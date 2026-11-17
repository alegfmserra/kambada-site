import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import CartaoProduto from "@/components/CartaoProduto";
import FaixaBeneficios from "@/components/FaixaBeneficios";
import BlocoPlay from "@/components/home/BlocoPlay";
import { ARTIGOS } from "@/lib/artigos";
import { buscarCatalogo } from "@/lib/bling/produtos";
import { fotoDoProduto } from "@/lib/fotoDoProduto";
import { FOTOS } from "@/lib/fotos";
import { destaquesDaHome, pecaDeCapa } from "@/lib/loja/destaques";
import { og } from "@/lib/seo/og";
import { REDES, SITE, WHATSAPP } from "@/lib/site";

// Título e descrição são os do layout raiz; aqui só o endereço próprio da home.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
  openGraph: og("/"),
};

/** Quem somos para o Google (organização e site), só na home. Sem endereço: o ateliê não tem endereço público. */
const DADOS_ESTRUTURADOS = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organizacao`,
      name: SITE.nomeCompleto,
      legalName: SITE.razaoSocial,
      url: SITE.url,
      logo: `${SITE.url}/icon.png`,
      description: SITE.descricao,
      sameAs: REDES.map((r) => r.url),
      areaServed: "BR",
      contactPoint: [{ "@type": "ContactPoint", contactType: "customer service", telephone: `+${WHATSAPP.numero}`, areaServed: "BR", availableLanguage: "pt-BR" }],
    },
    { "@type": "WebSite", "@id": `${SITE.url}/#site`, url: SITE.url, name: SITE.nomeCompleto, inLanguage: SITE.locale, publisher: { "@id": `${SITE.url}/#organizacao` } },
  ],
};

// A vitrine mostra preço e estoque do catálogo: renova junto com a loja (10 min).
export const revalidate = 600;

/**
 * Home. Os textos são os do site em produção, preservados.
 * As fotos vieram do acervo da marca — gente de verdade, vestindo as peças
 * em São Luís. É o que faz o site parecer a Kambada e não um template.
 *
 * Ordem (17/11/2026): abertura, vitrine com peça e preço, Kambada Play,
 * categorias, encomendas, quem somos. Antes a home não mostrava nenhum produto.
 */

export default async function Home() {
  const destaques = ARTIGOS.slice(0, 3);
  const { categorias, produtos } = await buscarCatalogo();
  const temFoto = (p: (typeof produtos)[number]) => fotoDoProduto(p) !== null;
  const vitrine = destaquesDaHome(produtos, categorias, temFoto);
  // Capa de cada categoria: a foto própria; sem ela, a de uma peça da categoria.
  const capas = categorias.map((categoria) => {
    const peca = categoria.foto ? undefined : pecaDeCapa(produtos, categoria.slug, temFoto);
    const daPeca = peca ? fotoDoProduto(peca) : null;
    return {
      categoria,
      src: categoria.foto?.arquivo ?? daPeca?.src ?? null,
      alt: categoria.foto?.alt ?? (peca ? `${peca.nome}, da categoria ${categoria.nome}` : ""),
    };
  });

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(DADOS_ESTRUTURADOS).replace(/</g, "\\u003c") }}
      />
      {/* --- Abertura: texto de um lado, família do outro ------------------ */}
      <section className="border-b border-borda">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <p className="font-display text-sm font-semibold tracking-[0.2em] text-texto-tenue uppercase">
              Camisas, matracas, ecobags e arte do Maranhão
            </p>
            <h1 className="mt-5 font-display text-4xl leading-tight font-extrabold text-balance sm:text-6xl">
              A beleza que é ser{" "}
              <span className="destaque">maranhense que só</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-texto-suave">
              O som da matraca, o gingado do reggae e as cores do Bumba Meu
              Boi, em peças pra levar o Maranhão no peito.
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-4" data-area="home-abertura">
              <Link
                href="/loja"
                data-alvo="ver-a-loja"
                className="inline-flex min-h-12 items-center rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro whitespace-nowrap"
              >
                Ver a loja
              </Link>
              <Link
                href="/cultura"
                data-alvo="nossa-cultura"
                className="inline-flex min-h-11 items-center font-display font-semibold text-texto underline underline-offset-4 hover-marca"
              >
                Conhecer a nossa cultura →
              </Link>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl">
            <Image
              src={FOTOS.familiaCaminhando.arquivo}
              alt={FOTOS.familiaCaminhando.alt}
              width={FOTOS.familiaCaminhando.largura}
              height={FOTOS.familiaCaminhando.altura}
              priority
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 pb-14 sm:px-6">
          <FaixaBeneficios compacta />
        </div>
      </section>

      {/* --- Vitrine: peça, nome e preço logo na segunda dobra -------------- */}
      {vitrine.length > 0 && (
        <section className="border-b border-borda" data-area="home-vitrine" aria-labelledby="home-vitrine-titulo">
          <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
            <div className="flex flex-wrap items-baseline justify-between gap-4">
              <h2 id="home-vitrine-titulo" className="font-display text-3xl font-bold sm:text-4xl">
                Da nossa lojinha
              </h2>
              <Link
                href="/loja"
                data-alvo="ver-tudo"
                className="inline-flex min-h-11 items-center font-display text-sm font-semibold text-texto-suave underline underline-offset-4 hover-marca"
              >
                Ver tudo →
              </Link>
            </div>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" data-lista="Home: da nossa lojinha">
              {vitrine.map((produto) => (
                <CartaoProduto key={produto.slug} produto={produto} />
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* --- Kambada Play (Alexandre, 17/11/2026: destaque logo depois da vitrine) --- */}
      <BlocoPlay />

      {/* --- Categorias: as nove, cada uma com foto ------------------------- */}
      <section className="border-b border-borda" data-area="home-categorias">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Explore nossos produtos
            </h2>
            <Link
              href="/loja"
              data-alvo="ver-a-loja-inteira"
              className="inline-flex min-h-11 items-center font-display text-sm font-semibold text-texto-suave underline underline-offset-4 hover-marca"
            >
              Ver a loja inteira →
            </Link>
          </div>

          <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {capas.map(({ categoria, src, alt }) => (
              <li key={categoria.slug}>
                <Link
                  href={`/loja/${categoria.slug}`}
                  data-alvo={`categoria-${categoria.slug}`}
                  className="group block h-full overflow-hidden rounded-2xl border border-borda bg-superficie transition-colors hover:border-kambada-amarelo-escuro"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    {src ? (
                      <Image
                        src={src}
                        alt={alt}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        style={categoria.posicaoDaFoto ? { objectPosition: categoria.posicaoDaFoto } : undefined}
                      />
                    ) : (
                      // Categoria ainda sem nenhuma foto: espaço honesto, não imagem genérica.
                      <div aria-hidden="true" className="flex h-full items-center justify-center border-b border-dashed border-borda text-4xl">
                        🦀
                      </div>
                    )}
                  </div>
                  <div className="p-6">
                    <h3 className="font-display text-xl font-semibold">
                      {categoria.nome}
                    </h3>
                    <p className="mt-2 leading-relaxed text-texto-suave">
                      {categoria.chamada}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --- Encomendas ----------------------------------------------------- */}
      <section className="border-b border-borda" data-area="home-encomendas">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-6 px-4 py-12 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Encomendas e brindes personalizados</h2>
            <p className="mt-2 leading-relaxed text-texto-suave">
              Matracas e placas pintadas à mão com seu nome ou frase, a partir de 1 unidade. Itens
              corporativos (bloquinhos, lápis ecológicos, ecobags…) a partir de 20.
            </p>
          </div>
          <Link
            href="/encomendas"
            data-alvo="fazer-encomenda"
            className="rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro whitespace-nowrap"
          >
            Fazer uma encomenda
          </Link>
        </div>
      </section>

      {/* --- Quem somos --------------------------------------------------- */}
      <section className="border-b border-borda">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div className="grid grid-cols-2 gap-4">
            <Image
              src={FOTOS.familiaSentados.arquivo}
              alt={FOTOS.familiaSentados.alt}
              width={FOTOS.familiaSentados.largura}
              height={FOTOS.familiaSentados.altura}
              sizes="(max-width: 1024px) 45vw, 25vw"
              className="mt-8 rounded-2xl object-cover"
            />
            <Image
              src={FOTOS.meninaRindo.arquivo}
              alt={FOTOS.meninaRindo.alt}
              width={FOTOS.meninaRindo.largura}
              height={FOTOS.meninaRindo.altura}
              sizes="(max-width: 1024px) 45vw, 25vw"
              className="rounded-2xl object-cover"
            />
          </div>

          <div>
            <p className="font-display text-sm font-semibold tracking-[0.2em] text-texto-tenue uppercase">
              Quem somos
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight font-extrabold text-balance sm:text-4xl">
              Uma <span className="destaque">cambada</span> de coração
            </h2>
            <div className="mt-6 space-y-4 text-lg leading-relaxed text-texto-suave">
              <p>
                A Kambada nasceu de um arraial de família — o Arraial da
                Cambada na Roça — e das matraquinhas dadas de lembrança aos
                convidados. O brinde durou mais que a festa e virou marca.
              </p>
              <p>Cada peça é feita e pintada por gente daqui.</p>
            </div>
            <Link
              href="/sobre"
              className="mt-8 inline-block rounded-full border border-borda px-7 py-3.5 font-display font-semibold text-texto transition-colors hover:border-kambada-amarelo-escuro whitespace-nowrap"
            >
              Conheça a nossa história
            </Link>
          </div>
        </div>
      </section>

      {/* --- Feito à mão --------------------------------------------------- */}
      <section className="border-b border-borda">
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div className="order-2 lg:order-1">
            <p className="font-display text-sm font-semibold tracking-[0.2em] text-texto-tenue uppercase">
              Feito à mão
            </p>
            <h2 className="mt-4 font-display text-3xl leading-tight font-extrabold text-balance sm:text-4xl">
              Uma por uma, <span className="destaque">nunca iguais</span>
            </h2>
            <p className="mt-6 text-lg leading-relaxed text-texto-suave">
              Cada matraca é pintada à mão: a sua não tem gêmea.
            </p>
            <Link
              href="/loja/matracas"
              className="mt-8 inline-block rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro whitespace-nowrap"
            >
              Ver as matracas
            </Link>
          </div>

          <div className="order-1 overflow-hidden rounded-3xl lg:order-2">
            <Image
              src={FOTOS.expositorFeira.arquivo}
              alt={FOTOS.expositorFeira.alt}
              width={FOTOS.expositorFeira.largura}
              height={FOTOS.expositorFeira.altura}
              sizes="(max-width: 1024px) 100vw, 45vw"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* --- Blog ---------------------------------------------------------- */}
      <section className="border-b border-borda">
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="flex flex-wrap items-baseline justify-between gap-4">
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Do nosso blog
            </h2>
            <Link
              href="/cultura"
              className="font-display text-sm font-semibold text-texto-suave underline underline-offset-4 hover:text-kambada-amarelo-escuro"
            >
              Ver todos →
            </Link>
          </div>
          <ul className="mt-12 grid gap-6 md:grid-cols-3">
            {destaques.map((artigo) => (
              <li
                key={artigo.slug}
                className="rounded-2xl border border-borda bg-superficie p-7 transition-colors hover:border-kambada-amarelo-escuro"
              >
                <p className="font-display text-xs font-semibold tracking-wide text-texto-tenue uppercase">
                  {artigo.categoria}
                </p>
                <h3 className="mt-3 font-display text-lg leading-snug font-semibold">
                  <Link
                    href={`/cultura/${artigo.slug}`}
                    className="hover:text-kambada-amarelo-escuro"
                  >
                    {artigo.titulo}
                  </Link>
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-texto-suave">
                  {artigo.resumo}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* --- Chamada final -------------------------------------------------- */}
      <section>
        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="rounded-3xl bg-kambada-amarelo px-8 py-14 text-kambada-grafite sm:px-14">
            <h2 className="max-w-2xl font-display text-3xl leading-tight font-extrabold text-balance sm:text-4xl">
              Da Ilha do Amor para o mundo: bora vestir nossa cultura?
            </h2>
            <Link
              href="/loja"
              className="mt-9 inline-block rounded-full bg-kambada-grafite px-7 py-3.5 font-display font-semibold text-kambada-amarelo transition-colors hover:bg-kambada-preto whitespace-nowrap"
            >
              Ver a loja
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
