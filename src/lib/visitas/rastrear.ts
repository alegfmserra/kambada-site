import { EH_PRODUCAO } from "@/lib/site";

/**
 * Envia um evento anônimo de visita ao nosso servidor (ver lib/visitas/visitas.ts).
 * Nunca manda nome, e-mail, telefone nem identificador de pessoa; no Play não faz nada
 * (lá a medição é a de lib/play/telas.ts). Junta a cada evento o número aleatório da
 * visita (sessionStorage: nasce ao abrir a aba, morre ao fechá-la) e o tipo de aparelho.
 */
const ENDERECO = "/api/visitas";
const CHAVE_SID = "kambada-sid";

function numeroDaVisita(): string | undefined {
  try {
    let s = sessionStorage.getItem(CHAVE_SID);
    if (!s) {
      const b = crypto.getRandomValues(new Uint8Array(8));
      s = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
      sessionStorage.setItem(CHAVE_SID, s);
    }
    return s;
  } catch {
    return undefined;
  }
}

export function aparelhoDaTela(): "celular" | "tablet" | "computador" {
  const w = window.innerWidth;
  return w < 768 ? "celular" : w < 1100 ? "tablet" : "computador";
}

/** Só em produção (fora dela, NEXT_PUBLIC_ANALYTICS=1 liga), como o GA4 e o GoatCounter. */
export function rastrear(corpo: Record<string, unknown>): void {
  try {
    if (!EH_PRODUCAO && process.env.NEXT_PUBLIC_ANALYTICS !== "1") return;
    if (window.location.pathname.startsWith("/kambadaplay")) return;
    if (navigator.webdriver) return; // navegador automatizado (robô)
    const dados = new Blob([JSON.stringify({ s: numeroDaVisita(), aparelho: aparelhoDaTela(), ...corpo })], { type: "application/json" });
    if (!navigator.sendBeacon?.(ENDERECO, dados)) {
      void fetch(ENDERECO, { method: "POST", body: dados, keepalive: true }).catch(() => {});
    }
  } catch {
    /* medição nunca pode quebrar a página */
  }
}
