import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Bandeirinhas } from "@/components/play/ornaments/Bandeirinhas";
import { Progresso } from "@/components/play/hub/Progresso";
import { Revelar } from "@/components/play/hub/Revelar";
import { VideoAuto } from "@/components/play/hub/VideoAuto";
import { BoiKambada } from "@/components/play/ilustracoes/BoiKambada";
import { HQS, paginaDaHQ } from "@/content/play/hq";
import { VIDEOS, arquivoDoVideo, capaDoVideo } from "@/content/play/videos";

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
  /** Ilustração própria no lugar da foto (desenho da Kambada). */
  ilustracao?: "boi";
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
        imagem: "",
        ilustracao: "boi",
        acao: "Ler agora",
      },
    ],
  },
  {
    id: "hq",
    titulo: "Quadrinhos",
    legenda: "As aventuras do Kambadinha, página por página.",
    itens: HQS.map((h) => ({
      titulo: h.titulo,
      texto: h.resumo,
      selo: "HQ",
      href: `/kambadaplay/hq/${h.slug}`,
      imagem: paginaDaHQ(h, 1),
      acao: "Ler agora",
    })),
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
        {item.ilustracao === "boi" ? (
          <div className="absolute inset-0 bg-kambada-papel p-6 pb-24">
            <BoiKambada titulo="" className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105" />
          </div>
        ) : (
          <Image
            src={item.imagem}
            alt=""
            fill
            sizes="(min-width: 1024px) 22rem, 78vw"
            className={`object-cover transition-transform duration-500 ${
              disponivel ? "group-hover:scale-105" : "opacity-40 grayscale"
            }`}
          />
        )}
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

const TOPICOS = ["Jogar", "Ler o cordel", "Quadrinhos", "Animações", "Matraca"];

function Letreiro() {
  const faixa = TOPICOS.flatMap((t) => [t, "✦"]);
  return (
    <div
      aria-hidden
      className="play-letreiro overflow-hidden border-y-2 border-kambada-grafite bg-kambada-amarelo py-3 text-kambada-grafite"
    >
      <div className="play-letreiro-faixa">
        {[0, 1].map((k) => (
          <div
            key={k}
            className="flex shrink-0 items-center gap-6 pr-6 font-display text-lg font-extrabold uppercase tracking-[0.18em]"
          >
            {faixa.map((t, i) => (
              <span key={`${k}-${i}`}>{t}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function Numero({ n, rotulo, escuro }: { n: string; rotulo: string; escuro?: boolean }) {
  return (
    <p
      className={`flex items-center gap-3 text-xs font-bold uppercase tracking-[0.3em] ${
        escuro ? "text-kambada-grafite" : "text-kambada-amarelo"
      }`}
    >
      <span
        className={`font-display text-3xl font-extrabold tracking-normal ${
          escuro ? "text-kambada-grafite/30" : "text-kambada-branco/25"
        }`}
      >
        {n}
      </span>
      {rotulo}
    </p>
  );
}

const BOTAO_AMARELO =
  "inline-block rounded-full bg-kambada-amarelo px-8 py-3.5 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kambada-amarelo";
const BOTAO_GRAFITE =
  "inline-block rounded-full bg-kambada-grafite px-8 py-3.5 font-bold text-kambada-amarelo transition-colors hover:bg-kambada-preto focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kambada-grafite";
const BOTAO_CONTORNO =
  "inline-block rounded-full border-2 border-kambada-branco/60 px-8 py-3 font-bold text-kambada-branco transition-colors hover:border-kambada-amarelo hover:text-kambada-amarelo focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kambada-amarelo";

export default function PlayEntrada() {
  const hq = HQS[0];
  const video = VIDEOS[0];

  return (
    <div className="play-tema-site">
      {/* Abertura: o arraial em paralaxe, com varal de bandeirinhas */}
      <Progresso as="section" className="relative isolate flex min-h-[92svh] items-end overflow-hidden">
        <div className="par-fundo absolute inset-0 -z-10 will-change-transform">
          <Image
            src="/kambadaplay/images/arraial/poster.webp"
            alt="Clareira do arraial de São João à noite, com a fogueira acesa, a capela e o povo da festa"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-kambada-grafite via-kambada-grafite/55 to-kambada-grafite/10" />
        <Bandeirinhas className="absolute inset-x-0 top-0 h-9 w-full opacity-95" />
        <div className="mx-auto w-full max-w-6xl px-4 pb-16 pt-32 text-kambada-branco sm:px-6">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-kambada-amarelo">Kambada Play</p>
          <h1 className="mt-3 max-w-3xl font-display text-4xl font-extrabold leading-[1.05] sm:text-6xl">
            A cultura do Maranhão para jogar, ler e viver.
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-kambada-branco/85 sm:text-lg">
            O espaço da Kambada para quem quer um pouco mais: entre no arraial, leia o cordel, folheie a
            HQ do Kambadinha e descubra a história por trás de cada matraca.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/kambadaplay/arraial" className={BOTAO_AMARELO}>
              Jogar o Arraial
            </Link>
            <Link href="#capitulos" className={BOTAO_CONTORNO}>
              Ver tudo
            </Link>
          </div>
        </div>
      </Progresso>

      <Letreiro />

      <div id="capitulos">
        {/* 01 · Jogo */}
        <Progresso as="section" className="overflow-hidden bg-kambada-grafite text-kambada-branco">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28">
            <Revelar>
              <Numero n="01" rotulo="Jogo" />
              <h2 className="mt-4 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
                Entre no <span className="text-kambada-amarelo">arraial.</span>
              </h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-kambada-branco/80">
                Ande pela festa de São João, converse com o povo da brincadeira, pesque na barraca e junte
                as cinco fitinhas da tradição maranhense. Funciona no celular e no computador.
              </p>
              <Link href="/kambadaplay/arraial" className={`mt-8 ${BOTAO_AMARELO}`}>
                Jogar agora
              </Link>
            </Revelar>
            <div className="par-lento">
              <div className="par-gira">
                <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border-4 border-kambada-amarelo shadow-[10px_10px_0_0_#ffcc29]">
                  <Image
                    src="/kambadaplay/images/arraial/poster.webp"
                    alt="O arraial do jogo, visto de cima, com a fogueira e a capela"
                    fill
                    sizes="(min-width: 768px) 40vw, 90vw"
                    className="object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </Progresso>

        {/* 02 · Cordel */}
        <Progresso
          as="section"
          className="papel fibra-papel grain relative overflow-hidden text-kambada-grafite"
        >
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28">
            <div className="par-medio order-2 md:order-1">
              <div className="mx-auto max-w-sm rounded-sm border-[3px] border-kambada-grafite bg-kambada-branco p-5 shadow-[8px_8px_0_0_#ffcc29]">
                <BoiKambada
                  titulo="O boi do Maranhão, desenhado no traço da Kambada, com o couro nas cores da bandeira"
                  className="h-auto w-full"
                />
              </div>
            </div>
            <Revelar className="order-1 md:order-2">
              <Numero n="02" rotulo="Cordel" escuro />
              <h2 className="mt-4 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
                O Auto do <span className="bg-kambada-amarelo px-2">Boi.</span>
              </h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-kambada-grafite/85">
                Um folheto de cordel digital: a lenda do Bumba Meu Boi em xilogravura animada, da noite de
                São João à festa que renasce todo junho. É só rolar a tela.
              </p>
              <Link href="/kambadaplay/conto" className={`mt-8 ${BOTAO_GRAFITE}`}>
                Ler o cordel
              </Link>
            </Revelar>
          </div>
        </Progresso>

        {/* 03 · HQ */}
        {hq ? (
          <Progresso as="section" className="overflow-hidden bg-kambada-amarelo text-kambada-grafite">
            <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28">
              <Revelar>
                <Numero n="03" rotulo="Quadrinhos" escuro />
                <h2 className="mt-4 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
                  As aventuras do Kambadinha.
                </h2>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-kambada-grafite/85">{hq.resumo}</p>
                <p className="mt-3 text-sm font-semibold text-kambada-grafite/70">{hq.autoria}</p>
                <Link href={`/kambadaplay/hq/${hq.slug}`} className={`mt-8 ${BOTAO_GRAFITE}`}>
                  Ler a HQ
                </Link>
              </Revelar>
              {/* Leque de páginas que se abre com a rolagem */}
              <div className="relative mx-auto h-[26rem] w-full max-w-md sm:h-[30rem]">
                {[1, 3, 2].map((n, k) => (
                  <div
                    key={n}
                    className={`absolute left-1/2 top-1/2 w-[58%] -translate-x-1/2 -translate-y-1/2 ${
                      n === 1 ? "leque-1" : n === 3 ? "leque-3" : "leque-2"
                    }`}
                    style={{ zIndex: k }}
                  >
                    <Image
                      src={paginaDaHQ(hq, n)}
                      alt={n === 2 ? `Página 2 da HQ ${hq.titulo}` : ""}
                      aria-hidden={n === 2 ? undefined : true}
                      width={1094}
                      height={1547}
                      sizes="(min-width: 768px) 16rem, 55vw"
                      className="h-auto w-full rounded-md border-4 border-kambada-grafite bg-kambada-branco shadow-[6px_6px_0_0_#1d1e20]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Progresso>
        ) : null}

        {/* 04 · Animação */}
        {video ? (
          <Progresso as="section" className="overflow-hidden bg-kambada-preto text-kambada-branco">
            <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-2 md:py-28">
              <Link
                href={`/kambadaplay/videos/${video.slug}`}
                aria-label={`Assistir: ${video.titulo}`}
                className="par-lento group relative block overflow-hidden rounded-2xl border-4 border-kambada-amarelo shadow-[10px_10px_0_0_#ffcc29] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kambada-amarelo"
              >
                <VideoAuto
                  src={arquivoDoVideo(video)}
                  poster={capaDoVideo(video)}
                  className="aspect-video w-full object-cover"
                />
                <span className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-kambada-grafite/90 px-4 py-2 text-sm font-bold text-kambada-amarelo">
                  <span aria-hidden>▶</span> Assistir · {video.duracao}
                </span>
              </Link>
              <Revelar>
                <Numero n="04" rotulo="Animação" />
                <h2 className="mt-4 font-display text-4xl font-extrabold leading-tight sm:text-5xl">
                  O caranguejinho <span className="text-kambada-amarelo">vai na batida.</span>
                </h2>
                <p className="mt-5 max-w-md text-lg leading-relaxed text-kambada-branco/80">
                  {video.descricao}
                </p>
                <p className="mt-3 text-sm text-kambada-branco/55">
                  {video.titulo}
                  {video.provisorio ? " (título de teste)" : ""}
                </p>
                <Link href={`/kambadaplay/videos/${video.slug}`} className={`mt-8 ${BOTAO_AMARELO}`}>
                  Assistir com som
                </Link>
                <figure className="mt-10">
                  <div className="flex gap-4">
                    {[
                      { src: "/kambadaplay/images/atelie/placa-coreira.webp", alt: "Placa pintada à mão da coreira do tambor de crioula, de saia vermelha e flores" },
                      { src: "/kambadaplay/images/atelie/placa-coreiro.webp", alt: "Placa pintada à mão do coreiro do tambor de crioula, tocando o tambor de camisa vermelha" },
                    ].map((p) => (
                      <Image
                        key={p.src}
                        src={p.src}
                        alt={p.alt}
                        width={720}
                        height={1080}
                        sizes="9rem"
                        className="h-auto w-32 rounded-md border-2 border-kambada-amarelo sm:w-36"
                      />
                    ))}
                  </div>
                  <figcaption className="mt-3 max-w-xs text-xs text-kambada-branco/60">
                    Do ateliê: a coreira e o coreiro, placas de madeira pintadas à mão pela Kambada.
                  </figcaption>
                </figure>
              </Revelar>
            </div>
          </Progresso>
        ) : null}

        {/* 05 · Matraca */}
        <Progresso
          as="section"
          className="relative isolate overflow-hidden bg-kambada-grafite text-kambada-branco"
        >
          <div className="par-fundo absolute inset-0 -z-10 opacity-45 will-change-transform">
            <Image
              src="/kambadaplay/images/renders/hero-matraca.webp"
              alt=""
              fill
              sizes="100vw"
              className="object-cover"
            />
          </div>
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-kambada-grafite via-kambada-grafite/70 to-transparent" />
          <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6 md:py-36">
            <Revelar>
              <Numero n="05" rotulo="Matraca" />
              <h2 className="mt-4 max-w-xl font-display text-4xl font-extrabold leading-tight sm:text-5xl">
                A matraca que <span className="text-kambada-amarelo">carrega o Maranhão.</span>
              </h2>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-kambada-branco/85">
                A origem do Bumba Meu Boi, os sotaques da matraca e o trabalho artesanal por trás de cada
                peça Kambada, num passeio em 3D.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/kambadaplay/matraca" className={BOTAO_AMARELO}>
                  Conhecer a matraca
                </Link>
                <Link href="/loja/matracas" className={BOTAO_CONTORNO}>
                  Levar a sua
                </Link>
              </div>
            </Revelar>
          </div>
        </Progresso>
      </div>

      {/* Catálogo completo, no estilo prateleira (acompanha o tema do site) */}
      <div className="mx-auto max-w-6xl space-y-14 px-4 py-16 sm:px-6">
        <h2 className="font-display text-3xl font-extrabold text-texto">Tudo no Kambada Play</h2>
        {FILEIRAS.map((fileira) => (
          <section key={fileira.id} aria-labelledby={`fileira-${fileira.id}`}>
            <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <h3 id={`fileira-${fileira.id}`} className="font-display text-xl font-bold text-texto">
                {fileira.titulo}
              </h3>
              <p className="text-sm text-texto-tenue">{fileira.legenda}</p>
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
      <section className="border-t border-borda bg-kambada-preto text-kambada-branco">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-5 px-4 py-14 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="font-display text-2xl font-bold">Gostou? Vista essa cultura.</h2>
            <p className="mt-2 max-w-xl text-kambada-branco/70">
              Camisas, matracas e ecobags feitas no Maranhão, direto do ateliê da Kambada.
            </p>
          </div>
          <Link href="/loja" className={BOTAO_AMARELO}>
            Ir para a loja
          </Link>
        </div>
      </section>
    </div>
  );
}
