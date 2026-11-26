/**
 * Prazos da loja — decisões do Alexandre em 10/10/2026, não do código.
 *
 * - Postagem em até 3 dias úteis após o pagamento, para todos os produtos.
 * - Peças pintadas à mão (matracas, placas, mandalas, porta-chaves) têm antes
 *   um período de PRODUÇÃO de 3 a 7 dias, por causa do processo manual.
 *   O prazo da transportadora só começa a contar depois da postagem.
 */

export const POSTAGEM_DIAS_UTEIS = 3;

export const PRODUCAO_PINTADA_A_MAO = { min: 3, max: 7 } as const;

/** Placas e mandalas têm área pintada maior: 4 a 10 dias (Alexandre, 20/10 e 01/11/2026). */
export const PRODUCAO_PLACA = { min: 4, max: 10 } as const;

const ehPlaca = (nome: string) => /^(placa|mandala)/i.test(nome.trim());

/**
 * Camisa estampada sob pedido em DTF (26/11/2026, Alexandre): há camisas lisas em
 * estoque e a estampa é aplicada quando o pedido entra, em 1 a 2 dias. É assim
 * que o lançamento vende antes de haver peça pronta contada no Bling.
 */
export const PRODUCAO_ESTAMPA_SOB_PEDIDO = { min: 1, max: 2 } as const;

export function ehEstampadaSobPedido(nome: string): boolean {
  return /^camisa caranguejinho\b/i.test(nome.trim());
}

export function prazoDeProducao(produto: { nome: string }): { min: number; max: number } {
  if (ehEstampadaSobPedido(produto.nome)) return PRODUCAO_ESTAMPA_SOB_PEDIDO;
  return ehPlaca(produto.nome) ? PRODUCAO_PLACA : PRODUCAO_PINTADA_A_MAO;
}

export function textoDeProducao(produto: { nome: string }): string {
  const p = prazoDeProducao(produto);
  if (ehEstampadaSobPedido(produto.nome)) {
    return `Lançamento em pré-venda: a estampa é aplicada na sua camisa quando o pedido entra, em ${p.min} a ${p.max} dias, antes da postagem.`;
  }
  return `Pintada à mão: a produção leva de ${p.min} a ${p.max} dias antes da postagem, e cada peça varia um pouco da foto.`;
}

/** Categorias cujas peças são pintadas à mão, uma por uma. */
const CATEGORIAS_PINTADAS_A_MAO = new Set(["matracas", "decoracao"]);

export function ehPintadaAMao(produto: { categoria: string; nome: string }): boolean {
  // Matraca Mini DTF (21/10/2026): estampa IMPRESSA — dizer "pintada à mão" seria falso.
  if (/\bdtf\b/i.test(produto.nome)) return false;
  if (CATEGORIAS_PINTADAS_A_MAO.has(produto.categoria)) return true;
  return /^porta-?chave/i.test(produto.nome.normalize("NFD").replace(/[̀-ͯ]/g, ""));
}

export const TEXTO_POSTAGEM = `Postamos em até ${POSTAGEM_DIAS_UTEIS} dias úteis após o pagamento`;

export const TEXTO_PRODUCAO_PINTADA_A_MAO = `Pintada à mão: a produção leva de ${PRODUCAO_PINTADA_A_MAO.min} a ${PRODUCAO_PINTADA_A_MAO.max} dias antes da postagem, e cada peça varia um pouco da foto.`;
