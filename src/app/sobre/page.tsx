import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FOTOS, GALERIA_SOBRE } from "@/lib/fotos";

/**
 * Sobre. O texto é o mesmo publicado hoje em /kambada — preservado
 * integralmente, incluindo a oralidade maranhense, que é parte da marca.
 */

export const metadata: Metadata = {
  title: "Família e tradição do São João maranhense",
  description:
    "A Kambada nasceu de uma brincadeira em família e do Arraial da Cambada na Roça. Conheça a história da marca maranhense que veste cultura.",
  alternates: { canonical: "/sobre" },
};

const NUMEROS = [
  { valor: "5+", rotulo: "Anos espalhando cultura" },
  { valor: "100+", rotulo: "Caranguejos felizes" },
] as const;

export default function Sobre() {
  return (
    <>
      <section className="border-b border-borda">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1fr_0.9fr]">
          <div>
            <h1 className="max-w-3xl font-display text-4xl leading-tight font-extrabold text-balance sm:text-5xl">
              Somos Kambada: uma turma que{" "}
              <span className="destaque">veste cultura</span>
            </h1>
            <p className="mt-6 text-lg text-texto-suave">
              Se achega e conhece nossa coleção!
            </p>
          </div>
          <div className="overflow-hidden rounded-3xl">
            <Image
              src={FOTOS.familiaMaosDadas.arquivo}
              alt={FOTOS.familiaMaosDadas.alt}
              width={FOTOS.familiaMaosDadas.largura}
              height={FOTOS.familiaMaosDadas.altura}
              priority
              sizes="(max-width: 1024px) 100vw, 42vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      <section className="border-b border-borda">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="font-display text-3xl font-bold">Sobre a Kambada</h2>
            <div className="mt-8 space-y-6 text-lg leading-relaxed text-texto-suave">
              <p>
                A Kambada nasceu de uma brincadeira em família. Sempre fomos
                apaixonados pelo São João maranhense com suas cores, danças e
                ritmos, e foi essa paixão que nos levou a criar o nosso próprio
                arraial: o Arraial da Cambada na Roça.
              </p>
              <p>
                A cada ano, nos reuníamos para celebrar do nosso jeito, com
                tanta alegria que até os vizinhos começavam a se perguntar se a
                gente realmente sabia o que era silêncio. Porque, sim, somos uma
                cambada no sentido mais bonito da palavra: unidos como UNIDADE,
                uma família que caminha junto!
              </p>
              <p>
                Do encanto de organizar o arraial veio uma ideia: produzir
                matraquinhas como brindes para nossos convidados. Gesto simples
                que se transformou em algo maior. Foi ali que percebemos que a
                nossa brincadeira poderia virar marca. O nome Kambada, com “K”,
                surgiu daí — da nossa turma, da nossa cambada de coração (e de
                risadas, porque se não tem risada, cadê a graça?).
              </p>
              <p>
                Somos cultura, somos amor, somos um. Somos família e amamos
                nosso Maranhão. Cada produto que criamos carrega um pedacinho
                dessa história, do som das matracas ao sorriso do nosso povo.
              </p>
              <p className="font-display text-xl font-semibold text-texto">
                Vem fazer parte da nossa Kambada! Não se preocupe, vem sem medo
                de dançar e de conhecer o nosso Maranhão!
              </p>
            </div>
          </div>

          <aside className="space-y-6">
            {NUMEROS.map((numero) => (
              <div
                key={numero.rotulo}
                className="rounded-2xl border border-borda bg-superficie p-8"
              >
                <p className="font-display text-5xl font-extrabold">
                  <span className="destaque">{numero.valor}</span>
                </p>
                <p className="mt-3 text-texto-suave">{numero.rotulo}</p>
              </div>
            ))}
            <Link
              href="/cultura"
              className="block rounded-2xl bg-kambada-amarelo p-8 font-display text-lg font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
            >
              Quer nos conhecer melhor? Dá uma passada na nossa Cultura →
            </Link>
          </aside>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Galeria
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-texto-suave">
            Conheça um pouco mais do gosto de ser maranhense que só, do gosto de
            ser Kambada.
          </p>
          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {GALERIA_SOBRE.map((foto) => (
              <li
                key={foto.arquivo}
                className="relative aspect-[3/4] overflow-hidden rounded-2xl"
              >
                <Image
                  src={foto.arquivo}
                  alt={foto.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover"
                />
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
