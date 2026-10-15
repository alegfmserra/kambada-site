import Image from "next/image";
import { copy } from "@/content/play/copy";
import { Reveal } from "@/components/play/motion/Reveal";
import { MicangaDashes } from "@/components/play/ornaments/MicangaDashes";

export function Artesanato() {
  return (
    <section id="artesanato" className="parede grain dither relative overflow-hidden py-24">
      <div className="px-6">
        <Reveal variant="micanga" className="mx-auto max-w-md md:max-w-2xl lg:max-w-3xl">
          <div className="flex items-center gap-3">
            <MicangaDashes count={3} />
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-kambada-ink/90">
              Feito à mão
            </p>
          </div>
          <h2 className="mt-4 font-display text-4xl font-black leading-[1.05] tracking-[-0.02em] text-kambada-ink md:text-5xl">
            {copy.artesanato.title}
          </h2>
          <p className="mt-4 font-body leading-relaxed text-kambada-ink/90 md:max-w-xl">{copy.artesanato.body}</p>
        </Reveal>

        <Reveal delay={0.1} className="mx-auto mt-6 flex max-w-md flex-wrap gap-2 md:max-w-2xl lg:max-w-3xl">
          {copy.artesanato.detalhes.map((d) => (
            <span
              key={d}
              className="rounded-full border border-kambada-ink/25 bg-kambada-cream/60 px-4 py-1.5 font-body text-xs font-semibold text-kambada-ink"
            >
              {d}
            </span>
          ))}
        </Reveal>
      </div>

      {/* Closes reais quebrando a grade: boi sangrando pra direita, detalhe sombreado pra esquerda.
          No desktop, as duas imagens ficam lado a lado em vez de sobrepostas. */}
      <div className="relative mx-auto mt-12 max-w-md md:flex md:max-w-4xl md:items-center md:gap-10 md:px-6 lg:max-w-5xl">
        <Reveal className="pl-6 md:flex-1 md:pl-0">
          <div className="-mr-8 overflow-hidden rounded-l-[2rem] shadow-2xl shadow-black/40 md:mr-0 md:rounded-[2rem]">
            <Image
              src="/play/images/renders/boi-close.webp"
              alt="Detalhe do boi de Bumba Meu Boi pintado à mão na madeira da matraca, com estrela branca e as cores da bandeira do Maranhão"
              width={900}
              height={1215}
              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 40vw, 26rem"
              className="h-auto w-full"
            />
          </div>
        </Reveal>
        <Reveal delay={0.15} className="pr-6 md:flex-1 md:pr-0">
          <div className="-ml-8 -mt-16 w-3/4 overflow-hidden rounded-r-[2rem] border-4 border-kambada-cream/70 shadow-2xl shadow-black/50 md:ml-0 md:mt-0 md:w-full md:rounded-[2rem]">
            <Image
              src="/play/images/renders/moody-detail.webp"
              alt="Matraca na parede sob a sombra de folhagens, com o capelo de miçangas aparecendo no alto"
              width={900}
              height={900}
              sizes="(max-width: 768px) 75vw, (max-width: 1024px) 35vw, 22rem"
              className="h-auto w-full"
            />
          </div>
        </Reveal>
      </div>
    </section>
  );
}
