"use client";

import { useEffect, useRef } from "react";

/**
 * Faz o conteúdo subir e aparecer quando entra na tela. O HTML nasce visível
 * (sem JavaScript nada fica escondido); só o que está abaixo da dobra é
 * escondido depois da hidratação e revelado pelo IntersectionObserver.
 */
export function Revelar({
  children,
  className = "",
  atraso = 0,
}: {
  children: React.ReactNode;
  className?: string;
  /** Atraso em milissegundos, para escalonar irmãos. */
  atraso?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight * 0.92) return; // já está na tela
    el.dataset.revelar = "0";
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.dataset.revelar = "1";
          io.disconnect();
        }
      },
      { threshold: 0.12 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={`play-revelar ${className}`} style={{ transitionDelay: `${atraso}ms` }}>
      {children}
    </div>
  );
}
