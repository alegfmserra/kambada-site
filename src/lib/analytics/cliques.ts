/**
 * Mapa de cliques (17/11/2026): o padrão único para medir, no Google Analytics,
 * tudo o que é clicável na loja e nas páginas institucionais.
 *
 * COMO FUNCIONA
 * Um ouvinte só, no documento (components/MedidorDeVisitas.tsx), olha cada clique
 * em link ou botão e decide o que mandar:
 *
 *  1. `data-evento="select_item"` (cartão de peça): manda `select_item` com a peça
 *     e o nome da lista (`data-lista` no elemento em volta).
 *  2. `data-evento="<outro nome>"`: o próprio componente já manda o evento certo
 *     (WhatsApp → generate_lead, pôr no carrinho → add_to_cart, promoção →
 *     select_promotion…). O ouvinte NÃO manda nada, para não contar duas vezes.
 *  3. Todo o resto: evento `clique` com { area, alvo, pagina }.
 *     - `area`: o `data-area` mais próximo; sem ele, "cabecalho", "rodape" ou "conteudo".
 *     - `alvo`: o `data-alvo` do elemento; sem ele, o texto do link ou botão, sem
 *       acento e com hífens ("ver-a-loja").
 *     - `pagina`: o TIPO da página ("produto", "categoria"…), nunca o endereço.
 *
 * O QUE NUNCA SAI DAQUI
 * Nada de nome, e-mail, telefone, CEP ou número de pedido. Nas páginas com dado
 * de cliente (conta, pedido, checkout, carrinho) só é medido o que foi marcado à
 * mão com `data-alvo`; texto de tela não vira nome de evento ali. Dentro do
 * Kambada Play e do painel nada é medido (ver `evento()`).
 *
 * Arquivo puro (vai ao navegador): nada de módulo de servidor aqui.
 */

export type TipoDePagina =
  | "home" | "loja" | "busca" | "categoria" | "produto" | "carrinho" | "checkout" | "checkout-retorno"
  | "pedido" | "atendimento" | "conta" | "entrar" | "cultura" | "artigo" | "sobre" | "contato"
  | "encomendas" | "avaliar" | "juridico" | "outra";

const FIXAS: Record<string, TipoDePagina> = {
  "/": "home",
  "/loja": "loja",
  "/loja/busca": "busca",
  "/carrinho": "carrinho",
  "/checkout": "checkout",
  "/pedido": "pedido",
  "/pedido/atendimento": "atendimento",
  "/conta": "conta",
  "/entrar": "entrar",
  "/cultura": "cultura",
  "/sobre": "sobre",
  "/contato": "contato",
  "/encomendas": "encomendas",
  "/termos": "juridico",
  "/privacidade": "juridico",
  "/trocas-e-devolucoes": "juridico",
  "/direitos-autorais": "juridico",
};

/** O tipo da página, a partir do endereço. O endereço em si (que pode levar número de pedido) não é enviado. */
export function tipoDaPagina(caminho: string): TipoDePagina {
  const limpo = caminho.replace(/\/+$/, "") || "/";
  if (FIXAS[limpo]) return FIXAS[limpo];
  const partes = limpo.split("/").filter(Boolean);
  if (partes[0] === "loja") return partes.length === 2 ? "categoria" : partes.length === 3 ? "produto" : "outra";
  if (partes[0] === "cultura") return "artigo";
  if (partes[0] === "checkout") return "checkout-retorno";
  if (partes[0] === "pedido") return "pedido";
  if (partes[0] === "conta") return "conta";
  if (partes[0] === "avaliar") return "avaliar";
  return "outra";
}

/** Páginas com dado de cliente na tela: ali só vale o que foi marcado à mão com `data-alvo`. */
const SO_MARCADOS = new Set<TipoDePagina>(["carrinho", "checkout", "checkout-retorno", "pedido", "atendimento", "conta", "entrar", "avaliar"]);

export const soCliquesMarcados = (pagina: TipoDePagina) => SO_MARCADOS.has(pagina);

/** Onde nada é medido: o Play (público infantil), o painel e as rotas de API. */
export const semMedicaoDeCliques = (caminho: string) => /^\/(kambadaplay|admin|api)(\/|$)/.test(caminho);

/**
 * Texto de tela → nome curto de alvo: "Ver a loja →" vira "ver-a-loja".
 * Sequência de 4 ou mais dígitos sai (número de pedido, telefone, CEP).
 */
export function alvoDoTexto(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\d{4,}/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/, "");
}

export type Clique = { area: string; alvo: string; pagina: TipoDePagina };

/** O que o ouvinte leu do elemento clicado (separado do DOM para poder ser testado). */
export type Lido = {
  /** `data-evento` do elemento, se houver. */
  evento?: string | null;
  /** `data-alvo` do elemento, se houver. */
  alvo?: string | null;
  /** `data-area` mais próximo, se houver. */
  area?: string | null;
  /** Está dentro de <header> ou de <footer>? */
  marco?: "cabecalho" | "rodape" | null;
  /** Rótulo acessível ou texto visível do elemento. */
  texto?: string | null;
};

/**
 * Decide o evento `clique` de um elemento, ou null quando não há o que mandar:
 * elemento com evento próprio, sem nome possível, ou página com dado de cliente
 * e elemento não marcado.
 */
export function cliqueDoElemento(lido: Lido, caminho: string): Clique | null {
  if (semMedicaoDeCliques(caminho)) return null;
  if (lido.evento) return null;
  const pagina = tipoDaPagina(caminho);
  const marcado = (lido.alvo ?? "").trim();
  if (!marcado && soCliquesMarcados(pagina) && !lido.marco) return null;
  const alvo = marcado ? alvoDoTexto(marcado) : alvoDoTexto(lido.texto ?? "");
  if (!alvo) return null;
  return { area: alvoDoTexto(lido.area ?? "") || lido.marco || "conteudo", alvo, pagina };
}

/** Peça como o GA4 espera numa lista (`view_item_list`, `select_item`). Sem preço: o cartão pode mostrar faixa. */
export type ItemDeLista = { item_id: string; item_name: string; item_category: string; index?: number };

/** Quantas peças vão num `view_item_list` (o Google corta evento grande demais). */
export const MAXIMO_DE_ITENS_NA_LISTA = 24;
