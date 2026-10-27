"use client";

import { useEffect, useRef } from "react";
import { pedirPesquisa } from "@/components/PesquisaSatisfacao";

/**
 * Marcador no fim da HQ: quando a pessoa chega até aqui (leu até o final), convida
 * para a pesquisa (27/10/2026). Respeita o "já respondeu / agora não" da pesquisa.
 */
export function PesquisaAoFim() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const ob = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        timer = setTimeout(() => pedirPesquisa("hq"), 2500);
        ob.disconnect();
      }
    });
    ob.observe(el);
    return () => {
      ob.disconnect();
      if (timer) clearTimeout(timer);
    };
  }, []);
  return <div ref={ref} aria-hidden="true" className="h-px" />;
}
