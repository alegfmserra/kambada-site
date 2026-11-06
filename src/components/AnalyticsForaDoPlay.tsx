"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

/**
 * O Kambada Play é público infantil: nada de Google Analytics nem Google Ads ali
 * (decisão do Alexandre, 27/10/2026). O Google respeita a chave "ga-disable-<id>":
 * ligada nas páginas do Play (inclusive na navegação sem recarregar) e desligada
 * fora delas. A contagem de contas e partidas do Play é do próprio servidor.
 *
 * A área de controle (/admin) também fica fora (05/11/2026): as visitas do próprio
 * Alexandre ao painel eram 5 % das visualizações e sujavam tráfego direto e tempo.
 */
export default function AnalyticsForaDoPlay({ ids }: { ids: string[] }) {
  const caminho = usePathname() ?? "/";
  useEffect(() => {
    const noPlay = caminho.startsWith("/kambadaplay") || caminho.startsWith("/admin");
    for (const id of ids) (window as unknown as Record<string, unknown>)["ga-disable-" + id] = noPlay;
  }, [caminho, ids]);
  return null;
}
