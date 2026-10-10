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

/** Categorias cujas peças são pintadas à mão, uma por uma. */
const CATEGORIAS_PINTADAS_A_MAO = new Set(["matracas", "decoracao"]);

export function ehPintadaAMao(produto: { categoria: string; nome: string }): boolean {
  if (CATEGORIAS_PINTADAS_A_MAO.has(produto.categoria)) return true;
  return /^porta-?chave/i.test(produto.nome.normalize("NFD").replace(/[̀-ͯ]/g, ""));
}

export const TEXTO_POSTAGEM = `Postamos em até ${POSTAGEM_DIAS_UTEIS} dias úteis após o pagamento`;

export const TEXTO_PRODUCAO_PINTADA_A_MAO = `Pintada à mão, uma por uma: a produção leva de ${PRODUCAO_PINTADA_A_MAO.min} a ${PRODUCAO_PINTADA_A_MAO.max} dias antes da postagem, e cada peça pode variar um pouco da foto.`;
