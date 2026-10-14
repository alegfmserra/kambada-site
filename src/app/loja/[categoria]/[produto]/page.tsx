import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import AdicionarAoCarrinho from "@/components/carrinho/AdicionarAoCarrinho";
import FotoAtiva from "@/components/produto/FotoAtiva";
import GuiaDeTamanhos from "@/components/produto/GuiaDeTamanhos";
import { ProvedorOpcaoAtiva } from "@/components/produto/OpcaoAtiva";
import { tabelaDeMedidas } from "@/lib/loja/medidas";
import { buscarCatalogo } from "@/lib/bling/produtos";
import { embalagemDe } from "@/lib/frete/embalagens";
import { fotoDoItem, fotoDoProduto, type FotoProduto, galeriaDoProduto } from "@/lib/fotoDoProduto";
import {
  categoriaPorSlug,
  disponibilidade,
  precoEmReais,
  precoExibido,
  type Produto,
} from "@/lib/catalogo";
import { ehPintadaAMao, TEXTO_POSTAGEM, TEXTO_PRODUCAO_PINTADA_A_MAO } from "@/lib/loja/prazos";
import { FRETE_GRATIS_A_PARTIR_DE } from "@/lib/frete/regras";
import { TEXTO_REGRA_PARCELAS } from "@/lib/loja/parcelas";
import { formatarReais } from "@/lib/loja/dinheiro";
import { linkWhatsApp, SITE } from "@/lib/site";

/** Tipado à mão: PageProps só existe depois do build. */
type Props = { params: Promise<{ categoria: string; produto: string }> };

export const revalidate = 600;

/**
 * Nenhuma rota de produto é pré-gerada, de propósito.
 *
 * O catálogo vem do Bling e muda sem aviso: estampa nova entra, peça sai de
 * linha. Pré-gerar congelaria a lista no momento do build e produziria 404 em
 * produto que existe. Com a lista vazia, cada produto é renderizado sob
 * demanda e cacheado pelos mesmos 10 minutos do resto da loja.
 */
export function generateStaticParams() {
  return [];
}

async function acharProduto(
  categoria: string,
  slug: string,
): Promise<Produto | undefined> {
  const catalogo = await buscarCatalogo();
  return catalogo.produtos.find(
    (p) => p.slug === slug && p.categoria === categoria,
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { categoria: catSlug, produto: prodSlug } = await params;
  const produto = await acharProduto(catSlug, prodSlug);
  if (!produto) return { title: "Peça não encontrada" };

  const categoria = categoriaPorSlug(catSlug);
  const descricao = `${produto.nome} — ${precoExibido(produto)}. Peça da Kambada, de São Luís do Maranhão. ${produto.variacoes.join(", ")}.`;
  const foto = fotoDoProduto(produto);

  return {
    title: produto.nome,
    description: descricao,
    alternates: { canonical: `/loja/${catSlug}/${prodSlug}` },
    // Produto de teste: abre pelo link, mas não vai para o Google.
    ...(produto.oculto ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      title: `${produto.nome} — ${SITE.nome}`,
      description: descricao,
      type: "website",
      url: `/loja/${catSlug}/${prodSlug}`,
      siteName: SITE.nomeCompleto,
      // A foto da peça no link compartilhado (WhatsApp, Instagram). Sem foto,
      // vai a logo — antes o link saía sem imagem nenhuma.
      images: foto
        ? [{ url: foto.src, width: foto.largura, height: foto.altura, alt: produto.nome }]
        : [{ url: "/opengraph-image.png", width: 1200, height: 630, alt: SITE.nomeCompleto }],
    },
    other: categoria ? { "product:category": categoria.nome } : undefined,
  };
}

export default async function PaginaProduto({ params }: Props) {
  const { categoria: catSlug, produto: prodSlug } = await params;
  const produto = await acharProduto(catSlug, prodSlug);
  if (!produto) notFound();

  const categoria = categoriaPorSlug(catSlug);
  if (!categoria) notFound();

  const estoque = disponibilidade(produto);
  const temFaixa =
    produto.precoMaximo !== undefined && produto.precoMaximo !== produto.preco;
  const umaVariacaoSo =
    produto.variacoes.length === 1 && produto.variacoes[0] === "Único";

  const foto = fotoDoProduto(produto);
  // Foto de cada opção (estampa) — a página troca ao escolher.
  const fotosPorOpcao: Record<number, FotoProduto> = {};
  for (const o of produto.opcoes ?? []) {
    const f = fotoDoItem(o.idBling, produto.slug);
    if (f) fotosPorOpcao[o.idBling] = f;
  }
  // Abre mostrando a primeira opção disponível que tenha foto própria — não a
  // estampa esgotada do produto-pai.
  const primeiraComFoto = (produto.opcoes ?? []).find((o) => o.quantidade > 0 && fotosPorOpcao[o.idBling]);
  const fotoInicial = primeiraComFoto ? fotosPorOpcao[primeiraComFoto.idBling] : foto;
  const medidas = tabelaDeMedidas(produto);

  /**
   * Opções que podem ir para o carrinho: precisam de ID no Bling e de
   * embalagem conhecida para o frete. Peça sem nenhuma delas é vendida pelo
   * WhatsApp — melhor do que cotar frete com medida inventada.
   */
  const opcoesCompraveis = produto.idBling
    ? (produto.opcoes ?? []).filter((o) => embalagemDe(produto, o) !== null)
    : [];

  /**
   * Dado estruturado para o Google. Vale a pena mesmo sem carrinho: é o que
   * faz a peça aparecer com preço e disponibilidade no resultado de busca.
   */
  const dadosEstruturados = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: produto.nome,
    category: categoria.nome,
    brand: { "@type": "Brand", name: SITE.nome },
    ...(foto ? { image: `${SITE.url}${foto.src}` } : {}),
    offers: {
      "@type": "Offer",
      price: produto.preco,
      priceCurrency: "BRL",
      availability: produto.sobEncomenda
        ? "https://schema.org/MadeToOrder"
        : estoque.disponivel
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        // O conteúdo é nosso, montado acima — não vem de entrada de usuário.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados) }}
      />

      <section className="border-b border-borda">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <nav aria-label="Trilha" className="font-display text-sm font-semibold">
            <Link
              href="/loja"
              className="text-texto-tenue hover:text-kambada-amarelo-escuro"
            >
              Loja
            </Link>
            <span aria-hidden="true" className="px-2 text-texto-tenue">
              ›
            </span>
            <Link
              href={`/loja/${categoria.slug}`}
              className="text-texto-tenue hover:text-kambada-amarelo-escuro"
            >
              {categoria.nome}
            </Link>
          </nav>

          <ProvedorOpcaoAtiva inicial={opcoesCompraveis.length === 1 ? opcoesCompraveis[0].idBling : null}>
          <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-14">
            <FotoAtiva nome={produto.nome} padrao={fotoInicial} porOpcao={fotosPorOpcao} galeria={galeriaDoProduto(produto)} />

            <div className="flex flex-col">
              <h1 className="font-display text-3xl leading-tight font-extrabold text-balance sm:text-4xl">
                {produto.nome}
              </h1>

              <p className="mt-5 font-display text-3xl font-bold">
                {precoExibido(produto)}
              </p>
              {temFaixa && (
                <p className="mt-1 text-sm text-texto-tenue">
                  O preço varia conforme o tamanho escolhido.
                </p>
              )}

              <p
                className={`mt-4 inline-flex w-fit rounded-full px-3 py-1 text-xs font-semibold ${
                  estoque.disponivel
                    ? "bg-kambada-amarelo text-kambada-grafite"
                    : "border border-borda text-texto-tenue"
                }`}
              >
                {estoque.texto}
              </p>

              {opcoesCompraveis.length > 0 && estoque.disponivel && (
                <>
                  <AdicionarAoCarrinho
                    slug={produto.slug}
                    categoria={produto.categoria}
                    nome={produto.nome}
                    opcoes={opcoesCompraveis}
                    sobEncomenda={produto.sobEncomenda}
                  />
                  {medidas && <GuiaDeTamanhos tabela={medidas} />}
                  <p className="mt-2 text-sm text-texto-suave">
                    Prefere conversar antes?{" "}
                    <a
                      href={linkWhatsApp(`Oi! Tenho uma dúvida sobre a peça "${produto.nome}".`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-texto underline underline-offset-4 hover:text-kambada-amarelo-escuro"
                    >
                      Chame no WhatsApp
                    </a>
                  </p>
                </>
              )}

              {opcoesCompraveis.length === 0 && !umaVariacaoSo && (
                <div className="mt-8">
                  <h2 className="font-display text-sm font-semibold text-texto-tenue uppercase">
                    Opções disponíveis
                  </h2>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {produto.variacoes.map((v) => (
                      <li
                        key={v}
                        className="rounded-full border border-borda px-4 py-2 text-sm"
                      >
                        {v}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-3 text-sm text-texto-suave">
                    Diga qual você quer na mensagem — a gente confirma a
                    disponibilidade na hora.
                  </p>
                </div>
              )}

              {/* Sem carrinho para esta peça (sem embalagem conhecida, ou
                  catálogo local sem ID do Bling): o WhatsApp é a compra. */}
              {!(opcoesCompraveis.length > 0 && estoque.disponivel) && (
              <div className="mt-10">
                {estoque.disponivel ? (
                  <a
                    href={linkWhatsApp(
                      `Oi! Quero esta peça: ${produto.nome} — ${precoEmReais(produto.preco)}${
                        umaVariacaoSo
                          ? ""
                          : ` (opções: ${produto.variacoes.join(", ")})`
                      }. Ainda tem disponível?`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-full bg-kambada-amarelo px-8 py-4 font-display font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
                  >
                    Pedir pelo WhatsApp
                  </a>
                ) : (
                  <>
                    <p className="inline-block rounded-full border border-borda px-8 py-4 font-display font-semibold text-texto-tenue">
                      Esgotado no momento
                    </p>
                    <p className="mt-4 text-sm text-texto-suave">
                      Esta peça é feita em lote pequeno.{" "}
                      <a
                        href={linkWhatsApp(
                          `Oi! A peça "${produto.nome}" está esgotada no site. Me avisa quando voltar?`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-texto underline underline-offset-4 hover:text-kambada-amarelo-escuro"
                      >
                        Me avise quando voltar
                      </a>
                    </p>
                  </>
                )}
              </div>
              )}

              {produto.descricao && (
                <div className="mt-8 border-t border-borda pt-6 leading-relaxed whitespace-pre-line">
                  {produto.descricao}
                </div>
              )}

              <ul className="mt-8 space-y-2 border-t border-borda pt-6 text-sm leading-relaxed text-texto-suave">
                {ehPintadaAMao(produto) && (
                  <li className="rounded-xl bg-superficie px-4 py-3 font-medium text-texto">
                    🎨 {TEXTO_PRODUCAO_PINTADA_A_MAO}
                  </li>
                )}
                <li>📦 {TEXTO_POSTAGEM}.</li>
                <li>🚚 Frete grátis a partir de {formatarReais(FRETE_GRATIS_A_PARTIR_DE)} na entrega mais barata.</li>
                <li>📍 Retirada grátis no ateliê, em São Luís.</li>
                <li>💳 {TEXTO_REGRA_PARCELAS}</li>
                <li>
                  ↩️ Trocas e devoluções conforme o Código de Defesa do Consumidor —{" "}
                  <Link href="/trocas-e-devolucoes" className="font-semibold text-texto underline underline-offset-4">
                    veja como funciona
                  </Link>
                  .
                </li>
              </ul>

              <p className="mt-6 text-sm leading-relaxed text-texto-suave">
                Feito em São Luís do Maranhão. Preço e disponibilidade saem
                direto do nosso estoque — se está aqui, existe de verdade.
              </p>
            </div>
          </div>
          </ProvedorOpcaoAtiva>
        </div>
      </section>

      <section>
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <Link
            href={`/loja/${categoria.slug}`}
            className="font-display font-semibold text-texto underline underline-offset-4 hover:text-kambada-amarelo-escuro"
          >
            ← Ver todas as peças de {categoria.nome}
          </Link>
        </div>
      </section>
    </>
  );
}
