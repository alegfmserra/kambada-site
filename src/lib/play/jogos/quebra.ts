import { assinar, embaralharSeguro, idAleatorio, verificar } from "./seguranca";
import { nivelValido, QUEBRA_NIVEL, type Nivel } from "./tipos";

/**
 * Quebra-cabeça das estampas — regras de pontuação e prova (somente servidor).
 *
 * Desde 17/11/2026 o servidor não confia mais no número de trocas que o
 * navegador informa (o ranking vale cupom). A partida nasce aqui, com o
 * tabuleiro embaralhado e assinado; no fim, o navegador manda a LISTA de
 * trocas que fez, e o servidor as refaz uma a uma sobre o tabuleiro que ele
 * mesmo sorteou. Só vale se a lista leva ao tabuleiro montado. As trocas são
 * contadas aqui e o tempo é o do relógio do servidor.
 *
 * (O tabuleiro vai em claro no estado assinado: ele está na tela mesmo. O que
 * a assinatura impede é trocar o tabuleiro por um mais fácil.)
 */

const MAX_TROCAS = 600;
/** Cada troca são dois toques: abaixo disto é máquina. */
export const MIN_SEGUNDOS_POR_TROCA = 0.5;
/** Segundos "de graça" por peça: 12 peças = 96 s, 40 peças = 320 s. */
const SEGUNDOS_POR_PECA = 8;
/** Trocas "de graça" por peça (embaralhar de verdade exige quase uma por peça). */
const TROCAS_POR_PECA = 1.5;

type Largada = {
  v: 3;
  id: string;
  /** Conta que começou a partida (null = sem conta). A prova sai presa a ela. */
  conta: string | null;
  t0: number;
  nivel: Nivel;
  /** posição -> peça, como foi entregue ao navegador. */
  ordem: number[];
};

export type ProvaQuebra = {
  v: 1;
  jogo: "quebra";
  partida: string;
  /** Ausente só em prova emitida antes de 17/11/2026. */
  conta?: string | null;
  nivel: Nivel;
  pontos: number;
  trocas: number;
  segundos: number;
  emitidaEm: number;
};

export function pecasDoNivel(nivel: Nivel): number {
  const { colunas, linhas } = QUEBRA_NIVEL[nivel];
  return colunas * linhas;
}

/** Nenhuma peça começa no lugar certo, para toda partida pedir pelo menos meia troca por peça. */
function tabuleiroEmbaralhado(total: number): number[] {
  for (;;) {
    const a = embaralharSeguro(Array.from({ length: total }, (_, i) => i));
    if (a.every((p, i) => p !== i)) return a;
  }
}

export function iniciarQuebra(
  nivelBruto: unknown,
  agora = Date.now(),
  conta: string | null = null,
): { token: string; nivel: Nivel; colunas: number; linhas: number; ordem: number[] } {
  const nivel = nivelValido(nivelBruto);
  const { colunas, linhas } = QUEBRA_NIVEL[nivel];
  const ordem = tabuleiroEmbaralhado(colunas * linhas);
  const largada: Largada = { v: 3, id: idAleatorio(), conta, t0: agora, nivel, ordem };
  return { token: assinar(largada), nivel, colunas, linhas, ordem };
}

/**
 * Base 1000 para uma montagem enxuta e rápida; cai 10 por troca acima de
 * 1,5 por peça e 2 por segundo acima de 8 por peça; nunca menos que 100. O
 * multiplicador do nível entra por cima: 1×, 1,5× ou 2×.
 */
export function pontosDaQuebra(nivel: Nivel, trocas: number, segundos: number): number {
  const pecas = pecasDoNivel(nivel);
  const penaTrocas = Math.max(0, trocas - pecas * TROCAS_POR_PECA) * 10;
  const penaTempo = Math.max(0, segundos - pecas * SEGUNDOS_POR_PECA) * 2;
  const base = Math.max(100, Math.round(1000 - penaTrocas - penaTempo));
  return Math.round(base * QUEBRA_NIVEL[nivel].multiplicador);
}

/**
 * Refaz as trocas sobre o tabuleiro sorteado. Devolve quantas foram, ou null
 * se a lista é impossível: posição fora do tabuleiro, troca de uma peça com ela
 * mesma, mexer em peça que já estava no lugar (a tela trava essas peças) ou
 * terminar sem o tabuleiro montado.
 */
export function refazerTrocas(ordemInicial: readonly number[], trocasBruto: unknown): number | null {
  if (!Array.isArray(trocasBruto) || trocasBruto.length < 1 || trocasBruto.length > MAX_TROCAS) return null;
  const ordem = [...ordemInicial];
  for (const t of trocasBruto) {
    if (!Array.isArray(t) || t.length !== 2) return null;
    const [a, b] = t as unknown[];
    if (typeof a !== "number" || typeof b !== "number" || !Number.isInteger(a) || !Number.isInteger(b)) return null;
    if (a < 0 || b < 0 || a >= ordem.length || b >= ordem.length || a === b) return null;
    if (ordem[a] === a || ordem[b] === b) return null;
    [ordem[a], ordem[b]] = [ordem[b], ordem[a]];
  }
  return ordem.every((p, i) => p === i) ? trocasBruto.length : null;
}

export function finalizarQuebra(
  token: unknown,
  trocasBruto: unknown,
  agora = Date.now(),
): { prova: string; pontos: number; trocas: number; segundos: number; nivel: Nivel } | { erro: string } {
  const largada = verificar<Largada>(token);
  if (!largada || largada.v !== 3 || !Array.isArray(largada.ordem)) return { erro: "Partida inválida. Comece outra." };
  const nivel = nivelValido(largada.nivel);
  if (largada.ordem.length !== pecasDoNivel(nivel)) return { erro: "Partida inválida. Comece outra." };
  const decorridoMs = agora - largada.t0;
  if (decorridoMs > 90 * 60 * 1000) return { erro: "Partida expirada. Comece outra." };
  const trocas = refazerTrocas(largada.ordem, trocasBruto);
  if (trocas === null) return { erro: "Resultado inválido." };
  const segundos = decorridoMs / 1000;
  if (segundos < trocas * MIN_SEGUNDOS_POR_TROCA) return { erro: "Resultado inválido." };
  const pontos = pontosDaQuebra(nivel, trocas, segundos);
  const prova: ProvaQuebra = {
    v: 1,
    jogo: "quebra",
    partida: largada.id,
    conta: largada.conta ?? null,
    nivel,
    pontos,
    trocas,
    segundos: Math.round(segundos),
    emitidaEm: agora,
  };
  return { prova: assinar(prova), pontos, trocas, segundos: Math.round(segundos), nivel };
}
