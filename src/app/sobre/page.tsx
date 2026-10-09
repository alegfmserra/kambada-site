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

/**
 * Quem faz a Kambada — pedido do Alexandre (09/10/2026): mostrar as cinco
 * pessoas da sociedade, porque isso cria identificação.
 *
 * As funções vêm só do que está registrado (gestão financeira do Alexandre;
 * Wilsonira sócia-administradora e líder de produção artesanal; Ricardo nas
 * artes). Onde a função não foi informada, fica "sócia-fundadora" — sem
 * inventar. Para pôr foto: `foto` com o caminho em /public (quadrada).
 */
const EQUIPE: { nome: string; papel: string; foto?: string }[] = [
  { nome: "Alexandre", papel: "Sócio-fundador · gestão e finanças" },
  { nome: "Wilzanira", papel: "Sócia-fundadora" },
  { nome: "Wilsonira", papel: "Sócia-fundadora · administração e produção artesanal" },
  { nome: "Elzanira", papel: "Sócia-fundadora" },
  { nome: "Ricardo", papel: "Sócio-fundador · arte e criação" },
];

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

      <section className="border-b border-borda">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            Quem faz a <span className="destaque">Kambada</span>
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-texto-suave">
            Uma família, cinco sócios e uma paixão em comum: o Maranhão. É essa
            cambada que pensa, desenha, produz e embala cada peça.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {EQUIPE.map((pessoa) => (
              <li key={pessoa.nome} className="rounded-2xl border border-borda bg-superficie p-6 text-center">
                {pessoa.foto ? (
                  <Image
                    src={pessoa.foto}
                    alt={pessoa.nome}
                    width={160}
                    height={160}
                    className="mx-auto h-28 w-28 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-kambada-amarelo font-display text-5xl font-extrabold text-kambada-grafite"
                  >
                    {pessoa.nome[0]}
                  </span>
                )}
                <h3 className="mt-4 font-display text-xl font-bold">{pessoa.nome}</h3>
                <p className="mt-1 text-sm leading-snug text-texto-suave">{pessoa.papel}</p>
              </li>
            ))}
          </ul>
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
