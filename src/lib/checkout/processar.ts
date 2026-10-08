/**
 * Transforma um pagamento aprovado em pedido no Bling.
 *
 * Duas portas chamam isto, de propósito:
 *  1. a notificação (webhook) do Mercado Pago;
 *  2. a página de sucesso, quando o cliente volta do pagamento.
 *
 * Se a notificação estiver mal configurada, a página de sucesso cria o pedido.
 * Se o cliente fechar a aba antes de voltar, a notificação cria. A idempotência
 * do `registrarPedidoNoBling` garante que as duas juntas não dupliquem nada.
 *
 * A fonte da verdade é SEMPRE o pagamento lido na API do Mercado Pago com o
 * nosso token — nunca o corpo de uma notificação nem a query string da volta.
 */

import { registrarPedidoNoBling } from "../bling/pedidos";
import { emCentavos } from "../loja/dinheiro";
import { buscarPagamento, totalDoRetratoEmCentavos } from "../mercadopago/cliente";
import { lerRegistro } from "../pedidos/registro";
import { lerRetrato } from "./pedido";
import { executarPosVenda } from "./posVenda";

export type ResultadoProcessamento =
  | {
      ok: true;
      situacao: "criado" | "ja_existia";
      idPedido: number;
      ref: string;
      /** Retirada no ateliê: a página de sucesso mostra o endereço. */
      retirada: boolean;
    }
  | { ok: false; motivo: "nao_aprovado"; status: string; ref?: string }
  | { ok: false; motivo: "sem_retrato" | "referencia_divergente" | "valor_divergente"; ref?: string };

/**
 * O valor pago bate com o pedido? Aceita duas leituras do campo, porque a
 * documentação não é inequívoca sobre o frete entrar ou não em
 * `transaction_amount`: (itens + frete) ou (itens, com o frete à parte em
 * `shipping_amount`). Qualquer outra diferença acima de 1 centavo barra o
 * pedido — e fica para conferência humana.
 */
export function valorConfere(
  totalCentavos: number,
  freteCentavos: number,
  transactionAmount?: number,
  shippingAmount?: number,
): boolean {
  if (typeof transactionAmount !== "number") return false;
  const pago = emCentavos(transactionAmount);
  if (Math.abs(pago - totalCentavos) <= 1) return true;
  const freteSeparado = typeof shippingAmount === "number" ? emCentavos(shippingAmount) : null;
  return (
    freteSeparado !== null &&
    Math.abs(freteSeparado - freteCentavos) <= 1 &&
    Math.abs(pago - (totalCentavos - freteCentavos)) <= 1
  );
}

export async function processarPagamento(idPagamento: string): Promise<ResultadoProcessamento> {
  const pagamento = await buscarPagamento(idPagamento);
  const retrato = lerRetrato(pagamento.metadata?.pedido);

  if (pagamento.status !== "approved") {
    return { ok: false, motivo: "nao_aprovado", status: pagamento.status, ref: retrato?.ref };
  }
  if (!retrato) return { ok: false, motivo: "sem_retrato" };
  if (pagamento.external_reference !== retrato.ref) {
    return { ok: false, motivo: "referencia_divergente", ref: retrato.ref };
  }
  if (
    !valorConfere(
      totalDoRetratoEmCentavos(retrato),
      emCentavos(retrato.frete.valor),
      pagamento.transaction_amount,
      pagamento.shipping_amount,
    )
  ) {
    return { ok: false, motivo: "valor_divergente", ref: retrato.ref };
  }

  const r = await registrarPedidoNoBling(retrato, pagamento);

  // Pós-venda (registro, estoque, nota, e-mail). Roda para pedido recém-criado
  // ou já registrado (retoma etapa que falhou). Pedido antigo sem registro —
  // anterior a esta função, como os testes cancelados de 08/10 — fica de fora:
  // um aviso reenviado não pode baixar estoque nem mandar e-mail por eles.
  try {
    if (r.situacao === "criado" || (await lerRegistro(retrato.ref))) {
      await executarPosVenda(retrato, pagamento, r.idPedido);
    }
  } catch (e) {
    // O pedido já existe no Bling; falha aqui não pode virar "pagamento perdido".
    console.error(`[pos-venda] ${retrato.ref}:`, e instanceof Error ? e.message : e);
  }

  return { ok: true, ...r, ref: retrato.ref, retirada: retrato.frete.retirada === true };
}
