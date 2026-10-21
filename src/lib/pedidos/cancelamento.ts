/**
 * Quando um pedido do site pode ser cancelado — regras do Alexandre (21/10/2026,
 * revistas à tarde).
 *
 *  - Já postado, entregue ou retirado: não se cancela; vira devolução
 *    (arrependimento em 7 dias, pela página de atendimento).
 *  - Produção iniciada (encomenda, personalizada ou não): NÃO se cancela — o
 *    cliente é avisado por e-mail quando a produção começa.
 *  - Personalizada cancelada ANTES da produção: a loja retém o valor do
 *    desenvolvimento da arte (campo "reter" no cancelamento da área de controle).
 *  - O resto (pago, ainda em separação): pode.
 *
 * Nota fiscal: até 24 h da emissão dá para cancelar no Bling; depois disso,
 * nota de devolução — CFOP e procedimento com o Glauco.
 *
 * Funções puras: a mesma regra decide o botão do cliente e o da loja.
 */

import type { RegistroPedido } from "./registro";

export const PRAZO_CANCELAR_NOTA_MS = 24 * 60 * 60 * 1000;

export type Avaliacao = { pode: true } | { pode: false; motivo: string };

export function avaliarCancelamento(r: RegistroPedido, agora = Date.now()): Avaliacao {
  if (r.cancelamento?.concluidoEm || r.estorno) {
    return { pode: false, motivo: "Este pedido já foi cancelado e o pagamento devolvido." };
  }
  if (r.conclusao) {
    return {
      pode: false,
      motivo:
        r.conclusao.tipo === "retirado"
          ? "O pedido já foi retirado. Para desistir, use a devolução (até 7 dias depois de receber)."
          : "O pedido já foi entregue. Para desistir, use a devolução (até 7 dias depois de receber).",
    };
  }
  if (r.envio) {
    return {
      pode: false,
      motivo: "O pedido já foi postado. Quando chegar, se quiser desistir, use a devolução (até 7 dias depois de receber).",
    };
  }
  if (r.producao) {
    return { pode: false, motivo: "A produção da peça já começou — a partir daí o pedido não pode ser cancelado." };
  }
  return { pode: true };
}

/** O que fazer com a nota no cancelamento. */
export function acaoDaNota(r: RegistroPedido, agora = Date.now()): "sem-nota" | "cancelar-no-bling" | "devolucao-com-glauco" {
  if (!r.nfe?.idNota) return "sem-nota";
  const emitida = Date.parse(r.nfe.feitoEm ?? r.criadoEm);
  return agora - emitida <= PRAZO_CANCELAR_NOTA_MS ? "cancelar-no-bling" : "devolucao-com-glauco";
}

/** Etapa do pedido em palavras do cliente (conta, página do pedido). */
export function etapaDoPedido(r: RegistroPedido): string {
  const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Fortaleza" });
  if (r.cancelamento?.concluidoEm) return `Cancelado em ${dia(r.cancelamento.concluidoEm)} · pagamento devolvido`;
  if (r.estorno) return "Pagamento devolvido ou cancelado";
  if (r.cancelamento?.solicitadoEm) return "Cancelamento solicitado · em análise";
  if (r.conclusao) return `${r.conclusao.tipo === "retirado" ? "Retirado" : "Entregue"} em ${dia(r.conclusao.em)}`;
  if (r.envio) return `Postado em ${dia(r.envio.postadoEm)}`;
  if (r.producao) return `Em produção desde ${dia(r.producao.iniciadaEm)}`;
  if (r.entrega.retirada) return "Pago · retirada no ateliê";
  return "Pago · em preparação";
}
