import { assinar, idAleatorio, verificar } from "./seguranca";
import { nivelValido, QUEBRA_NIVEL, type Nivel } from "./tipos";

/**
 * Quebra-cabeça das estampas — regras de pontuação e prova (somente servidor).
 *
 * Como na memória: o navegador monta sozinho, e o servidor garante o relógio
 * (largada assinada com horário e nível) e a plausibilidade (ninguém troca 40
 * peças em 5 segundos). Os pontos são calculados aqui.
 */

const MAX_TROCAS = 600;
/** Cada troca são dois toques: abaixo disto é trapaça. */
const MIN_SEGUNDOS_POR_TROCA = 0.5;
/** Segundos "de graça" por peça: 12 peças = 96 s, 40 peças = 320 s. */
const SEGUNDOS_POR_PECA = 8;
/** Trocas "de graça" por peça (embaralhar de verdade exige quase uma por peça). */
const TROCAS_POR_PECA = 1.5;

type Largada = { v: 2; id: string; t0: number; nivel: Nivel };

export type ProvaQuebra = {
  v: 1;
  jogo: "quebra";
  partida: string;
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

export function iniciarQuebra(nivelBruto: unknown, agora = Date.now()): { token: string; nivel: Nivel; colunas: number; linhas: number } {
  const nivel = nivelValido(nivelBruto);
  const largada: Largada = { v: 2, id: idAleatorio(), t0: agora, nivel };
  const { colunas, linhas } = QUEBRA_NIVEL[nivel];
  return { token: assinar(largada), nivel, colunas, linhas };
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

export function finalizarQuebra(
  token: unknown,
  trocasBruto: unknown,
  agora = Date.now(),
): { prova: string; pontos: number; trocas: number; segundos: number; nivel: Nivel } | { erro: string } {
  const largada = verificar<Largada>(token);
  if (!largada || largada.v !== 2) return { erro: "Partida inválida. Comece outra." };
  const nivel = nivelValido(largada.nivel);
  const trocas = typeof trocasBruto === "number" && Number.isInteger(trocasBruto) ? trocasBruto : -1;
  // Embaralhada de verdade, a peça precisa de ao menos uma troca a cada duas peças fora do lugar.
  if (trocas < Math.floor(pecasDoNivel(nivel) / 4) || trocas > MAX_TROCAS) return { erro: "Resultado inválido." };
  const decorridoMs = agora - largada.t0;
  if (decorridoMs > 90 * 60 * 1000) return { erro: "Partida expirada. Comece outra." };
  const segundos = decorridoMs / 1000;
  if (segundos < trocas * MIN_SEGUNDOS_POR_TROCA) return { erro: "Resultado inválido." };
  const pontos = pontosDaQuebra(nivel, trocas, segundos);
  const prova: ProvaQuebra = {
    v: 1,
    jogo: "quebra",
    partida: largada.id,
    nivel,
    pontos,
    trocas,
    segundos: Math.round(segundos),
    emitidaEm: agora,
  };
  return { prova: assinar(prova), pontos, trocas, segundos: Math.round(segundos), nivel };
}
