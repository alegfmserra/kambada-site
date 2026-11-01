"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Mede quanto tempo cada tela do Kambada Play fica aberta (30/10/2026).
 *
 * Medição própria e anônima: manda ao nosso servidor só o caminho (sem query) e
 * os segundos em que a tela esteve visível. Sem cookie, sem identificador, sem
 * terceiros. Telas de login/confirmação/conta o servidor descarta de qualquer jeito.
 * O tempo conta só com a aba visível; envia ao trocar de tela, ao esconder a aba
 * ou ao fechar (sendBeacon sobrevive ao fechamento).
 */
const ENDERECO = "/api/play/telas";
const PRIVADA = /^\/kambadaplay\/(entrar|confirmar|redefinir|conta)(\/|$)/;

function enviar(tela: string, seg: number) {
  if (seg < 1) return;
  try {
    const corpo = new Blob([JSON.stringify({ tela, seg })], { type: "application/json" });
    if (!navigator.sendBeacon?.(ENDERECO, corpo)) {
      void fetch(ENDERECO, { method: "POST", body: corpo, keepalive: true }).catch(() => {});
    }
  } catch {
    /* medição nunca atrapalha o Play */
  }
}

export function MedidorDeTela() {
  const caminho = usePathname() ?? "";

  useEffect(() => {
    if (!caminho.startsWith("/kambadaplay") || PRIVADA.test(caminho)) return;
    let acumulado = 0;
    let desde = document.visibilityState === "visible" ? Date.now() : 0;

    const parar = () => {
      if (desde) acumulado += Date.now() - desde;
      desde = 0;
    };
    const descarregar = () => {
      parar();
      enviar(caminho, Math.round(acumulado / 1000));
      acumulado = 0;
    };
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "visible") {
        if (!desde) desde = Date.now();
      } else {
        descarregar();
      }
    };

    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    window.addEventListener("pagehide", descarregar);
    return () => {
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      window.removeEventListener("pagehide", descarregar);
      descarregar();
    };
  }, [caminho]);

  return null;
}
