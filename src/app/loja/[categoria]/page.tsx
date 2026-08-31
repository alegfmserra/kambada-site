import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AvisoDemonstracao from "@/components/AvisoDemonstracao";
import BarraCategorias from "@/components/BarraCategorias";
import CartaoProduto from "@/components/CartaoProduto";
import {
  CATEGORIAS,
  categoriaPorSlug,
  produtosDaCategoria,
} from "@/lib/catalogo";
import { linkWhatsApp } from "@/lib/site";

/** Tipado à mão: PageProps só existe depois do build. */
type Props = { params: Promise<{ categoria: string }> };

export function generateStaticParams() {
  return CATEGORIAS.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria: slug } = await params;
  const categoria = categoriaPorSlug(slug);
  if (!categoria) return { title: "Categoria não encontrada" };

  return {
    title: categoria.nome,
    description: categoria.chamada,
    alternates: { canonical: `/loja/${categoria.slug}` },
  };
}

export default async function Categoria({ params }: Props) {
  const { categoria: slug } = await params;
  const categoria = categoriaPorSlug(slug);
  if (!categoria) notFound();

  const produtos = produtosDaCategoria(categoria.slug);

  return (
    <>
      <section className="border-b border-borda">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-16">
          <Link
            href="/loja"
            className="font-display text-sm font-semibold text-texto-tenue hover:text-kambada-amarelo-escuro"
          >
            ← Toda a loja
          </Link>
          <h1 className="mt-6 font-display text-4xl leading-tight font-extrabold text-balance sm:text-5xl">
            {categoria.nome}
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-texto-suave">
            {categoria.chamada}
          </p>
          <p className="mt-4 text-sm text-texto-tenue">
            {produtos.length}{" "}
            {produtos.length === 1 ? "peça nesta categoria" : "peças nesta categoria"}
          </p>
          <div className="mt-8">
            <AvisoDemonstracao />
          </div>
        </div>
      </section>

      <BarraCategorias ativa={categoria.slug} />

      <section className="border-b border-borda">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {produtos.map((produto) => (
              <CartaoProduto key={produto.slug} produto={produto} />
            ))}
          </ul>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl bg-kambada-amarelo px-8 py-12 text-kambada-grafite sm:px-12">
            <h2 className="font-display text-2xl leading-tight font-extrabold text-balance sm:text-3xl">
              Não achou o que queria?
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-kambada-grafite/80">
              A gente também faz sob encomenda. Chama no WhatsApp e conta o que
              você tem em mente.
            </p>
            <a
              href={linkWhatsApp(
                `Oi! Estava vendo a categoria "${categoria.nome}" e queria falar sobre uma encomenda.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block rounded-full bg-kambada-grafite px-7 py-3.5 font-display font-semibold text-kambada-amarelo transition-colors hover:bg-kambada-preto"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
