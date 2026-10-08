import type { NextConfig } from "next";

/**
 * Cabeçalhos de cache.
 *
 * O CDN da Hostinger estava devolvendo `s-maxage=31536000` (um ano) para o
 * HTML das páginas. Como o nome do arquivo CSS muda a cada build, o efeito era
 * este: o CDN servia um HTML antigo apontando para um CSS que o deploy novo já
 * havia apagado — o navegador recebia 404 e a página aparecia sem estilo
 * nenhum, para todos os visitantes, em qualquer aparelho.
 *
 * A correção declara o cache explicitamente:
 *
 * - HTML: o navegador sempre revalida (`max-age=0, must-revalidate`) e o CDN
 *   guarda no máximo 60 segundos. É a janela em que um deploy pode ser visto
 *   pela metade — curta o bastante para não derrubar o site.
 * - `/_next/static/*`: nome com hash, conteúdo imutável. Um ano de cache é o
 *   correto aqui, e é o que traz a velocidade de volta.
 */
const nextConfig: NextConfig = {
  /**
   * Fotos em WebP (08/10/2026). Sem isto, o Next entregava JPEG — e no celular
   * a foto principal da página inicial levava 3,7 s para aparecer (Lighthouse
   * móvel). AVIF ficou de fora de propósito: comprime mais, mas codificar é
   * lento no servidor, e a primeira visita de cada tamanho pagaria a conta.
   * O cache de 30 dias evita recodificar a mesma foto a cada visita.
   */
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
  async headers() {
    return [
      {
        source: "/_next/static/:caminho*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        // Rotas de API nunca podem ser cacheadas: webhook, diagnóstico e
        // callback do OAuth precisam refletir o estado do instante. Uma
        // resposta guardada por 60 segundos aqui esconde a realidade e
        // atrapalha justamente quando se está investigando um problema.
        source: "/api/:caminho*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate",
          },
        ],
      },
      {
        // Páginas: o navegador revalida sempre, o CDN guarda no máximo 60s.
        source: "/:caminho((?!_next/static|api/).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=60, must-revalidate",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
