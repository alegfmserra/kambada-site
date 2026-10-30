import { SITE } from "@/lib/site";

/**
 * Manifesto web da loja: ícone na tela inicial do celular e cor da barra do navegador.
 *
 * Era `src/app/manifest.ts` (arquivo de convenção do Next) até 30/10/2026. Esse
 * arquivo prende o <link rel="manifest"> em TODAS as páginas, sem que um layout
 * filho consiga trocar — e o Kambada Play precisa do manifesto próprio (app
 * instalável, /kambadaplay/manifest.json). Agora é uma rota no mesmo endereço,
 * declarada em `metadata.manifest` do layout raiz, que o layout do Play substitui.
 */
export const dynamic = "force-static";

export function GET() {
  return Response.json(
    {
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
    },
    { headers: { "Content-Type": "application/manifest+json" } },
  );
}
