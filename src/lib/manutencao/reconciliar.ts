/**
 * Reconciliação Mercado Pago × pedidos do site.
 *
 * Risco nº 1 da auditoria de 10/10/2026: um pagamento aprovado podia ficar sem
 * pedido (webhook recusado, cliente fechou a aba, Bling fora) e ninguém saber.
 * Aqui, a cada rodada de manutenção, lemos os pagamentos aprovados das últimas
 * 48 h no Mercado Pago e conferimos se cada um tem registro. Os que não têm
 * passam de novo pelo processamento normal (idempotente) — na maioria das
 * vezes isso resolve sozinho. O que sobrar vira alerta para a loja.
 */

import { processarPagamento } from "../checkout/processar";
import { buscarPagamentosAprovadosRecentes } from "../mercadopago/cliente";
import { lerRegistro } from "../pedidos/registro";

export type Reconciliacao = {
  conferidos: number;
  comRegistro: number;
  recuperados: { ref: string; pagamentoId: number }[];
  pendentes: { pagamentoId: number; ref?: string; motivo: string }[];
  erro?: string;
};

export async function reconciliar(horas = 48): Promise<Reconciliacao> {
  const r: Reconciliacao = { conferidos: 0, comRegistro: 0, recuperados: [], pendentes: [] };
  let pagamentos;
  try {
    pagamentos = await buscarPagamentosAprovadosRecentes(horas);
  } catch (e) {
    r.erro = `não consegui consultar o Mercado Pago: ${e instanceof Error ? e.message : String(e)}`;
    return r;
  }

  for (const p of pagamentos) {
    const ref = p.external_reference;
    // Só pagamentos do site têm referência KMB-; o resto (maquininha, link) não é daqui.
    if (!ref || !/^KMB-\d{8}-[0-9A-F]{6}$/.test(ref)) continue;
    r.conferidos++;
    if (await lerRegistro(ref)) {
      r.comRegistro++;
      continue;
    }
    try {
      const resultado = await processarPagamento(String(p.id));
      if (resultado.ok) r.recuperados.push({ ref, pagamentoId: p.id });
      else r.pendentes.push({ pagamentoId: p.id, ref, motivo: resultado.motivo });
    } catch (e) {
      r.pendentes.push({ pagamentoId: p.id, ref, motivo: e instanceof Error ? e.message.slice(0, 160) : String(e) });
    }
  }
  return r;
}
