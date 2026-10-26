import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FOTOS, GALERIA_SOBRE } from "@/lib/fotos";

/**
 * Sobre. Texto de origem em /kambada, enxugado em 20/10/2026 (pedido do
 * Alexandre: menos texto), mantendo a oralidade maranhense da marca.
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
 * Quem faz a Kambada — pedido do Alexandre (09/10/2026): mostrar a família
 * que faz a marca, porque isso cria identificação.
 *
 * Regra do Alexandre (20/10/2026): no site, sócios são só Wilsonira e
 * Alexandre, os dois fundadores; a sócia-administradora (no papel) é a
 * Wilsonira e vem primeiro. Os demais aparecem como a família que faz a
 * Kambada, sem o título de sócio. Fotos em /public/equipe (400×400,
 * recortadas no rosto; originais em comercial/fotos-equipe_2026-10-20/).
 */
const EQUIPE: { nome: string; papel: string; foto?: string; selo?: string }[] = [
  {
    nome: "Wilsonira Batista",
    papel: "Sócia-Administradora · À Frente da Produção Artesanal",
    foto: "/equipe/wilsonira.webp",
    selo: "Sócia-Fundadora",
  },
  {
    nome: "Alexandre",
    papel: "Estratégia e Gestão",
    foto: "/equipe/alexandre.webp",
    selo: "Sócio-Fundador",
  },
  {
    nome: "Wilzanira",
    papel: "Advogada e Artista Plástica.",
    foto: "/equipe/wilzanira.webp",
  },
  { nome: "Elzanira", papel: "Artista Plástica", foto: "/equipe/elzanira.webp" },
  { nome: "Ricardo", papel: "Ilustrador e Diretor de Arte", foto: "/equipe/ricardo.webp" },
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
                A Kambada nasceu de uma brincadeira em família. Apaixonados
                pelo São João maranhense, criamos o nosso próprio arraial: o
                Arraial da Cambada na Roça — tão animado que os vizinhos
                duvidavam que a gente soubesse o que era silêncio.
              </p>
              <p>
                Para os convidados, fizemos matraquinhas de brinde. O gesto
                simples virou marca, e o nome Kambada, com “K”, veio da nossa
                turma: uma cambada no sentido mais bonito da palavra, uma
                família que caminha junto.
              </p>
              <p>
                Cada peça carrega um pedacinho dessa história, do som das
                matracas ao sorriso do nosso povo.
              </p>
              <p className="font-display text-xl font-semibold text-texto">
                Vem fazer parte da nossa Kambada — sem medo de dançar!
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
              Conheça a nossa Cultura →
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
            Wilsonira e Alexandre são os sócios fundadores, com a Wilsonira à
            frente como sócia-administradora. A família inteira pensa, desenha,
            pinta, produz e embala cada peça.
          </p>
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
            {EQUIPE.map((pessoa) => (
              <li key={pessoa.nome} className="rounded-2xl border border-borda bg-superficie p-6 text-center">
                {pessoa.foto ? (
                  <Image
                    src={pessoa.foto}
                    alt={`Foto de ${pessoa.nome}`}
                    width={224}
                    height={224}
                    className="mx-auto h-28 w-28 rounded-full object-cover"
                  />
                ) : (
                  <span
                    aria-hidden="true"
                    className="mx-auto flex h-28 w-28 items-center justify-center rounded-full bg-kambada-amarelo font-display text-5xl font-extrabold text-kambada-grafite whitespace-nowrap"
                  >
                    {pessoa.nome[0]}
                  </span>
                )}
                <h3 className="mt-4 font-display text-xl font-bold">{pessoa.nome}</h3>
                {pessoa.selo ? (
                  <p className="mt-2 inline-block rounded-full bg-kambada-amarelo px-3 py-0.5 text-xs font-bold text-kambada-grafite">
                    {pessoa.selo}
                  </p>
                ) : null}
                <p className="mt-2 text-sm leading-snug text-texto-suave">{pessoa.papel}</p>
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
            O gosto de ser maranhense que só — e de ser Kambada.
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
