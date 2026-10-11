import type { MetadataRoute } from "next";
import { SITE } from "@/lib/site";

/** Manifesto web: ícone na tela inicial do celular e cor da barra do navegador. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE.nomeCompleto,
    short_name: SITE.nome,
    description: SITE.descricao,
    start_url: "/",
    display: "standalone",
    background_color: "#1d1e20",
    theme_color: "#201E1F",
    lang: "pt-BR",
    icons: [
      { src: "/marca/icone-192.png", sizes: "192x192", type: "image/png" },
      { src: "/marca/icone-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
