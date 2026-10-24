"use client";

import { useEffect } from "react";
import { type Atribuicao, origemDaVisita } from "@/lib/atribuicao/atribuicao";

const CHAVE = "kambada-origem";
const VALIDADE_MS = 30 * 86_400_000;

type Guardada = Atribuicao & { em: number };

/**
 * Anota de onde a pessoa veio (ver lib/atribuicao). Não envia nada sozinho.
 * Regras: marcador utm_* novo sempre substitui; "direto" nunca apaga uma
 * origem que ainda vale; navegação interna não muda nada.
 */
export default function RegistrarOrigem() {
  useEffect(() => {
    try {
      const nova = origemDaVisita(window.location.search, document.referrer, window.location.hostname, window.location.pathname);
      if (!nova) return;
      const atual = lerOrigemSalva();
      const temUtm = new URLSearchParams(window.location.search).has("utm_source") || new URLSearchParams(window.location.search).has("utm_campaign");
      if (atual && !temUtm) return; // sem marcador novo, vale a primeira origem dos últimos 30 dias
      localStorage.setItem(CHAVE, JSON.stringify({ ...nova, em: Date.now() } satisfies Guardada));
    } catch {
      /* sem armazenamento: só não registra */
    }
  }, []);
  return null;
}

/** A origem guardada e ainda válida (30 dias), para mandar junto com pedido, conta ou pesquisa. */
export function lerOrigemSalva(): Atribuicao | undefined {
  try {
    const g = JSON.parse(localStorage.getItem(CHAVE) ?? "null") as Guardada | null;
    if (!g || Date.now() - g.em > VALIDADE_MS) return undefined;
    const { fonte, meio, campanha, entrada } = g;
    return { fonte, meio, campanha, entrada };
  } catch {
    return undefined;
  }
}
