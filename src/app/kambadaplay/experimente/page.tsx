import type { Metadata } from "next";
import Image from "next/image";
import { Quiz } from "@/components/play/jogos/Quiz";

export const metadata: Metadata = {
  title: "Jogue agora: quiz da cultura maranhense",
  description:
    "Quanto você sabe do Maranhão? 10 perguntas sobre Bumba Meu Boi, Tambor de Crioula, matraca e São Luís. Grátis, sem cadastro.",
  robots: { index: true, follow: true },
};

const CRIAR = "/kambadaplay/entrar?modo=criar&de=/kambadaplay";

/** O que fica do outro lado da conta: aparece trancado, para dar vontade (não para cobrar). */
const VITRINE = [
  { titulo: "Arraial da Kambada", texto: "Ande pelo arraial em 3D, converse com o povo da festa e junte as 5 fitinhas.", img: "/kambadaplay/images/arraial/poster.webp" },
  { titulo: "Memória das estampas", texto: "Encontre os pares das nossas estampas e descubra o que cada uma conta.", img: "/kambadaplay/jogos/memoria/camisa-boi-maranhense.webp" },
  { titulo: "HQ da Kambadinha", texto: "Kambadinha em: Na Batida do Tambor, a primeira história em quadrinhos.", img: "/kambadaplay/hq/kambadinha-na-batida-do-tambor/01.webp" },
  { titulo: "Animação", texto: "A Kambadinha cai na roda do Tambor de Crioula.", img: "/kambadaplay/videos/kambadinha-na-batida-do-tambor.jpg" },
];

/** Degustação do Kambada Play: o quiz fácil abre sem conta; o resto aparece trancado com o convite. */
export default function ExperimentePage() {
  return (
    <div className="play-tema-site">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Quiz visitante />
      </div>

      <section className="border-t border-borda bg-superficie px-4 py-12 sm:px-6" aria-labelledby="vitrine-titulo">
        <div className="mx-auto max-w-5xl">
          <p className="text-center text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">
            Tem muito mais do outro lado
          </p>
          <h2 id="vitrine-titulo" className="mt-2 text-center font-display text-3xl font-extrabold text-texto">
            Com a conta grátis, você libera <span className="destaque">tudo até 31/12</span>
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
                    <p className="mt-3 text-sm font-bold text-[var(--destaque-texto)]">Liberar com a conta grátis →</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-10 text-center">
            <a href={CRIAR} className="inline-block rounded-full bg-kambada-amarelo px-10 py-4 text-lg font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro">
              Criar minha conta grátis
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
