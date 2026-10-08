/**
 * Dinheiro em centavos inteiros.
 *
 * Somar preço em número de ponto flutuante dá errado de forma silenciosa:
 * 0,1 + 0,2 vira 0,30000000000000004, e três camisas de R$ 89,90 viram
 * 269,70000000000005. No carrinho isso aparece como um centavo a mais ou a
 * menos — e um centavo de diferença entre o site, o Mercado Pago e o Bling é
 * exatamente o que quebra a conciliação. Toda conta de total passa por aqui.
 */

export function emCentavos(reais: number): number {
  return Math.round(reais * 100);
}

export function emReais(centavos: number): number {
  return centavos / 100;
}

export function formatarReais(reais: number): string {
  return reais.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
