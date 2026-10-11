/**
 * Parcelamento sem juros — decisão do Alexandre (10/10 e 11/10/2026).
 *
 * A loja absorve os juros, por isso o parcelamento só abre em pedidos que o
 * suportam: 2x a partir de R$ 150 e 3x a partir de R$ 350; abaixo, à vista.
 * O 3x subiu de 300 para 350 porque, somado ao frete grátis (≥ R$ 250), a
 * camisa caía a 31% de margem; a 350 o frete pesa 10% e a camisa fica em 35%.
 * Este arquivo é a única fonte: vale para a preferência do Mercado Pago e
 * para o que o cliente lê na peça, no carrinho e no checkout.
 */

export const LIMITES_PARCELAS = [
  { parcelas: 3, aPartirDeCentavos: 35000 },
  { parcelas: 2, aPartirDeCentavos: 15000 },
] as const;

export function parcelasPermitidas(totalCentavos: number): number {
  for (const l of LIMITES_PARCELAS) if (totalCentavos >= l.aPartirDeCentavos) return l.parcelas;
  return 1;
}

const reais = (c: number) => (c / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

/** Regra geral, para a página da peça. */
export const TEXTO_REGRA_PARCELAS = `Pix ou cartão. Sem juros em 2x a partir de ${reais(15000)} e em 3x a partir de ${reais(35000)}.`;

/** O que vale para ESTE total, para carrinho e checkout. */
export function textoParcelas(totalCentavos: number): string {
  const n = parcelasPermitidas(totalCentavos);
  if (n === 1) {
    const proximo = LIMITES_PARCELAS[LIMITES_PARCELAS.length - 1];
    const falta = proximo.aPartirDeCentavos - totalCentavos;
    return `À vista no Pix ou no cartão. Faltam ${reais(falta)} para parcelar em 2x sem juros.`;
  }
  const valor = Math.round(totalCentavos / n);
  return `Em até ${n}x de ${reais(valor)} sem juros no cartão, ou à vista no Pix.`;
}
