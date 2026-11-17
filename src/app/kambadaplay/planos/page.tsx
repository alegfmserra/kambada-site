import type { Metadata } from "next";
import Link from "next/link";
import { IMAGEM_OG_PLAY, og } from "@/lib/seo/og";
import { EMAILS, linkWhatsApp } from "@/lib/site";
import { PERGUNTAS_PLANOS, PLANOS, PRECOS, itemEmProducao, textoDoItem } from "@/lib/play/planos";

export const metadata: Metadata = {
  title: "Planos",
  description:
    "Os planos do Kambada Play: Play Família, Play Brincante e projetos personalizados para escolas, eventos e marcas.",
  alternates: { canonical: "/kambadaplay/planos" },
  openGraph: og("/kambadaplay/planos", { images: [IMAGEM_OG_PLAY] }),
  robots: { index: true, follow: true },
};

const BOTAO_AMARELO =
  "inline-block rounded-full bg-kambada-amarelo px-8 py-3.5 text-center font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kambada-amarelo";
const BOTAO_CONTORNO =
  "inline-block rounded-full border-2 border-borda px-8 py-3 text-center font-bold text-texto transition-colors hover:border-kambada-amarelo focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kambada-amarelo";

/** Pedido de demonstração da escola: a mensagem já pede o que precisamos para responder. */
const MENSAGEM_ESCOLA = [
  "Olá! Gostaria de pedir uma demonstração do Kambada Play para a minha escola.",
  "Nome da escola: ",
  "Etapa (Educação Infantil, Fundamental anos iniciais ou anos finais): ",
  "Número de alunos: ",
].join("\n");

/** O que o portal da escola já tem hoje. Só entra aqui o que existe. */
const ESCOLA_JA_TEM = [
  "Portal com perfis de aluno, professor e coordenação",
  "Temporadas culturais ao longo do ano",
  "Jogos, quadrinhos e animações",
  "Relatório por habilidade",
  "Material para imprimir",
  "Aluno entra sem e-mail",
];

const ESCOLA_ETAPAS = [
  { nome: "Educação Infantil", detalhe: "Conduzida pela professora" },
  { nome: "Ensino Fundamental", detalhe: "Anos iniciais" },
  { nome: "Ensino Fundamental", detalhe: "Anos finais" },
];

const MENSAGEM_PERSONALIZADO =
  "Olá! Quero conversar sobre um projeto personalizado no Kambada Play (escola, evento ou ativação de marca).";

/**
 * Tela pública dos planos (fica fora do login de propósito: escola e família
 * precisam ver as condições antes de criar a conta). Sem preço na tela, de
 * propósito: valores só na pesquisa de satisfação (decisão de 30/10/2026).
 */
export default function PlanosPage() {
  // As mesmas perguntas da tela, para o Google (FAQPage).
  const perguntasEstruturadas = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PERGUNTAS_PLANOS.map((q) => ({
      "@type": "Question",
      name: q.pergunta,
      acceptedAnswer: { "@type": "Answer", text: q.resposta },
    })),
  };

  return (
    <div className="play-tema-site">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(perguntasEstruturadas).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Link href="/kambadaplay" className="text-sm font-semibold text-[var(--destaque-texto)] hover:underline">
            ← Kambada Play
          </Link>
          <Link href="/kambadaplay/conheca" className="text-sm font-semibold text-[var(--destaque-texto)] hover:underline">
            Conhecer o Kambada Play
          </Link>
        </div>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Planos</p>
        <h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold leading-tight text-texto sm:text-5xl">
          A cultura do Maranhão, <span className="destaque">do tamanho da sua casa</span> ou da sua escola.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-texto-suave">
          <strong className="text-texto">Hoje, a conta abre tudo o que já está pronto no Kambada Play:</strong> os
          jogos, o Arraial em 3D, as HQs e a animação. O que aparece como “Em produção” ainda está sendo feito.
        </p>

        {/* Para escolas: logo abaixo do título, com âncora (#escolas) para os links "Sou escola". */}
        <section
          id="escolas"
          aria-labelledby="escolas-titulo"
          className="mt-10 scroll-mt-28 rounded-2xl border-2 border-borda bg-superficie p-6 sm:p-8"
        >
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Para escolas</p>
          <h2 id="escolas-titulo" className="mt-2 font-display text-2xl font-extrabold leading-tight text-texto sm:text-3xl">
            A cultura do Maranhão na sala de aula
          </h2>
          <div className="mt-6 grid gap-8 md:grid-cols-[1.3fr_1fr]">
            <div>
              <h3 className="text-sm font-bold text-texto">O que a escola já encontra</h3>
              <ul className="mt-3 grid gap-2.5 text-sm leading-snug text-texto-suave sm:grid-cols-2">
                {ESCOLA_JA_TEM.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden="true" className="text-[var(--destaque-texto)]">
                      ✦
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-bold text-texto">Para cada etapa</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {ESCOLA_ETAPAS.map((etapa) => (
                  <li key={`${etapa.nome} ${etapa.detalhe}`} className="rounded-xl border border-borda px-4 py-2.5">
                    <strong className="text-texto">{etapa.nome}</strong>
                    <span className="text-texto-suave"> · {etapa.detalhe}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3">
            <a href={linkWhatsApp(MENSAGEM_ESCOLA)} target="_blank" rel="noopener noreferrer" className={BOTAO_AMARELO}>
              Pedir demonstração
            </a>
            <p className="text-sm text-texto-suave">Pelo WhatsApp, com o nome da escola, a etapa e o número de alunos.</p>
          </div>
        </section>

        <ul className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {PLANOS.map((p) => (
            <li
              key={p.id}
              className={`relative flex flex-col rounded-2xl border-2 p-6 ${
                p.destaque
                  ? "border-kambada-amarelo bg-kambada-grafite text-kambada-branco shadow-[8px_8px_0_0_#ffcc29]"
                  : "border-borda bg-superficie text-texto"
              }`}
            >
              <span
                className={`absolute right-4 top-4 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] ${
                  p.disponivel
                    ? "bg-kambada-amarelo text-kambada-grafite"
                    : p.destaque
                      ? "bg-kambada-branco/15 text-kambada-branco"
                      : "bg-kambada-grafite/10 text-texto"
                }`}
              >
                {p.selo}
              </span>
              <p
                className={`pr-24 text-xs font-bold uppercase tracking-[0.3em] ${
                  p.destaque ? "text-kambada-amarelo" : "text-[var(--destaque-texto)]"
                }`}
              >
                {p.paraQuem}
              </p>
              <h2 className="mt-3 font-display text-2xl font-extrabold">{p.nome}</h2>
              <ul
                className={`mt-6 flex-1 space-y-2.5 text-sm leading-snug ${
                  p.destaque ? "text-kambada-branco/85" : "text-texto-suave"
                }`}
              >
                {p.inclui.map((item) => (
                  <li key={textoDoItem(item)} className="flex gap-2">
                    <span aria-hidden className={p.destaque ? "text-kambada-amarelo" : "text-[var(--destaque-texto)]"}>
                      ✦
                    </span>
                    <span>
                      {textoDoItem(item)}
                      {itemEmProducao(item) ? (
                        <span
                          className={`ml-2 inline-block rounded-full border px-2 py-0.5 align-middle text-[11px] font-semibold whitespace-nowrap ${
                            p.destaque ? "border-kambada-branco/50 text-kambada-branco" : "border-borda-campo text-texto"
                          }`}
                        >
                          Em produção
                        </span>
                      ) : null}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {p.id === "gratis" ? (
                  <Link href="/kambadaplay/entrar?modo=criar" className={`${BOTAO_AMARELO} w-full`}>
                    Criar conta
                  </Link>
                ) : p.id === "familia" || p.id === "brincante" ? (
                  // Plano ainda não disponível: a conta abre o que já existe (texto do topo), sem prometer o plano.
                  <Link href="/kambadaplay/entrar?modo=criar" className={`${BOTAO_AMARELO} w-full`}>
                    Criar conta
                  </Link>
                ) : p.id === "personalizado" ? (
                  <a
                    href={linkWhatsApp(MENSAGEM_PERSONALIZADO)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`${BOTAO_CONTORNO} w-full`}
                  >
                    Pedir uma proposta
                  </a>
                ) : (
                  <a
                    href={`mailto:${EMAILS.contato}?subject=${encodeURIComponent("Licença de conteúdo — Kambada Play")}`}
                    className={`${BOTAO_CONTORNO} w-full`}
                  >
                    Falar com a Kambada
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>

        {/* Personalizado: como funciona, sem pacote pronto */}
        <section className="mt-16 grid gap-8 rounded-2xl bg-kambada-amarelo p-6 text-kambada-grafite sm:p-10 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em]">Personalizado</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              Cultura maranhense na escola, no evento ou na sua marca.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed">
              Sem pacote pronto. Na escola, partimos do plano de aula para criar animações e histórias educativas.
              Em eventos e marcas, criamos jogos e conteúdo com a sua identidade. A primeira leva sai em até{" "}
              {PRECOS.personalizadoPrimeiraEntregaDias} dias após o acordo.
            </p>
          </div>
          <div className="rounded-xl border-2 border-kambada-grafite bg-kambada-papel p-5">
            <ol className="space-y-3 text-sm">
              <li className="flex gap-3">
                <span className="font-display text-xl font-extrabold leading-none">1</span>
                <span>
                  <strong>Conversa</strong>: você conta o plano de aula, o evento ou a campanha.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-display text-xl font-extrabold leading-none">2</span>
                <span>
                  <strong>Proposta</strong>: o que será produzido e em que prazo.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-display text-xl font-extrabold leading-none">3</span>
                <span>
                  <strong>Produção</strong>: entregas em levas, no seu calendário.
                </span>
              </li>
              <li className="flex gap-3 border-t border-kambada-grafite/30 pt-3">
                <span className="font-display text-xl font-extrabold leading-none">+</span>
                <span>Jogos, cordel e HQ já prontos, liberados desde o 1º dia.</span>
              </li>
            </ol>
            <a
              href={linkWhatsApp(MENSAGEM_PERSONALIZADO)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-block w-full rounded-full bg-kambada-grafite px-6 py-3 text-center font-bold text-kambada-amarelo transition-colors hover:bg-kambada-preto"
            >
              Falar no WhatsApp
            </a>
          </div>
        </section>

        <section className="mt-16 max-w-3xl">
          <h2 className="font-display text-2xl font-extrabold text-texto sm:text-3xl">Perguntas que chegam</h2>
          <dl className="mt-6 divide-y divide-borda">
            {PERGUNTAS_PLANOS.map((q) => (
              <div key={q.pergunta} className="py-5">
                <dt className="font-display text-lg font-bold text-texto">{q.pergunta}</dt>
                <dd className="mt-2 leading-relaxed text-texto-suave">{q.resposta}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>
    </div>
  );
}
