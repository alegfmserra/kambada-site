/**
 * Regras de frete da loja — decisões do Alexandre, não do código.
 *
 * - Origem: 65065-060, São Luís (informado em 08/10/2026).
 * - Frete grátis a partir de R$ 199,99 em produtos (decidido em 08/10/2026).
 *   Vale para a opção de entrega MAIS BARATA; as mais rápidas continuam pagas,
 *   e o cliente escolhe. Dar grátis o SEDEX acima do valor seria abrir mão de
 *   margem que a regra não pediu.
 * - Vendas do site cotam frete por CEP no Melhor Envio. Vendas do Mercado Livre
 *   cotam pela plataforma deles — nunca passam por aqui.
 */

import { emCentavos } from "../loja/dinheiro";

export const CEP_ORIGEM = "65065060";

export const FRETE_GRATIS_A_PARTIR_DE = 199.99;

export function temFreteGratis(subtotalReais: number): boolean {
  return emCentavos(subtotalReais) >= emCentavos(FRETE_GRATIS_A_PARTIR_DE);
}

/** Quanto falta para o frete grátis, ou 0 se já chegou. */
export function faltaParaFreteGratis(subtotalReais: number): number {
  const falta = emCentavos(FRETE_GRATIS_A_PARTIR_DE) - emCentavos(subtotalReais);
  return falta > 0 ? falta / 100 : 0;
}

/** CEP só com dígitos, ou null se não tiver os 8. */
export function normalizarCep(cep: string): string | null {
  const digitos = cep.replace(/\D/g, "");
  return digitos.length === 8 ? digitos : null;
}
