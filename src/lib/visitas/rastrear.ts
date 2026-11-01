/**
 * Envia um evento anônimo de visita ao nosso servidor (ver lib/visitas/visitas.ts).
 * Nunca manda nome, e-mail, telefone nem identificador de pessoa; no Play não faz nada
 * (lá a medição é a de lib/play/telas.ts).
 */
import { EH_PRODUCAO } from "@/lib/site";

const ENDERECO = "/api/visitas";

/** Só em produção (fora dela, NEXT_PUBLIC_ANALYTICS=1 liga), como o GA4 e o GoatCounter. */
export function rastrear(corpo: Record<string, unknown>): void {
  try {
    if (!EH_PRODUCAO && process.env.NEXT_PUBLIC_ANALYTICS !== "1") return;
    if (window.location.pathname.startsWith("/kambadaplay")) return;
    const dados = new Blob([JSON.stringify(corpo)], { type: "application/json" });
    if (!navigator.sendBeacon?.(ENDERECO, dados)) {
      void fetch(ENDERECO, { method: "POST", body: dados, keepalive: true }).catch(() => {});
    }
  } catch {
    /* medição nunca pode quebrar a página */
  }
}
