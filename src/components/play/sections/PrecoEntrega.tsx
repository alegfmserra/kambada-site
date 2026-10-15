"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { copy } from "@/content/play/copy";
import { Reveal } from "@/components/play/motion/Reveal";
import { EstrelaRaiada } from "@/components/play/ornaments/EstrelaRaiada";
import { Bandeirinhas } from "@/components/play/ornaments/Bandeirinhas";

export function PrecoEntrega() {
  const ctaRef = useRef<HTMLAnchorElement>(null);

  // Pulso finito: 3 ciclos quando o CTA entra na viewport, depois silêncio
  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add("pulsar");
          obs.disconnect();
        }
      },
      { threshold: 0.6 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="preco-entrega" className="noite grain dither relative overflow-hidden px-6 py-28 text-center">
      {/* Faixa de fitas no topo da seção */}
      <div className="fita-band absolute inset-x-0 top-0 h-3" aria-hidden />

      <EstrelaRaiada className="girar-lento pointer-events-none absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 text-kambada-gold/[0.07]" />

      {/* Palmeira de babaçu: ornamento lateral discreto, meio sangrada na borda */}
      <Image
        src="/kambadaplay/images/xilogravuras/xilo-babacu.webp"
        alt=""
        aria-hidden
        width={700}
        height={700}
        sizes="(min-width: 768px) 320px, 208px"
        className="pointer-events-none absolute -left-16 top-1/2 h-auto w-52 -translate-y-1/2 opacity-[0.14] md:-left-12 md:w-80"
      />

      <div className="relative mx-auto max-w-md md:max-w-xl">
        <Reveal variant="micanga">
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-kambada-gold">
            Da Ilha pra sua casa
          </p>
          <h2 className="mt-4 font-display text-5xl font-black tracking-[-0.02em] text-kambada-cream md:text-6xl">
            {copy.precoEntrega.title}
          </h2>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-8 font-display text-2xl font-semibold text-kambada-gold">
            {copy.precoEntrega.price}
          </p>
          <p className="mt-2 font-body text-base text-kambada-cream/70">{copy.precoEntrega.delivery}</p>
        </Reveal>

        <Reveal delay={0.2}>
          <a
            ref={ctaRef}
            href={copy.precoEntrega.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="cta-matraca mt-10 inline-block rounded-full bg-kambada-red px-12 py-4 font-body text-lg font-bold text-kambada-cream shadow-xl shadow-kambada-red/30 hover:-translate-y-0.5 hover:bg-kambada-red/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-kambada-gold/60"
          >
            {copy.precoEntrega.ctaLabel}
          </a>
        </Reveal>

        <Reveal delay={0.3}>
          <Bandeirinhas className="mx-auto mt-14 w-full max-w-xs md:max-w-sm" />
        </Reveal>
      </div>
    </section>
  );
}
