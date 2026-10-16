import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { arquivoTokens } from "../../bling/tokens";
import {
  hojeEmSaoLuis,
  inicioDoPeriodo,
  listarCupons,
  normalizarCodigo,
  salvarCupons,
  type Cupom,
} from "../../cupons/cupons";
import { idAleatorio } from "./seguranca";
import {
  AVATARES,
  JOGOS,
  PONTOS_MINIMOS_PREMIO,
  PREMIOS_SEMANAIS,
  REGRAS_PREMIO,
  type AvatarId,
  type JogoId,
  type LinhaPlacar,
  type PeriodoPlacar,
} from "./tipos";

/**
 * Placar e prêmios do Kambada Play (somente servidor).
 *
 * Sem conta e sem dado pessoal: cada jogador é um resumo da chave que o próprio
 * navegador gera (o servidor nunca guarda a chave). O que fica no arquivo é
 * apelido, avatar, jogo e pontos. O arquivo mora na mesma pasta persistente dos
 * pedidos e dos cupons, então sobrevive a cada deploy.
 *
 * Ranking semanal = soma da MELHOR pontuação da semana em cada jogo. A semana
 * vai de segunda a domingo, no horário de São Luís (igual aos cupons).
 */

export type Pontuacao = {
  jogador: string;
  apelido: string;
  avatar: AvatarId;
  jogo: JogoId;
  pontos: number;
  /** Segunda-feira (AAAA-MM-DD) da semana em que a pontuação foi feita. */
  semana: string;
  em: string;
};

export type PremioEmitido = {
  semana: string;
  jogador: string;
  posicao: number;
  percentual: number;
  codigo: string;
  emitidoEm: string;
};

type Dados = { versao: 1; pontuacoes: Pontuacao[]; premios: PremioEmitido[] };

const FUSO_MS = 3 * 60 * 60 * 1000;
const DIA_MS = 24 * 60 * 60 * 1000;

export function arquivoPlacar(): string {
  return process.env.PLAY_PLACAR_ARQUIVO ?? join(dirname(arquivoTokens()), "play-placar.json");
}

// ---------------------------------------------------------------------------
// Semana
// ---------------------------------------------------------------------------

/** Segunda-feira da semana de `agora`, em AAAA-MM-DD (São Luís). */
export function semanaDe(agora = new Date()): string {
  return new Date(inicioDoPeriodo("semana", agora).getTime() - FUSO_MS).toISOString().slice(0, 10);
}

/** Segunda-feira da semana anterior, que é a que "fechou". */
export function semanaFechada(agora = new Date()): string {
  const segundaAtual = Date.parse(`${semanaDe(agora)}T00:00:00Z`);
  return new Date(segundaAtual - 7 * DIA_MS).toISOString().slice(0, 10);
}

function somarDias(dataIso: string, dias: number): string {
  return new Date(Date.parse(`${dataIso}T00:00:00Z`) + dias * DIA_MS).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Armazenamento (com fila, para duas gravações não se atropelarem)
// ---------------------------------------------------------------------------

let fila: Promise<unknown> = Promise.resolve();

function naFila<T>(trabalho: () => Promise<T>): Promise<T> {
  const proximo = fila.then(trabalho, trabalho);
  fila = proximo.catch(() => undefined);
  return proximo;
}

/**
 * Se a pasta persistente não puder ser escrita (ex.: prévia na Vercel, cujo
 * disco é só leitura), o placar cai para a pasta temporária: funciona para
 * testar, mas não sobrevive a reinício. Na Hostinger usa a pasta persistente.
 */
let usarTemporario = false;
const arquivoTemporario = () => join(tmpdir(), "kambada-play-placar.json");

async function ler(): Promise<Dados> {
  const caminhos = usarTemporario ? [arquivoTemporario()] : [arquivoPlacar(), arquivoTemporario()];
  for (const c of caminhos) {
    try {
      const d = JSON.parse(await readFile(c, "utf8")) as Dados;
      return { versao: 1, pontuacoes: d.pontuacoes ?? [], premios: d.premios ?? [] };
    } catch {
      // tenta o próximo
    }
  }
  return { versao: 1, pontuacoes: [], premios: [] };
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
      await gravarEm(arquivoPlacar(), d);
      return;
    } catch {
      usarTemporario = true;
    }
  }
  await gravarEm(arquivoTemporario(), d);
}

// ---------------------------------------------------------------------------
// Apelido
// ---------------------------------------------------------------------------

const PALAVRAS_PROIBIDAS = [
  "puta", "puto", "caralho", "porra", "merda", "bosta", "cuzao", "cuzão", "viado", "buceta", "foder", "fdp",
  "racista", "nazi", "hitler", "estupr", "pedofil", "macaco", "preto sujo",
];

function simplificar(t: string): string {
  return t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[0@]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/3/g, "e")
    .replace(/[4]/g, "a")
    .replace(/[5$]/g, "s")
    .replace(/[^a-z]/g, "");
}

/** Apelido limpo, ou null se for inválido ou ofensivo. */
export function apelidoValido(bruto: unknown): string | null {
  if (typeof bruto !== "string") return null;
  const a = bruto.replace(/\s+/g, " ").trim();
  if (a.length < 3 || a.length > 16) return null;
  if (!/^[\p{L}\p{N} ._-]+$/u.test(a)) return null;
  const s = simplificar(a);
  if (PALAVRAS_PROIBIDAS.some((p) => s.includes(simplificar(p)))) return null;
  return a;
}

export function avatarValido(v: unknown): AvatarId {
  return AVATARES.some((a) => a.id === v) ? (v as AvatarId) : "kambadinha";
}

// ---------------------------------------------------------------------------
// Pontuações
// ---------------------------------------------------------------------------

/** Guarda a pontuação (só se for a melhor do jogador naquele jogo e semana). */
export function registrarPontuacao(
  p: Omit<Pontuacao, "semana" | "em">,
  agora = new Date(),
): Promise<{ melhorDaSemana: boolean; pontosDaSemana: number }> {
  return naFila(async () => {
    const maximo = JOGOS[p.jogo].maximo;
    const pontos = Math.max(0, Math.min(maximo, Math.round(p.pontos)));
    const semana = semanaDe(agora);
    const d = await ler();
    const existente = d.pontuacoes.find(
      (x) => x.jogador === p.jogador && x.jogo === p.jogo && x.semana === semana,
    );
    let melhor = false;
    if (!existente) {
      d.pontuacoes.push({ ...p, pontos, semana, em: agora.toISOString() });
      melhor = true;
    } else {
      // O apelido e o avatar acompanham a última partida.
      existente.apelido = p.apelido;
      existente.avatar = p.avatar;
      if (pontos > existente.pontos) {
        existente.pontos = pontos;
        existente.em = agora.toISOString();
        melhor = true;
      }
    }
    await gravar(d);
    const pontosDaSemana = d.pontuacoes
      .filter((x) => x.jogador === p.jogador && x.semana === semana)
      .reduce((s, x) => s + x.pontos, 0);
    return { melhorDaSemana: melhor, pontosDaSemana };
  });
}

type Agregado = { jogador: string; apelido: string; avatar: AvatarId; pontos: number; porJogo: Partial<Record<JogoId, number>>; ultima: string };

function agregar(pontuacoes: Pontuacao[]): Agregado[] {
  const mapa = new Map<string, Agregado>();
  // Melhor por jogo, dentro do recorte recebido.
  for (const x of pontuacoes) {
    let a = mapa.get(x.jogador);
    if (!a) {
      a = { jogador: x.jogador, apelido: x.apelido, avatar: x.avatar, pontos: 0, porJogo: {}, ultima: x.em };
      mapa.set(x.jogador, a);
    }
    const atual = a.porJogo[x.jogo] ?? 0;
    if (x.pontos > atual) a.porJogo[x.jogo] = x.pontos;
    if (x.em >= a.ultima) {
      a.ultima = x.em;
      a.apelido = x.apelido;
      a.avatar = x.avatar;
    }
  }
  for (const a of mapa.values()) a.pontos = Object.values(a.porJogo).reduce((s, n) => s + (n ?? 0), 0);
  return [...mapa.values()].sort((a, b) => b.pontos - a.pontos || (a.ultima < b.ultima ? -1 : 1));
}

function recorte(d: Dados, periodo: PeriodoPlacar, agora: Date, semana?: string): Pontuacao[] {
  if (periodo === "total") return d.pontuacoes;
  if (periodo === "semana") {
    const alvo = semana ?? semanaDe(agora);
    return d.pontuacoes.filter((x) => x.semana === alvo);
  }
  const mes = hojeEmSaoLuis(agora).slice(0, 7);
  return d.pontuacoes.filter((x) => x.semana.slice(0, 7) === mes || x.em.slice(0, 7) === mes);
}

export async function lerPlacar(
  opcoes: { jogo?: JogoId; periodo: PeriodoPlacar; limite?: number; semana?: string },
  agora = new Date(),
): Promise<LinhaPlacar[]> {
  const d = await ler();
  let base = recorte(d, opcoes.periodo, agora, opcoes.semana);
  if (opcoes.jogo) base = base.filter((x) => x.jogo === opcoes.jogo);
  return agregar(base)
    .slice(0, opcoes.limite ?? 20)
    .map((a, i) => ({
      posicao: i + 1,
      apelido: a.apelido,
      avatar: a.avatar,
      pontos: a.pontos,
      porJogo: opcoes.jogo ? undefined : a.porJogo,
    }));
}

/** Posição do jogador no placar geral da semana corrente (1 = primeiro), ou null. */
export async function posicaoNaSemana(jogador: string, agora = new Date()): Promise<number | null> {
  const d = await ler();
  const lista = agregar(d.pontuacoes.filter((x) => x.semana === semanaDe(agora)));
  const i = lista.findIndex((a) => a.jogador === jogador);
  return i < 0 ? null : i + 1;
}

// ---------------------------------------------------------------------------
// Prêmios (cupons) da semana fechada
// ---------------------------------------------------------------------------

export type SituacaoPremio =
  | { elegivel: false; semana: string }
  | {
      elegivel: true;
      semana: string;
      posicao: number;
      percentual: number;
      codigo?: string;
      validoAte?: string;
      /** Último dia para resgatar. */
      resgatarAte: string;
      expirou: boolean;
    };

function percentualDaPosicao(posicao: number): number | null {
  return PREMIOS_SEMANAIS[posicao - 1] ?? null;
}

function topDaSemana(d: Dados, semana: string): Agregado[] {
  return agregar(d.pontuacoes.filter((x) => x.semana === semana))
    .filter((a) => a.pontos >= PONTOS_MINIMOS_PREMIO)
    .slice(0, PREMIOS_SEMANAIS.length);
}

export async function situacaoDoPremio(jogador: string, agora = new Date()): Promise<SituacaoPremio> {
  const semana = semanaFechada(agora);
  const d = await ler();
  const top = topDaSemana(d, semana);
  const idx = top.findIndex((a) => a.jogador === jogador);
  if (idx < 0) return { elegivel: false, semana };
  const posicao = idx + 1;
  const emitido = d.premios.find((p) => p.semana === semana && p.jogador === jogador);
  const resgatarAte = somarDias(semana, 7 + REGRAS_PREMIO.prazoParaResgatarDias - 1);
  const hoje = hojeEmSaoLuis(agora);
  const cupom = emitido ? (await listarCupons()).find((c) => c.codigo === emitido.codigo) : undefined;
  return {
    elegivel: true,
    semana,
    posicao,
    percentual: PREMIOS_SEMANAIS[idx],
    codigo: emitido?.codigo,
    validoAte: cupom?.validoAte,
    resgatarAte,
    expirou: !emitido && hoje > resgatarAte,
  };
}

function codigoNovo(existentes: Set<string>): string {
  const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sem O, I, L, 0, 1
  for (let t = 0; t < 20; t++) {
    let c = "PLAY-";
    const bytes = idAleatorio(6);
    for (let i = 0; i < 6; i++) c += ALFABETO[parseInt(bytes.slice(i * 2, i * 2 + 2), 16) % ALFABETO.length];
    if (!existentes.has(c)) return c;
  }
  throw new Error("Não foi possível gerar um código único.");
}

/**
 * Emite o cupom do prêmio (uma vez por jogador e semana). O cupom vale por uma
 * única compra, tem validade curta e fica na lista de cupons da loja, como
 * qualquer outro — o Alexandre o vê e pode desativá-lo na área de controle.
 */
export function resgatarPremio(
  jogador: string,
  agora = new Date(),
): Promise<
  | { ok: true; codigo: string; percentual: number; posicao: number; validoAte: string; jaEmitido: boolean }
  | { ok: false; mensagem: string }
> {
  return naFila(async () => {
    const situacao = await situacaoDoPremio(jogador, agora);
    if (!situacao.elegivel) {
      return { ok: false as const, mensagem: "Você não ficou entre os 3 primeiros da última semana." };
    }
    const d = await ler();
    const existente = d.premios.find((p) => p.semana === situacao.semana && p.jogador === jogador);
    const cupons = await listarCupons();
    if (existente) {
      const c = cupons.find((x) => x.codigo === existente.codigo);
      return {
        ok: true as const,
        codigo: existente.codigo,
        percentual: existente.percentual,
        posicao: existente.posicao,
        validoAte: c?.validoAte ?? "",
        jaEmitido: true,
      };
    }
    if (situacao.expirou) {
      return { ok: false as const, mensagem: "O prazo para resgatar o prêmio dessa semana acabou." };
    }
    const percentual = percentualDaPosicao(situacao.posicao);
    if (percentual === null) return { ok: false as const, mensagem: "Posição sem prêmio." };

    const hoje = hojeEmSaoLuis(agora);
    const validoAte = somarDias(hoje, REGRAS_PREMIO.validadeCupomDias);
    const codigo = codigoNovo(new Set(cupons.map((c) => c.codigo)));
    const cupom: Cupom = {
      codigo: normalizarCodigo(codigo),
      percentual,
      parceiro: `Kambada Play · semana ${situacao.semana} · ${situacao.posicao}º lugar`,
      limite: { usos: 1, periodo: "total" },
      validoDe: hoje,
      validoAte,
      ativo: true,
      criadoEm: agora.toISOString(),
    };
    await salvarCupons([...cupons, cupom]);
    d.premios.push({
      semana: situacao.semana,
      jogador,
      posicao: situacao.posicao,
      percentual,
      codigo: cupom.codigo,
      emitidoEm: agora.toISOString(),
    });
    await gravar(d);
    return {
      ok: true as const,
      codigo: cupom.codigo,
      percentual,
      posicao: situacao.posicao,
      validoAte,
      jaEmitido: false,
    };
  });
}
