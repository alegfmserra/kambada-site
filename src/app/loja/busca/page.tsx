import type { Metadata } from "next";
import Form from "next/form";
import Link from "next/link";
import BarraCategorias from "@/components/BarraCategorias";
import CartaoProduto from "@/components/CartaoProduto";
import LinkWhatsApp from "@/components/LinkWhatsApp";
import EventoBusca from "@/components/loja/EventoBusca";
import { buscarCatalogo } from "@/lib/bling/produtos";
import { buscarProdutos, lerTermo, TAMANHO_MAXIMO_DO_TERMO } from "@/lib/loja/busca";
import { linkWhatsApp } from "@/lib/site";

/** Tipado à mão: PageProps só existe depois do build. */
type Props = { searchParams: Promise<{ q?: string | string[] }> };

/**
 * Busca da loja (17/11/2026). Página de resultado nunca vai para o Google:
 * cada termo digitado criaria um endereço novo com conteúdo repetido.
 */
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const termo = lerTermo((await searchParams).q);
  return {
    title: termo ? `Busca: ${termo}` : "Buscar na loja",
    robots: { index: false, follow: true },
    alternates: { canonical: "/loja/busca" },
  };
}

export default async function Busca({ searchParams }: Props) {
  const termo = lerTermo((await searchParams).q);
  const { categorias, produtos } = await buscarCatalogo();
  const achados = buscarProdutos(produtos, categorias, termo);
  const vazio = termo !== "" && achados.length === 0;

  return (
    <>
      <EventoBusca termo={termo} resultados={achados.length} />
      <section className="border-b border-borda">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <Link href="/loja" className="font-display text-sm font-semibold text-texto-tenue hover-marca">
            ← Toda a loja
          </Link>
          <h1 className="mt-6 font-display text-4xl leading-tight font-extrabold text-balance sm:text-5xl">
            Buscar na loja
          </h1>

          <Form action="/loja/busca" role="search" className="mt-6 flex max-w-xl gap-2" data-area="busca">
            <label htmlFor="busca-pagina" className="sr-only">
              O que você procura?
            </label>
            <input
              id="busca-pagina"
              type="search"
              name="q"
              defaultValue={termo}
              maxLength={TAMANHO_MAXIMO_DO_TERMO}
              placeholder="Camisa, matraca, boné…"
              autoComplete="off"
              enterKeyHint="search"
              className="min-h-12 w-full min-w-0 rounded-full border border-borda-campo bg-superficie px-5 py-2.5 text-texto outline-none placeholder:text-texto-tenue focus:border-kambada-amarelo-escuro"
            />
            <button
              type="submit"
              data-alvo="buscar"
              className="min-h-12 shrink-0 rounded-full bg-kambada-amarelo px-6 font-display font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
            >
              Buscar
            </button>
          </Form>

          {/* Quem usa leitor de tela ouve o resultado ao chegar na página. */}
          <p role="status" aria-live="polite" className="mt-5 text-texto-suave">
            {termo === ""
              ? "Digite o nome da peça, a categoria, a estampa ou o tamanho."
              : vazio
                ? `Não achamos nada com “${termo}”.`
                : `${achados.length} ${achados.length === 1 ? "peça encontrada" : "peças encontradas"} para “${termo}”.`}
          </p>
        </div>
      </section>

      <BarraCategorias />

      {achados.length > 0 && (
        <section className="border-b border-borda">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            {/* Os cartões são h3: sem este h2, a hierarquia pularia um nível. */}
            <h2 className="sr-only">Resultado da busca</h2>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-lista="Busca">
              {achados.map((produto) => (
                <CartaoProduto key={produto.slug} produto={produto} />
              ))}
            </ul>
          </div>
        </section>
      )}

      {(vazio || termo === "") && (
        <section className="border-b border-borda" data-area="busca-sugestoes">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
            <h2 className="font-display text-2xl font-bold">
              {vazio ? "Que tal olhar por categoria?" : "Ou vá direto a uma categoria"}
            </h2>
            {vazio && (
              <p className="mt-2 max-w-2xl leading-relaxed text-texto-suave">
                Confira se a palavra está certa ou tente uma mais curta, como “camisa” ou “matraca”.
              </p>
            )}
            <ul className="mt-6 flex flex-wrap gap-2">
              {categorias.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/loja/${c.slug}`}
                    data-alvo={`categoria-${c.slug}`}
                    className="inline-flex min-h-11 items-center rounded-full border border-borda-campo px-5 font-display text-sm font-semibold text-texto transition-colors hover:border-kambada-amarelo-escuro"
                  >
                    {c.nome}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl bg-kambada-amarelo px-8 py-12 text-kambada-grafite sm:px-12">
            <h2 className="font-display text-2xl leading-tight font-extrabold text-balance sm:text-3xl">
              Não achou o que queria?
            </h2>
            <p className="mt-4 max-w-2xl leading-relaxed text-kambada-grafite/80">
              Conta no WhatsApp o que você procura. Também fazemos sob encomenda.
            </p>
            <LinkWhatsApp
              origem={vazio ? "busca-vazia" : "busca"}
              href={linkWhatsApp(
                vazio ? `Oi! Procurei por "${termo}" no site e não achei. Vocês têm?` : "Oi! Estou procurando uma peça no site e queria uma ajuda.",
              )}
              className="mt-8 inline-flex min-h-12 items-center rounded-full bg-kambada-grafite px-7 py-3.5 font-display font-semibold text-kambada-amarelo transition-colors hover:bg-kambada-preto focus-visible:outline-kambada-grafite"
            >
              Falar no WhatsApp
            </LinkWhatsApp>
          </div>
        </div>
      </section>
    </>
  );
}
