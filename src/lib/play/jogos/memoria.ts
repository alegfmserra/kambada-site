import { assinar, cifrar, decifrar, embaralharPorRotulo, embaralharSeguro, idAleatorio } from "./seguranca";
import { MEMORIA_NIVEL, nivelValido, type Nivel } from "./tipos";
import { registrarPasso } from "./usoUnico";

/**
 * Memória das estampas: a partida inteira acontece no servidor (17/11/2026).
 *
 * Antes, o navegador embaralhava as cartas, jogava sozinho e só informava o
 * número de jogadas no fim: dava para mandar "partida perfeita" sem jogar, e o
 * ranking vale cupom. Agora:
 *   - o servidor sorteia a mesa e a guarda no estado da partida, CIFRADO (o
 *     navegador carrega o estado, mas não consegue ler onde está cada carta);
 *   - o navegador pede "virar a carta da posição i" e o servidor responde qual
 *     é. Só assim se descobre uma carta, e cada virada conta;
 *   - cada passo vale uma vez (`registrarPasso`): não dá para virar, olhar e
 *     reenviar o estado anterior;
 *   - jogadas, erros, o embaralho do nível difícil, o tempo (relógio do
 *     servidor) e os pontos são todos daqui.
 *
 * As cartas são números (0 a pares-1): a tela sabe qual arte é cada número.
 */

/** Cada jogada vira duas cartas e espera a animação: abaixo disto é máquina. */
export const MIN_SEGUNDOS_POR_JOGADA = 0.7;
/** Segundos "de graça" por par: 8 pares = 30 s, 12 pares = 45 s. */
const SEGUNDOS_POR_PAR = 3.75;
const VALIDADE_MS = 60 * 60 * 1000;

type Estado = {
  v: 3;
  id: string;
  /** Conta que começou a partida (null = sem conta). A prova sai presa a ela. */
  conta: string | null;
  nivel: Nivel;
  t0: number;
  /** posição -> carta. Nunca sai do servidor em claro. */
  mesa: number[];
  /** Cartas já achadas. */
  achadas: number[];
  /** Posição da primeira carta da jogada em andamento. */
  aberta: number | null;
  jogadas: number;
  errosSeguidos: number;
  /** Número do passo (cada virada é um). */
  n: number;
};

export type ProvaMemoria = {
  v: 1;
  jogo: "memoria";
  partida: string;
  /** Ausente só em prova emitida antes de 17/11/2026. */
  conta?: string | null;
  nivel: Nivel;
  pontos: number;
  jogadas: number;
  segundos: number;
  emitidaEm: number;
};

export type FimDaMemoria = { prova: string; pontos: number; jogadas: number; segundos: number; nivel: Nivel };

export type ViradaMemoria = {
  /** A carta que estava na posição pedida. */
  carta: number;
  /** Só na segunda carta da jogada: formou par? */
  par?: boolean;
  /** No difícil, depois de erros seguidos: as cartas ainda não achadas trocaram de lugar. */
  embaralhou?: boolean;
  jogadas: number;
  achadas: number;
  /** Estado para a próxima virada (ausente quando a partida acaba). */
  estado?: string;
  fim?: FimDaMemoria;
};

export function iniciarMemoria(
  nivelBruto: unknown,
  agora = Date.now(),
  conta: string | null = null,
): { estado: string; nivel: Nivel; pares: number } {
  const nivel = nivelValido(nivelBruto);
  const { pares } = MEMORIA_NIVEL[nivel];
  const mesa = embaralharSeguro(Array.from({ length: pares * 2 }, (_, i) => i % pares));
  const estado: Estado = { v: 3, id: idAleatorio(), conta, nivel, t0: agora, mesa, achadas: [], aberta: null, jogadas: 0, errosSeguidos: 0, n: 0 };
  return { estado: cifrar(estado), nivel, pares };
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

function estadoValido(e: Estado | null): e is Estado {
  if (!e || e.v !== 3 || typeof e.id !== "string" || !Array.isArray(e.mesa) || !Array.isArray(e.achadas)) return false;
  return e.mesa.length === MEMORIA_NIVEL[nivelValido(e.nivel)].pares * 2;
}

/** Vira a carta da posição `pos`. É o único jeito de saber qual carta está lá. */
export function virarCarta(estadoBruto: unknown, posBruto: unknown, agora = Date.now()): ViradaMemoria | { erro: string } {
  const e = decifrar<Estado>(estadoBruto);
  if (!estadoValido(e)) return { erro: "Partida inválida. Comece outra." };
  if (agora - e.t0 > VALIDADE_MS) return { erro: "Partida expirada. Comece outra." };
  const nivel = nivelValido(e.nivel);
  const regras = MEMORIA_NIVEL[nivel];
  const pos = typeof posBruto === "number" && Number.isInteger(posBruto) ? posBruto : -1;
  if (pos < 0 || pos >= e.mesa.length) return { erro: "Carta inválida." };
  const carta = e.mesa[pos];
  if (e.achadas.includes(carta) || e.aberta === pos) return { erro: "Essa carta já está virada." };
  if (e.achadas.length >= regras.pares) return { erro: "Partida já terminou." };
  if (!registrarPasso("memoria", e.id, e.n, String(pos), VALIDADE_MS, agora)) {
    return { erro: "Essa jogada já foi feita. Comece outra partida." };
  }

  // Primeira carta da jogada: só mostra.
  if (e.aberta === null) {
    const prox: Estado = { ...e, aberta: pos, n: e.n + 1 };
    return { carta, jogadas: e.jogadas, achadas: e.achadas.length, estado: cifrar(prox) };
  }

  const jogadas = e.jogadas + 1;
  if (e.mesa[e.aberta] === carta) {
    const achadas = [...e.achadas, carta];
    if (achadas.length < regras.pares) {
      const prox: Estado = { ...e, achadas, aberta: null, jogadas, errosSeguidos: 0, n: e.n + 1 };
      return { carta, par: true, jogadas, achadas: achadas.length, estado: cifrar(prox) };
    }
    // Último par: fim de jogo, com o relógio do servidor.
    const segundos = (agora - e.t0) / 1000;
    if (segundos < jogadas * MIN_SEGUNDOS_POR_JOGADA) return { erro: "Resultado inválido." };
    const pontos = pontosDaMemoria(nivel, jogadas, segundos);
    const prova: ProvaMemoria = {
      v: 1,
      jogo: "memoria",
      partida: e.id,
      conta: e.conta ?? null,
      nivel,
      pontos,
      jogadas,
      segundos: Math.round(segundos),
      emitidaEm: agora,
    };
    return {
      carta,
      par: true,
      jogadas,
      achadas: achadas.length,
      fim: { prova: assinar(prova), pontos, jogadas, segundos: Math.round(segundos), nivel },
    };
  }

  // Errou. No difícil, erros seguidos embaralham as cartas que ainda não foram achadas.
  const erros = e.errosSeguidos + 1;
  if (regras.embaralhaApos && erros >= regras.embaralhaApos) {
    const livres = e.mesa.map((c, i) => (e.achadas.includes(c) ? -1 : i)).filter((i) => i >= 0);
    const cartas = embaralharPorRotulo(livres.map((i) => e.mesa[i]), `memoria|${e.id}|${e.n}`);
    const mesa = [...e.mesa];
    livres.forEach((p, k) => (mesa[p] = cartas[k]));
    const prox: Estado = { ...e, mesa, aberta: null, jogadas, errosSeguidos: 0, n: e.n + 1 };
    return { carta, par: false, embaralhou: true, jogadas, achadas: e.achadas.length, estado: cifrar(prox) };
  }
  const prox: Estado = { ...e, aberta: null, jogadas, errosSeguidos: erros, n: e.n + 1 };
  return { carta, par: false, jogadas, achadas: e.achadas.length, estado: cifrar(prox) };
}
