import type { MetadataRoute } from "next";
import { ARTIGOS } from "@/lib/artigos";
import { NAV, SITE } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const paginas: MetadataRoute.Sitemap = NAV.map((item) => ({
    url: new URL(item.href, SITE.url).toString(),
    lastModified: new Date(),
    changeFrequency: item.href === "/" ? "weekly" : "monthly",
    priority: item.href === "/" ? 1 : 0.8,
  }));

  const artigos: MetadataRoute.Sitemap = ARTIGOS.map((artigo) => ({
    url: new URL(`/cultura/${artigo.slug}`, SITE.url).toString(),
    lastModified: new Date(artigo.data),
    changeFrequency: "yearly",
    priority: 0.6,
  }));

  return [...paginas, ...artigos];
}
