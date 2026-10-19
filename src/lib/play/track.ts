/**
 * Instrumentação mínima de eventos do PRD (Seção 2).
 * Dispara um CustomEvent no window; a ferramenta concreta de analytics
 * (Vercel Analytics, Plausible, etc.) pode escutar "kambada:track" depois,
 * sem acoplar o jogo a nenhum fornecedor. Nenhum dado pessoal é coletado.
 */
export type EventoArraial =
  | "arraial_open"
  | "arraial_start"
  | "arraial_fitinha"
  | "arraial_desafio_inicio"
  | "arraial_completo"
  | "arraial_cta_matraca"
  | "arraial_webgl_fallback"
  | "arraial_mapa_ir"
  | "arraial_entrar_toque"
  | "arraial_minigame_pescaria_inicio"
  | "arraial_minigame_pescaria_vitoria"
  | "arraial_minigame_pescaria_abandono";

export function track(evento: EventoArraial, dados?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("kambada:track", { detail: { evento, dados } }));
  if (process.env.NODE_ENV !== "production") {
    console.debug("[kambada:track]", evento, dados ?? "");
  }
}
