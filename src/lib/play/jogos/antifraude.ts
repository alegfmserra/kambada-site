import { hojeEmSaoLuis } from "../../cupons/cupons";
import type { ProvaArraial } from "./arraial";
import { MIN_SEGUNDOS_POR_JOGADA, type ProvaMemoria } from "./memoria";
import { MIN_SEGUNDOS_POR_TROCA, type ProvaQuebra } from "./quebra";
import type { ProvaQuiz } from "./quiz";
import { PARTIDAS_NO_RANKING_POR_DIA, QUIZ_PERGUNTAS_POR_PARTIDA, type JogoId } from "./tipos";
import { apagarMarca, contarMarca, gravarMarca, lerMarca } from "./usoUnico";

/**
 * Freios do ranking (17/11/2026). O ranking da semana vale cupom, então:
 *   - a mesma conta só pontua `PARTIDAS_NO_RANKING_POR_DIA` partidas por jogo por
 *     dia (quem joga mais continua jogando, só não manda mais para o ranking);
 *   - pontuação idêntica, repetida em sequência e sempre no tempo mínimo que o
 *     servidor aceita, tem cara de máquina: a loja é avisada (não bloqueia
 *     ninguém sozinho; quem decide é gente).
 * As contagens ficam nas marcas de uso único (memória + arquivo), sem dado pessoal.
 */

export type ProvaDeJogo = ProvaQuiz | ProvaMemoria | ProvaArraial | ProvaQuebra;

export { PARTIDAS_NO_RANKING_POR_DIA };

/** A partir de quantas partidas iguais seguidas, no tempo mínimo, a loja é avisada. */
export const REPETICOES_PARA_AVISAR = 3;

const DIA_E_POUCO_MS = 26 * 60 * 60 * 1000;

const chaveDoDia = (jogo: JogoId, jogador: string, agora: number) => `dia:${jogo}:${jogador}:${hojeEmSaoLuis(new Date(agora))}`;

/** Quantas partidas deste jogo o jogador já mandou ao ranking hoje (dia de São Luís). */
export function partidasNoDia(jogo: JogoId, jogador: string, agora = Date.now()): number {
  return Number(lerMarca(chaveDoDia(jogo, jogador, agora), agora) ?? 0) || 0;
}

export function limiteDoDiaAtingido(jogo: JogoId, jogador: string, agora = Date.now()): boolean {
  return partidasNoDia(jogo, jogador, agora) >= PARTIDAS_NO_RANKING_POR_DIA;
}

/** Conta uma partida enviada ao ranking. Devolve o total do dia. */
export function contarPartidaNoDia(jogo: JogoId, jogador: string, agora = Date.now()): number {
  return contarMarca(chaveDoDia(jogo, jogador, agora), DIA_E_POUCO_MS, agora);
}

/**
 * A partida terminou colada no tempo mínimo que o servidor aceita (até 50 %
 * acima do piso)? Gente de verdade quase nunca fica aí; máquina fica sempre.
 * O Arraial não leva tempo na prova: nunca conta.
 */
export function noTempoMinimo(prova: ProvaDeJogo): boolean {
  if (prova.jogo === "memoria") return prova.segundos <= prova.jogadas * MIN_SEGUNDOS_POR_JOGADA * 1.5;
  if (prova.jogo === "quebra") return prova.segundos <= prova.trocas * MIN_SEGUNDOS_POR_TROCA * 1.5;
  if (prova.jogo === "quiz") return prova.duracaoMs <= QUIZ_PERGUNTAS_POR_PARTIDA * 2000;
  return false;
}

/**
 * Anota a partida e diz quantas vezes seguidas o jogador repetiu a MESMA
 * pontuação no tempo mínimo neste jogo. Partida diferente (outra pontuação ou
 * tempo de gente) zera a contagem.
 */
export function repeticoesSeguidas(prova: ProvaDeJogo, jogador: string, agora = Date.now()): number {
  const chave = `rep:${prova.jogo}:${jogador}`;
  if (!noTempoMinimo(prova)) {
    apagarMarca(chave, agora);
    return 0;
  }
  const [pontos, vezes] = (lerMarca(chave, agora) ?? "").split("|");
  const total = Number(pontos) === prova.pontos ? (Number(vezes) || 0) + 1 : 1;
  gravarMarca(chave, `${prova.pontos}|${total}`, DIA_E_POUCO_MS, agora);
  return total;
}
