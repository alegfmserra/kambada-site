import type { MetadataRoute } from "next";
import { EH_PRODUCAO, SITE } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Fora de produção (endereço temporário, preview, local) nada é indexado.
  if (!EH_PRODUCAO) {
    return { rules: { userAgent: "*", disallow: "/" } };
  }

  return {
    // Só o que não é página: /pedido, /checkout, /conta e /entrar saíram daqui
    // porque todas já levam "noindex" na própria página, e o Google só enxerga
    // o "noindex" de uma página que ele pode ler. Bloqueada aqui, ela podia
    // aparecer na busca só com o endereço.
    rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/admin/"] },
    sitemap: new URL("/sitemap.xml", SITE.url).toString(),
  };
}
