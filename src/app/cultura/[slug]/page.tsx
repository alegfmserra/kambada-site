import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ARTIGOS,
  artigoPorSlug,
  dataPorExtenso,
  type Imagem,
  type Link as LinkArtigo,
} from "@/lib/artigos";
import { SITE, linkWhatsApp } from "@/lib/site";

/**
 * Tipado à mão em vez de usar PageProps: aquele tipo é gerado durante o build,
 * então uma rota nova quebra o `tsc --noEmit` até o primeiro build passar.
 */
type Props = { params: Promise<{ slug: string }> };

/** Todo artigo fecha com os dois convites: loja e Kambada Play (pedido do Alexandre, 29/10). */
const CHAMADA_PLAY_PADRAO =
  "Jogos, HQs e o Arraial em 3D para a criançada brincar com a cultura maranhense. Experimente o quiz sem cadastro.";

export function generateStaticParams() {
  return ARTIGOS.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { slug } = await params;
  const artigo = artigoPorSlug(slug);
  if (!artigo) return { title: "Artigo não encontrado" };

  const imagem = { url: artigo.capa.src, width: artigo.capa.largura, height: artigo.capa.altura, alt: artigo.capa.alt };

  return {
    title: artigo.tituloSeo ?? artigo.titulo,
    description: artigo.resumo,
    keywords: artigo.palavrasChave,
    alternates: { canonical: `/cultura/${artigo.slug}` },
    openGraph: {
      type: "article",
      title: artigo.titulo,
      description: artigo.resumo,
      publishedTime: artigo.data,
      modifiedTime: artigo.atualizado ?? artigo.data,
      section: artigo.categoria,
      images: [imagem],
    },
    twitter: { card: "summary_large_image", title: artigo.titulo, description: artigo.resumo, images: [imagem.url] },
  };
}

/** Crédito e licença ao lado da foto: CC BY/BY-SA só valem com eles visíveis. */
function Credito({ imagem }: { imagem: Imagem }) {
  return (
    <>
      Foto:{" "}
      <a href={imagem.fonte} target="_blank" rel="noopener noreferrer" className="underline hover:text-kambada-amarelo-escuro">
        {imagem.credito}
      </a>
      {imagem.licenca && (
        <>
          {" · "}
          <a href={imagem.licenca.url} target="_blank" rel="noopener noreferrer license" className="underline hover:text-kambada-amarelo-escuro">
            {imagem.licenca.nome}
          </a>
        </>
      )}
    </>
  );
}

function Figura({ imagem, prioridade = false }: { imagem: Imagem; prioridade?: boolean }) {
  return (
    <figure className="my-10">
      <Image
        src={imagem.src}
        alt={imagem.alt}
        width={imagem.largura}
        height={imagem.altura}
        priority={prioridade}
        sizes="(min-width: 768px) 720px, 100vw"
        className="w-full rounded-2xl"
      />
      <figcaption className="mt-3 text-sm leading-relaxed text-texto-tenue">
        {imagem.legenda && <span className="text-texto-suave">{imagem.legenda} </span>}
        <Credito imagem={imagem} />
      </figcaption>
    </figure>
  );
}

function ItemLink({ link }: { link: LinkArtigo }) {
  const classe =
    "font-semibold underline decoration-kambada-amarelo-escuro underline-offset-4 hover:text-kambada-amarelo-escuro";
  if (link.href.startsWith("/")) {
    return (
      <Link href={link.href} className={classe}>
        {link.texto}
      </Link>
    );
  }
  return (
    <a href={link.href} target="_blank" rel="noopener noreferrer" className={classe}>
      {link.texto}
    </a>
  );
}

export default async function Artigo({ params }: Props) {
  const { slug } = await params;
  const artigo = artigoPorSlug(slug);
  if (!artigo) notFound();

  const url = new URL(`/cultura/${artigo.slug}`, SITE.url).toString();
  const dadosEstruturados = [
    {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      headline: artigo.titulo,
      description: artigo.resumo,
      datePublished: artigo.data,
      dateModified: artigo.atualizado ?? artigo.data,
      articleSection: artigo.categoria,
      inLanguage: "pt-BR",
      keywords: artigo.palavrasChave.join(", "),
      image: new URL(artigo.capa.src, SITE.url).toString(),
      citation: artigo.fontes.map((f) => f.href),
      mainEntityOfPage: url,
      author: { "@type": "Organization", name: SITE.nomeCompleto, url: SITE.url },
      publisher: {
        "@type": "Organization",
        name: SITE.nomeCompleto,
        logo: { "@type": "ImageObject", url: new URL("/icon.png", SITE.url).toString() },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Início", item: SITE.url },
        { "@type": "ListItem", position: 2, name: "Cultura", item: new URL("/cultura", SITE.url).toString() },
        { "@type": "ListItem", position: 3, name: artigo.titulo, item: url },
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: artigo.perguntas.map((p) => ({
        "@type": "Question",
        name: p.pergunta,
        acceptedAnswer: { "@type": "Answer", text: p.resposta },
      })),
    },
  ];

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(dadosEstruturados).replace(/</g, "\\u003c") }}
      />
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
            {artigo.atualizado && (
              <>
                {" · atualizado em "}
                <time dateTime={artigo.atualizado}>{dataPorExtenso(artigo.atualizado)}</time>
              </>
            )}
          </p>
          <Figura imagem={artigo.capa} prioridade />
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
          if (bloco.tipo === "imagem") {
            return <Figura key={i} imagem={bloco.imagem} />;
          }
          if (bloco.tipo === "links") {
            return (
              <nav key={i} aria-label={bloco.titulo} className="mt-12 rounded-2xl border border-borda p-6">
                <h2 className="font-display text-lg font-bold">{bloco.titulo}</h2>
                <ul className="mt-4 space-y-3">
                  {bloco.itens.map((link) => (
                    <li key={link.href} className="leading-relaxed text-texto-suave">
                      <ItemLink link={link} />
                    </li>
                  ))}
                </ul>
              </nav>
            );
          }
          return (
            <p key={i} className="my-5 text-lg leading-relaxed text-texto-suave">
              {bloco.texto}
            </p>
          );
        })}

        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold">Perguntas frequentes</h2>
          <div className="mt-5 divide-y divide-borda rounded-2xl border border-borda">
            {artigo.perguntas.map((p) => (
              <details key={p.pergunta} className="group px-6 py-4">
                <summary className="cursor-pointer list-none font-display text-lg font-semibold marker:hidden">
                  <span className="mr-2 text-kambada-amarelo-escuro group-open:hidden">+</span>
                  <span className="mr-2 hidden text-kambada-amarelo-escuro group-open:inline">−</span>
                  {p.pergunta}
                </summary>
                <p className="mt-3 leading-relaxed text-texto-suave">{p.resposta}</p>
              </details>
            ))}
          </div>
        </section>

        <nav aria-label="Fontes" className="mt-10 text-sm text-texto-tenue">
          <h2 className="font-display text-base font-bold text-texto-suave">Fontes consultadas</h2>
          <ul className="mt-3 space-y-2">
            {artigo.fontes.map((f) => (
              <li key={f.href}>
                <a href={f.href} target="_blank" rel="noopener noreferrer" className="underline hover:text-kambada-amarelo-escuro">
                  {f.texto}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="mt-16 grid gap-5 md:grid-cols-2">
          <div className="flex flex-col rounded-3xl bg-kambada-amarelo px-7 py-9 text-kambada-grafite">
            <h2 className="font-display text-2xl leading-tight font-extrabold text-balance">
              Gostou? A gente também veste isso.
            </h2>
            <p className="mt-3 flex-1 leading-relaxed text-kambada-grafite/80">
              Camisetas, matracas pintadas à mão e bonés de quem vive o que escreve.
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

          <div className="flex flex-col rounded-3xl border border-borda bg-kambada-grafite px-7 py-9 text-kambada-branco">
            <h2 className="font-display text-2xl leading-tight font-extrabold text-balance">
              Brinque com a cultura no <span className="text-kambada-amarelo">Kambada Play</span>
            </h2>
            <p className="mt-3 flex-1 leading-relaxed text-kambada-branco/80">
              {artigo.chamadaPlay ?? CHAMADA_PLAY_PADRAO}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/kambadaplay/experimente"
                className="rounded-full bg-kambada-amarelo px-6 py-3 font-display font-semibold text-kambada-grafite transition-colors hover:bg-kambada-branco"
              >
                Jogar o quiz grátis
              </Link>
              <Link
                href="/kambadaplay/planos"
                className="rounded-full border-2 border-kambada-amarelo px-6 py-3 font-display font-semibold text-kambada-amarelo transition-colors hover:bg-kambada-amarelo hover:text-kambada-grafite"
              >
                Conhecer o Play
              </Link>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
