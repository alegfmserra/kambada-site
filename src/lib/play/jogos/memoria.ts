import { assinar, idAleatorio, verificar } from "./seguranca";

/**
 * Memória das estampas — regras de pontuação e prova (somente servidor).
 *
 * O navegador joga sozinho (as cartas estão na tela), então o servidor só
 * garante o que dá para garantir: o relógio (a partida começa com um horário
 * assinado por ele) e a plausibilidade (ninguém faz 8 pares em 3 segundos).
 * Os pontos são calculados aqui, com o tempo do servidor, nunca recebidos
 * prontos do navegador.
 */

export const PARES = 8;
const MIN_JOGADAS = PARES;
const MAX_JOGADAS = 80;
/** Cada jogada vira duas cartas e espera a animação: abaixo disto é trapaça. */
const MIN_SEGUNDOS_POR_JOGADA = 0.7;
const SEGUNDOS_SEM_PENALIDADE = 30;

type Largada = { v: 1; id: string; t0: number };

export type ProvaMemoria = {
  v: 1;
  jogo: "memoria";
  partida: string;
  pontos: number;
  jogadas: number;
  segundos: number;
  emitidaEm: number;
};

export function iniciarMemoria(agora = Date.now()): { token: string } {
  const largada: Largada = { v: 1, id: idAleatorio(), t0: agora };
  return { token: assinar(largada) };
}

/** 1000 para 8 jogadas em até 30 s; cai 25 por jogada a mais e 5 por segundo a mais. */
export function pontosDaMemoria(jogadas: number, segundos: number): number {
  const penaJogadas = (jogadas - MIN_JOGADAS) * 25;
  const penaTempo = Math.max(0, segundos - SEGUNDOS_SEM_PENALIDADE) * 5;
  return Math.max(100, Math.round(1000 - penaJogadas - penaTempo));
}

export function finalizarMemoria(
  token: unknown,
  jogadasBruto: unknown,
  agora = Date.now(),
): { prova: string; pontos: number; jogadas: number; segundos: number } | { erro: string } {
  const largada = verificar<Largada>(token);
  if (!largada || largada.v !== 1) return { erro: "Partida inválida. Comece outra." };
  const jogadas = typeof jogadasBruto === "number" && Number.isInteger(jogadasBruto) ? jogadasBruto : -1;
  if (jogadas < MIN_JOGADAS || jogadas > MAX_JOGADAS) return { erro: "Resultado inválido." };
  const decorridoMs = agora - largada.t0;
  if (decorridoMs > 60 * 60 * 1000) return { erro: "Partida expirada. Comece outra." };
  const segundos = decorridoMs / 1000;
  if (segundos < jogadas * MIN_SEGUNDOS_POR_JOGADA) return { erro: "Resultado inválido." };
  const pontos = pontosDaMemoria(jogadas, segundos);
  const prova: ProvaMemoria = {
    v: 1,
    jogo: "memoria",
    partida: largada.id,
    pontos,
    jogadas,
    segundos: Math.round(segundos),
    emitidaEm: agora,
  };
  return { prova: assinar(prova), pontos, jogadas, segundos: Math.round(segundos) };
}
