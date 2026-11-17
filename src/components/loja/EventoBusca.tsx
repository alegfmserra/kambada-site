"use client";

import { useEffect } from "react";
import { evento } from "@/lib/analytics/eventos";
import { termoParaMedicao } from "@/lib/loja/busca";

/**
 * Evento `search` do Google Analytics na página de resultados: o termo (sem
 * acento, e escondido se parecer e-mail ou telefone) e quantas peças vieram.
 * `resultados: 0` é a "busca sem resultado", a lista do que a loja não tem.
 */
export default function EventoBusca({ termo, resultados }: { termo: string; resultados: number }) {
  useEffect(() => {
    if (!termo) return;
    evento("search", { search_term: termoParaMedicao(termo), resultados });
  }, [termo, resultados]);
  return null;
}
