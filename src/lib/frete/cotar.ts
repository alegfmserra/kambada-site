/**
 * Cotação do carrinho inteiro, já com a regra de frete grátis aplicada.
 *
 * Usada em dois momentos: para MOSTRAR as opções ao cliente, e de novo no
 * servidor na hora de COBRAR. O valor de frete que vem do navegador é sempre
 * descartado — o checkout recota e usa o próprio número.
 */

import type { ItemValidado } from "../carrinho/validar";
import { emReais } from "../loja/dinheiro";
import { cotarFrete, type OpcaoFrete } from "./melhorEnvio";
import { temFreteGratis } from "./regras";

export type OpcaoFreteDaLoja = OpcaoFrete & {
  /** O que o cliente paga — zero na opção beneficiada pelo frete grátis. */
  precoCobrado: number;
  gratis: boolean;
};

/** Até quantas opções mostrar. Mais que isso confunde e não ajuda a decidir. */
const MAXIMO_DE_OPCOES = 5;

export function aplicarRegraDaLoja(
  opcoes: OpcaoFrete[],
  subtotalCentavos: number,
): OpcaoFreteDaLoja[] {
  const gratis = temFreteGratis(emReais(subtotalCentavos));
  // `opcoes` já vem ordenado do mais barato para o mais caro.
  return opcoes.slice(0, MAXIMO_DE_OPCOES).map((o, i) => ({
    ...o,
    gratis: gratis && i === 0,
    precoCobrado: gratis && i === 0 ? 0 : o.preco,
  }));
}

type EntradaCache = { quando: number; opcoes: OpcaoFrete[] };
const cache = new Map<string, EntradaCache>();
const VALIDADE_MS = 10 * 60 * 1000;

/**
 * Cache de 10 minutos por CEP + carrinho. O cliente que muda de opção ou volta
 * ao carrinho não refaz a chamada — e a cotação mostrada é a mesma cobrada.
 */
export async function cotarCarrinho(
  cep: string,
  itens: ItemValidado[],
  subtotalCentavos: number,
): Promise<OpcaoFreteDaLoja[]> {
  const chave = `${cep}|${itens
    .map((i) => `${i.idBling}x${i.quantidade}`)
    .sort()
    .join(",")}`;

  const guardada = cache.get(chave);
  let opcoes: OpcaoFrete[];
  if (guardada && Date.now() - guardada.quando < VALIDADE_MS) {
    opcoes = guardada.opcoes;
  } else {
    opcoes = await cotarFrete(
      cep,
      itens.map((i) => ({
        id: String(i.idBling),
        embalagem: i.embalagem,
        valorUnitario: i.precoUnitario,
        quantidade: i.quantidade,
      })),
    );
    cache.set(chave, { quando: Date.now(), opcoes });
    if (cache.size > 500) cache.delete(cache.keys().next().value as string);
  }

  return aplicarRegraDaLoja(opcoes, subtotalCentavos);
}
