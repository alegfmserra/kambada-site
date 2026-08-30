import type { Metadata } from "next";
import { REDES, WHATSAPP, linkWhatsApp } from "@/lib/site";

/**
 * Contato. Só canais confirmados: o WhatsApp extraído dos links do site atual
 * e as redes sociais divulgadas nele. Não há e-mail nem endereço públicos hoje
 * — quando o Alexandre confirmar, entram aqui.
 */

export const metadata: Metadata = {
  title: "Fale com a Kambada",
  description:
    "Se achega: fale com a Kambada pelo WhatsApp ou pelas nossas redes. Atendimento direto com quem faz a marca.",
  alternates: { canonical: "/contato" },
};

export default function Contato() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <h1 className="font-display text-4xl leading-tight font-extrabold text-balance sm:text-5xl">
          Se achega, <span className="text-kambada-amarelo">vem falar</span> com
          a gente
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-kambada-branco/80">
          Dúvida sobre uma peça, encomenda para o teu arraial ou pedido para
          empresa: a gente responde no WhatsApp e nas redes.
        </p>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <a
            href={linkWhatsApp()}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl bg-kambada-amarelo p-8 text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
          >
            <h2 className="font-display text-2xl font-bold">WhatsApp</h2>
            <p className="mt-2 text-lg font-medium">{WHATSAPP.exibicao}</p>
            <p className="mt-3 text-kambada-grafite/75">
              O caminho mais rápido — falar direto com a Kambada.
            </p>
          </a>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8">
            <h2 className="font-display text-2xl font-bold text-kambada-amarelo">
              Nossas redes
            </h2>
            <ul className="mt-5 space-y-3">
              {REDES.map((rede) => (
                <li key={rede.nome}>
                  <a
                    href={rede.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg text-kambada-branco/80 transition-colors hover:text-kambada-amarelo"
                  >
                    {rede.nome} →
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
