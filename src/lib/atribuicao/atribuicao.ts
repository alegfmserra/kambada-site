/**
 * Origem da visita (23/10/2026) — para responder "de onde vieram as vendas e as
 * contas do Kambada Play", pedido pela FAPEMA/MaraInTech (conversão por canal).
 *
 * Sem cookie e sem dado pessoal: guarda só de onde a pessoa veio (marcadores
 * `utm_*` do link ou o site de referência) e a página de entrada. Fica no
 * navegador (localStorage) por 30 dias e só viaja ao servidor quando a pessoa
 * faz algo concreto: paga um pedido, cria conta no Play ou responde a pesquisa.
 */

export type Atribuicao = {
  /** utm_source, ou o site de referência (ex.: "instagram.com"), ou "direto". */
  fonte?: string;
  /** utm_medium (ex.: "social", "email", "cpc") ou "referral" / "organico". */
  meio?: string;
  /** utm_campaign (ex.: "play-lancamento"). */
  campanha?: string;
  /** Página por onde entrou, sem query (ex.: "/kambadaplay/experimente"). */
  entrada?: string;
};

const MAX = 60;

function slug(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.toLowerCase().trim().replace(/[^a-z0-9._\-/ ]/g, "").replace(/\s+/g, "-").slice(0, MAX);
  return t || undefined;
}

/** Valida o que veio do navegador (nunca confiar: o corpo é livre). */
export function lerAtribuicao(bruto: unknown): Atribuicao | undefined {
  if (!bruto || typeof bruto !== "object") return undefined;
  const o = bruto as Record<string, unknown>;
  const entrada = typeof o.entrada === "string" ? o.entrada.replace(/[?#].*$/, "").slice(0, 100) : undefined;
  const a: Atribuicao = {
    fonte: slug(o.fonte),
    meio: slug(o.meio),
    campanha: slug(o.campanha),
    entrada: entrada && entrada.startsWith("/") ? entrada : undefined,
  };
  return a.fonte || a.meio || a.campanha || a.entrada ? a : undefined;
}

const BUSCADORES = /(^|\.)(google|bing|duckduckgo|yahoo|ecosia|brave)\./;

/**
 * Descobre a origem a partir do endereço atual e do `document.referrer`.
 * Marcador `utm_*` manda; sem ele, site de referência; sem nada, "direto".
 * Visita vinda do próprio site (navegação interna) devolve `null` — não muda a origem.
 */
export function origemDaVisita(search: string, referrer: string, hostDoSite: string, caminho: string): Atribuicao | null {
  const q = new URLSearchParams(search);
  const fonte = slug(q.get("utm_source"));
  const meio = slug(q.get("utm_medium"));
  const campanha = slug(q.get("utm_campaign"));
  const entrada = caminho.replace(/[?#].*$/, "").slice(0, 100);
  if (fonte || meio || campanha) return { fonte, meio, campanha, entrada };

  let host = "";
  try {
    host = referrer ? new URL(referrer).hostname.replace(/^www\./, "") : "";
  } catch {
    host = "";
  }
  if (host && host === hostDoSite.replace(/^www\./, "")) return null;
  if (!host) return { fonte: "direto", meio: "nenhum", entrada };
  return { fonte: host.slice(0, MAX), meio: BUSCADORES.test(host) ? "organico" : "referral", entrada };
}

/** Texto curto para tabela/planilha: "instagram / social / play-lancamento". */
export function rotuloDaOrigem(a?: Atribuicao): string {
  if (!a) return "sem registro";
  return [a.fonte, a.meio, a.campanha].filter(Boolean).join(" / ") || "sem registro";
}
