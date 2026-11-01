"use client";

import { usePathname } from "next/navigation";
import { useReportWebVitals } from "next/web-vitals";
import { rastrear } from "@/lib/visitas/rastrear";
import { ficaForaDaMedicao } from "@/lib/visitas/canal";

/**
 * Velocidade REAL percebida por quem usa o site (Core Web Vitals: LCP, INP, CLS,
 * mais FCP e TTFB), por página e por tipo de aparelho. Só o nome da métrica, o valor
 * e o caminho; nada de pessoa. Fora do Play e das áreas privadas, e só em produção.
 */
export default function MedidorDeVelocidade() {
  const caminho = usePathname() ?? "/";
  useReportWebVitals((m) => {
    if (ficaForaDaMedicao(caminho)) return;
    if (!["LCP", "INP", "CLS", "FCP", "TTFB"].includes(m.name)) return;
    rastrear({ tipo: "vital", nome: m.name, valor: m.value, caminho });
  });
  return null;
}
