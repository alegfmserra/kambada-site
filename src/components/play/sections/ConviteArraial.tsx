import Link from "next/link";
import { Reveal } from "@/components/play/motion/Reveal";
import { Bandeirinhas } from "@/components/play/ornaments/Bandeirinhas";

export function ConviteArraial() {
  return (
    <section id="convite-arraial" className="parede grain dither relative overflow-hidden px-6 py-20 text-center">
      <Reveal className="mx-auto max-w-md md:max-w-xl">
        <Bandeirinhas className="mx-auto mb-6 w-full max-w-xs md:max-w-sm" />
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-kambada-ink/90">
          A festa continua
        </p>
        <h2 className="mt-3 font-display text-4xl font-black tracking-[-0.02em] text-kambada-ink md:text-5xl">Entre no arraial</h2>
        <p className="mx-auto mt-4 max-w-[32ch] font-body text-kambada-ink/90 md:max-w-[42ch]">
          Passeie pelo São João e junte as cinco fitinhas no quiz da tradição.
        </p>
        <Link
          href="/kambadaplay/arraial"
          className="cta-matraca mt-8 inline-block rounded-full border-2 border-kambada-ink bg-kambada-cream px-10 py-3.5 font-body text-lg font-bold text-kambada-ink shadow-lg shadow-black/20 hover:-translate-y-0.5 hover:bg-kambada-cream/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-kambada-ink/30"
        >
          Visitar o arraial
        </Link>
        <Link
          href="/kambadaplay/conto"
          className="mt-5 block font-body text-sm font-semibold text-kambada-ink/70 underline underline-offset-4 transition-colors hover:text-kambada-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-ink/40 rounded"
        >
          Ler o conto do boi
        </Link>
      </Reveal>
    </section>
  );
}
