import type { MetadataRoute } from "next";
import { EH_PRODUCAO, SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Fora de produção (endereço temporário, preview, local) nada é indexado.
  if (!EH_PRODUCAO) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: new URL("/sitemap.xml", SITE.url).toString(),
  };
}
