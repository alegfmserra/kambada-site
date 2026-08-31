/**
 * Constantes do site. Ponto único de verdade para dados institucionais.
 * Nada aqui é inventado: tudo veio do site em produção (somoskambada.com.br,
 * lido em 2026-08-30) ou foi confirmado pelo Alexandre. Dado desconhecido
 * fica ausente e vira pendência — nunca é preenchido por suposição.
 */

export const SITE = {
  nome: "Kambada",
  nomeCompleto: "Somos Kambada",
  descricao:
    "Marca maranhense que celebra o Bumba Meu Boi, o reggae e as tradições da Ilha do Amor. Moda e arte que vestem cultura.",
  url: "https://somoskambada.com.br",
  locale: "pt-BR",
} as const;

/**
 * O site só se declara "produção" quando NEXT_PUBLIC_SITE_URL for definida
 * explicitamente com o domínio oficial. Em qualquer outro lugar — endereço
 * temporário da Hostinger, pré-visualização, máquina local — o site pede
 * para não ser indexado.
 *
 * O padrão é fechado de propósito: enquanto o site atual estiver vendendo em
 * somoskambada.com.br, um endereço de teste indexado viraria conteúdo
 * duplicado e competiria com ele no Google.
 */
export const EH_PRODUCAO = process.env.NEXT_PUBLIC_SITE_URL === SITE.url;

/** Número oficial de atendimento, extraído dos links do site atual. */
export const WHATSAPP = {
  numero: "5598984435295",
  exibicao: "(98) 98443-5295",
  saudacao: "Bom dia, o que a Kambada pode fazer por você hoje?",
} as const;

export function linkWhatsApp(mensagem: string = WHATSAPP.saudacao): string {
  return `https://wa.me/${WHATSAPP.numero}?text=${encodeURIComponent(mensagem)}`;
}

export const REDES = [
  { nome: "Instagram", url: "https://www.instagram.com/somos.kambada" },
  { nome: "TikTok", url: "https://tiktok.com/somos.kambada" },
  { nome: "Threads", url: "https://www.threads.com/@somos.kambada" },
] as const;

/**
 * Navegação. Todo item aponta para uma rota que existe de fato — há teste
 * garantindo isso, para nunca surgir link quebrado no menu.
 */
export const NAV = [
  { rotulo: "Início", href: "/" },
  { rotulo: "Loja", href: "/loja" },
  { rotulo: "Sobre", href: "/sobre" },
  { rotulo: "Cultura", href: "/cultura" },
  { rotulo: "Contato", href: "/contato" },
] as const;

/**
 * Medidores de analytics já em uso no site atual — migram na Fase 1.
 * Só carregam em produção.
 */
export const ANALYTICS = {
  ga4: "G-1LGMQVBGL3",
  googleAds: "AW-17510432449",
} as const;
