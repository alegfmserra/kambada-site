/**
 * Portal da escola (protótipo, 01/11/2026) — só existe no subdomínio
 * `modelo.somoskambada.com.br/kambadaplay` (e em `modelo.localhost` no
 * desenvolvimento). No domínio oficial o Kambada Play continua igual e as
 * rotas internas da escola respondem 404.
 *
 * Como funciona: o `proxy` vê o host; se for o da escola, reescreve
 * `/kambadaplay/...` para a árvore interna `/escola-modelo/...`. O navegador
 * continua vendo `/kambadaplay/...` — por isso os links usam `rotaEscola()`.
 */

export const BASE_PUBLICA = "/kambadaplay";
export const BASE_INTERNA = "/escola-modelo";

/** Hosts da escola: `modelo.` na frente, ou a lista de ESCOLA_HOSTS (separada por vírgula). */
export function ehHostDaEscola(host: string | null | undefined): boolean {
  if (!host) return false;
  const h = host.toLowerCase().split(":")[0];
  const extras = (process.env.ESCOLA_HOSTS ?? "")
    .split(",")
    .map((x) => x.trim().toLowerCase())
    .filter(Boolean);
  if (extras.includes(h)) return true;
  return h.startsWith("modelo.");
}

/** Endereço como o navegador vê (sempre sob /kambadaplay). */
export function rotaEscola(caminho = ""): string {
  if (!caminho || caminho === "/") return BASE_PUBLICA;
  return `${BASE_PUBLICA}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
}
