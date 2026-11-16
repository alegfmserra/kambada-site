import type { Metadata } from "next";
import { SITE } from "@/lib/site";

type OpenGraph = NonNullable<Metadata["openGraph"]>;
type ImagemOg = { url: string; width: number; height: number; alt: string };

/** A imagem de compartilhamento da loja (arquivo em app/opengraph-image.png). */
export const IMAGEM_OG_LOJA: ImagemOg = { url: "/opengraph-image.png", width: 1200, height: 630, alt: SITE.nomeCompleto };

/** A imagem de compartilhamento do Kambada Play: a capa da animação do Kambadinha. */
export const IMAGEM_OG_PLAY: ImagemOg = {
  url: "/kambadaplay/videos/kambadinha-a-hora-dos-guaras.jpg",
  width: 1280,
  height: 720,
  alt: "Kambadinha em A Hora dos Guarás, animação do Kambada Play",
};

/**
 * Open Graph de uma página, com o endereço dela em `og:url`.
 *
 * O Next não mescla `openGraph` entre layout e página: o da página substitui o
 * do layout inteiro. Por isso toda página que declara o seu repete aqui o nome
 * do site, o idioma, o tipo e a imagem. Título e descrição, quando não vêm,
 * são herdados do `title` e da `description` da própria página.
 */
export function og(
  caminho: string,
  extra: { title?: string; description?: string; images?: ImagemOg[] } = {},
): OpenGraph {
  return {
    type: "website",
    locale: "pt_BR",
    siteName: SITE.nomeCompleto,
    url: caminho,
    images: extra.images ?? [IMAGEM_OG_LOJA],
    ...(extra.title ? { title: extra.title } : {}),
    ...(extra.description ? { description: extra.description } : {}),
  };
}
