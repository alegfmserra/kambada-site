/**
 * O retrato do pedido que viaja DENTRO do pagamento do Mercado Pago.
 *
 * O site não tem banco de dados — de propósito, por ora. Então, entre o
 * cliente clicar em "Pagar" e o pagamento ser aprovado, o pedido precisa
 * morar em algum lugar. Mora no próprio pagamento: vai no campo `metadata`
 * da preferência, e o Mercado Pago o devolve dentro do pagamento. Quando a
 * aprovação chega, o site lê esse retrato e cria o pedido no Bling.
 *
 * Vai como texto JSON num campo só (`metadata.pedido`), e não como objeto:
 * o Mercado Pago converte chaves de metadata para snake_case, e um objeto
 * aninhado chegaria com nome de campo diferente do que foi enviado. Texto
 * atravessa intacto.
 */

import type { DadosCliente } from "./cliente";

export const VERSAO_RETRATO = 1;

export type RetratoPedido = {
  v: typeof VERSAO_RETRATO;
  /** Referência nossa, também em `external_reference` do pagamento. */
  ref: string;
  itens: { id: number; q: number; p: number; n: string }[];
  frete: { servico: string; valor: number; prazo: number; gratis: boolean };
  cliente: DadosCliente;
};

/** "KMB-20261008-7F3A9C" — legível no extrato do Mercado Pago e no Bling. */
export function novaReferencia(agora = new Date(), aleatorio = Math.random): string {
  const data = agora.toISOString().slice(0, 10).replace(/-/g, "");
  const sufixo = Math.floor(aleatorio() * 0xffffff)
    .toString(16)
    .toUpperCase()
    .padStart(6, "0");
  return `KMB-${data}-${sufixo}`;
}

export function lerRetrato(bruto: unknown): RetratoPedido | null {
  if (typeof bruto !== "string") return null;
  try {
    const r = JSON.parse(bruto) as RetratoPedido;
    if (r?.v !== VERSAO_RETRATO || !Array.isArray(r.itens) || !r.cliente || !r.frete) return null;
    return r;
  } catch {
    return null;
  }
}
