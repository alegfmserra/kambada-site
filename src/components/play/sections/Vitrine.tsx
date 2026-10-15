"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { copy } from "@/content/play/copy";
import { Reveal } from "@/components/play/motion/Reveal";
import { Zigzag } from "@/components/play/ornaments/Zigzag";
import { CordaoMicangas } from "@/components/play/ornaments/CordaoMicangas";
import type { AlvoVitrine } from "@/components/play/three/VitrineCanvas";

gsap.registerPlugin(ScrollTrigger);

// O canvas WebGL só entra no bundle/execução quando a seção se aproxima da viewport
const VitrineCanvas = dynamic(() => import("@/components/play/three/VitrineCanvas"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center font-body text-base text-kambada-ink">
      preparando a peça...
    </div>
  ),
});

/** Etapas do scrollytelling, derivadas dos fatos já presentes na copy da página. */
const ETAPAS = [
  {
    titulo: "O couro bordado",
    texto:
      "O capelo de miçangas traz a estrela guia dos brincantes, bordada ponto a ponto sobre o veludo.",
  },
  {
    titulo: "A madeira",
    texto:
      "Madeira maciça, entalhada e pintada à mão, com o boi nas cores da bandeira do Maranhão.",
  },
  {
    titulo: "O som",
    texto:
      "Batida em par, uma em cada mão, o som seco que marca o compasso e conduz o boi pelas ruas.",
  },
];

export function Vitrine() {
  const secaoRef = useRef<HTMLElement>(null);
  const molduraRef = useRef<HTMLDivElement>(null);
  const alvoRef = useRef<AlvoVitrine>({ giro: 0, aprox: 0 });
  const [perto, setPerto] = useState(false);
  const [emCena, setEmCena] = useState(true);
  const [scrolly, setScrolly] = useState(false);

  // Monta o canvas quando a seção se aproxima (uma vez só)
  useEffect(() => {
    const el = molduraRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setPerto(true);
          obs.disconnect();
        }
      },
      { rootMargin: "400px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Pausa o frameloop quando a seção sai da tela
  useEffect(() => {
    const el = secaoRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => setEmCena(entry.isIntersecting),
      { rootMargin: "80px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Scrollytelling: pin com scrub no desktop, matraca gira e aproxima em 3
  // ângulos enquanto os blocos de texto trocam. Mobile e reduced-motion ficam
  // com a vitrine estática de sempre.
  useEffect(() => {
    const secao = secaoRef.current;
    if (!secao) return;

    const mm = gsap.matchMedia();
    mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
      setScrolly(true);
      const etapas = gsap.utils.toArray<HTMLElement>(".vitrine-etapa", secao);
      const alvo = alvoRef.current;
      gsap.set(etapas, { opacity: 0, y: 16 });
      gsap.set(etapas[0], { opacity: 1, y: 0 });

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: secao,
          start: "top top",
          end: "+=220%",
          pin: true,
          scrub: true,
          anticipatePin: 1,
        },
      });

      // Uma volta completa em três tempos, com uma aproximação por etapa
      tl.to(alvo, { giro: Math.PI * 2, duration: 3 }, 0)
        .to(alvo, { aprox: 1, duration: 1.4 }, 0.4)
        .to(alvo, { aprox: 0.35, duration: 1.2 }, 1.8);

      // Troca dos blocos: sai um terço antes, entra o seguinte
      tl.to(etapas[0], { opacity: 0, y: -16, duration: 0.25 }, 0.8)
        .to(etapas[1], { opacity: 1, y: 0, duration: 0.25 }, 1.05)
        .to(etapas[1], { opacity: 0, y: -16, duration: 0.25 }, 1.8)
        .to(etapas[2], { opacity: 1, y: 0, duration: 0.25 }, 2.05);

      return () => {
        setScrolly(false);
        alvo.giro = 0;
        alvo.aprox = 0;
      };
    });

    return () => mm.revert();
  }, []);

  return (
    <section
      ref={secaoRef}
      id="vitrine"
      className="parede grain dither relative overflow-hidden px-6 py-24"
    >
      <div className="mx-auto md:grid md:max-w-4xl md:grid-cols-2 md:items-center md:gap-12 lg:max-w-5xl lg:gap-16">
        <div className="mx-auto max-w-md text-center md:order-2 md:w-full md:max-w-none md:text-left">
          <Reveal variant="micanga">
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-kambada-ink/90">
              {copy.vitrine.kicker}
            </p>
            <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.02em] text-kambada-ink md:text-5xl">
              {copy.vitrine.title}
            </h2>
            <p className="mt-4 hidden font-body text-kambada-ink/90 md:block">{copy.vitrine.apoio}</p>
          </Reveal>

          {/* Blocos do scrollytelling (desktop com movimento liberado) */}
          <div className="vitrine-etapas relative mt-8 h-32" aria-hidden={!scrolly}>
            {ETAPAS.map((etapa) => (
              <div key={etapa.titulo} className="vitrine-etapa absolute inset-x-0 top-0">
                <h3 className="font-display text-2xl font-semibold tracking-[-0.02em] text-kambada-ink">
                  {etapa.titulo}
                </h3>
                <p className="mt-2 font-body text-base leading-relaxed text-kambada-ink/90">
                  {etapa.texto}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Reveal delay={0.1} className="mx-auto mt-8 max-w-md md:order-1 md:mt-0 md:w-full md:max-w-none">
          <div
            ref={molduraRef}
            className="relative h-[28rem] w-full touch-pan-y overflow-hidden rounded-[2rem] border-2 border-kambada-ink/20 shadow-2xl shadow-black/40 md:h-[32rem] lg:h-[36rem]"
          >
            {/* Parede real dos renders como cenário da vitrine */}
            <Image
              src="/play/images/renders/parede-texture.webp"
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 768px) 100vw, 40rem"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-kambada-ink/35" aria-hidden />
            <div className="absolute inset-0">
              {perto && (
                <VitrineCanvas alvo={scrolly ? alvoRef : undefined} visivel={emCena} />
              )}
            </div>
            <Zigzag className="pointer-events-none absolute bottom-3 left-1/2 h-2.5 w-40 -translate-x-1/2 text-kambada-cream/30" />
          </div>
          <p className="mt-4 text-center font-body text-base text-kambada-ink/90 md:hidden">
            {copy.vitrine.apoio}
          </p>
        </Reveal>
      </div>

      {/* Emenda com o Artesanato (mesma parede): cordão de miçangas na costura */}
      <CordaoMicangas className="absolute bottom-6 left-1/2 h-4 w-56 -translate-x-1/2" />
    </section>
  );
}
