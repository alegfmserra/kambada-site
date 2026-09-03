import type { ProdutoBling } from "./tipos";

/**
 * Preço de venda e custo corretos, por produto do Bling.
 *
 * POR QUE ESTE ARQUIVO EXISTE
 *
 * O Bling foi carregado com os valores da nota de remessa para a Fenace, que
 * sai a CUSTO. O custo entrou no campo de preço de venda em toda a conta: a
 * camiseta ficou a R$ 33,80, o boné a R$ 19,00, a necessaire a R$ 7,22 —
 * exatamente os valores unitários das NF-e 25, 26 e 27.
 *
 * Isso não afeta só a vitrine: o mesmo campo alimenta nota fiscal e
 * marketplace.
 *
 * DE ONDE VEM CADA NÚMERO
 *
 * - VENDA: planilha `Kambada_Listagem_FENACE_Bling_2026-08-29.xlsx`, aba
 *   "Listagem Consolidada". É a única fonte que tem preço de venda.
 * - CUSTO: as NF-e da remessa (2026-08-31 e 2026-09-02). Documento fiscal
 *   vence a planilha onde divergem — e divergem em quatro itens, sendo o
 *   boné o mais gritante (planilha: R$ 0,20; nota: R$ 19,00).
 *
 * Aprovado pelo Alexandre em 2026-09-03, com duas correções dele:
 * - pareô passa de R$ 85,00 (preço antigo) para R$ 89,90, por decisão nova;
 * - toda a linha infantil é R$ 74,90.
 *
 * As matracas foram casadas por custo E por saldo ao mesmo tempo, porque o
 * nome no Bling ("Grande com Suporte") não bate com o da planilha ("Desenhos
 * Diversos com Suporte / Grande"). Os cinco tipos bateram nos dois critérios.
 */

export type PrecoCorreto = { venda: number; custo: number };

/** Camisa adulta. Infantil e suede saem por 74,90 — confirmado. */
const ADULTO = 89.9;
const INFANTIL = 74.9;
const CUSTO_CAMISA = 33.8;

export const PRECOS_CORRETOS: Record<string, PrecoCorreto> = {
  // --- Camisas (custo da NF 25) ---
  "Camisa Alusiva São Luís": { venda: ADULTO, custo: CUSTO_CAMISA },
  "Camisa Babylook Bumba Boi": { venda: ADULTO, custo: CUSTO_CAMISA },
  "Camisa Boi Maranhense que só": { venda: ADULTO, custo: CUSTO_CAMISA },
  "Camisa Boizinho com Fio de Matraca": { venda: ADULTO, custo: CUSTO_CAMISA },
  "Camisa Caboclo de Pena": { venda: ADULTO, custo: CUSTO_CAMISA },
  "Camisa Cazumbá": { venda: ADULTO, custo: CUSTO_CAMISA },
  "Camisa Lendas e Carrancas": { venda: ADULTO, custo: CUSTO_CAMISA },
  "Camisa Reggae Roots": { venda: ADULTO, custo: CUSTO_CAMISA },
  "Camisa Revoada dos Guarás": { venda: ADULTO, custo: CUSTO_CAMISA },
  "Camisa Sol Nosso de Cada Dia - Regatão": { venda: ADULTO, custo: CUSTO_CAMISA },
  "Camisa Tradição": { venda: ADULTO, custo: CUSTO_CAMISA },
  "Camisa Tradição Texto": { venda: ADULTO, custo: CUSTO_CAMISA },
  "Camisa Bumba meu Boi Infantil": { venda: INFANTIL, custo: CUSTO_CAMISA },
  "Camisa Cazumbázinho": { venda: INFANTIL, custo: CUSTO_CAMISA },
  "Camisa Infantil Ilha Encantada": { venda: INFANTIL, custo: CUSTO_CAMISA },
  "Camisa Lenda da Serpente Infantil": { venda: INFANTIL, custo: CUSTO_CAMISA },
  "Camisa Revoada dos Guarás Suede Feminino": {
    venda: INFANTIL,
    custo: CUSTO_CAMISA,
  },
  "Camisa Revoada dos Guarás Suede Unissex": {
    venda: INFANTIL,
    custo: CUSTO_CAMISA,
  },
  "Camisa Revoadinha dos Guarás": { venda: INFANTIL, custo: CUSTO_CAMISA },
  "Camisa Serpente Mosaico Infantil": { venda: INFANTIL, custo: CUSTO_CAMISA },

  // --- Demais categorias (custo das NF 26 e 27) ---
  Boné: { venda: 55, custo: 19 },
  Necessaire: { venda: 20, custo: 7.22 },
  Pareô: { venda: 89.9, custo: 31 },
  "Ecobag Pequena": { venda: 40, custo: 9.55 },
  "Ecobag Grande": { venda: 55, custo: 10.8 },
  "Porta-chave": { venda: 55, custo: 10.83 },

  // Casadas por custo + saldo, não por nome.
  "Matraca Kambada Pequena sem Suporte": { venda: 110, custo: 22.26 },
  "Matraca Kambada Grande sem Suporte": { venda: 145, custo: 28.72 },
  "Matraca Kambada Pequena com Suporte": { venda: 140, custo: 36.32 },
  "Matraca Kambada Grande com Suporte": { venda: 185, custo: 45.72 },
  "Matraca Kambada Play": { venda: 220, custo: 63.72 },
};

/**
 * Registros que NÃO devem ter preço corrigido — vão ser inativados.
 *
 * "Camisa" é um cadastro genérico criado para emitir a nota de remessa de
 * forma mais simples, sem deixar de declarar o que estava sendo levado. Ele
 * carrega 169 peças, que é o total de TODAS as camisas — e como cada camisa
 * também está cadastrada individualmente, o estoque das camisas aparece em
 * dobro no Bling.
 *
 * "Camisa Unissex" foi um lote de emergência (fornecedor trocado às pressas),
 * comprado a ~R$34, vendido a R$80. Já foi todo vendido — confirmado pelo
 * Alexandre em 2026-09-03 — e não compram mais desse lote. O Cadastro Mestre
 * tem o mesmo item como "Camisa Unissex Emergencial" (SKU15), marcado
 * DESCONTINUADO.
 *
 * "Boné", "Necessaire" e "Pareô" são o padrão ANTIGO — Fase 2 da
 * reestruturação "estampa é produto" (2026-09-03): a Fase 1 já criou os 12
 * produtos novos, um por estampa (ver /api/bling/criar-produtos). Estes três
 * — o genérico de cada categoria e seus filhos por variação — ficam
 * substituídos. "Pareô" não tem filho: era um produto simples avulso, sem
 * estrutura de variação nenhuma.
 *
 * "Ecobag Pequena" e "Ecobag Grande" são o padrão antigo da Fase 3 — a
 * estampa virou o produto-pai, com Mini/Grande como variação dentro dele
 * (ver /api/bling/criar-ecobags). "Ecobag Grande" era um produto simples
 * avulso, sem variação — igual ao caso do Pareô antes da Fase 1.
 *
 * "Kit Ecológico" (R$80, sem variação) virou 4 produtos por estampa a
 * R$85 — achado nas fotos de produto de 2026-09-03, confirmado pelo
 * Alexandre. O preço antigo também estava errado, não só a estrutura.
 *
 * Inativar, e não apagar: os registros estão amarrados a notas fiscais já
 * emitidas.
 */
export const A_INATIVAR = [
  "Camisa",
  "Camisa Unissex",
  "Boné",
  "Necessaire",
  "Pareô",
  "Ecobag Pequena",
  "Ecobag Grande",
  "Kit Ecológico",
];

/**
 * Produtos existentes no Bling que ficaram FORA desta correção, de propósito.
 *
 * O nome deles não casa com nenhuma linha da planilha de forma inequívoca
 * (ex.: "Bloquinho" pode ser "Bloco Anotação Caderninho Ecológico" a R$ 17 ou
 * "Kambada Goods" a R$ 10). Chutar preço de venda em cadastro que alimenta
 * nota fiscal seria pior do que deixar como está e avisar.
 *
 * "Lápis Plantável" É a mesma peça que a planilha de estoque chama de "Lápis
 * Ecológicos Sortido" — confirmado pelo Alexandre em 2026-09-03 (lápis de
 * madeira reflorestada com cápsula biodegradável de sementes). O preço já
 * batia (R$ 8 nos dois lados), então não precisou de correção — fica na
 * lista só porque o nome ainda diverge entre Bling e planilha.
 */
export const FORA_DA_CORRECAO = [
  "Bermuda Brim",
  "Bermuda Linho",
  "Bloquinho",
  "Lápis Plantável",
  "Livro Trilíngue",
  "Livro Vermelho (Historinha)",
];

/**
 * O preço-alvo de um produto, seguindo o pai quando ele for uma variação.
 *
 * Um tamanho custa o mesmo que a peça: "Camisa Tradição Tamanho:G" recebe o
 * preço de "Camisa Tradição". Sem isto, só o produto-pai seria corrigido e as
 * variações — que são o que de fato se vende — continuariam a custo.
 */
export function alvoDoProduto(
  p: ProdutoBling,
  nomesDePais: string[],
): PrecoCorreto | null {
  const direto = PRECOS_CORRETOS[p.nome];
  if (direto) return direto;

  // Um produto-pai nunca herda de outro. "Camisa Alusiva São Luís" começa com
  // "Camisa ", que também é um cadastro — sem esta guarda, um pai seria
  // tratado como variação de outro.
  if (p.formato === "V") return null;

  const pai = nomesDePais.find(
    (nome) => p.nome !== nome && p.nome.startsWith(`${nome} `),
  );
  return pai ? (PRECOS_CORRETOS[pai] ?? null) : null;
}
