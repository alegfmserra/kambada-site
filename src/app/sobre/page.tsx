import type { Metadata } from "next";
import Link from "next/link";

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
      <section className="border-b border-white/10">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
          <h1 className="max-w-3xl font-display text-4xl leading-tight font-extrabold text-balance sm:text-5xl">
            Somos Kambada: uma turma que{" "}
            <span className="text-kambada-amarelo">veste cultura</span>
          </h1>
          <p className="mt-6 text-lg text-kambada-branco/80">
            Se achega e conhece nossa coleção!
          </p>
        </div>
      </section>

      <section className="border-b border-white/10">
        <div className="mx-auto grid max-w-6xl gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[2fr_1fr]">
          <div>
            <h2 className="font-display text-3xl font-bold">Sobre a Kambada</h2>
            <div className="mt-8 space-y-6 text-lg leading-relaxed text-kambada-branco/80">
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
              <p className="font-display text-xl font-semibold text-kambada-amarelo">
                Vem fazer parte da nossa Kambada! Não se preocupe, vem sem medo
                de dançar e de conhecer o nosso Maranhão!
              </p>
            </div>
          </div>

          <aside className="space-y-6">
            {NUMEROS.map((numero) => (
              <div
                key={numero.rotulo}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-8"
              >
                <p className="font-display text-5xl font-extrabold text-kambada-amarelo">
                  {numero.valor}
                </p>
                <p className="mt-2 text-kambada-branco/70">{numero.rotulo}</p>
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
    </>
  );
}
