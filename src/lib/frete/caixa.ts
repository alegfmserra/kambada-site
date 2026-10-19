/**
 * Caixa única: o carrinho inteiro como UM pacote.
 *
 * Pedido do Alexandre (19/10/2026): o frete de vários itens tem de sair como
 * um frete só, com tudo somado — é assim que a Will embala, fica mais barato
 * para o cliente e para a loja. A cotação "por produtos" do Melhor Envio às
 * vezes separa os itens em volumes e soma os preços.
 *
 * Como a caixa é montada (conservador, para não ser remedida no centro de
 * distribuição):
 * - cada peça é deitada com o maior lado no comprimento;
 * - base = maior comprimento × maior largura entre as peças;
 * - altura = volume total (com 10 % de folga) ÷ base, nunca menor que a peça mais alta;
 * - peso = soma das peças + 100 g da caixa.
 * Se a caixa passar dos limites dos Correios (lado > 100 cm, soma > 200 cm,
 * peso > 30 kg), devolve `null` e o carrinho fica só na cotação por produtos.
 */

import type { Embalagem } from "./embalagens";

export type ItemDaCaixa = { embalagem: Embalagem; quantidade: number };

export type Caixa = { comprimento: number; largura: number; altura: number; peso: number };

const FOLGA = 1.1;
const PESO_DA_CAIXA = 0.1;
const LIMITE_LADO = 100;
const LIMITE_SOMA = 200;
const LIMITE_PESO = 30;

export function unidades(itens: ItemDaCaixa[]): number {
  return itens.reduce((n, i) => n + i.quantidade, 0);
}

export function montarCaixaUnica(itens: ItemDaCaixa[]): Caixa | null {
  if (unidades(itens) < 2) return null;
  let comprimento = 0;
  let largura = 0;
  let alturaMinima = 0;
  let volume = 0;
  let peso = PESO_DA_CAIXA;
  for (const { embalagem: e, quantidade } of itens) {
    const [a, b, c] = [e.comprimento, e.largura, e.altura].sort((x, y) => y - x);
    comprimento = Math.max(comprimento, a);
    largura = Math.max(largura, b);
    alturaMinima = Math.max(alturaMinima, c);
    volume += a * b * c * quantidade;
    peso += e.peso * quantidade;
  }
  const altura = Math.max(alturaMinima, Math.ceil((volume * FOLGA) / (comprimento * largura)));
  const caixa = { comprimento, largura, altura, peso: Number(peso.toFixed(3)) };
  const lados = [caixa.comprimento, caixa.largura, caixa.altura];
  if (lados.some((l) => l > LIMITE_LADO)) return null;
  if (lados.reduce((s, l) => s + l, 0) > LIMITE_SOMA) return null;
  if (caixa.peso > LIMITE_PESO) return null;
  return caixa;
}
