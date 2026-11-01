"use client";

import { useEffect } from "react";
import { evento } from "@/lib/analytics/eventos";
import { rastrear } from "@/lib/visitas/rastrear";

/** Evento `purchase` do GA4 na página de sucesso — uma vez por pedido (sem dado pessoal). */
export default function EventoCompra({ pedido, valor }: { pedido: string; valor?: number }) {
  useEffect(() => {
    const chave = `kambada-compra-${pedido}`;
    try {
      if (sessionStorage.getItem(chave)) return;
      sessionStorage.setItem(chave, "1");
    } catch {
      /* sem armazenamento: arrisca repetir */
    }
    rastrear({ tipo: "compra" });
    evento("purchase", { transaction_id: pedido, currency: "BRL", ...(valor !== undefined ? { value: valor } : {}) });
  }, [pedido, valor]);
  return null;
}
