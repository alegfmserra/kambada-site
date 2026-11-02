import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AvisoDemonstracao from "@/components/AvisoDemonstracao";
import BarraCategorias from "@/components/BarraCategorias";
import CartaoProduto from "@/components/CartaoProduto";
import { buscarCatalogo } from "@/lib/bling/produtos";
import { CATEGORIAS, categoriaPorSlug } from "@/lib/catalogo";
import { linkWhatsApp, SITE } from "@/lib/site";

/** Tipado à mão: PageProps só existe depois do build. */
type Props = { params: Promise<{ categoria: string }> };

export const revalidate = 600;

/**
 * As rotas vêm da lista local de categorias, não do Bling: são curadoria
 * nossa e precisam existir no build mesmo se o ERP estiver fora do ar.
 */
export function generateStaticParams() {
  return CATEGORIAS.map((c) => ({ categoria: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria: slug } = await params;
  const categoria = categoriaPorSlug(slug);
  if (!categoria) return { title: "Categoria não encontrada" };

  const seo = SEO_CATEGORIA[categoria.slug];
  return {
    title: seo?.titulo ?? categoria.nome,
    description: seo?.descricao ?? categoria.chamada,
    alternates: { canonical: `/loja/${categoria.slug}` },
  };
}

/**
 * Título e descrição para o Google (02/11/2026): antes saíam só "Bonés" e a frase
 * curta da vitrine, abaixo do tamanho que ajuda a página a ser achada. A tela
 * continua com o nome e a chamada de sempre. Título até ~42 caracteres (o site
 * acrescenta "| Somos Kambada") e descrição entre 70 e 160.
 */
const SEO_CATEGORIA: Record<string, { titulo: string; descricao: string }> = {
  camisas: {
    titulo: "Camisas maranhenses de Bumba Meu Boi",
    descricao: "Camisas da Kambada com lendas e símbolos do Maranhão: Bumba Meu Boi, reggae e tradições da Ilha do Amor. Feitas em São Luís, para adultos e crianças.",
  },
  matracas: {
    titulo: "Matracas pintadas à mão do Maranhão",
    descricao: "Matracas do Bumba Meu Boi pintadas à mão, uma por uma, em São Luís do Maranhão. Instrumento, peça de arte e lembrança da cultura maranhense.",
  },
  ecobags: {
    titulo: "Ecobags com arte maranhense",
    descricao: "Ecobags da Kambada com estampas do Maranhão, para a feira, a praia e o arraial. Cabe tudo e conta história. Feitas em São Luís.",
  },
  bones: {
    titulo: "Bonés maranhenses: reggae e Bumba Meu Boi",
    descricao: "Bonés da Kambada com a cara do Maranhão, para o reggae na praça e o sol de São Luís. Peças de moda e arte da cultura maranhense.",
  },
  pareos: {
    titulo: "Pareôs maranhenses para a praia",
    descricao: "Pareôs da Kambada para a praia e o calor, com a arte e as cores do Maranhão. Moda e cultura maranhense para levar no ombro.",
  },
  necessaires: {
    titulo: "Necessaires com estampas do Maranhão",
    descricao: "Necessaires pequenas e práticas da Kambada, com estampas da cultura maranhense. Peças feitas em São Luís do Maranhão.",
  },
  papelaria: {
    titulo: "Papelaria sustentável com arte maranhense",
    descricao: "Papelaria da Kambada para anotar, escrever e desenhar, com toque sustentável e a arte do Maranhão. Cadernos, blocos e lápis.",
  },
  brindes: {
    titulo: "Brindes e lembranças do Maranhão",
    descricao: "Brindes e mimos da Kambada para presentear ou levar de lembrança do Maranhão: chaveiros, porta-chaves e outras peças com a nossa cara.",
  },
  decoracao: {
    titulo: "Decoração com arte do Maranhão",
    descricao: "Decoração com a arte do Maranhão: placas, mandalas e peças de madeira da Kambada para deixar a sua casa com cultura maranhense.",
  },
};

export default async function Categoria({ params }: Props) {
  const { categoria: slug } = await params;
  const categoria = categoriaPorSlug(slug);
  if (!categoria) notFound();

  const catalogo = await buscarCatalogo();
  const produtos = catalogo.produtos.filter((p) => p.categoria === slug && !p.oculto);

  // Dados estruturados da vitrine (migalhas + lista de peças), para o Google entender a categoria.
  const dadosEstruturados = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Início", item: SITE.url },
          { "@type": "ListItem", position: 2, name: "Loja", item: `${SITE.url}/loja` },
          { "@type": "ListItem", position: 3, name: categoria.nome, item: `${SITE.url}/loja/${categoria.slug}` },
        ],
      },
      {
        "@type": "CollectionPage",
        name: SEO_CATEGORIA[categoria.slug]?.titulo ?? categoria.nome,
        description: SEO_CATEGORIA[categoria.slug]?.descricao ?? categoria.chamada,
        url: `${SITE.url}/loja/${categoria.slug}`,
        isPartOf: { "@type": "WebSite", name: SITE.nomeCompleto, url: SITE.url },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: produtos.length,
          itemListElement: produtos.map((p, i) => ({
            "@type": "ListItem",
            position: i + 1,
            url: `${SITE.url}/loja/${categoria.slug}/${p.slug}`,
            name: p.nome,
          })),
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados).replace(/</g, "\\u003c") }}
      />
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
          {/* Os cartões são h3: sem este h2, a hierarquia pularia um nível. */}
          <h2 className="sr-only">Peças de {categoria.nome}</h2>
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
              Também fazemos sob encomenda. Conta no WhatsApp o que você quer.
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
