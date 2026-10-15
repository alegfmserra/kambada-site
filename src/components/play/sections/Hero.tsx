import Image from "next/image";
import type { CSSProperties } from "react";
import { copy } from "@/content/play/copy";
import { MicangaDashes } from "@/components/play/ornaments/MicangaDashes";

export function Hero() {
  return (
    <section id="hero" className="grain relative flex min-h-[100svh] flex-col overflow-hidden">
      {/* Render frontal como cenário de fundo (matraca na parede terracota) */}
      <Image
        src="/kambadaplay/images/renders/hero-matraca.webp"
        alt="Matraca Kambada pendurada em uma parede de estuque, com capelo de miçangas e o boi pintado à mão"
        fill
        priority
        sizes="100vw"
        className="object-cover object-top"
      />
      {/* Fade quente no topo e mergulho pra noite embaixo */}
      <div className="absolute inset-0 bg-gradient-to-b from-kambada-ink/30 via-transparent via-30% to-kambada-noite" />

      <header className="relative z-10 flex items-center justify-between px-6 pt-6">
        <span className="font-display text-2xl font-semibold italic tracking-tight text-kambada-cream drop-shadow-md">
          Kambada
        </span>
        <MicangaDashes count={4} />
      </header>

      <div className="relative z-10 mt-auto px-6 pb-14">
        {/* Entrada em stagger atrás da cortina do splash: kicker -> título -> subtítulo */}
        <p
          data-entrada-splash
          style={{ "--ordem": 0 } as CSSProperties}
          className="font-body text-[11px] font-semibold uppercase tracking-[0.32em] text-kambada-gold"
        >
          {copy.hero.kicker}
        </p>
        <h1
          data-entrada-splash
          style={{ "--ordem": 1 } as CSSProperties}
          className="mt-3 font-display text-[clamp(2.5rem,8vw+1rem,4.5rem)] font-black leading-[0.98] tracking-[-0.02em] text-kambada-cream"
        >
          {copy.hero.title}
        </h1>
        <p
          data-entrada-splash
          style={{ "--ordem": 2 } as CSSProperties}
          className="mt-4 max-w-[28ch] font-body text-base text-kambada-cream/75"
        >
          {copy.hero.subtitle}
        </p>
        <div className="mt-8 flex items-center gap-3" aria-hidden>
          <span className="h-10 w-px motion-safe:animate-pulse bg-gradient-to-b from-kambada-gold to-transparent" />
          <span className="font-body text-[11px] uppercase tracking-[0.25em] text-kambada-cream/75">
            role
          </span>
        </div>
      </div>
    </section>
  );
}
