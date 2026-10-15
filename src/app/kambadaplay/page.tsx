import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { VIDEOS, capaDoVideo } from "@/content/play/videos";

export const metadata: Metadata = {
  title: "Kambada Play",
  description:
    "Jogos, histórias, animações e a festa do Bumba Meu Boi para viver em casa. O Kambada Play é o espaço da Kambada para quem quer um pouco mais da cultura maranhense.",
  alternates: { canonical: "/kambadaplay" },
};

type Item = {
  titulo: string;
  texto: string;
  selo: string;
  href?: string;
  imagem: string;
  /** Texto do botão (só quando há `href`). */
  acao?: string;
};

type Fileira = {
  id: string;
  titulo: string;
  legenda: string;
  itens: Item[];
};

/**
 * Catálogo do Kambada Play. Só entra aqui o que existe: o que ainda vem fica
 * sem `href` e aparece como "Em breve", sem prometer data.
 */
const FILEIRAS: Fileira[] = [
  {
    id: "jogos",
    titulo: "Jogos",
    legenda: "Entre na festa e brinque.",
    itens: [
      {
        titulo: "Arraial da Kambada",
        texto:
          "Ande pelo arraial de São João, converse com o povo da festa, pesque na barraca e junte as cinco fitinhas da tradição.",
        selo: "Jogo",
        href: "/kambadaplay/arraial",
        imagem: "/kambadaplay/images/arraial/poster.webp",
        acao: "Jogar agora",
      },
      {
        titulo: "Novos jogos",
        texto: "Mais brincadeiras da cultura maranhense a caminho.",
        selo: "Em breve",
        imagem: "/kambadaplay/images/xilogravuras/xilo-brincantes.webp",
      },
    ],
  },
  {
    id: "historias",
    titulo: "Histórias",
    legenda: "Para ler com calma, rolando a tela.",
    itens: [
      {
        titulo: "O Auto do Boi",
        texto:
          "Um folheto de cordel digital: a lenda do Bumba Meu Boi em xilogravura animada, da noite de São João à festa que renasce todo junho.",
        selo: "História",
        href: "/kambadaplay/conto",
        imagem: "/kambadaplay/images/xilogravuras/xilo-boi.webp",
        acao: "Ler agora",
      },
    ],
  },
  {
    id: "animacoes",
    titulo: "Animações",
    legenda: "A cultura em movimento.",
    itens: VIDEOS.map((v) => ({
      titulo: v.provisorio ? `${v.titulo} (título de teste)` : v.titulo,
      texto: v.descricao,
      selo: "Animação",
      href: `/kambadaplay/videos/${v.slug}`,
      imagem: capaDoVideo(v),
      acao: "Assistir",
    })),
  },
  {
    id: "conheca",
    titulo: "Conheça a matraca",
    legenda: "O instrumento que dita o ritmo do boi.",
    itens: [
      {
        titulo: "A matraca que carrega o Maranhão",
        texto:
          "A origem do Bumba Meu Boi, os sotaques da matraca e o trabalho artesanal por trás de cada peça Kambada.",
        selo: "Explorar",
        href: "/kambadaplay/matraca",
        imagem: "/kambadaplay/images/renders/hero-matraca.webp",
        acao: "Conhecer",
      },
      {
        titulo: "Leve a sua",
        texto: "Matracas pintadas à mão, feitas no Maranhão, na loja da Kambada.",
        selo: "Loja",
        href: "/loja/matracas",
        imagem: "/kambadaplay/images/renders/moody-detail.webp",
        acao: "Ver na loja",
      },
    ],
  },
];

function Cartao({ item }: { item: Item }) {
  const disponivel = Boolean(item.href);
  const miolo = (
    <>
      <div className="relative aspect-[4/5] overflow-hidden rounded-xl bg-kambada-preto">
        <Image
          src={item.imagem}
          alt=""
          fill
          sizes="(min-width: 1024px) 22rem, 78vw"
          className={`object-cover transition-transform duration-500 ${
            disponivel ? "group-hover:scale-105" : "opacity-40 grayscale"
          }`}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-kambada-preto via-kambada-preto/40 to-transparent" />
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
            disponivel
              ? "bg-kambada-amarelo text-kambada-grafite"
              : "bg-kambada-branco/15 text-kambada-branco"
          }`}
        >
          {item.selo}
        </span>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <h3 className="font-display text-xl font-bold leading-tight text-kambada-branco">
            {item.titulo}
          </h3>
          <p className="mt-2 line-clamp-4 text-sm leading-snug text-kambada-branco/80">
            {item.texto}
          </p>
          {disponivel ? (
            <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-kambada-amarelo">
              {item.acao}
              <span aria-hidden className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </span>
          ) : null}
        </div>
      </div>
    </>
  );

  if (!item.href) {
    return (
      <div
        aria-disabled
        className="w-[78vw] max-w-[22rem] shrink-0 snap-start sm:w-[20rem]"
      >
        {miolo}
      </div>
    );
  }
  return (
    <Link
      href={item.href}
      className="group w-[78vw] max-w-[22rem] shrink-0 snap-start rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kambada-amarelo sm:w-[20rem]"
    >
      {miolo}
    </Link>
  );
}

export default function PlayEntrada() {
  return (
    <>
      {/* Destaque: o jogo, com a imagem do próprio arraial */}
      <section className="relative isolate flex min-h-[80svh] items-end overflow-hidden">
        <Image
          src="/kambadaplay/images/arraial/poster.webp"
          alt="Clareira do arraial de São João à noite, com a fogueira acesa, a capela e o povo da festa"
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-kambada-grafite via-kambada-grafite/60 to-kambada-grafite/10" />
        <div className="mx-auto w-full max-w-6xl px-4 pb-14 pt-32 sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-kambada-amarelo">
            Kambada Play
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] text-kambada-branco sm:text-6xl">
            A cultura do Maranhão para jogar, ler e viver.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-kambada-branco/85 sm:text-lg">
            O espaço da Kambada para quem quer um pouco mais: entre no arraial, leia a lenda do
            boi e descubra a história por trás de cada matraca.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/kambadaplay/arraial"
              className="rounded-full bg-kambada-amarelo px-8 py-3.5 text-base font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kambada-amarelo"
            >
              Jogar o Arraial
            </Link>
            <Link
              href="/kambadaplay/conto"
              className="rounded-full border-2 border-kambada-branco/60 px-8 py-3 text-base font-bold text-kambada-branco transition-colors hover:border-kambada-amarelo hover:text-kambada-amarelo focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kambada-amarelo"
            >
              Ler o Auto do Boi
            </Link>
          </div>
        </div>
      </section>

      {/* Fileiras, no estilo catálogo */}
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-14 sm:px-6">
        {FILEIRAS.map((fileira) => (
          <section key={fileira.id} aria-labelledby={`fileira-${fileira.id}`}>
            <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h2
                id={`fileira-${fileira.id}`}
                className="font-display text-2xl font-bold text-kambada-branco"
              >
                {fileira.titulo}
              </h2>
              <p className="text-sm text-kambada-branco/60">{fileira.legenda}</p>
            </div>
            <div className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-3 sm:-mx-6 sm:scroll-px-6 sm:px-6">
              {fileira.itens.map((item) => (
                <Cartao key={item.titulo} item={item} />
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* Ponte com a loja */}
      <section className="border-t border-kambada-branco/10 bg-kambada-preto">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-display text-2xl font-bold text-kambada-branco">
              Gostou? Vista essa cultura.
            </h2>
            <p className="mt-2 max-w-xl text-kambada-branco/70">
              Camisas, matracas e ecobags feitas no Maranhão, direto do ateliê da Kambada.
            </p>
          </div>
          <Link
            href="/loja"
            className="rounded-full bg-kambada-amarelo px-8 py-3.5 text-base font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kambada-amarelo"
          >
            Ir para a loja
          </Link>
        </div>
      </section>
    </>
  );
}
