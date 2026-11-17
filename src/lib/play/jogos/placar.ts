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
import { listarContas } from "../contas";
import { idAleatorio, resumoDaChave } from "./seguranca";
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
 * Cada jogador é um resumo: da conta (`jogadorDaConta`) ou, no acesso de
 * demonstração, da chave que o próprio navegador gera (o servidor nunca guarda
 * a chave). O que fica no arquivo é apelido, avatar, jogo e pontos. O arquivo mora na mesma pasta persistente dos
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

/** Como a conta aparece no placar e nos prêmios (nunca o id em si). */
export const jogadorDaConta = (contaId: string): string => resumoDaChave(`conta:${contaId}`);

/** Quando a semana (segunda-feira AAAA-MM-DD) fecha: 00:00 da segunda seguinte, em São Luís. */
export function fimDaSemana(semana: string): Date {
  return new Date(Date.parse(`${somarDias(semana, 7)}T00:00:00Z`) + FUSO_MS);
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

/** Todas as pontuações e prêmios — para a exportação da área de controle (só leitura). */
export async function dadosDoPlacar(): Promise<{ pontuacoes: Pontuacao[]; premios: PremioEmitido[] }> {
  const d = await ler();
  return { pontuacoes: d.pontuacoes, premios: d.premios };
}

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

/**
 * Quem pode receber cupom (17/11/2026): só conta com e-mail confirmado ATÉ o
 * fechamento da semana. Quem não confirmou aparece no ranking, mas o prêmio
 * passa para o próximo confirmado. O corte é o fim da semana (e não "agora")
 * para a lista de premiados não mudar depois de fechada: confirmar na terça
 * não tira o cupom de quem já recebeu. Conta por usuário (sem e-mail) e jogador
 * sem conta (demonstração) não recebem.
 *
 * "todos" desliga o filtro: existe só para os testes das outras regras.
 */
export type Confirmados = ReadonlySet<string> | "todos";

export async function confirmadosAte(limite: Date): Promise<Set<string>> {
  const corte = limite.toISOString();
  const contas = await listarContas();
  return new Set(
    contas.filter((c) => !c.usuario && typeof c.confirmadoEm === "string" && c.confirmadoEm < corte).map((c) => jogadorDaConta(c.id)),
  );
}

export type SituacaoPremio =
  | {
      elegivel: false;
      semana: string;
      /** Ficou entre os 3 primeiros, mas a conta não tinha o e-mail confirmado quando a semana fechou. */
      semConfirmacao?: true;
    }
  | {
      elegivel: true;
      semana: string;
      /** Qual prêmio (1º, 2º ou 3º). Pode ser melhor que a posição no ranking, se alguém acima não tinha e-mail confirmado. */
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

/** Ranking da semana com o mínimo de pontos, na ordem (com ou sem e-mail confirmado). */
function candidatosDaSemana(d: Dados, semana: string): Agregado[] {
  return agregar(d.pontuacoes.filter((x) => x.semana === semana)).filter((a) => a.pontos >= PONTOS_MINIMOS_PREMIO);
}

/** Os premiados: os primeiros CONFIRMADOS do ranking da semana. */
function topDaSemana(d: Dados, semana: string, confirmados: Confirmados): Agregado[] {
  return candidatosDaSemana(d, semana)
    .filter((a) => confirmados === "todos" || confirmados.has(a.jogador))
    .slice(0, PREMIOS_SEMANAIS.length);
}

export async function situacaoDoPremio(jogador: string, agora = new Date(), confirmados?: Confirmados): Promise<SituacaoPremio> {
  const semana = semanaFechada(agora);
  const d = await ler();
  const emitido = d.premios.find((p) => p.semana === semana && p.jogador === jogador);
  const idx = emitido
    ? emitido.posicao - 1
    : topDaSemana(d, semana, confirmados ?? (await confirmadosAte(fimDaSemana(semana)))).findIndex((a) => a.jogador === jogador);
  // Sem cupom emitido, o prêmio dessa posição só é dele se ainda não saiu para outra pessoa.
  const jaSaiu = !emitido && idx >= 0 && d.premios.some((p) => p.semana === semana && p.posicao === idx + 1);
  if (idx < 0 || jaSaiu) {
    const noTop = candidatosDaSemana(d, semana).slice(0, PREMIOS_SEMANAIS.length).some((a) => a.jogador === jogador);
    return noTop && idx < 0 ? { elegivel: false, semana, semConfirmacao: true } : { elegivel: false, semana };
  }
  const resgatarAte = somarDias(semana, 7 + REGRAS_PREMIO.prazoParaResgatarDias - 1);
  const hoje = hojeEmSaoLuis(agora);
  const cupom = emitido ? (await listarCupons()).find((c) => c.codigo === emitido.codigo) : undefined;
  return {
    elegivel: true,
    semana,
    posicao: idx + 1,
    percentual: emitido?.percentual ?? PREMIOS_SEMANAIS[idx],
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
  confirmados?: Confirmados,
): Promise<
  | { ok: true; codigo: string; percentual: number; posicao: number; validoAte: string; jaEmitido: boolean }
  | { ok: false; mensagem: string }
> {
  return naFila(async () => {
    const situacao = await situacaoDoPremio(jogador, agora, confirmados);
    if (!situacao.elegivel) {
      return {
        ok: false as const,
        mensagem: situacao.semConfirmacao
          ? "O prêmio da semana só vale para conta com e-mail confirmado até o domingo. Confirme o seu para valer na próxima."
          : "Você não ficou entre os 3 primeiros da última semana.",
      };
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
    const novo = await emitirCupomDoPremio(d, situacao.semana, jogador, situacao.posicao, agora);
    if (!novo) return { ok: false as const, mensagem: "Posição sem prêmio." };
    return { ok: true as const, ...novo, jaEmitido: false };
  });
}

/** Cria o cupom (uso único, validade curta), grava na lista de cupons da loja e registra o prêmio. */
async function emitirCupomDoPremio(
  d: Dados,
  semana: string,
  jogador: string,
  posicao: number,
  agora: Date,
): Promise<{ codigo: string; percentual: number; posicao: number; validoAte: string } | null> {
  const percentual = percentualDaPosicao(posicao);
  if (percentual === null) return null;
  const cupons = await listarCupons();
  const hoje = hojeEmSaoLuis(agora);
  const validoAte = somarDias(hoje, REGRAS_PREMIO.validadeCupomDias);
  const codigo = codigoNovo(new Set(cupons.map((c) => c.codigo)));
  const cupom: Cupom = {
    codigo: normalizarCodigo(codigo),
    percentual,
    parceiro: `Kambada Play · semana ${semana} · ${posicao}º lugar`,
    limite: { usos: 1, periodo: "total" },
    validoDe: hoje,
    validoAte,
    ativo: true,
    criadoEm: agora.toISOString(),
  };
  await salvarCupons([...cupons, cupom]);
  d.premios.push({ semana, jogador, posicao, percentual, codigo: cupom.codigo, emitidoEm: agora.toISOString() });
  await gravar(d);
  return { codigo: cupom.codigo, percentual, posicao, validoAte };
}

export type PremioNovo = { jogador: string; apelido: string; pontos: number; semana: string; codigo: string; percentual: number; posicao: number; validoAte: string };

export type FechamentoDoPlacar = {
  semana: string;
  /** Os premiados (até 3): os primeiros do ranking com e-mail confirmado. */
  top: { posicao: number; apelido: string; pontos: number }[];
  /** Quem estava à frente de um premiado e ficou sem cupom por não ter o e-mail confirmado. */
  semConfirmacao: { apelido: string; pontos: number }[];
  novos: PremioNovo[];
};

/**
 * Fechamento automático da semana (02/11/2026): emite o cupom de cada um dos 3 primeiros
 * da semana que fechou (mínimo de pontos incluso) que ainda não tenha cupom. Pode rodar
 * quantas vezes quiser: só emite o que falta, então não duplica. Devolve os cupons NOVOS
 * (quem os envia por e-mail é lib/play/premiosDaSemana.ts).
 *
 * Desde 17/11/2026 só premia conta com e-mail confirmado até o fechamento (`confirmadosAte`);
 * o prêmio de quem não confirmou passa ao próximo confirmado. Cada posição sai uma vez só por
 * semana: se o 1º prêmio já foi emitido (mesmo pela regra antiga), ninguém mais o recebe.
 */
export function emitirPremiosDaSemanaFechada(agora = new Date(), confirmados?: Confirmados): Promise<FechamentoDoPlacar> {
  return naFila(async () => {
    const semana = semanaFechada(agora);
    const quem = confirmados ?? (await confirmadosAte(fimDaSemana(semana)));
    const d = await ler();
    const top = topDaSemana(d, semana, quem);
    const novos: PremioNovo[] = [];
    for (const [i, a] of top.entries()) {
      if (d.premios.some((p) => p.semana === semana && (p.jogador === a.jogador || p.posicao === i + 1))) continue;
      const c = await emitirCupomDoPremio(d, semana, a.jogador, i + 1, agora);
      if (c) novos.push({ jogador: a.jogador, apelido: a.apelido, pontos: a.pontos, semana, ...c });
    }
    // Quem ficou à frente do último premiado sem ser premiado: não tinha o e-mail confirmado.
    const candidatos = candidatosDaSemana(d, semana);
    const ultimo = top.length ? candidatos.findIndex((a) => a.jogador === top[top.length - 1].jogador) : candidatos.length - 1;
    const corte = top.length >= PREMIOS_SEMANAIS.length ? ultimo : candidatos.length - 1;
    const semConfirmacao = candidatos
      .slice(0, corte + 1)
      .filter((a) => !top.some((t) => t.jogador === a.jogador))
      .map((a) => ({ apelido: a.apelido, pontos: a.pontos }));
    return { semana, top: top.map((a, i) => ({ posicao: i + 1, apelido: a.apelido, pontos: a.pontos })), semConfirmacao, novos };
  });
}

/**
 * Tira uma conta do placar (exclusão da conta, 17/11/2026). As pontuações ficam, para o
 * ranking passado não mudar, mas deixam de apontar para a conta: o jogador vira um
 * identificador novo e sem volta, e o apelido vira "Brincante". Os prêmios já emitidos
 * seguem o mesmo caminho (o cupom continua na lista da loja). Devolve quantas linhas mudou.
 */
export function anonimizarJogador(jogador: string): Promise<number> {
  return naFila(async () => {
    const d = await ler();
    const anonimo = `apagado-${idAleatorio(12)}`;
    let mudou = 0;
    for (const p of d.pontuacoes) {
      if (p.jogador !== jogador) continue;
      p.jogador = anonimo;
      p.apelido = "Brincante";
      p.avatar = "kambadinha";
      mudou += 1;
    }
    for (const p of d.premios) {
      if (p.jogador !== jogador) continue;
      p.jogador = anonimo;
      mudou += 1;
    }
    if (mudou) await gravar(d);
    return mudou;
  });
}
