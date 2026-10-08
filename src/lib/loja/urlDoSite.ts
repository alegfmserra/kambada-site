/**
 * O endereço público do site, para montar as URLs de volta do pagamento e de
 * notificação.
 *
 * Não pode vir cegamente do cabeçalho Host: quem forjasse o Host faria o
 * Mercado Pago avisar OUTRO servidor sobre um pagamento nosso. Por isso só
 * hosts conhecidos são aceitos; os demais caem no endereço configurado.
 *
 * Ordem: variável URL_DO_SITE (manda sempre) → host conhecido da requisição →
 * endereço temporário da Hostinger.
 */

const HOSTS_CONHECIDOS = new Set([
  "somoskambada.com.br",
  "www.somoskambada.com.br",
  "maroon-heron-459360.hostingersite.com",
]);

const PADRAO = "https://maroon-heron-459360.hostingersite.com";

export function urlDoSite(requisicao: Request): string {
  const configurada = process.env.URL_DO_SITE?.trim().replace(/\/+$/, "");
  if (configurada) return configurada;

  const host = (requisicao.headers.get("x-forwarded-host") ?? requisicao.headers.get("host") ?? "")
    .split(",")[0]
    .trim()
    .toLowerCase();

  if (HOSTS_CONHECIDOS.has(host)) return `https://${host}`;
  if (/^localhost(:\d+)?$/.test(host)) return `http://${host}`;
  return PADRAO;
}
