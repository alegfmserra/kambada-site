import { appendFile, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { arquivoTokens } from "../bling/tokens";

/**
 * Telas do Kambada Play: visitas e tempo por tela (30/10/2026, pedido do Alexandre).
 *
 * Medição PRÓPRIA e anônima, só do servidor: nada vai a terceiros (o Play é público
 * infantil e o GA4/GoatCounter ficam desligados lá). Cada linha guarda só o dia/hora,
 * a tela (caminho sem query string, de uma lista de telas conhecidas) e os segundos
 * em que a tela ficou aberta e visível. Não guarda IP, conta, cookie, aparelho nem
 * identificador de pessoa. Telas de login, confirmação e conta nunca entram.
 */

export type EventoTela = { em: string; tela: string; seg: number };

const arquivo = () => process.env.TELAS_ARQUIVO ?? join(dirname(arquivoTokens()), "telas-play.jsonl");
const arquivoTemporario = () => join(tmpdir(), "kambada-telas-play.jsonl");

/** Telas que nunca são medidas: carregam token, dado de conta ou credencial. */
const PRIVADAS = /^\/kambadaplay\/(entrar|confirmar|redefinir|conta)(\/|$)/;

/**
 * Normaliza o caminho para uma tela conhecida; devolve null se não deve ser medida.
 * Aceita só /kambadaplay e até 3 níveis com letras minúsculas, números e hífen
 * (o resto vira "outra"), para que um endereço estranho nunca grave texto livre.
 */
export function normalizarTela(caminho: unknown): string | null {
  if (typeof caminho !== "string") return null;
  const limpo = caminho.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  if (limpo.length > 80) return null;
  if (!limpo.startsWith("/kambadaplay")) return null;
  if (PRIVADAS.test(limpo)) return null;
  const partes = limpo.split("/").slice(1);
  if (partes.length > 4 || !partes.every((p) => /^[a-z0-9-]{1,40}$/.test(p))) return "/kambadaplay/outra";
  return limpo;
}

export function segundosValidos(valor: unknown): number | null {
  const n = Number(valor);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(Math.round(n), 30 * 60);
}

/** Registra sem nunca atrapalhar o Play: qualquer falha é engolida. */
export async function registrarTela(e: Omit<EventoTela, "em">, agora = new Date()): Promise<void> {
  const linha = JSON.stringify({ em: agora.toISOString(), ...e }) + "\n";
  try {
    await mkdir(dirname(arquivo()), { recursive: true });
    await appendFile(arquivo(), linha, "utf8");
  } catch {
    try {
      await appendFile(arquivoTemporario(), linha, "utf8");
    } catch {
      /* medição nunca pode quebrar o Play */
    }
  }
}

export async function listarTelas(): Promise<EventoTela[]> {
  const todos: EventoTela[] = [];
  for (const caminho of [arquivo(), arquivoTemporario()]) {
    try {
      for (const l of (await readFile(caminho, "utf8")).split("\n")) {
        if (!l.trim()) continue;
        try {
          todos.push(JSON.parse(l) as EventoTela);
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

export type LinhaTela = { tela: string; visitas: number; segTotal: number; segMedio: number; segMediana: number };

/** Uma linha por tela, da mais visitada para a menos. */
export function resumirTelas(es: EventoTela[]): { linhas: LinhaTela[]; total: number; periodo: { de: string; ate: string } | null } {
  const grupos = new Map<string, number[]>();
  for (const e of es) grupos.set(e.tela, [...(grupos.get(e.tela) ?? []), e.seg]);
  const linhas = [...grupos.entries()]
    .map(([tela, segs]) => {
      const ord = [...segs].sort((a, b) => a - b);
      const segTotal = segs.reduce((a, b) => a + b, 0);
      return {
        tela,
        visitas: segs.length,
        segTotal,
        segMedio: Math.round(segTotal / segs.length),
        segMediana: ord[Math.floor(ord.length / 2)],
      };
    })
    .sort((a, b) => b.visitas - a.visitas || b.segTotal - a.segTotal);
  return { linhas, total: es.length, periodo: es.length ? { de: es[0].em.slice(0, 10), ate: es[es.length - 1].em.slice(0, 10) } : null };
}

/** "75 s" → "1 min 15 s". */
export function duracao(seg: number): string {
  if (seg < 60) return `${seg} s`;
  const m = Math.floor(seg / 60);
  const s = seg % 60;
  return s ? `${m} min ${s} s` : `${m} min`;
}
