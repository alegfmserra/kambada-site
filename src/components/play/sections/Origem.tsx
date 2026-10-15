import Image from "next/image";
import { copy } from "@/content/play/copy";
import { Reveal } from "@/components/play/motion/Reveal";
import { Bandeirinhas } from "@/components/play/ornaments/Bandeirinhas";
import { EstrelaRaiada } from "@/components/play/ornaments/EstrelaRaiada";
import { MicangaDashes } from "@/components/play/ornaments/MicangaDashes";

export function Origem() {
  const [primeiro, ...demais] = copy.origem.paragrafos;
  return (
    <section id="origem" className="noite grain dither relative overflow-hidden px-6 pb-0 pt-24">
      {/* Estrela raiada como marca d'água de fundo */}
      <EstrelaRaiada className="pointer-events-none absolute -right-24 top-10 h-72 w-72 text-kambada-cream/[0.05]" />

      <Bandeirinhas className="mx-auto mb-14 w-full max-w-md md:max-w-xl lg:max-w-2xl" />

      <div className="relative mx-auto max-w-md md:max-w-2xl lg:max-w-3xl">
        <Reveal variant="micanga">
          <div className="flex items-center gap-3">
            <MicangaDashes count={3} />
            <p className="font-body text-[11px] font-semibold uppercase tracking-[0.3em] text-kambada-gold">
              A tradição
            </p>
          </div>
          <h2 className="mt-4 font-display text-4xl font-black leading-[1.05] tracking-[-0.02em] text-kambada-cream md:text-5xl">
            {copy.origem.title}
          </h2>
        </Reveal>

        <Reveal delay={0.08} className="mt-8">
          <p className="font-body leading-relaxed text-kambada-cream/85">{primeiro}</p>
        </Reveal>

        {/* Xilogravura do boi: presença forte entre os parágrafos,
            semi-integrada ao fundo navy (traço cream sobre alpha) */}
        <Reveal delay={0.1} className="relative my-10 md:my-12">
          <EstrelaRaiada className="pointer-events-none absolute left-1/2 top-1/2 h-[120%] w-auto -translate-x-1/2 -translate-y-1/2 text-kambada-gold/[0.06]" />
          <Image
            src="/kambadaplay/images/xilogravuras/xilo-boi.webp"
            alt="Xilogravura do boi de Bumba Meu Boi, com o couro bordado, penas no dorso e a estrela na testa"
            width={900}
            height={900}
            sizes="(min-width: 768px) 384px, 288px"
            className="relative mx-auto h-auto w-72 opacity-90 md:w-96"
          />
        </Reveal>

        <div className="space-y-6 md:columns-2 md:gap-10">
          {demais.map((p, i) => (
            <Reveal key={i} delay={i * 0.08} className="break-inside-avoid">
              <p
                className={
                  i === demais.length - 1
                    ? "border-l-2 border-kambada-red pl-4 font-display text-xl leading-relaxed text-kambada-gold"
                    : "font-body leading-relaxed text-kambada-cream/85"
                }
              >
                {p}
              </p>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Friso dos brincantes em cortejo atravessando o rodapé da seção
          (tile repetido via CSS: a fila de brincantes nasceu pra isso) */}
      <Reveal delay={0.1} className="-mx-6 mt-16">
        <div
          role="img"
          aria-label="Friso em xilogravura com brincantes de Bumba Meu Boi em cortejo, matracas erguidas"
          className="friso-brincantes h-36 w-full opacity-75 md:h-52"
        />
      </Reveal>
    </section>
  );
}
