"use client";

import { useEffect, useRef } from "react";

/**
 * Mede o quanto a seção já atravessou a tela e publica em `--p` (0 quando
 * ela entra por baixo, 1 quando sai por cima). O CSS usa a variável para
 * mover as camadas (paralaxe) sem JavaScript por elemento. Só mede enquanto
 * a seção está visível; com "reduzir movimento" a variável fica em 0,5.
 */
export function Progresso({
  children,
  className = "",
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section";
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.style.setProperty("--p", "0.5");
      return;
    }
    let visivel = false;
    let quadro = 0;
    const medir = () => {
      quadro = 0;
      const r = el.getBoundingClientRect();
      const total = r.height + window.innerHeight;
      const p = Math.min(1, Math.max(0, (window.innerHeight - r.top) / total));
      el.style.setProperty("--p", p.toFixed(4));
    };
    const aoRolar = () => {
      if (visivel && !quadro) quadro = requestAnimationFrame(medir);
    };
    const io = new IntersectionObserver(
      ([e]) => {
        visivel = e.isIntersecting;
        if (visivel) aoRolar();
      },
      { rootMargin: "20% 0px" }
    );
    io.observe(el);
    medir();
    window.addEventListener("scroll", aoRolar, { passive: true });
    window.addEventListener("resize", aoRolar);
    return () => {
      io.disconnect();
      window.removeEventListener("scroll", aoRolar);
      window.removeEventListener("resize", aoRolar);
      if (quadro) cancelAnimationFrame(quadro);
    };
  }, []);

  const Elemento = Tag as "div";
  return (
    <Elemento ref={ref} className={className} style={{ ["--p" as string]: 0.5 }}>
      {children}
    </Elemento>
  );
}
