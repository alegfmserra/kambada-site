import type { Metadata } from "next";
import { IMAGEM_OG_PLAY, og } from "@/lib/seo/og";
import Image from "next/image";
import Link from "next/link";
import { Quiz } from "@/components/play/jogos/Quiz";
import { VIDEOS, capaDoVideo } from "@/content/play/videos";

export const metadata: Metadata = {
  title: "Jogue agora: quiz da cultura maranhense",
  description:
    "Quanto você sabe do Maranhão? 10 perguntas sobre Bumba Meu Boi, Tambor de Crioula, matraca e São Luís. Sem cadastro.",
  robots: { index: true, follow: true },
  // Sem isto herdava o canonical "/" do layout raiz e o Google tratava o quiz como cópia da home.
  alternates: { canonical: "/kambadaplay/experimente" },
  openGraph: og("/kambadaplay/experimente", { images: [IMAGEM_OG_PLAY] }),
};

const CRIAR = "/kambadaplay/entrar?modo=criar&de=/kambadaplay";

/** O que fica do outro lado da conta: aparece trancado, para dar vontade (não para cobrar). */
const VITRINE = [
  { titulo: "Arraial da Kambada", texto: "O São João em 3D: junte as 5 fitinhas.", img: "/kambadaplay/images/arraial/poster.webp" },
  { titulo: "Memória das estampas", texto: "Ache os pares das nossas estampas.", img: "/kambadaplay/jogos/memoria/camisa-boi-maranhense.webp" },
  { titulo: "HQs do Kambadinha", texto: "A Hora dos Guarás e Na Batida do Tambor.", img: "/kambadaplay/hq/kambadinha-a-hora-dos-guaras/01.webp" },
  // A animação que está no ar (content/play/videos.ts). Com ela são 4 cartões: a grade fecha sem buraco.
  ...VIDEOS.slice(0, 1).map((v) => ({ titulo: "Animação do Kambadinha", texto: `${v.titulo}.`, img: capaDoVideo(v) })),
];

const PORTA =
  "flex min-h-11 items-center justify-center rounded-full border-2 px-3 py-2 text-center text-sm font-bold leading-tight transition-colors";

/** Degustação do Kambada Play: o quiz fácil abre sem conta; o resto aparece trancado com o convite. */
export default function ExperimentePage() {
  return (
    <div className="play-tema-site">
      {/* Quem chega sem conta cai aqui: uma frase do que é o Play e três portas, sem empurrar o quiz. */}
      <header className="mx-auto max-w-2xl px-4 pt-8 text-center sm:px-6 sm:pt-10">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Kambada Play</p>
        <h1 className="mt-2 font-display text-2xl font-extrabold leading-tight text-balance text-texto sm:text-3xl">
          Jogos, quadrinhos e animação da cultura do Maranhão para crianças
        </h1>
        <nav aria-label="Por onde começar" className="mt-5 grid grid-cols-3 gap-2">
          <a href="#quiz" className={`${PORTA} border-kambada-amarelo bg-kambada-amarelo text-kambada-grafite hover:bg-kambada-amarelo-escuro`}>
            Jogar agora
          </a>
          <Link href="/kambadaplay/planos" className={`${PORTA} border-borda-campo text-texto hover:border-kambada-amarelo`}>
            Sou família
          </Link>
          <Link href="/kambadaplay/planos#escolas" className={`${PORTA} border-borda-campo text-texto hover:border-kambada-amarelo`}>
            Sou escola
          </Link>
        </nav>
      </header>

      <div id="quiz" className="mx-auto max-w-2xl scroll-mt-24 px-4 pt-8 pb-10 sm:px-6">
        <Quiz visitante />
      </div>

      <section className="border-t border-borda bg-superficie px-4 py-12 sm:px-6" aria-labelledby="vitrine-titulo">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">
            Tem muito mais
          </p>
          <h2 id="vitrine-titulo" className="mt-2 text-center font-display text-3xl font-extrabold text-texto">
            Crie a conta e <span className="destaque">libere tudo</span>
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {VITRINE.map((v) => (
              <li key={v.titulo}>
                <a href={CRIAR} className="group block overflow-hidden rounded-2xl border-2 border-borda bg-fundo transition-colors hover:border-kambada-amarelo">
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image src={v.img} alt="" fill sizes="(min-width:1024px) 25vw, (min-width:640px) 50vw, 100vw" className="object-cover opacity-60 blur-[1px] transition group-hover:opacity-80" />
                    <span className="absolute inset-0 flex items-center justify-center text-4xl" aria-hidden>🔒</span>
                  </div>
                  <div className="p-4">
                    <p className="font-display text-lg font-extrabold text-texto">{v.titulo}</p>
                    <p className="mt-1 text-sm text-texto-suave">{v.texto}</p>
                    <p className="mt-3 text-sm font-bold text-[var(--destaque-texto)]">Liberar →</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center">
            <a href={CRIAR} className="inline-block rounded-full bg-kambada-amarelo px-10 py-4 text-lg font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro">
              Criar minha conta
            </a>
            <p className="mt-3 text-sm text-texto-tenue">
              Já tem conta? <a href="/kambadaplay/entrar" className="font-semibold text-[var(--destaque-texto)] hover:underline">Entrar</a>
              {" · "}
              <a href="/kambadaplay/planos" className="font-semibold text-[var(--destaque-texto)] hover:underline">Ver os planos</a>
            </p>
          </div>
        </div>
      </section>

    </div>
  );
}
