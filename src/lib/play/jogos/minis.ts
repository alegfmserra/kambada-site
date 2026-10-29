import { assinar, idAleatorio, verificar } from "./seguranca";

/**
 * Mini-atividades do Arraial (Fase 3): repetir uma sequência de 1–2 minutos.
 *   fogueira  — "Acenda a fogueira": toques curtos e longos no ritmo mostrado;
 *   quadrilha — "Marque a quadrilha": comandos do marcador na ordem.
 * O servidor sorteia a sequência e guarda o gabarito assinado; o cliente só
 * devolve o que o jogador tocou. Os textos de comando são os da quadrilha
 * junina (sem revisão cultural nova: `MINIS_REVISADAS`).
 */

export const MINIS_REVISADAS = false;

export type MiniId = "fogueira" | "quadrilha";

type Modelo = { id: MiniId; nome: string; instrucao: string; simbolos: string[]; tamanho: number };

export const MINIS: Modelo[] = [
  {
    id: "fogueira",
    nome: "Acenda a fogueira",
    instrucao: "Seu Chico bate o ritmo para acender o fogo. Olhe a sequência de toques e repita na mesma ordem.",
    simbolos: ["Toque curto", "Toque longo"],
    tamanho: 6,
  },
  {
    id: "quadrilha",
    nome: "Marque a quadrilha",
    instrucao: "O marcador grita os passos da quadrilha. Guarde a ordem e repita os comandos.",
    simbolos: ["Anarriê!", "Alavantu!", "Balancê!", "Caminho da roça!", "Olha a chuva!"],
    tamanho: 6,
  },
];

const VALIDADE_MS = 10 * 60 * 1000;
/** Tempo mínimo plausível por toque (abaixo disso o servidor não dá XP de "perfeito"). */
const MS_MINIMO_POR_TOQUE = 250;

type Estado = { v: 1; jogo: "mini"; id: string; mini: MiniId; seq: number[]; t0: number };

export function iniciarMini(mini: unknown, agora = Date.now()): { estado: string; mini: MiniId; nome: string; instrucao: string; simbolos: string[]; sequencia: number[] } | { erro: string } {
  const m = MINIS.find((x) => x.id === mini);
  if (!m) return { erro: "Atividade desconhecida." };
  const seq = Array.from({ length: m.tamanho }, () => Math.floor(Math.random() * m.simbolos.length));
  const estado: Estado = { v: 1, jogo: "mini", id: idAleatorio(), mini: m.id, seq, t0: agora };
  return { estado: assinar(estado), mini: m.id, nome: m.nome, instrucao: m.instrucao, simbolos: m.simbolos, sequencia: seq };
}

export type ResultadoMini = { mini: MiniId; acertos: number; total: number; perfeito: boolean; gabarito: number[] };

export function concluirMini(token: unknown, resposta: unknown, agora = Date.now()): ResultadoMini | { erro: string } {
  const e = verificar<Estado>(token);
  if (!e || e.v !== 1 || e.jogo !== "mini") return { erro: "Partida inválida. Comece de novo." };
  if (agora - e.t0 > VALIDADE_MS) return { erro: "O tempo acabou. Comece de novo." };
  const m = MINIS.find((x) => x.id === e.mini);
  if (!m || !Array.isArray(resposta) || resposta.length !== e.seq.length) return { erro: "Resposta inválida." };
  if (!resposta.every((n) => Number.isInteger(n) && n >= 0 && n < m.simbolos.length)) return { erro: "Resposta inválida." };
  const acertos = e.seq.filter((s, i) => resposta[i] === s).length;
  const rapidoDemais = agora - e.t0 < e.seq.length * MS_MINIMO_POR_TOQUE;
  return { mini: e.mini, acertos, total: e.seq.length, perfeito: acertos === e.seq.length && !rapidoDemais, gabarito: e.seq };
}
