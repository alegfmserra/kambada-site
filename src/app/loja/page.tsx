import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import AvisoDemonstracao from "@/components/AvisoDemonstracao";
import FaixaBeneficios from "@/components/FaixaBeneficios";
import BarraCategorias from "@/components/BarraCategorias";
import CartaoProduto from "@/components/CartaoProduto";
import { buscarCatalogo } from "@/lib/bling/produtos";
import { linkWhatsApp } from "@/lib/site";

export const metadata: Metadata = {
  title: "Loja",
  description:
    "Camisas, matracas, ecobags, bonés, pareôs e papelaria feitos à mão em São Luís. Pix, cartão em até 3x e frete grátis a partir de R$ 250.",
  alternates: { canonical: "/loja" },
};

export const revalidate = 600;

export default async function Loja() {
  const { categorias, produtos } = await buscarCatalogo();
  const daCategoria = (slug: string) =>
    produtos.filter((p) => p.categoria === slug && !p.oculto);
  /**
   * A vitrine geral mostra até 6 destaques por categoria (decisão do Alexandre,
   * 11/10/2026): quem já sabe o que quer vai pela categoria. Disponíveis
   * primeiro; a categoria inteira fica em /loja/<categoria>.
   */
  const DESTAQUES = 6;
  const destaques = (slug: string) => {
    const lista = daCategoria(slug);
    const ordenada = [...lista].sort((a, b) => Number(b.quantidade > 0) - Number(a.quantidade > 0));
    return { mostrados: ordenada.slice(0, DESTAQUES), total: lista.length };
  };

  return (
    <>
      <section className="border-b border-borda">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
          <h1 className="font-display text-4xl leading-tight font-extrabold text-balance sm:text-5xl">
            Vista o <span className="destaque">Maranhão</span>
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-texto-suave">
            Cada peça carrega o som da matraca, o gingado do reggae e as cores
            do nosso Bumba Meu Boi.
          </p>
          <div className="mt-10">
            <AvisoDemonstracao />
          </div>
          <FaixaBeneficios />
        </div>
      </section>

      <BarraCategorias />

      {categorias.map((categoria) => (
        <section
          key={categoria.slug}
          id={categoria.slug}
          className="border-b border-borda scroll-mt-24"
        >
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <div className="flex flex-wrap items-baseline justify-between gap-3">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">
                {categoria.nome}
              </h2>
              <Link
                href={`/loja/${categoria.slug}`}
                className="font-display text-sm font-semibold text-texto-suave underline underline-offset-4 hover:text-kambada-amarelo-escuro"
              >
                Ver só {categoria.nome.toLowerCase()} →
              </Link>
            </div>
            <p className="mt-3 max-w-2xl leading-relaxed text-texto-suave">
              {categoria.chamada}
            </p>
            {categoria.foto && (
              <Link
                href={`/loja/${categoria.slug}`}
                className="group mt-7 block overflow-hidden rounded-2xl"
              >
                <div className="relative aspect-[4/3] sm:aspect-[2/1]">
                  <Image
                    src={categoria.foto.arquivo}
                    alt={categoria.foto.alt}
                    fill
                    sizes="(max-width: 1024px) 100vw, 70vw"
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    style={categoria.posicaoDaFoto ? { objectPosition: categoria.posicaoDaFoto } : undefined}
                  />
                </div>
              </Link>
            )}
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {destaques(categoria.slug).mostrados.map((produto) => (
                <CartaoProduto key={produto.slug} produto={produto} />
              ))}
            </ul>
            {destaques(categoria.slug).total > DESTAQUES && (
              <p className="mt-8 text-center">
                <Link
                  href={`/loja/${categoria.slug}`}
                  className="inline-block rounded-full border border-borda px-7 py-3.5 font-display font-semibold whitespace-nowrap text-texto transition-colors hover:border-kambada-amarelo-escuro"
                >
                  Ver todas · {destaques(categoria.slug).total} peças →
                </Link>
              </p>
            )}
          </div>
        </section>
      ))}

      <section>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl bg-kambada-amarelo px-8 py-12 text-kambada-grafite sm:px-12">
            <h2 className="font-display text-2xl leading-tight font-extrabold text-balance sm:text-3xl">
              Prefere conversar antes de comprar? A gente atende no WhatsApp
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-kambada-grafite/80">
              Encomenda para arraial, pedido de empresa ou uma peça só: é só
              chamar que a gente responde.
            </p>
            <a
              href={linkWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 inline-block rounded-full bg-kambada-grafite px-7 py-3.5 font-display font-semibold text-kambada-amarelo transition-colors hover:bg-kambada-preto whitespace-nowrap"
            >
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
