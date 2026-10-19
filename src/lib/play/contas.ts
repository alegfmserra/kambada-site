import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { arquivoTokens } from "../bling/tokens";
import { assinar, idAleatorio, verificar } from "./jogos/seguranca";

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
    } catch {
      usarTemporario = true;
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
  entrada: { nome: unknown; email: unknown; senha: unknown; novidades: unknown },
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

type TokenEmail = { v: 1; tipo: "confirmar" | "redefinir" | "descadastrar"; conta: string; exp: number };

const VALIDADE: Record<TokenEmail["tipo"], number> = {
  confirmar: 48 * 60 * 60,
  redefinir: 60 * 60,
  descadastrar: 365 * 24 * 60 * 60,
};

export function tokenDeEmail(tipo: TokenEmail["tipo"], contaId: string, agora = Date.now()): string {
  const t: TokenEmail = { v: 1, tipo, conta: contaId, exp: Math.floor(agora / 1000) + VALIDADE[tipo] };
  return assinar(t);
}

export function lerTokenDeEmail(token: unknown, tipo: TokenEmail["tipo"], agora = Date.now()): string | null {
  const t = verificar<TokenEmail>(token);
  if (!t || t.v !== 1 || t.tipo !== tipo || typeof t.conta !== "string") return null;
  if (t.exp <= Math.floor(agora / 1000)) return null;
  return t.conta;
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
    const id = lerTokenDeEmail(token, "redefinir", agora.getTime());
    if (!id || !senhaAceitavel(novaSenha)) return null;
    const d = await ler();
    const c = d.contas.find((x) => x.id === id);
    if (!c) return null;
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
