import Image from "next/image";
import { copy } from "@/content/play/copy";
import { Reveal } from "@/components/play/motion/Reveal";
import { Zigzag } from "@/components/play/ornaments/Zigzag";
import { DivisorZigzag } from "@/components/play/ornaments/DivisorZigzag";
import {
  IconMatraca,
  IconZabumba,
  IconOrquestra,
  IconCostaDeMao,
} from "@/components/play/ornaments/SotaqueIcons";

const ICONES = [IconMatraca, IconZabumba, IconOrquestra, IconCostaDeMao];

export function TiposDeMatraca() {
  return (
    <section id="tipos-de-matraca" className="relative overflow-hidden bg-kambada-navy pb-28 pt-24">
      <Zigzag className="absolute top-6 h-3 w-full text-kambada-cream/20" />

      {/* Vinheta do par de matracas: marca a virada da Origem pros Sotaques */}
      <Reveal className="mt-6 flex justify-center">
        <Image
          src="/play/images/xilogravuras/xilo-matracas.webp"
          alt="Xilogravura de um par de matracas de madeira batendo, com linhas de som saindo do impacto"
          width={560}
          height={560}
          sizes="(min-width: 768px) 144px, 112px"
          className="h-auto w-28 opacity-80 md:w-36"
        />
      </Reveal>

      <div className="mt-10 px-6">
        <Reveal variant="micanga" className="mx-auto max-w-md md:max-w-2xl lg:max-w-4xl">
          <p className="font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-kambada-gold">
            Quatro jeitos de brincar
          </p>
          <h2 className="mt-4 font-display text-4xl font-black leading-[1.05] tracking-[-0.02em] text-kambada-cream md:text-5xl">
            {copy.tiposDeMatraca.title}
          </h2>
          <p className="mt-4 font-body text-kambada-cream/80 md:max-w-xl">{copy.tiposDeMatraca.intro}</p>
        </Reveal>
      </div>

      {/* Carrossel horizontal com snap no mobile; grid alinhado ao texto a partir do md */}
      <Reveal delay={0.1}>
        <ul
          tabIndex={0}
          role="region"
          aria-label="Sotaques do Bumba Meu Boi"
          className="snap-x-cards mt-10 flex gap-4 overflow-x-auto px-6 pb-4 [scrollbar-width:none] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kambada-gold md:mx-auto md:grid md:max-w-2xl md:grid-cols-2 md:overflow-visible md:pb-0 lg:max-w-4xl lg:grid-cols-4"
        >
          {copy.tiposDeMatraca.sotaques.map((s, i) => {
            const Icone = ICONES[i % ICONES.length];
            return (
              <li
                key={s.nome}
                className="relative w-[78vw] max-w-xs shrink-0 rounded-2xl border border-kambada-cream/12 bg-kambada-noite/70 p-6 shadow-xl shadow-black/30 md:w-auto md:max-w-none"
              >
                <span className="absolute right-5 top-5 font-display text-4xl font-black text-kambada-cream/10">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Icone className="h-12 w-12 text-kambada-gold" />
                <h3 className="mt-5 font-display text-xl font-semibold text-kambada-cream">{s.nome}</h3>
                <p className="mt-3 font-body text-base leading-relaxed text-kambada-cream/75">{s.descricao}</p>
                <span className="mt-5 block h-1 w-10 rounded-full bg-kambada-red" />
              </li>
            );
          })}
        </ul>
      </Reveal>
      <p className="mt-1 px-6 text-center font-body text-[11px] uppercase tracking-[0.2em] text-kambada-cream/75 md:hidden">
        deslize para o lado
      </p>

      {/* Emenda com a Vitrine: dentes de zigue-zague na cor da seção seguinte */}
      <DivisorZigzag className="absolute inset-x-0 bottom-0 h-5 w-full text-kambada-terracota md:h-6" />
    </section>
  );
}
