"use client";

import { useEffect } from "react";
import { ARQUIVO_SW, ESCOPO_APP } from "./pwa";

/** Liga o service worker do app do Play (só nas páginas do Play; a loja não tem). */
export function RegistrarApp() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    // Em desenvolvimento o SW atrapalha a recarga dos arquivos; liga só no build.
    if (process.env.NODE_ENV !== "production") return;
    navigator.serviceWorker.register(ARQUIVO_SW, { scope: ESCOPO_APP }).catch(() => undefined);
  }, []);
  return null;
}
