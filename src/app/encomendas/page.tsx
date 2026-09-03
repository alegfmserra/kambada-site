import type { Metadata } from "next";
import { ENCOMENDAS_PORTFOLIO, linkWhatsApp } from "@/lib/site";

/**
 * Encomendas corporativas. A Kambada já produz sob medida para empresas e
 * eventos — kits personalizados, placas, porta-chaves — mas isso não é
 * produto de prateleira: preço e prazo dependem de conversa prévia, por
 * isso a chamada vai direto para o WhatsApp, nunca para um checkout.
 *
 * O portfólio (empresas que confiaram na Kambada) começa vazio — ver
 * ENCOMENDAS_PORTFOLIO em site.ts para o porquê — e cresce conforme cada
 * cliente autorizar ser citado.
 */

export const metadata: Metadata = {
  title: "Encomendas corporativas",
  description:
    "Leve a Kambada para o seu evento: kits, placas e porta-chaves personalizados para empresas. Fale com a gente e monte sua encomenda.",
  alternates: { canonical: "/encomendas" },
};

export default function Encomendas() {
  return (
    <>
      <section className="border-b border-borda">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h1 className="max-w-3xl font-display text-4xl leading-tight font-extrabold text-balance sm:text-5xl">
            Leve a Kambada para o{" "}
            <span className="destaque">seu evento</span>
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-texto-suave">
            Já fizemos kit de boas-vindas, placa personalizada e porta-chaves
            para empresas e eventos aqui do Maranhão. Cada encomenda é
            pensada junto com você — arte, material e quantidade — e a
            conversa começa no WhatsApp.
          </p>

          <a
            href={linkWhatsApp(
              "Olá! Quero fazer uma encomenda corporativa para o meu evento.",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-10 inline-flex items-center gap-3 rounded-2xl bg-kambada-amarelo px-8 py-5 font-display text-lg font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12.04 2C6.6 2 2.17 6.43 2.17 11.87c0 1.74.46 3.44 1.32 4.94L2 22l5.33-1.4a9.83 9.83 0 0 0 4.71 1.2h.01c5.43 0 9.86-4.43 9.86-9.87A9.8 9.8 0 0 0 19.02 4.9 9.8 9.8 0 0 0 12.04 2zm0 18.05h-.01a8.2 8.2 0 0 1-4.17-1.14l-.3-.18-3.1.81.83-3.02-.2-.31a8.15 8.15 0 0 1-1.25-4.34c0-4.52 3.68-8.2 8.2-8.2a8.15 8.15 0 0 1 5.8 2.4 8.15 8.15 0 0 1 2.4 5.8c0 4.53-3.68 8.2-8.2 8.2z" />
              <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.03-.53-.07-.15-.67-1.61-.92-2.2-.24-.58-.48-.5-.67-.51h-.57c-.2 0-.52.07-.79.38-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.22 3.08.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.7.63.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35z" />
            </svg>
            Fazer minha encomenda
          </a>
        </div>
      </section>

      <section className="border-b border-borda">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="font-display text-3xl font-bold sm:text-4xl">
            O que a gente já fez
          </h2>
          <p className="mt-3 max-w-2xl leading-relaxed text-texto-suave">
            Um pouco do que já saiu da nossa oficina para eventos e empresas.
          </p>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-borda bg-superficie p-6">
              <h3 className="font-display text-lg font-semibold">
                Kit de boas-vindas
              </h3>
              <p className="mt-2 leading-relaxed text-texto-suave">
                Caixa personalizada com a arte do seu evento, bloco de
                anotações, réguas e marcadores — para presentear
                convidados e equipe.
              </p>
            </div>
            <div className="rounded-2xl border border-borda bg-superficie p-6">
              <h3 className="font-display text-lg font-semibold">
                Placa e porta-chaves personalizados
              </h3>
              <p className="mt-2 leading-relaxed text-texto-suave">
                Peças em madeira, pintadas à mão, com a marca da sua empresa
                ao lado da nossa arte maranhense.
              </p>
            </div>
          </div>
        </div>
      </section>

      {ENCOMENDAS_PORTFOLIO.length > 0 ? (
        <section>
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Empresas que confiaram na Kambada
            </h2>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {ENCOMENDAS_PORTFOLIO.map((caso) => (
                <li
                  key={caso.empresa}
                  className="rounded-2xl border border-borda bg-superficie p-6"
                >
                  <h3 className="font-display text-lg font-semibold">
                    {caso.empresa}
                  </h3>
                  <p className="mt-2 leading-relaxed text-texto-suave">
                    {caso.descricao}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </>
  );
}
