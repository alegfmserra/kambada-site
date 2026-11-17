/**
 * Black Kambada 2026 — a promoção de Black Friday da loja (pedido do Alexandre, 11/11/2026).
 * O cupom em si vive no painel /admin/cupons (limite de usos, validade); aqui ficam só
 * os dados do pop-up. Mudou a regra no painel, mude aqui também.
 *
 * Arquivo público (vai ao navegador): nada de módulo de servidor aqui.
 */
export const BLACK = {
  codigo: "BLACKKAMBADA",
  percentual: 15,
  usos: 50,
  /** Janela do pop-up e do cupom, em AAAA-MM-DD (inclusive), no fuso de São Luís. */
  inicio: "2026-11-22",
  fim: "2026-11-30",
  link: "/loja?utm_source=popup&utm_medium=site&utm_campaign=black-kambada-2026",
  /** Mensagem pronta de quem pede o aviso antes de a promoção abrir. */
  mensagemAviso: "Oi! Quero ser avisado(a) quando a Black Kambada abrir, dia 22/11.",
  nome: "Black Kambada 2026",
} as const;

/** O pop-up fica no ar desde já até o fim; o cupom só vale a partir de `inicio` (ativaEm). */
export const popupNoAr = (hoje: string) => hoje <= BLACK.fim;

export const ativaEm = (hoje: string) => hoje >= BLACK.inicio && hoje <= BLACK.fim;

/**
 * As fases do pop-up (17/11/2026). Antes de abrir, ele é uma lista de espera
 * ("Me avisa no WhatsApp") e não mostra o código: "guarde o código, vale dia 22"
 * convidava a adiar a compra de hoje. Com a promoção aberta, mostra o código.
 */
export type FaseDaBlack = "espera" | "aberta" | "encerrada";

export const faseDaBlack = (hoje: string): FaseDaBlack => (hoje > BLACK.fim ? "encerrada" : hoje >= BLACK.inicio ? "aberta" : "espera");

/**
 * Páginas em que o pop-up nunca aparece: compra em andamento, conta, admin, o
 * Play (público infantil) e, desde 17/11/2026, também quem está lendo (artigos de
 * /cultura e páginas jurídicas) ou tratando de encomenda.
 */
export const FORA_DO_POPUP = [
  /^\/admin/,
  /^\/carrinho/,
  /^\/checkout/,
  /^\/pedido/,
  /^\/conta(\/|$)/,
  // Quem abriu o Contato quer falar com a gente, não ver oferta.
  /^\/contato/,
  /^\/entrar/,
  /^\/kambadaplay/,
  /^\/avaliar/,
  /^\/cultura\/./,
  /^\/encomendas/,
  /^\/(termos|privacidade|trocas-e-devolucoes|direitos-autorais)(\/|$)/,
];

export const podeAparecerEm = (caminho: string) => !FORA_DO_POPUP.some((r) => r.test(caminho));

/** A faixa fina da promoção aparece só na loja: vitrine, categorias, busca e página de peça. */
export const faixaApareceEm = (caminho: string) => /^\/loja(\/|$)/.test(caminho);

/** Data de hoje em São Luís (UTC−3), AAAA-MM-DD. */
export const hojeSaoLuis = (agora = new Date()) => new Date(agora.getTime() - 3 * 3_600_000).toISOString().slice(0, 10);

/** "2026-11-22" → "22/11". */
export const diaMes = (data: string) => data.split("-").reverse().slice(0, 2).join("/");

/**
 * Gatilho com intenção (17/11/2026): o pop-up só abre para quem mostrou
 * interesse. Antes abria 1,2 s depois de qualquer página carregar.
 */
export const GATILHO = {
  /** Abre ao chegar a esta página da visita (a 2ª)… */
  paginas: 2,
  /** …ou ao rolar esta fração da página… */
  rolagem: 0.5,
  /** …ou depois deste tempo na mesma página. */
  esperaMs: 25_000,
} as const;

/** Quanto da página já foi rolado, de 0 a 1. Página que cabe inteira na tela conta 0 (não há o que rolar). */
export function fracaoRolada(rolado: number, alturaDaPagina: number, alturaDaTela: number): number {
  const rolavel = alturaDaPagina - alturaDaTela;
  if (rolavel <= 0) return 0;
  return Math.max(0, Math.min(1, rolado / rolavel));
}

/**
 * Código guardado para o checkout (só nesta aba; some ao fechar). Quem copia o
 * código ou clica em "Ir para a loja" encontra o campo de cupom já preenchido.
 * O cupom NÃO é aplicado sozinho: a pessoa confere e toca em "Aplicar".
 */
const CHAVE_CUPOM_GUARDADO = "kambada:cupom-guardado";

export function guardarCupom(codigo: string): void {
  try {
    sessionStorage.setItem(CHAVE_CUPOM_GUARDADO, codigo);
  } catch {
    /* sem armazenamento: a pessoa digita o código */
  }
}

export function lerCupomGuardado(): string | null {
  try {
    const c = sessionStorage.getItem(CHAVE_CUPOM_GUARDADO);
    return c && /^[A-Z0-9_-]{3,30}$/.test(c) ? c : null;
  } catch {
    return null;
  }
}
