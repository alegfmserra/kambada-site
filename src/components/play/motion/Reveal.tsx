"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { CustomEase } from "gsap/CustomEase";

gsap.registerPlugin(ScrollTrigger, CustomEase);

// Curva da casa (bate com --ease-kambada no globals.css)
const EASE_KAMBADA = CustomEase.create("kambadaOut", "0.16, 1, 0.3, 1");

/** Duração de reveal da casa em segundos (bate com --dur-reveal). */
const DUR_REVEAL = 0.45;

type RevealVariant = "fade-up" | "cortina" | "micanga";

type RevealProps = {
  children: React.ReactNode;
  className?: string;
  /** Atraso em segundos, para escalonar elementos irmãos. */
  delay?: number;
  /** Deslocamento vertical inicial em px (variante fade-up). */
  y?: number;
  /**
   * Assinatura do reveal: "fade-up" (padrão), "cortina" (abre por clip-path,
   * ecoando a cortina do splash) ou "micanga" (filhos diretos acendem em
   * stagger, como o cordão de miçangas).
   */
  variant?: RevealVariant;
};

/**
 * Revela o conteúdo quando entra na viewport. O estado inicial escondido vem
 * da classe `html.js [data-reveal]` (matraca.css): sem JS a página fica
 * visível; com JS o GSAP assume via fromTo (immediateRender).
 */
export function Reveal({
  children,
  className = "",
  delay = 0,
  y = 28,
  variant = "fade-up",
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Quem prefere menos movimento vê o conteúdo direto, sem tween
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(el, { opacity: 1, y: 0, clearProps: "clipPath" });
      return;
    }

    const ctx = gsap.context(() => {
      const scrollTrigger = { trigger: el, start: "top 88%", once: true } as const;

      if (variant === "cortina") {
        gsap.fromTo(
          el,
          { opacity: 1, clipPath: "inset(0 0 100% 0)" },
          {
            clipPath: "inset(0% 0% 0% 0%)",
            duration: DUR_REVEAL,
            delay,
            ease: EASE_KAMBADA,
            scrollTrigger,
            onComplete: () => gsap.set(el, { clearProps: "clipPath" }),
          }
        );
        return;
      }

      if (variant === "micanga") {
        const filhos = Array.from(el.children);
        gsap.set(el, { opacity: 1 });
        gsap.fromTo(
          filhos.length ? filhos : el,
          { opacity: 0, y: 14 },
          {
            opacity: 1,
            y: 0,
            duration: DUR_REVEAL,
            delay,
            stagger: 0.07,
            ease: EASE_KAMBADA,
            scrollTrigger,
          }
        );
        return;
      }

      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration: DUR_REVEAL,
          delay,
          ease: EASE_KAMBADA,
          scrollTrigger,
        }
      );
    }, el);

    return () => ctx.revert();
  }, [delay, y, variant]);

  return (
    <div ref={ref} data-reveal className={className}>
      {children}
    </div>
  );
}
