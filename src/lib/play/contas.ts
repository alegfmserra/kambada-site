import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { access, mkdir, readFile, rename, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import type { Atribuicao } from "../atribuicao/atribuicao";
import { arquivoTokens } from "../bling/tokens";
import { assinar, idAleatorio, verificar } from "./jogos/seguranca";
import { sessaoDaRequisicao, type Sessao } from "./acesso";

/**
 * Contas do Kambada Play (somente servidor).
 *
 * Pedido do Alexandre (18/10/2026): identificar quem joga por e-mail, com
 * cadastro, para mandar novidades, promoções e os cupons do ranking — e
 * construir a base que, mais à frente, vira assinatura.
 *
 * O que guardamos: nome, e-mail, senha em hash (scrypt + sal), se aceitou
 * receber novidades (opt-in explícito, com data), se o e-mail foi confirmado,
 * datas de criação e último acesso. Nada de CPF, telefone ou data de
 * nascimento. O arquivo mora na pasta persistente do servidor (a mesma dos
 * pedidos e cupons). Quando passar de alguns milhares de contas, migra para
 * um banco sem mudar as telas.
 */

export type Conta = {
  id: string;
  nome: string;
  email: string; // normalizado (minúsculas, sem espaços)
  senhaHash: string; // "scrypt$<sal hex>$<hash hex>"
  novidades: boolean;
  novidadesEm?: string;
  confirmadoEm?: string;
  criadoEm: string;
  ultimoAcessoEm?: string;
  /** Preenchido ao cancelar o recebimento (link do e-mail). */
  descadastradoEm?: string;
  /** De onde veio o cadastro (utm/referência) — conversão por canal. */
  atribuicao?: Atribuicao;
};

type Dados = { versao: 1; contas: Conta[] };

export function arquivoContas(): string {
  return process.env.PLAY_CONTAS_ARQUIVO ?? join(dirname(arquivoTokens()), "play-contas.json");
}

// ---------------------------------------------------------------------------
// Armazenamento (fila + queda para a pasta temporária, como o placar)
// ---------------------------------------------------------------------------

let fila: Promise<unknown> = Promise.resolve();
function naFila<T>(trabalho: () => Promise<T>): Promise<T> {
  const proximo = fila.then(trabalho, trabalho);
  fila = proximo.catch(() => undefined);
  return proximo;
}

let usarTemporario = false;
const arquivoTemporario = () => join(tmpdir(), "kambada-play-contas.json");

async function ler(): Promise<Dados> {
  const caminhos = usarTemporario ? [arquivoTemporario()] : [arquivoContas(), arquivoTemporario()];
  for (const c of caminhos) {
    try {
      const d = JSON.parse(await readFile(c, "utf8")) as Dados;
      return { versao: 1, contas: Array.isArray(d.contas) ? d.contas : [] };
    } catch {
      // tenta o próximo
    }
  }
  return { versao: 1, contas: [] };
}

async function gravarEm(destino: string, d: Dados): Promise<void> {
  await mkdir(dirname(destino), { recursive: true });
  const tmp = `${destino}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(d), "utf8");
  await rename(tmp, destino);
}

async function gravar(d: Dados): Promise<void> {
  if (!usarTemporario) {
    try {
      await gravarEm(arquivoContas(), d);
      return;
    } catch (erro) {
      usarTemporario = true;
      console.error(
        `[play/contas] não consegui gravar em ${arquivoContas()}; caindo para a pasta temporária (as contas NÃO vão sobreviver a um reinício): ${String(erro)}`,
      );
    }
  }
  await gravarEm(arquivoTemporario(), d);
}

// ---------------------------------------------------------------------------
// Validação e senha
// ---------------------------------------------------------------------------

export function normalizarEmail(bruto: unknown): string | null {
  if (typeof bruto !== "string") return null;
  const e = bruto.trim().toLowerCase();
  if (e.length < 6 || e.length > 120) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e)) return null;
  return e;
}

export function nomeValido(bruto: unknown): string | null {
  if (typeof bruto !== "string") return null;
  const n = bruto.replace(/\s+/g, " ").trim();
  if (n.length < 2 || n.length > 60) return null;
  if (!/^[\p{L}\p{M}' .-]+$/u.test(n)) return null;
  return n;
}

export function senhaAceitavel(senha: unknown): senha is string {
  return typeof senha === "string" && senha.length >= 8 && senha.length <= 100;
}

export function gerarHash(senha: string): string {
  const sal = randomBytes(16).toString("hex");
  const hash = scryptSync(senha, sal, 32).toString("hex");
  return `scrypt$${sal}$${hash}`;
}

export function senhaConfere(senha: string, guardado: string): boolean {
  const [alg, sal, hash] = guardado.split("$");
  if (alg !== "scrypt" || !sal || !hash) return false;
  const calculado = scryptSync(senha, sal, 32);
  const esperado = Buffer.from(hash, "hex");
  return calculado.length === esperado.length && timingSafeEqual(calculado, esperado);
}

/** Versão sem a senha, para devolver ao navegador. */
export type ContaPublica = Pick<Conta, "id" | "nome" | "email" | "novidades" | "confirmadoEm" | "criadoEm">;
export function publica(c: Conta): ContaPublica {
  return { id: c.id, nome: c.nome, email: c.email, novidades: c.novidades, confirmadoEm: c.confirmadoEm, criadoEm: c.criadoEm };
}

// ---------------------------------------------------------------------------
// Operações
// ---------------------------------------------------------------------------

export type ResultadoCadastro =
  | { ok: true; conta: Conta }
  | { ok: false; motivo: "dados" | "email-em-uso"; mensagem: string };

export function cadastrar(
  entrada: { nome: unknown; email: unknown; senha: unknown; novidades: unknown; atribuicao?: Atribuicao },
  agora = new Date(),
): Promise<ResultadoCadastro> {
  return naFila(async () => {
    const nome = nomeValido(entrada.nome);
    const email = normalizarEmail(entrada.email);
    if (!nome || !email || !senhaAceitavel(entrada.senha)) {
      return { ok: false as const, motivo: "dados" as const, mensagem: "Confira nome, e-mail e senha (mínimo de 8 caracteres)." };
    }
    const d = await ler();
    if (d.contas.some((c) => c.email === email)) {
      return { ok: false as const, motivo: "email-em-uso" as const, mensagem: "Já existe uma conta com este e-mail. Entre ou use \"esqueci a senha\"." };
    }
    const conta: Conta = {
      id: idAleatorio(12),
      nome,
      email,
      senhaHash: gerarHash(entrada.senha),
      novidades: entrada.novidades === true,
      novidadesEm: entrada.novidades === true ? agora.toISOString() : undefined,
      criadoEm: agora.toISOString(),
      ultimoAcessoEm: agora.toISOString(),
      ...(entrada.atribuicao ? { atribuicao: entrada.atribuicao } : {}),
    };
    d.contas.push(conta);
    await gravar(d);
    return { ok: true as const, conta };
  });
}

export function autenticar(emailBruto: unknown, senha: unknown, agora = new Date()): Promise<Conta | null> {
  return naFila(async () => {
    const email = normalizarEmail(emailBruto);
    if (!email || typeof senha !== "string" || senha.length > 100) return null;
    const d = await ler();
    const conta = d.contas.find((c) => c.email === email);
    // Sempre calcula um hash, para o tempo de resposta não revelar se o e-mail existe.
    const ok = conta ? senhaConfere(senha, conta.senhaHash) : (senhaConfere(senha, HASH_FALSO), false);
    if (!conta || !ok) return null;
    conta.ultimoAcessoEm = agora.toISOString();
    await gravar(d);
    return conta;
  });
}
const HASH_FALSO = gerarHash("senha-que-nao-existe");

export async function buscarPorId(id: string): Promise<Conta | null> {
  const d = await ler();
  return d.contas.find((c) => c.id === id) ?? null;
}

export async function buscarPorEmail(emailBruto: unknown): Promise<Conta | null> {
  const email = normalizarEmail(emailBruto);
  if (!email) return null;
  const d = await ler();
  return d.contas.find((c) => c.email === email) ?? null;
}

export function registrarAcesso(id: string, agora = new Date()): Promise<void> {
  return naFila(async () => {
    const d = await ler();
    const c = d.contas.find((x) => x.id === id);
    if (!c) return;
    c.ultimoAcessoEm = agora.toISOString();
    await gravar(d);
  });
}

export function atualizarNovidades(id: string, quer: boolean, agora = new Date()): Promise<boolean> {
  return naFila(async () => {
    const d = await ler();
    const c = d.contas.find((x) => x.id === id);
    if (!c) return false;
    c.novidades = quer;
    if (quer) {
      c.novidadesEm = agora.toISOString();
      c.descadastradoEm = undefined;
    } else {
      c.descadastradoEm = agora.toISOString();
    }
    await gravar(d);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Tokens de e-mail (confirmação, redefinição de senha, descadastro)
// ---------------------------------------------------------------------------

type TokenEmail = {
  v: 1;
  tipo: "confirmar" | "redefinir" | "descadastrar";
  conta: string;
  exp: number;
  /** Só em "redefinir": marca da senha atual. Trocou a senha, o link morre (uso único). */
  s?: string;
};

/** Impressão curta do hash da senha (nunca o hash em si). Vai no link de redefinição e no cookie da sessão. */
export function marcaDaSenha(c: Pick<Conta, "senhaHash">): string {
  return createHash("sha256").update(c.senhaHash).digest("hex").slice(0, 16);
}

/**
 * A conta de uma sessão, só se a senha ainda é a mesma de quando a pessoa
 * entrou. É o que derruba as sessões antigas depois de uma troca de senha.
 */
export async function contaDaSessao(sessao: Sessao | null): Promise<Conta | null> {
  if (!sessao || sessao.v !== 2) return null;
  const c = await buscarPorId(sessao.conta);
  if (!c) return null;
  const a = Buffer.from(sessao.s);
  const b = Buffer.from(marcaDaSenha(c));
  return a.length === b.length && timingSafeEqual(a, b) ? c : null;
}

/** Atalho para as rotas de API: lê o cookie e confere a marca da senha. */
export function contaDaRequisicao(requisicao: Request): Promise<Conta | null> {
  return contaDaSessao(sessaoDaRequisicao(requisicao));
}

const VALIDADE: Record<TokenEmail["tipo"], number> = {
  confirmar: 48 * 60 * 60,
  redefinir: 60 * 60,
  descadastrar: 365 * 24 * 60 * 60,
};

export function tokenDeEmail(
  tipo: TokenEmail["tipo"],
  conta: string | Pick<Conta, "id" | "senhaHash">,
  agora = Date.now(),
): string {
  const id = typeof conta === "string" ? conta : conta.id;
  const t: TokenEmail = { v: 1, tipo, conta: id, exp: Math.floor(agora / 1000) + VALIDADE[tipo] };
  if (tipo === "redefinir" && typeof conta !== "string") t.s = marcaDaSenha(conta);
  return assinar(t);
}

export function lerTokenDeEmail(token: unknown, tipo: TokenEmail["tipo"], agora = Date.now()): string | null {
  return lerToken(token, tipo, agora)?.conta ?? null;
}

function lerToken(token: unknown, tipo: TokenEmail["tipo"], agora = Date.now()): TokenEmail | null {
  const t = verificar<TokenEmail>(token);
  if (!t || t.v !== 1 || t.tipo !== tipo || typeof t.conta !== "string") return null;
  if (t.exp <= Math.floor(agora / 1000)) return null;
  return t;
}

export function confirmarEmail(token: unknown, agora = new Date()): Promise<Conta | null> {
  return naFila(async () => {
    const id = lerTokenDeEmail(token, "confirmar", agora.getTime());
    if (!id) return null;
    const d = await ler();
    const c = d.contas.find((x) => x.id === id);
    if (!c) return null;
    if (!c.confirmadoEm) {
      c.confirmadoEm = agora.toISOString();
      await gravar(d);
    }
    return c;
  });
}

export function redefinirSenha(token: unknown, novaSenha: unknown, agora = new Date()): Promise<Conta | null> {
  return naFila(async () => {
    const t = lerToken(token, "redefinir", agora.getTime());
    if (!t || !senhaAceitavel(novaSenha)) return null;
    const d = await ler();
    const c = d.contas.find((x) => x.id === t.conta);
    if (!c) return null;
    // Link de uso único: se a senha já mudou depois que o link foi emitido, ele não vale mais.
    if (t.s && t.s !== marcaDaSenha(c)) return null;
    c.senhaHash = gerarHash(novaSenha);
    // Quem conseguiu abrir o link tem o e-mail: vale como confirmação.
    if (!c.confirmadoEm) c.confirmadoEm = agora.toISOString();
    await gravar(d);
    return c;
  });
}

export function descadastrar(token: unknown, agora = new Date()): Promise<boolean> {
  return naFila(async () => {
    const id = lerTokenDeEmail(token, "descadastrar", agora.getTime());
    if (!id) return false;
    const d = await ler();
    const c = d.contas.find((x) => x.id === id);
    if (!c) return false;
    c.novidades = false;
    c.descadastradoEm = agora.toISOString();
    await gravar(d);
    return true;
  });
}

// ---------------------------------------------------------------------------
// Base para o marketing (rota protegida)
// ---------------------------------------------------------------------------

export async function listarContas(): Promise<Conta[]> {
  return (await ler()).contas;
}

/** Onde as contas estão de fato (para o diagnóstico da rota de exportação). */
export async function estadoDoArmazenamento(): Promise<{
  arquivo: string;
  persistente: boolean;
  existe: boolean;
  gravavel: boolean;
}> {
  const arquivo = usarTemporario ? arquivoTemporario() : arquivoContas();
  const existe = await access(arquivo).then(() => true, () => false);
  // Testa a escrita de verdade (arquivo de sonda na mesma pasta), sem criar conta.
  const sonda = join(dirname(arquivo), `.sonda-`);
  const gravavel = await mkdir(dirname(arquivo), { recursive: true })
    .then(() => writeFile(sonda, "ok"))
    .then(() => unlink(sonda))
    .then(() => true, () => false);
  return { arquivo, persistente: !usarTemporario, existe, gravavel };
}

export function contasParaCsv(contas: Conta[]): string {
  const esc = (v: unknown) => {
    const s = v === undefined || v === null ? "" : String(v);
    return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const linhas = [
    ["id", "nome", "email", "aceita_novidades", "aceitou_em", "email_confirmado_em", "criado_em", "ultimo_acesso_em", "descadastrado_em"].join(";"),
    ...contas.map((c) =>
      [c.id, c.nome, c.email, c.novidades ? "sim" : "nao", c.novidadesEm, c.confirmadoEm, c.criadoEm, c.ultimoAcessoEm, c.descadastradoEm]
        .map(esc)
        .join(";"),
    ),
  ];
  // BOM para o Excel abrir acentos certos
  return "﻿" + linhas.join("\r\n");
}
