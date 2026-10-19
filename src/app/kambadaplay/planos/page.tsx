import type { Metadata } from "next";
import Link from "next/link";
import { EMAILS, linkWhatsApp } from "@/lib/site";
import { PERGUNTAS_PLANOS, PLANOS, PRECOS } from "@/lib/play/planos";

export const metadata: Metadata = {
  title: "Planos",
  description:
    "Os planos do Kambada Play: 3 meses grátis para quem cria a conta, Play Família por R$ 9,90/mês e projetos personalizados para escolas, eventos e marcas, sob proposta.",
  alternates: { canonical: "/kambadaplay/planos" },
};

const BOTAO_AMARELO =
  "inline-block rounded-full bg-kambada-amarelo px-8 py-3.5 text-center font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kambada-amarelo";
const BOTAO_CONTORNO =
  "inline-block rounded-full border-2 border-borda px-8 py-3 text-center font-bold text-texto transition-colors hover:border-kambada-amarelo focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kambada-amarelo";

const MENSAGEM_PERSONALIZADO =
  "Olá! Quero conversar sobre um projeto personalizado no Kambada Play (escola, evento ou ativação de marca).";

/**
 * Tela pública dos planos (fica fora do login de propósito: escola e família
 * precisam ver as condições antes de criar a conta). Ainda não cobra nada.
 */
export default function PlanosPage() {
  return (
    <div className="play-tema-site">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Link href="/kambadaplay" className="text-sm font-semibold text-[var(--destaque-texto)] hover:underline">
          ← Kambada Play
        </Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Planos</p>
        <h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold leading-tight text-texto sm:text-5xl">
          A cultura do Maranhão, <span className="destaque">do tamanho da sua casa</span> ou da sua escola.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-texto-suave">
          Quem cria a conta ganha {PRECOS.mesesGratis} meses grátis. A cobrança do Play Família entra aos poucos,
          conforme a plataforma ganhar jogos, temporadas e recursos novos. Quem entra agora fica sabendo primeiro e não
          perde nada do que já usa.
        </p>

        <ul className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
              <p className="mt-4 font-display text-3xl font-extrabold leading-none">{p.preco}</p>
              {p.precoDetalhe ? (
                <p className={`mt-2 text-sm ${p.destaque ? "text-kambada-branco/75" : "text-texto-suave"}`}>
                  {p.precoDetalhe}
                </p>
              ) : null}
              <ul
                className={`mt-6 flex-1 space-y-2.5 text-sm leading-snug ${
                  p.destaque ? "text-kambada-branco/85" : "text-texto-suave"
                }`}
              >
                {p.inclui.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span aria-hidden className={p.destaque ? "text-kambada-amarelo" : "text-[var(--destaque-texto)]"}>
                      ✦
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                {p.id === "gratis" ? (
                  <Link href="/kambadaplay/entrar" className={`${BOTAO_AMARELO} w-full`}>
                    Criar conta grátis
                  </Link>
                ) : p.id === "familia" ? (
                  <Link href="/kambadaplay/entrar" className={`${BOTAO_AMARELO} w-full`}>
                    Quero ser avisado
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

        <p className="mt-6 text-sm text-texto-tenue">
          Para ser avisado, crie a conta e marque &ldquo;quero receber novidades&rdquo;. Nenhum valor é cobrado hoje; quando
          a assinatura abrir, a gente avisa por e-mail e você escolhe se quer entrar.
        </p>

        {/* Personalizado: como funciona, sem pacote pronto */}
        <section className="mt-16 grid gap-8 rounded-2xl bg-kambada-amarelo p-6 text-kambada-grafite sm:p-10 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em]">Personalizado</p>
            <h2 className="mt-2 font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              Cultura maranhense do seu jeito: na escola, no evento, na sua marca.
            </h2>
            <p className="mt-4 max-w-xl text-lg leading-relaxed">
              Não é pacote pronto. Para a escola, a gente senta com a coordenação, entende o plano de aula ou o plano
              anual e produz animações e histórias de cunho educativo, que ensinam a cultura do Maranhão pelo
              entretenimento. Para eventos e ativações de marca, criamos jogos e conteúdo com a sua identidade a partir
              da ideia cultural. Tudo nasce aos poucos, e a primeira leva sai em até{" "}
              {PRECOS.personalizadoPrimeiraEntregaDias} dias depois do acordo, conforme o combinado.
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
                  <strong>Proposta</strong>: o que será produzido, em que prazo e por quanto.
                </span>
              </li>
              <li className="flex gap-3">
                <span className="font-display text-xl font-extrabold leading-none">3</span>
                <span>
                  <strong>Produção</strong>: animações, histórias e jogos entregues em levas, no seu calendário.
                </span>
              </li>
              <li className="flex gap-3 border-t border-kambada-grafite/30 pt-3">
                <span className="font-display text-xl font-extrabold leading-none">+</span>
                <span>Jogos, cordel e HQ que já existem ficam liberados desde o primeiro dia.</span>
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
