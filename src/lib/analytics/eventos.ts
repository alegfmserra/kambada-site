/**
 * Eventos de conversão no Google Analytics 4 (23/10/2026). Só dispara se o GA4
 * estiver carregado (produção). NUNCA mande nome, e-mail, telefone ou qualquer
 * dado pessoal nos parâmetros — só números e rótulos genéricos.
 *
 * Eventos usados (nomes padrão do GA4, para os relatórios de e-commerce funcionarem):
 *   view_item_list · select_item · view_item · add_to_cart · remove_from_cart · view_cart ·
 *   begin_checkout · add_shipping_info · add_payment_info · purchase · search ·
 *   view_promotion · select_promotion · generate_lead (WhatsApp, com a origem; gestor interessado) ·
 *   sign_up (conta do Play, disparado fora do Play)
 * Eventos próprios: clique { area, alvo, pagina } (todo o resto; regras em ./cliques.ts) ·
 *   frete_calculado · cupom_aplicado · play_cta_home
 * O mapa completo, página por página, está em site-novo/02-auditorias-e-relatorios/MAPA-DE-CLIQUES_2026-11-17.md.
 */
type Gtag = (comando: "event", nome: string, parametros?: Record<string, unknown>) => void;

export function evento(nome: string, parametros: Record<string, unknown> = {}) {
  try {
    // Play = público infantil: nenhum evento sai de lá.
    if (window.location.pathname.startsWith("/kambadaplay")) return;
    const g = (window as unknown as { gtag?: Gtag }).gtag;
    if (typeof g === "function") g("event", nome, parametros);
  } catch {
    /* medição nunca pode quebrar a página */
  }
}
