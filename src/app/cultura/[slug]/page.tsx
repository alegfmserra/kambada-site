import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ARTIGOS, artigoPorSlug, dataPorExtenso } from "@/lib/artigos";
import { linkWhatsApp } from "@/lib/site";

/**
 * Tipado à mão em vez de usar PageProps: aquele tipo é gerado durante o build,
 * então uma rota nova quebra o `tsc --noEmit` até o primeiro build passar.
 */
type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return ARTIGOS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const artigo = artigoPorSlug(slug);
  if (!artigo) return { title: "Artigo não encontrado" };

  return {
    title: artigo.titulo,
    description: artigo.resumo,
    alternates: { canonical: `/cultura/${artigo.slug}` },
    openGraph: {
      type: "article",
      title: artigo.titulo,
      description: artigo.resumo,
      publishedTime: artigo.data,
    },
  };
}

export default async function Artigo({ params }: Props) {
  const { slug } = await params;
  const artigo = artigoPorSlug(slug);
  if (!artigo) notFound();

  return (
    <article>
      <header className="border-b border-borda">
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
          <Link
            href="/cultura"
            className="font-display text-sm font-semibold text-texto-tenue hover:text-kambada-amarelo-escuro"
          >
            ← Voltar para Cultura
          </Link>
          <p className="mt-8 font-display text-xs font-semibold tracking-wide text-texto-tenue uppercase">
            {artigo.categoria} · {artigo.tempoLeitura} de leitura
          </p>
          <h1 className="mt-4 font-display text-3xl leading-tight font-extrabold text-balance sm:text-5xl">
            {artigo.titulo}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-texto-suave">
            {artigo.resumo}
          </p>
          <p className="mt-6 text-sm text-texto-tenue">
            <time dateTime={artigo.data}>{dataPorExtenso(artigo.data)}</time>
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
        {artigo.blocos.map((bloco, i) => {
          if (bloco.tipo === "subtitulo") {
            return (
              <h2
                key={i}
                className="mt-12 mb-4 font-display text-2xl font-bold first:mt-0"
              >
                {bloco.texto}
              </h2>
            );
          }
          if (bloco.tipo === "lista") {
            return (
              <ul key={i} className="my-6 space-y-3 pl-5">
                {bloco.itens.map((item, j) => (
                  <li
                    key={j}
                    className="list-disc text-lg leading-relaxed text-texto-suave marker:text-kambada-amarelo-escuro"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            );
          }
          if (bloco.tipo === "destaque") {
            return (
              <blockquote
                key={i}
                className="my-10 border-l-4 border-kambada-amarelo bg-superficie py-5 pr-5 pl-6 font-display text-xl leading-snug font-semibold"
              >
                {bloco.texto}
              </blockquote>
            );
          }
          return (
            <p key={i} className="my-5 text-lg leading-relaxed text-texto-suave">
              {bloco.texto}
            </p>
          );
        })}

        <div className="mt-16 rounded-3xl bg-kambada-amarelo px-7 py-10 text-kambada-grafite">
          <h2 className="font-display text-2xl leading-tight font-extrabold text-balance">
            Gostou? A gente também veste isso.
          </h2>
          <p className="mt-3 leading-relaxed text-kambada-grafite/80">
            Camisetas, matracas e bonés feitos por quem vive o que escreve aqui.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/loja"
              className="rounded-full bg-kambada-grafite px-6 py-3 font-display font-semibold text-kambada-amarelo transition-colors hover:bg-kambada-preto"
            >
              Ver a loja
            </Link>
            <a
              href={linkWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border-2 border-kambada-grafite px-6 py-3 font-display font-semibold text-kambada-grafite transition-colors hover:bg-kambada-grafite hover:text-kambada-amarelo"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}
