import { appendFile, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { arquivoTokens } from "../../bling/tokens";

/**
 * Partidas do Kambada Play: iniciadas × concluídas (27/10/2026).
 *
 * Serve ao indicador F2.2 do ICTG (tarefas concluídas ÷ tarefas tentadas). Primeira
 * parte, só do servidor: nada de medição de terceiros no Play (público infantil).
 * Cada linha guarda o dia/hora, o jogo, "inicio" ou "fim", o nível e, quando há
 * conta, o id interno dela (aleatório — não é nome nem e-mail). Visitante sem conta
 * entra só como contagem. Nunca guarda IP.
 *
 * Contar "sem ajuda" de verdade pede teste com observação; aqui é a taxa de quem
 * começou e chegou ao fim.
 */

export type JogoPartida = "quiz" | "memoria" | "arraial";
export type EventoPartida = {
  em: string;
  jogo: JogoPartida;
  tipo: "inicio" | "fim";
  nivel?: string;
  /** Id interno da conta (quando logada). */
  conta?: string;
};

const arquivo = () => process.env.PARTIDAS_ARQUIVO ?? join(dirname(arquivoTokens()), "partidas-play.jsonl");
const arquivoTemporario = () => join(tmpdir(), "kambada-partidas-play.jsonl");

/** Registra sem nunca atrapalhar o jogo: qualquer falha é engolida. */
export async function registrarEventoPartida(e: Omit<EventoPartida, "em">, agora = new Date()): Promise<void> {
  const linha = JSON.stringify({ em: agora.toISOString(), ...e }) + "\n";
  try {
    await mkdir(dirname(arquivo()), { recursive: true });
    await appendFile(arquivo(), linha, "utf8");
  } catch {
    try {
      await appendFile(arquivoTemporario(), linha, "utf8");
    } catch {
      /* medição nunca pode quebrar o jogo */
    }
  }
}

export async function listarEventosPartida(): Promise<EventoPartida[]> {
  const todos: EventoPartida[] = [];
  for (const caminho of [arquivo(), arquivoTemporario()]) {
    try {
      for (const l of (await readFile(caminho, "utf8")).split("\n")) {
        if (!l.trim()) continue;
        try {
          todos.push(JSON.parse(l) as EventoPartida);
        } catch {
          /* linha corrompida: ignora */
        }
      }
    } catch {
      /* arquivo ainda não existe */
    }
  }
  return todos.sort((a, b) => a.em.localeCompare(b.em));
}

const taxa = (parte: number, todo: number) => (todo ? Math.round((parte / todo) * 1000) / 10 : null);

/** Filtra por período (AAAA-MM-DD inclusivo, fuso de São Luís). */
export function filtrarPartidasPorPeriodo(es: EventoPartida[], de?: string | null, ate?: string | null): EventoPartida[] {
  const dia = (e: EventoPartida) => new Date(new Date(e.em).getTime() - 3 * 3600_000).toISOString().slice(0, 10);
  return es.filter((e) => (!de || dia(e) >= de) && (!ate || dia(e) <= ate));
}

export function resumirPartidas(es: EventoPartida[]) {
  const jogos: JogoPartida[] = ["quiz", "memoria", "arraial"];
  const porJogo: Record<string, { iniciadas: number; concluidas: number; taxa: number | null }> = {};
  for (const j of jogos) {
    const iniciadas = es.filter((e) => e.jogo === j && e.tipo === "inicio").length;
    const concluidas = es.filter((e) => e.jogo === j && e.tipo === "fim").length;
    porJogo[j] = { iniciadas, concluidas, taxa: taxa(concluidas, iniciadas) };
  }
  const iniciadas = es.filter((e) => e.tipo === "inicio").length;
  const concluidas = es.filter((e) => e.tipo === "fim").length;
  const contasIniciaram = new Set(es.filter((e) => e.tipo === "inicio" && e.conta).map((e) => e.conta));
  const contasConcluiram = new Set(es.filter((e) => e.tipo === "fim" && e.conta).map((e) => e.conta));
  return {
    iniciadas,
    concluidas,
    taxaConclusao: taxa(concluidas, iniciadas),
    porJogo,
    // Só quem tem conta: quantas contas começaram alguma partida e quantas terminaram ao menos uma.
    contas: { iniciaram: contasIniciaram.size, concluiramAoMenosUma: [...contasIniciaram].filter((c) => contasConcluiram.has(c)).length },
    periodo: es.length ? { de: es[0].em.slice(0, 10), ate: es[es.length - 1].em.slice(0, 10) } : null,
  };
}
