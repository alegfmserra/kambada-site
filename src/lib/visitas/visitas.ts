import { appendFile, mkdir, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { arquivoTokens } from "../bling/tokens";
import { canalDaOrigem, ficaForaDaMedicao } from "./canal";

/**
 * Visitas ao site da Kambada (loja, blog, institucional): páginas mais vistas,
 * tempo de tela, produtos mais vistos, carrinho e canal de origem (01/11/2026,
 * pedido do Alexandre). Medição PRÓPRIA e anônima, só do servidor.
 *
 * Cada linha guarda o dia/hora, o tipo do evento e um dado genérico (caminho sem
 * query, nome do produto, segundos, rótulo do canal). Nunca guarda IP, cookie,
 * identificador de pessoa, e-mail nem aparelho. Não vale para o Kambada Play
 * (tem medição própria em lib/play/telas.ts) nem para áreas privadas
 * (carrinho, checkout, pedido, conta, entrar, admin, api).
 */

export type TipoVisita = "pagina" | "tempo" | "produto" | "carrinho" | "checkout";

export type EventoVisita = {
  em: string;
  tipo: TipoVisita;
  /** Caminho sem query ("/loja/camisas"). */
  caminho?: string;
  /** Só na 1ª página da sessão: de onde a pessoa veio ("Instagram", "Google", "Direto"...). */
  canal?: string;
  /** Segundos com a página visível (tipo "tempo"). */
  seg?: number;
  /** Nome do produto (tipos "produto" e "carrinho"). */
  produto?: string;
  qtd?: number;
};

const arquivo = () => process.env.VISITAS_ARQUIVO ?? join(dirname(arquivoTokens()), "visitas-site.jsonl");
const arquivoTemporario = () => join(tmpdir(), "kambada-visitas-site.jsonl");

export { canalDaOrigem, ficaForaDaMedicao };

export function normalizarCaminho(c: unknown): string | null {
  if (typeof c !== "string") return null;
  const limpo = c.split("?")[0].split("#")[0].replace(/\/+$/, "") || "/";
  if (limpo.length > 120 || !limpo.startsWith("/")) return null;
  if (!/^[a-z0-9\-_/.%]*$/i.test(limpo)) return null;
  if (ficaForaDaMedicao(limpo)) return null;
  return limpo;
}

const texto = (v: unknown, max: number): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.replace(/\s+/g, " ").trim().slice(0, max);
  return t || undefined;
};

export function segundosValidos(valor: unknown): number | null {
  const n = Number(valor);
  if (!Number.isFinite(n) || n < 1) return null;
  return Math.min(Math.round(n), 30 * 60);
}

/** Valida o corpo livre que vem do navegador e devolve o evento limpo (ou null). */
export function lerEvento(bruto: unknown): Omit<EventoVisita, "em"> | null {
  if (!bruto || typeof bruto !== "object") return null;
  const o = bruto as Record<string, unknown>;
  switch (o.tipo) {
    case "pagina": {
      const caminho = normalizarCaminho(o.caminho);
      if (!caminho) return null;
      return { tipo: "pagina", caminho, canal: texto(o.canal, 40) };
    }
    case "tempo": {
      const caminho = normalizarCaminho(o.caminho);
      const seg = segundosValidos(o.seg);
      return caminho && seg ? { tipo: "tempo", caminho, seg } : null;
    }
    case "produto": {
      const produto = texto(o.produto, 120);
      return produto ? { tipo: "produto", produto } : null;
    }
    case "carrinho": {
      const produto = texto(o.produto, 120);
      const qtd = Math.min(Math.max(Math.round(Number(o.qtd) || 1), 1), 50);
      return produto ? { tipo: "carrinho", produto, qtd } : null;
    }
    case "checkout":
      return { tipo: "checkout" };
    default:
      return null;
  }
}

/** Registra sem nunca atrapalhar o site: qualquer falha é engolida. */
export async function registrarVisita(e: Omit<EventoVisita, "em">, agora = new Date()): Promise<void> {
  const linha = JSON.stringify({ em: agora.toISOString(), ...e }) + "\n";
  try {
    await mkdir(dirname(arquivo()), { recursive: true });
    await appendFile(arquivo(), linha, "utf8");
  } catch {
    try {
      await appendFile(arquivoTemporario(), linha, "utf8");
    } catch {
      /* medição nunca pode quebrar o site */
    }
  }
}

export async function listarVisitas(): Promise<EventoVisita[]> {
  const todos: EventoVisita[] = [];
  for (const caminho of [arquivo(), arquivoTemporario()]) {
    try {
      for (const l of (await readFile(caminho, "utf8")).split("\n")) {
        if (!l.trim()) continue;
        try {
          todos.push(JSON.parse(l) as EventoVisita);
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

/** "Camisa Tradição (G)" → "Camisa Tradição": o pedido guarda o nome com o tamanho/cor. */
export function nomeDoProduto(nomeNoPedido: string): string {
  return nomeNoPedido.replace(/\s*\([^)]*\)\s*$/, "").trim();
}

export type PedidoParaMedir = {
  criadoEm: string;
  cancelado: boolean;
  itens: { nome: string; quantidade: number }[];
  fonte?: string;
  meio?: string;
};

const pct = (parte: number, todo: number) => (todo ? Math.round((parte / todo) * 1000) / 10 : null);

export type ResumoVisitas = {
  periodo: { de: string; ate: string } | null;
  sessoes: number;
  paginasVistas: number;
  pedidos: number;
  conversao: number | null;
  paginas: { caminho: string; vistas: number; segMedio: number | null }[];
  produtos: { produto: string; vistas: number; carrinho: number; vendidas: number; pctCarrinho: number | null; pctCompra: number | null }[];
  canais: { canal: string; sessoes: number; pedidos: number; conversao: number | null }[];
  checkouts: number;
};

/**
 * Cruza as visitas (primeira página de cada sessão = sessão) com os pedidos pagos.
 * Só conta pedidos a partir do 1º dia medido, para não dividir por zero visitas
 * anteriores à medição.
 */
export function resumirVisitas(es: EventoVisita[], pedidos: PedidoParaMedir[]): ResumoVisitas {
  const inicio = es.length ? es[0].em : null;
  const validos = pedidos.filter((p) => !p.cancelado && inicio && p.criadoEm >= inicio);

  const paginasMap = new Map<string, { vistas: number; segs: number[] }>();
  const sessoesPorCanal = new Map<string, number>();
  const prod = new Map<string, { vistas: number; carrinho: number; vendidas: number }>();
  const pegaProd = (n: string) => {
    const p = prod.get(n) ?? { vistas: 0, carrinho: 0, vendidas: 0 };
    prod.set(n, p);
    return p;
  };
  let sessoes = 0;
  let paginasVistas = 0;
  let checkouts = 0;

  for (const e of es) {
    if (e.tipo === "pagina" && e.caminho) {
      paginasVistas += 1;
      const g = paginasMap.get(e.caminho) ?? { vistas: 0, segs: [] };
      g.vistas += 1;
      paginasMap.set(e.caminho, g);
      if (e.canal) {
        sessoes += 1;
        sessoesPorCanal.set(e.canal, (sessoesPorCanal.get(e.canal) ?? 0) + 1);
      }
    } else if (e.tipo === "tempo" && e.caminho && e.seg) {
      const g = paginasMap.get(e.caminho) ?? { vistas: 0, segs: [] };
      g.segs.push(e.seg);
      paginasMap.set(e.caminho, g);
    } else if (e.tipo === "produto" && e.produto) pegaProd(e.produto).vistas += 1;
    else if (e.tipo === "carrinho" && e.produto) pegaProd(e.produto).carrinho += e.qtd ?? 1;
    else if (e.tipo === "checkout") checkouts += 1;
  }

  const pedidosPorCanal = new Map<string, number>();
  for (const p of validos) {
    const c = canalDaOrigem(p.fonte, p.meio);
    pedidosPorCanal.set(c, (pedidosPorCanal.get(c) ?? 0) + 1);
    for (const i of p.itens) pegaProd(nomeDoProduto(i.nome)).vendidas += i.quantidade;
  }

  const nomesCanais = new Set([...sessoesPorCanal.keys(), ...pedidosPorCanal.keys()]);
  return {
    periodo: es.length ? { de: es[0].em.slice(0, 10), ate: es[es.length - 1].em.slice(0, 10) } : null,
    sessoes,
    paginasVistas,
    pedidos: validos.length,
    conversao: pct(validos.length, sessoes),
    checkouts,
    paginas: [...paginasMap.entries()]
      .filter(([, g]) => g.vistas > 0)
      .map(([caminho, g]) => ({
        caminho,
        vistas: g.vistas,
        segMedio: g.segs.length ? Math.round(g.segs.reduce((a, b) => a + b, 0) / g.segs.length) : null,
      }))
      .sort((a, b) => b.vistas - a.vistas),
    produtos: [...prod.entries()]
      .map(([produto, p]) => ({ produto, ...p, pctCarrinho: pct(p.carrinho, p.vistas), pctCompra: pct(p.vendidas, p.vistas) }))
      .sort((a, b) => b.vistas - a.vistas || b.vendidas - a.vendidas),
    canais: [...nomesCanais]
      .map((canal) => {
        const s = sessoesPorCanal.get(canal) ?? 0;
        const p = pedidosPorCanal.get(canal) ?? 0;
        return { canal, sessoes: s, pedidos: p, conversao: pct(p, s) };
      })
      .sort((a, b) => b.sessoes - a.sessoes || b.pedidos - a.pedidos),
  };
}
