"use client";

import { useRef } from "react";

const RAIO = 52;
/** Metade do diâmetro visual da base (h-32/w-32 = 128px). */
const META_BASE = 64;
/** Margem do ponto de repouso da base (bottom-6/left-6 = 24px). */
const REPOUSO = 24;

/**
 * Joystick virtual pra touch: escreve o vetor de movimento em inputRef.
 * Dinâmico: a zona de captura é a metade inferior esquerda da tela e a base
 * nasce onde o polegar pousa (padrão premium de thumb zone); solta, volta ao
 * ponto de repouso no canto, que segue visível como affordance.
 */
export function Joystick({ inputRef }: { inputRef: React.MutableRefObject<{ x: number; z: number }> }) {
  const zona = useRef<HTMLDivElement>(null);
  const base = useRef<HTMLDivElement>(null);
  const alavanca = useRef<HTMLDivElement>(null);
  const ativo = useRef(false);
  const centro = useRef({ x: 0, y: 0 });

  const posicionarBase = (clientX: number, clientY: number) => {
    const z = zona.current;
    const b = base.current;
    if (!z || !b) return;
    // Enquanto o dedo está na tela, base e alavanca seguem sem transição.
    b.style.transition = "none";
    if (alavanca.current) alavanca.current.style.transition = "none";
    const rect = z.getBoundingClientRect();
    // Clampa o centro da base pra ela nunca vazar da tela.
    const x = Math.min(Math.max(clientX, rect.left + META_BASE), rect.right - META_BASE);
    const y = Math.min(Math.max(clientY, rect.top + META_BASE), rect.bottom - META_BASE);
    centro.current = { x, y };
    // Desloca a base por transform a partir do ponto de repouso (canto inferior
    // esquerdo, bottom-6/left-6): sem left/top, sem reflow.
    const repousoX = rect.left + REPOUSO + META_BASE;
    const repousoY = rect.bottom - REPOUSO - META_BASE;
    b.style.transform = `translate(${x - repousoX}px, ${y - repousoY}px)`;
  };

  const mover = (clientX: number, clientY: number) => {
    const a = alavanca.current;
    if (!a) return;
    let dx = clientX - centro.current.x;
    let dy = clientY - centro.current.y;
    const d = Math.hypot(dx, dy);
    if (d > RAIO) {
      dx = (dx / d) * RAIO;
      dy = (dy / d) * RAIO;
    }
    a.style.transform = `translate(${dx}px, ${dy}px)`;
    inputRef.current = { x: dx / RAIO, z: dy / RAIO };
  };

  const soltar = () => {
    ativo.current = false;
    // Soltou: alavanca e base voltam ao repouso com mola curta (só transform e
    // posição), no easing da casa; com reduced-motion o CSS zera a transição.
    if (alavanca.current) {
      alavanca.current.style.transition = "transform var(--dur-mola) var(--ease-kambada)";
      alavanca.current.style.transform = "translate(0px, 0px)";
    }
    if (base.current) {
      base.current.style.transition = "transform var(--dur-mola) var(--ease-kambada)";
      // Volta ao ponto de repouso (canto inferior esquerdo) definido nas classes.
      base.current.style.transform = "translate(0px, 0px)";
    }
    inputRef.current = { x: 0, z: 0 };
  };

  return (
    <div
      ref={zona}
      className="pointer-events-auto absolute bottom-0 left-0 z-10 h-1/2 w-1/2 touch-none select-none"
      onTouchStart={(e) => {
        ativo.current = true;
        posicionarBase(e.touches[0].clientX, e.touches[0].clientY);
        mover(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchMove={(e) => {
        if (ativo.current) mover(e.touches[0].clientX, e.touches[0].clientY);
      }}
      onTouchEnd={soltar}
      onTouchCancel={soltar}
    >
      <div
        ref={base}
        className="joystick-base absolute bottom-6 left-6 h-32 w-32 rounded-full border-2 border-kambada-cream/25 bg-kambada-noite/40 backdrop-blur-sm"
      >
        <div
          ref={alavanca}
          className="joystick-alavanca absolute left-1/2 top-1/2 -ml-7 -mt-7 h-14 w-14 rounded-full border-2 border-kambada-cream/40 bg-kambada-gold/80 shadow-lg"
        />
      </div>
    </div>
  );
}
