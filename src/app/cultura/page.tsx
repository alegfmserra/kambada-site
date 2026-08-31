import type { Metadata } from "next";
import Link from "next/link";
import { ARTIGOS, dataPorExtenso } from "@/lib/artigos";

export const metadata: Metadata = {
  title: "Explore a cultura maranhense",
  description:
    "Histórias, tradições e o Maranhão do jeito Kambada: do reggae ao Bumba Meu Boi, do Guaraná Jesus às matracas.",
  alternates: { canonical: "/cultura" },
};

export default function Cultura() {
  return (
    <>
      <section className="border-b border-borda">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h1 className="max-w-3xl font-display text-4xl leading-tight font-extrabold text-balance sm:text-5xl">
            Viva a cultura do <span className="destaque">Maranhão</span>
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-relaxed text-texto-suave">
            Aqui a gente conta histórias, compartilha tradições e celebra o
            Maranhão do nosso jeito Kambada — leve, autêntico e maranhense que
            só. Do reggae ao Bumba Meu Boi, do Guaraná Jesus às matracas: um
            espaço para valorizar a riqueza cultural do Maranhão, com aquele
            toque especial da Kambada.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <ul className="grid gap-8 md:grid-cols-3">
            {ARTIGOS.map((artigo) => (
              <li
                key={artigo.slug}
                className="flex flex-col rounded-2xl border border-borda bg-superficie p-7 transition-colors hover:border-kambada-amarelo-escuro"
              >
                <p className="font-display text-xs font-semibold tracking-wide text-texto-tenue uppercase">
                  {artigo.categoria} · {artigo.tempoLeitura}
                </p>
                <h2 className="mt-3 font-display text-xl leading-snug font-semibold">
                  <Link
                    href={`/cultura/${artigo.slug}`}
                    className="hover:text-kambada-amarelo-escuro"
                  >
                    {artigo.titulo}
                  </Link>
                </h2>
                <p className="mt-3 flex-1 leading-relaxed text-texto-suave">
                  {artigo.resumo}
                </p>
                <p className="mt-5 text-xs text-texto-tenue">
                  {dataPorExtenso(artigo.data)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
