import type { MetadataRoute } from "next";
import { ARTIGOS } from "@/lib/artigos";
import { CATEGORIAS } from "@/lib/catalogo";
import { buscarCatalogo } from "@/lib/bling/produtos";
import { NAV, SITE } from "@/lib/site";

/**
 * Sitemap com as páginas, as categorias, os 63 produtos (menos os ocultos) e
 * os artigos. Sem `lastModified` inventado: data só onde ela é real (artigos).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const paginas: MetadataRoute.Sitemap = NAV.map((item) => ({
    url: new URL(item.href, SITE.url).toString(),
    changeFrequency: item.href === "/" ? "weekly" : "monthly",
    priority: item.href === "/" ? 1 : 0.8,
  }));

  let produtos: MetadataRoute.Sitemap = [];
  try {
    const catalogo = await buscarCatalogo();
    produtos = catalogo.produtos
      .filter((p) => !p.oculto)
      .map((p) => ({
        url: new URL(`/loja/${p.categoria}/${p.slug}`, SITE.url).toString(),
        changeFrequency: "weekly" as const,
        priority: 0.6,
      }));
  } catch {
    // Catálogo indisponível: o sitemap sai sem produtos em vez de falhar.
  }

  const artigos: MetadataRoute.Sitemap = ARTIGOS.map((artigo) => ({
    url: new URL(`/cultura/${artigo.slug}`, SITE.url).toString(),
    lastModified: new Date(artigo.data),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  const categorias: MetadataRoute.Sitemap = CATEGORIAS.map((categoria) => ({
    url: new URL(`/loja/${categoria.slug}`, SITE.url).toString(),
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const politicas: MetadataRoute.Sitemap = [
    { url: new URL("/trocas-e-devolucoes", SITE.url).toString(), changeFrequency: "yearly", priority: 0.3 },
    { url: new URL("/privacidade", SITE.url).toString(), changeFrequency: "yearly", priority: 0.3 },
    { url: new URL("/termos", SITE.url).toString(), changeFrequency: "yearly", priority: 0.3 },
    { url: new URL("/direitos-autorais", SITE.url).toString(), changeFrequency: "yearly", priority: 0.3 },
  ];

  return [...paginas, ...categorias, ...produtos, ...artigos, ...politicas];
}
