/**
 * Eventos de conversão no Google Analytics 4 (23/10/2026). Só dispara se o GA4
 * estiver carregado (produção). NUNCA mande nome, e-mail, telefone ou qualquer
 * dado pessoal nos parâmetros — só números e rótulos genéricos.
 *
 * Eventos usados (nomes padrão do GA4, para os relatórios de e-commerce funcionarem):
 *   add_to_cart · begin_checkout · purchase · sign_up (conta do Play) · generate_lead (gestor interessado)
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
