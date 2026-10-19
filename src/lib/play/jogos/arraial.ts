/**
 * Arraial da Kambada — motor das missões (servidor).
 *
 * Fluxo (tudo num estado assinado que vai e volta, como no quiz):
 *   iniciar             -> missão sorteada (falas e pistas são públicas) + estado
 *   pista {npc}         -> anota a pista daquela conversa no estado
 *   desafio             -> sorteia as perguntas e entrega a 1ª (sem gabarito)
 *   responder {escolha} -> certa/errada + "você sabia?" + próxima, ou a prova final
 *
 * Pontos: (100 + bônus de rapidez até 50) por acerto; a rapidez só conta na
 * fase do desafio (explorar e ler não contam contra). Juntou as 5 pistas
 * antes do desafio: +100. Máximo por partida: 6 × 150 + 100 = 1000.
 */

import { assinar, idAleatorio, permutacaoSecreta, verificar } from "./seguranca";
import { MISSOES, ORDEM_NPCS, type Missao, type NpcId } from "./missoesArraial";

export const PERGUNTAS_DO_DESAFIO = 6;
const PONTOS_ACERTO = 100;
const BONUS_RAPIDEZ = 50;
const TEMPO_BONUS_MS = 20_000;
const TEMPO_MINIMO_MS = 700;
export const BONUS_PISTAS = 100;
const VALIDADE_MS = 2 * 60 * 60 * 1000; // uma noite de arraial: 2 h

export type MissaoPublica = {
  id: string;
  titulo: string;
  anfitriao: NpcId;
  conversas: Missao["conversas"];
  falasDoDesafio: string[];
};

export type PerguntaArraial = { indice: number; total: number; enunciado: string; opcoes: string[] };

export type RespostaArraial = {
  certa: boolean;
  correta: number;
  pontosDaPergunta: number;
  pontos: number;
  vocesabia: string;
  proxima?: PerguntaArraial;
  estado?: string;
  /** No fim: prova assinada para o placar, acertos e bônus de pistas. */
  prova?: string;
  acertos?: number;
  bonusPistas?: number;
};

type Estado = {
  v: 1;
  id: string;
  missao: string;
  t0: number;
  pistas: NpcId[];
  /** Só existe depois de "desafio". */
  desafio?: { ordem: number[]; i: number; pontos: number; acertos: number; tq: number; bonus: number };
};

export type ProvaArraial = {
  v: 1;
  jogo: "arraial";
  partida: string;
  missao: string;
  pontos: number;
  acertos: number;
  pistas: number;
  emitidaEm: number;
};

function embaralhar<T>(lista: T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Missões do mês (AAAA-MM no horário de São Luís). Sem missão revisada, usa a mais recente como prévia. */
export function missoesAtivas(agora = new Date(), lista: Missao[] = MISSOES): Missao[] {
  const mes = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Fortaleza", year: "numeric", month: "2-digit" })
    .format(agora)
    .slice(0, 7);
  const doMes = lista.filter((m) => m.temporadas === "sempre" || m.temporadas.includes(mes));
  const revisadas = doMes.filter((m) => m.revisado);
  if (revisadas.length) return revisadas;
  return doMes.length ? [doMes[doMes.length - 1]] : [lista[lista.length - 1]];
}

function lerEstado(token: unknown, agora: number): { estado: Estado; missao: Missao } | { erro: string } {
  const estado = verificar<Estado>(token);
  if (!estado || estado.v !== 1) return { erro: "Partida inválida. Recarregue o arraial." };
  if (agora - estado.t0 > VALIDADE_MS) return { erro: "A noite acabou! Recarregue o arraial para uma partida nova." };
  const missao = MISSOES.find((m) => m.id === estado.missao);
  if (!missao) return { erro: "Missão não encontrada. Recarregue o arraial." };
  return { estado, missao };
}

export function iniciarMissao(agora = Date.now()): { estado: string; missao: MissaoPublica } {
  const ativas = missoesAtivas(new Date(agora));
  const m = ativas[Math.floor(Math.random() * ativas.length)];
  const estado: Estado = { v: 1, id: idAleatorio(), missao: m.id, t0: agora, pistas: [] };
  return {
    estado: assinar(estado),
    missao: { id: m.id, titulo: m.titulo, anfitriao: m.anfitriao, conversas: m.conversas, falasDoDesafio: m.falasDoDesafio },
  };
}

export function anotarPista(token: unknown, npc: unknown, agora = Date.now()): { estado: string; pistas: NpcId[] } | { erro: string } {
  const lido = lerEstado(token, agora);
  if ("erro" in lido) return lido;
  const { estado } = lido;
  if (!ORDEM_NPCS.includes(npc as NpcId)) return { erro: "Personagem desconhecido." };
  if (estado.desafio) return { erro: "O desafio já começou." };
  const pistas = estado.pistas.includes(npc as NpcId) ? estado.pistas : [...estado.pistas, npc as NpcId];
  return { estado: assinar({ ...estado, pistas }), pistas };
}

function publica(partida: string, missao: Missao, d: NonNullable<Estado["desafio"]>): PerguntaArraial {
  const p = missao.perguntas[d.ordem[d.i]];
  const ordem = permutacaoSecreta(partida, d.i, p.opcoes.length);
  return { indice: d.i, total: d.ordem.length, enunciado: p.enunciado, opcoes: ordem.map((o) => p.opcoes[o]) };
}

export function iniciarDesafio(token: unknown, agora = Date.now()): { estado: string; pergunta: PerguntaArraial } | { erro: string } {
  const lido = lerEstado(token, agora);
  if ("erro" in lido) return lido;
  const { estado, missao } = lido;
  if (estado.desafio) return { erro: "O desafio desta partida já foi feito. Recarregue para jogar de novo." };
  const total = Math.min(PERGUNTAS_DO_DESAFIO, missao.perguntas.length);
  const ordem = embaralhar(missao.perguntas.map((_, i) => i)).slice(0, total);
  const desafio = {
    ordem,
    i: 0,
    pontos: 0,
    acertos: 0,
    tq: agora,
    bonus: estado.pistas.length >= ORDEM_NPCS.length ? BONUS_PISTAS : 0,
  };
  return { estado: assinar({ ...estado, desafio }), pergunta: publica(estado.id, missao, desafio) };
}

export function pontosDaResposta(certa: boolean, tempoMs: number): number {
  if (!certa) return 0;
  const t = Math.max(TEMPO_MINIMO_MS, tempoMs);
  return PONTOS_ACERTO + Math.round(BONUS_RAPIDEZ * Math.max(0, 1 - t / TEMPO_BONUS_MS));
}

export function responderDesafio(token: unknown, escolha: unknown, agora = Date.now()): RespostaArraial | { erro: string } {
  const lido = lerEstado(token, agora);
  if ("erro" in lido) return lido;
  const { estado, missao } = lido;
  const d = estado.desafio;
  if (!d) return { erro: "O desafio ainda não começou." };
  if (d.i >= d.ordem.length) return { erro: "O desafio já terminou." };
  if (typeof escolha !== "number" || !Number.isInteger(escolha) || escolha < 0 || escolha > 2) {
    return { erro: "Resposta inválida." };
  }
  const p = missao.perguntas[d.ordem[d.i]];
  const mostradas = permutacaoSecreta(estado.id, d.i, p.opcoes.length);
  const certa = mostradas[escolha] === 0;
  const ganho = pontosDaResposta(certa, agora - d.tq);
  const prox = { ...d, i: d.i + 1, pontos: d.pontos + ganho, acertos: d.acertos + (certa ? 1 : 0), tq: agora };
  const base = { certa, correta: mostradas.indexOf(0), pontosDaPergunta: ganho, vocesabia: p.vocesabia };

  if (prox.i >= prox.ordem.length) {
    const pontos = prox.pontos + prox.bonus;
    const prova: ProvaArraial = {
      v: 1,
      jogo: "arraial",
      partida: estado.id,
      missao: missao.id,
      pontos,
      acertos: prox.acertos,
      pistas: estado.pistas.length,
      emitidaEm: agora,
    };
    return { ...base, pontos, acertos: prox.acertos, bonusPistas: prox.bonus, prova: assinar(prova) };
  }
  return { ...base, pontos: prox.pontos, proxima: publica(estado.id, missao, prox), estado: assinar({ ...estado, desafio: prox }) };
}
