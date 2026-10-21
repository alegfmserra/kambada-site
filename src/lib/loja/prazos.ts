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

/** Placas têm área pintada maior: 4 a 10 dias (Alexandre, 20/10/2026). */
export const PRODUCAO_PLACA = { min: 4, max: 10 } as const;

const ehPlaca = (nome: string) => /^placa/i.test(nome.trim());

export function prazoDeProducao(produto: { nome: string }): { min: number; max: number } {
  return ehPlaca(produto.nome) ? PRODUCAO_PLACA : PRODUCAO_PINTADA_A_MAO;
}

export function textoDeProducao(produto: { nome: string }): string {
  const p = prazoDeProducao(produto);
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
