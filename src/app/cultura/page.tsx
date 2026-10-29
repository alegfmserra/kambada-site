import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ARTIGOS, dataPorExtenso } from "@/lib/artigos";

export const metadata: Metadata = {
  title: "Explore a cultura maranhense",
  description:
    "Histórias, tradições e o Maranhão do jeito Kambada: Tambor de Crioula, capoeira, Bumba Meu Boi, reggae e o que fazer em São Luís.",
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
            Histórias e tradições do jeito Kambada, maranhense que só: do
            reggae ao Bumba Meu Boi, do Guaraná Jesus às matracas.
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
                {artigo.capa && (
                  <Image
                    src={artigo.capa.src}
                    alt=""
                    width={artigo.capa.largura}
                    height={artigo.capa.altura}
                    sizes="(min-width: 768px) 360px, 100vw"
                    className="-mx-7 -mt-7 mb-6 aspect-[3/2] w-[calc(100%+3.5rem)] max-w-none rounded-t-2xl object-cover"
                  />
                )}
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
