"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { copy } from "@/content/play/copy";
import { Reveal } from "@/components/play/motion/Reveal";

gsap.registerPlugin(ScrollTrigger);

export function Manifesto() {
  const imgRef = useRef<HTMLDivElement>(null);

  // Zoom lento na estrela de miçangas conforme a seção atravessa a viewport
  useEffect(() => {
    const el = imgRef.current;
    if (!el) return;

    // Quem prefere menos movimento vê a imagem no tamanho final, sem zoom de rolagem
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.set(el, { scale: 1 });
      return;
    }

    const tween = gsap.fromTo(
      el,
      { scale: 1.18 },
      {
        scale: 1,
        ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: 0.8 },
      }
    );
    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <section id="manifesto" className="noite grain dither relative overflow-hidden px-6 py-20">
      <div className="mx-auto md:grid md:max-w-4xl md:grid-cols-2 md:items-center md:gap-14 lg:max-w-5xl lg:gap-20">
        <Reveal variant="cortina" className="relative z-10 mx-auto max-w-md md:order-2 md:w-full md:max-w-none md:text-left">
          <h2 className="text-center font-display text-4xl font-semibold leading-tight tracking-[-0.02em] text-kambada-cream md:text-left md:text-5xl">
            {copy.manifesto.linha1}
            <br />
            <span className="text-kambada-gold">{copy.manifesto.linha2}</span>
          </h2>
          <p className="mt-5 hidden text-center font-body text-base text-kambada-cream/70 md:block md:text-left">
            {copy.manifesto.apoio}
          </p>
        </Reveal>

        <Reveal variant="cortina" delay={0.15} className="relative z-10 mx-auto mt-10 max-w-md md:order-1 md:mt-0 md:w-full md:max-w-none">
          <div className="overflow-hidden rounded-[2rem] border border-kambada-cream/15 shadow-2xl shadow-black/50">
            <div ref={imgRef} className="will-change-transform">
              <Image
                src="/kambadaplay/images/renders/estrela-capelo.webp"
                alt="Suporte da matraca em detalhe: estrela bordada em miçangas brancas sobre veludo azul-marinho, cercada de tracinhos coloridos"
                width={1000}
                height={1000}
                sizes="(max-width: 768px) 100vw, 32rem"
                className="h-auto w-full"
              />
            </div>
          </div>
          <p className="mt-5 text-center font-body text-base text-kambada-cream/70 md:hidden">
            {copy.manifesto.apoio}
          </p>
        </Reveal>
      </div>
    </section>
  );
}
