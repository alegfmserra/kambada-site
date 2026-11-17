/**
 * Como uma opção de entrega aparece na tela: no checkout, no carrinho e na
 * página da peça. Um lugar só, para as três telas dizerem a mesma coisa.
 * Nenhuma regra de frete mora aqui: preço, prazo e gratuidade vêm prontos do
 * servidor (/api/frete).
 *
 * Arquivo público (vai ao navegador): nada de módulo de servidor aqui.
 */

import { formatarReais } from "../loja/dinheiro";
import { POSTAGEM_DIAS_UTEIS } from "../loja/prazos";
import { explicacaoLocal } from "./entregaLocal";
import { RETIRADA } from "./retirada";

export type OpcaoFreteNaTela = {
  id: number;
  /** Nome pronto para exibir, montado no servidor. */
  nome: string;
  servico: string;
  transportadora: string;
  preco: number;
  precoOriginal: number;
  prazoDias: number;
  gratis: boolean;
  /** Retirada no ateliê: sem transporte, sem custo. */
  retirada?: boolean;
  /** Entrega por aplicativo na Grande São Luís: corrida combinada no WhatsApp. */
  local?: boolean;
};

/** A linha de baixo de cada opção: prazo da transportadora, ou a explicação da retirada e da corrida. */
export function detalheDaEntrega(o: OpcaoFreteNaTela): string {
  if (o.retirada) return RETIRADA.explicacao;
  if (o.local) return explicacaoLocal(o.gratis);
  return `até ${o.prazoDias} ${o.prazoDias === 1 ? "dia útil" : "dias úteis"} após a postagem · postamos em até ${POSTAGEM_DIAS_UTEIS} dias úteis`;
}

/** O preço como se lê: "Grátis", "A combinar" (corrida de app paga à parte) ou o valor. */
export function precoDaEntrega(o: OpcaoFreteNaTela): { texto: string; gratis: boolean; riscado?: string } {
  if (o.retirada) return { texto: "Grátis", gratis: true };
  if (o.local && !o.gratis) return { texto: "A combinar", gratis: false };
  if (o.gratis) return { texto: "Grátis", gratis: true, ...(o.precoOriginal > 0 ? { riscado: formatarReais(o.precoOriginal) } : {}) };
  return { texto: formatarReais(o.preco), gratis: false };
}

/** A entrega mais em conta para resumir ("a partir de…"): a primeira que não é retirada. */
export function entregaMaisEmConta(opcoes: OpcaoFreteNaTela[]): OpcaoFreteNaTela | null {
  return opcoes.find((o) => !o.retirada && !o.local) ?? opcoes.find((o) => !o.retirada) ?? null;
}

/** Mensagem para quem lê, a partir da resposta de erro do servidor. */
export function mensagemDeErroDoFrete(status: number, erro?: string): string {
  if (status === 422 && /cep/i.test(erro ?? "")) return "Não achamos esse CEP. Confira os 8 números.";
  if (status === 409) return "Alguma peça mudou de preço ou de estoque. Atualize a página e calcule de novo.";
  if (status === 429) return erro ?? "Muitas cotações seguidas. Espere alguns minutos e tente de novo.";
  if (status === 503) return erro ?? "A cotação de frete está fora do ar. Fale com a gente no WhatsApp.";
  if (status >= 500) return "Não conseguimos calcular o frete agora. Tente de novo em instantes ou fale no WhatsApp.";
  return erro ?? "Não conseguimos calcular o frete.";
}
