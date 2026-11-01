/**
 * Partes puras da medição de visitas (sem acesso a arquivo), usadas também no
 * navegador. Não importe módulos de servidor (node:*) aqui.
 */

/** Páginas que NÃO entram na contagem (iguais às do GoatCounter, mais o Play). */
export function ficaForaDaMedicao(caminho: string): boolean {
  return /^\/(kambadaplay|admin|checkout|pedido|carrinho|entrar|api)(\/|$)|^\/conta(\/|$)/.test(caminho);
}

/**
 * Rótulo do canal a partir de `fonte` e `meio` (os mesmos de lib/atribuicao:
 * utm_source ou o site de referência; "direto" quando não veio de lugar nenhum).
 */
export function canalDaOrigem(fonte?: string, meio?: string): string {
  const f = (fonte ?? "").toLowerCase();
  const m = (meio ?? "").toLowerCase();
  if (!f) return "Sem registro";
  if (f === "direto") return "Direto";
  if (/instagram|^ig$/.test(f)) return "Instagram";
  if (/facebook|^fb$|fb\.com/.test(f)) return "Facebook";
  if (/whatsapp|wa\.me/.test(f)) return "WhatsApp";
  if (/google/.test(f)) return /cpc|ppc|paid|ads/.test(m) ? "Google Ads" : "Google";
  if (/bing/.test(f)) return "Bing";
  if (/duckduckgo|yahoo|ecosia|brave/.test(f)) return "Outros buscadores";
  if (/linktr|linktree/.test(f)) return "Linktree";
  if (/youtube|youtu\.be/.test(f)) return "YouTube";
  if (/tiktok/.test(f)) return "TikTok";
  if (/pinterest/.test(f)) return "Pinterest";
  if (/^t\.co|twitter|^x\.com/.test(f)) return "X (Twitter)";
  if (/mail|newsletter/.test(f) || m === "email") return "E-mail";
  return "Outros sites";
}
