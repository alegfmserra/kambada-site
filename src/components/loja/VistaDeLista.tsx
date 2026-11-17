"use client";

import { useEffect } from "react";
import { evento } from "@/lib/analytics/eventos";
import { MAXIMO_DE_ITENS_NA_LISTA, type ItemDeLista } from "@/lib/analytics/cliques";

/**
 * Evento `view_item_list` do Google Analytics: "esta lista de peças foi vista".
 * Vai uma vez por lista e por página aberta (vitrine da home, loja, categoria,
 * busca). Junto com o `select_item` do cartão, mostra qual vitrine leva mais
 * gente à página de peça.
 */
export default function VistaDeLista({ nome, itens }: { nome: string; itens: ItemDeLista[] }) {
  const chave = `${nome}|${itens.map((i) => i.item_id).join(",")}`;
  useEffect(() => {
    if (itens.length === 0) return;
    evento("view_item_list", {
      item_list_name: nome,
      items: itens.slice(0, MAXIMO_DE_ITENS_NA_LISTA).map((i, index) => ({ ...i, index })),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `itens` muda de identidade a cada render; a chave em texto é quem diz se a lista mudou
  }, [chave]);
  return null;
}
