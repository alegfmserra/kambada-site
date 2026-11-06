"use client";

import { useEffect } from "react";
import { evento } from "@/lib/analytics/eventos";
import { rastrear } from "@/lib/visitas/rastrear";

/** Evento `purchase` do GA4 na página de sucesso — uma vez por pedido (sem dado pessoal). */
export default function EventoCompra({
  pedido,
  valor,
  itens,
}: {
  pedido: string;
  valor?: number;
  /** Itens do pedido (nome, quantidade e preço; sem dado pessoal) para o Analytics somar receita por produto. */
  itens?: { id: number; nome: string; quantidade: number; preco: number }[];
}) {
  useEffect(() => {
    const chave = `kambada-compra-${pedido}`;
    try {
      if (sessionStorage.getItem(chave)) return;
      sessionStorage.setItem(chave, "1");
    } catch {
      /* sem armazenamento: arrisca repetir */
    }
    rastrear({ tipo: "compra" });
    evento("purchase", {
      transaction_id: pedido,
      currency: "BRL",
      ...(valor !== undefined ? { value: valor } : {}),
      ...(itens?.length ? { items: itens.map((i) => ({ item_id: String(i.id), item_name: i.nome, price: i.preco, quantity: i.quantidade })) } : {}),
    });
  }, [pedido, valor, itens]);
  return null;
}
