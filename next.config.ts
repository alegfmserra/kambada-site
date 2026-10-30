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
/**
 * Cabeçalhos de segurança (auditoria de 10/10/2026): sem eles, um XSS vira
 * execução de script na origem, o login do admin pode ser embutido em outro
 * site (clickjacking) e o navegador pode "adivinhar" tipos de arquivo.
 * A CSP permite script inline porque o Next o usa; o resto é o mínimo.
 */
function seguranca(play: boolean) {
  return [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Kambada Play (3D): os decodificadores WebAssembly dos modelos (Meshopt,
      // Draco) exigem 'wasm-unsafe-eval' (só WebAssembly; não libera eval de JS)
      // e o carregador de modelos lê texturas por blob:. Só vale em /kambadaplay.
      `script-src 'self' 'unsafe-inline'${play ? " 'wasm-unsafe-eval'" : ""} https://www.googletagmanager.com https://www.googleadservices.com https://googleads.g.doubleclick.net${play ? "" : " https://gc.zgo.at"}`,
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data:",
      `connect-src 'self'${play ? " blob: data:" : ""} https://*.google-analytics.com https://*.analytics.google.com https://www.googletagmanager.com https://www.google.com https://googleads.g.doubleclick.net https://ad.doubleclick.net https://www.googleadservices.com https://viacep.com.br${play ? "" : " https://somoskambada.goatcounter.com"}`,
      ...(play ? ["worker-src 'self' blob:"] : []),
      "frame-src https://td.doubleclick.net https://www.googletagmanager.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
  ];
}
const SEGURANCA = seguranca(false);
const SEGURANCA_PLAY = seguranca(true);

/** Site antigo → site novo. Matracas vão para a categoria (os IDs do Bling mudaram na migração de 21/10). */
const ENDERECOS_DO_SITE_ANTIGO: [string, string][] = [
  ["/somos-kambada-o-afeto-que-veste-e-abraca", "/sobre"],
  ["/kambada", "/sobre"],
  ["/kambadamoda-maranhense", "/loja/camisas"],
  ["/cultura-maranhense", "/cultura"],
  ["/matraca-personalizada-kambada-para-eventos", "/encomendas"],
  ["/matraca-grande-com-suporte-reto-edicao-colorida-tradicional-do-bumba-meu-boi", "/loja/matracas"],
  ["/matraca-grande-com-suporte-edicao-bandeira-do-maranhao", "/loja/matracas"],
  ["/matraca-grande-do-bumba-meu-boi-edicao-colorida", "/loja/matracas"],
  ["/matraca-mini-bumba-meu-boi-com-suporte-", "/loja/matracas"],
  ["/matraca-grande-edicao-chapeu-de-fita", "/loja/matracas"],
  ["/matraca-mini-chapeu-de-fita-colorido-ores-do-boi", "/loja/matracas"],
  ["/matraca-grande-do-bumba-meu-boi-edicao-bandeirinhas", "/loja/matracas"],
  ["/matraca-grande-bumba-meu-boi-maranhense", "/loja/matracas"],
  ["/matraca-mini-do-bumba-meu-boi-boi-perfil-direito", "/loja/matracas"],
  ["/matraca-mini-geometrica-chapeu-de-pena", "/loja/matracas"],
  // Peças que a Kambada não vende mais: vão para a decoração.
  ["/tabuas-de-corte-decorativas", "/loja/decoracao"],
  ["/berimbau-miniatura-decorativa", "/loja/decoracao"],
  ["/prancha-de-madeira-decorativa", "/loja/decoracao"],
  ["/maraca-de-madeira-artesanal", "/loja/decoracao"],
  ["/arte-decorativa-de-touro-em-madeira", "/loja/decoracao"],
  ["/placa-decorativa-afro-brasileira", "/loja/decoracao"],
  ["/porta-vinho-decorativo-de-madeira", "/loja/decoracao"],
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  /**
   * Servidor de build da Hostinger limita threads: em 19/10/2026 o "Collecting
   * page data" abriu 63 workers e o processo morreu com "OS can't spawn worker
   * thread (os error 11)". Quatro workers bastam para este site.
   */
  experimental: { cpus: 4 },
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
    // Fotos de produto levam ?v=<impressão do arquivo> (troca de foto fura o cache); o Next 16 só
    // aceita imagem local com parâmetro se o padrão a liberar.
    localPatterns: [{ pathname: "/**" }],
  },
  /**
   * 301s (21/10/2026): www → domínio sem www (um endereço só para o Google) e
   * os endereços do site antigo (construtor da Hostinger, sitemap de 20/10)
   * → a página nova equivalente, para não perder link compartilhado nem busca.
   */
  async redirects() {
    return [
      {
        source: "/:caminho*",
        has: [{ type: "host", value: "www.somoskambada.com.br" }],
        destination: "https://somoskambada.com.br/:caminho*",
        permanent: true,
      },
      ...ENDERECOS_DO_SITE_ANTIGO.map(([source, destination]) => ({ source, destination, permanent: true })),
    ];
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
        // Service worker do app do Play: o navegador e o CDN sempre buscam a
        // versão nova (um SW guardado por um ano prenderia todo mundo na velha).
        source: "/kambadaplay-sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, max-age=0, must-revalidate" },
          { key: "Content-Type", value: "application/javascript; charset=utf-8" },
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
        // Páginas pessoais ou autenticadas: nunca em cache compartilhado.
        // Antes, /admin/pedidos saía com "public, s-maxage=60".
        source: "/:caminho((?:admin|checkout|pedido|carrinho|conta|entrar)(?:/.*)?)",
        headers: [
          { key: "Cache-Control", value: "private, no-store, must-revalidate" },
          ...SEGURANCA,
        ],
      },
      {
        source: "/:caminho((?!kambadaplay).*)",
        headers: SEGURANCA,
      },
      {
        // Kambada Play: mesma política, com a folga mínima do 3D (ver seguranca()).
        source: "/kambadaplay/:caminho*",
        headers: SEGURANCA_PLAY,
      },
      {
        // Páginas: o navegador revalida sempre, o CDN guarda no máximo 60s.
        source: "/:caminho((?!_next/static|api/|admin|checkout|pedido|carrinho|kambadaplay|conta(?!to)|entrar).*)",
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
