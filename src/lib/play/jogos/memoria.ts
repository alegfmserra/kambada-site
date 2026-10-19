import { assinar, idAleatorio, verificar } from "./seguranca";
import { MEMORIA_NIVEL, nivelValido, type Nivel } from "./tipos";

/**
 * Memória das estampas — regras de pontuação e prova (somente servidor).
 *
 * O navegador joga sozinho (as cartas estão na tela), então o servidor só
 * garante o que dá para garantir: o relógio (a partida começa com um horário
 * assinado por ele, junto com o nível) e a plausibilidade (ninguém faz 12
 * pares em 3 segundos). Os pontos são calculados aqui, com o tempo do
 * servidor, nunca recebidos prontos do navegador.
 */

const MAX_JOGADAS = 120;
/** Cada jogada vira duas cartas e espera a animação: abaixo disto é trapaça. */
const MIN_SEGUNDOS_POR_JOGADA = 0.7;
/** Segundos "de graça" por par: 8 pares = 30 s, 12 pares = 45 s. */
const SEGUNDOS_POR_PAR = 3.75;

type Largada = { v: 2; id: string; t0: number; nivel: Nivel };

export type ProvaMemoria = {
  v: 1;
  jogo: "memoria";
  partida: string;
  nivel: Nivel;
  pontos: number;
  jogadas: number;
  segundos: number;
  emitidaEm: number;
};

export function iniciarMemoria(nivelBruto: unknown, agora = Date.now()): { token: string; nivel: Nivel; pares: number } {
  const nivel = nivelValido(nivelBruto);
  const largada: Largada = { v: 2, id: idAleatorio(), t0: agora, nivel };
  return { token: assinar(largada), nivel, pares: MEMORIA_NIVEL[nivel].pares };
}

/**
 * Base 1000 para o jogo perfeito (uma jogada por par, dentro do tempo de
 * graça); cai 25 por jogada a mais e 5 por segundo a mais; nunca menos que
 * 100. O multiplicador do nível entra por cima: 1×, 1,5× ou 2×.
 */
export function pontosDaMemoria(nivel: Nivel, jogadas: number, segundos: number): number {
  const { pares, multiplicador } = MEMORIA_NIVEL[nivel];
  const penaJogadas = (jogadas - pares) * 25;
  const penaTempo = Math.max(0, segundos - pares * SEGUNDOS_POR_PAR) * 5;
  const base = Math.max(100, Math.round(1000 - penaJogadas - penaTempo));
  return Math.round(base * multiplicador);
}

export function finalizarMemoria(
  token: unknown,
  jogadasBruto: unknown,
  agora = Date.now(),
): { prova: string; pontos: number; jogadas: number; segundos: number; nivel: Nivel } | { erro: string } {
  const largada = verificar<Largada>(token);
  if (!largada || largada.v !== 2) return { erro: "Partida inválida. Comece outra." };
  const nivel = nivelValido(largada.nivel);
  const { pares } = MEMORIA_NIVEL[nivel];
  const jogadas = typeof jogadasBruto === "number" && Number.isInteger(jogadasBruto) ? jogadasBruto : -1;
  if (jogadas < pares || jogadas > MAX_JOGADAS) return { erro: "Resultado inválido." };
  const decorridoMs = agora - largada.t0;
  if (decorridoMs > 60 * 60 * 1000) return { erro: "Partida expirada. Comece outra." };
  const segundos = decorridoMs / 1000;
  if (segundos < jogadas * MIN_SEGUNDOS_POR_JOGADA) return { erro: "Resultado inválido." };
  const pontos = pontosDaMemoria(nivel, jogadas, segundos);
  const prova: ProvaMemoria = {
    v: 1,
    jogo: "memoria",
    partida: largada.id,
    nivel,
    pontos,
    jogadas,
    segundos: Math.round(segundos),
    emitidaEm: agora,
  };
  return { prova: assinar(prova), pontos, jogadas, segundos: Math.round(segundos), nivel };
}
