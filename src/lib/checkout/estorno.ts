/**
 * Estorno, contestação e cancelamento de um pagamento que já virou pedido.
 *
 * Decisão de projeto: o site só REGISTRA e AVISA a loja. Cancelar o pedido no
 * Bling, devolver estoque e tratar a nota fiscal têm efeito fiscal e ficam com
 * gente (o e-mail traz o passo a passo). Idempotente: o aviso sai uma vez.
 */

import { EMAILS } from "../site";
import { CID_LOGO, emailConfigurado, emailDaLoja, enviarEmail } from "../email/enviar";
import { assuntoEstorno, htmlEstorno, textoEstorno } from "../email/posVenda";
import { atualizarRegistro, lerRegistro, type Etapa } from "../pedidos/registro";

/** Situações do Mercado Pago que desfazem uma venda já aprovada. */
export const STATUS_DE_ESTORNO = ["refunded", "charged_back", "cancelled"];

export async function registrarEstorno(ref: string, status: string): Promise<void> {
  const r = await lerRegistro(ref);
  if (!r) return;
  if (r.estorno?.status === status && r.estorno.avisoLoja?.feitoEm) return;
  // Estorno feito pelo próprio site (botão "Cancelar e estornar"): a loja já
  // sabe e o resto já foi feito — só registra, sem o e-mail de alerta.
  if (r.cancelamento?.estornoMp?.feitoEm) {
    if (r.estorno?.status !== status) {
      await atualizarRegistro(ref, { estorno: { status, detectadoEm: new Date().toISOString(), avisoLoja: { feitoEm: r.cancelamento.estornoMp.feitoEm, detalhe: "estorno feito pelo site" } } });
    }
    return;
  }

  const estorno = { status, detectadoEm: r.estorno?.status === status ? r.estorno.detectadoEm : new Date().toISOString() };
  let avisoLoja: Etapa | undefined;
  if (emailConfigurado()) {
    try {
      await enviarEmail({
        para: emailDaLoja(),
        assunto: assuntoEstorno(r, status),
        texto: textoEstorno(r, status),
        html: htmlEstorno(r, status, CID_LOGO),
        responderPara: EMAILS.contato,
      });
      avisoLoja = { feitoEm: new Date().toISOString() };
    } catch (e) {
      avisoLoja = { erro: e instanceof Error ? e.message : String(e) };
    }
  }
  await atualizarRegistro(ref, { estorno: { ...estorno, avisoLoja } });
  console.error(`[estorno] pedido ${ref}: pagamento ${status}`);
}
