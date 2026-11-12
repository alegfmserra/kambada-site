/**
 * Black Kambada 2026 — a promoção de Black Friday da loja (pedido do Alexandre, 11/11/2026).
 * O cupom em si vive no painel /admin/cupons (limite de usos, validade); aqui ficam só
 * os dados do pop-up. Mudou a regra no painel, mude aqui também.
 */
export const BLACK = {
  codigo: "BLACKKAMBADA",
  percentual: 15,
  usos: 50,
  /** Janela do pop-up e do cupom, em AAAA-MM-DD (inclusive), no fuso de São Luís. */
  inicio: "2026-11-22",
  fim: "2026-11-30",
  link: "/loja?utm_source=popup&utm_medium=site&utm_campaign=black-kambada-2026",
} as const;

/** O pop-up fica no ar desde já até o fim; o cupom só vale a partir de `inicio` (ativaEm). */
export const popupNoAr = (hoje: string) => hoje <= BLACK.fim;

export const ativaEm = (hoje: string) => hoje >= BLACK.inicio && hoje <= BLACK.fim;

/** Páginas em que o pop-up nunca aparece: compra em andamento, conta, admin e o Play (público infantil). */
export const FORA_DO_POPUP = [/^\/admin/, /^\/carrinho/, /^\/checkout/, /^\/pedido/, /^\/conta/, /^\/entrar/, /^\/kambadaplay/, /^\/avaliar/];

export const podeAparecerEm = (caminho: string) => !FORA_DO_POPUP.some((r) => r.test(caminho));

/** Data de hoje em São Luís (UTC−3), AAAA-MM-DD. */
export const hojeSaoLuis = (agora = new Date()) => new Date(agora.getTime() - 3 * 3_600_000).toISOString().slice(0, 10);
