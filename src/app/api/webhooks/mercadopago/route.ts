import { NextResponse } from "next/server";
import { processarPagamento } from "@/lib/checkout/processar";
import { assinaturaValida } from "@/lib/mercadopago/assinatura";
import { mercadoPagoConfigurado } from "@/lib/mercadopago/cliente";

export const dynamic = "force-dynamic";

/**
 * Notificações do Mercado Pago.
 *
 * Respostas, e por quê:
 * - 200: processado, já existia, ou não é caso de pedido (pagamento ainda não
 *   aprovado, notificação de outro tipo). Reenviar não mudaria nada.
 * - 401: assinatura presente e inválida.
 * - 500: falha transitória (Bling fora, limite estourado). O Mercado Pago
 *   reenvia — e é exatamente o que queremos: a fila de reenvio dele é a nossa.
 *
 * A notificação só diz "olhe o pagamento X". O que vale é o pagamento lido na
 * API com o nosso token (ver `processarPagamento`).
 */

export async function GET() {
  return NextResponse.json({
    ok: true,
    configurado: mercadoPagoConfigurado(),
    assinaturaConfigurada: Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET),
  });
}

export async function POST(requisicao: Request) {
  const url = new URL(requisicao.url);

  let corpo: { type?: string; action?: string; data?: { id?: string | number } } = {};
  try {
    corpo = (await requisicao.json()) as typeof corpo;
  } catch {
    // Corpo ilegível: segue com a query string, que também traz o ID.
  }

  const tipo = corpo.type ?? url.searchParams.get("type") ?? url.searchParams.get("topic");
  const dataId =
    url.searchParams.get("data.id") ?? (corpo.data?.id !== undefined ? String(corpo.data.id) : null);

  if (tipo !== "payment" || !dataId) {
    return NextResponse.json({ ok: true, ignorado: true });
  }

  const segredo = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  const cabecalho = requisicao.headers.get("x-signature");
  if (segredo && cabecalho) {
    const valida = assinaturaValida({
      cabecalho,
      requestId: requisicao.headers.get("x-request-id"),
      dataId,
      segredo,
    });
    if (!valida) {
      console.error("[mercadopago] assinatura inválida para o pagamento", dataId);
      return NextResponse.json({ erro: "assinatura inválida" }, { status: 401 });
    }
  }

  try {
    const r = await processarPagamento(dataId);
    if (r.ok) {
      console.log(`[mercadopago] pagamento ${dataId}: pedido ${r.situacao} no Bling (${r.idPedido}), ${r.ref}`);
      return NextResponse.json({ ok: true, situacao: r.situacao });
    }
    if (r.motivo !== "nao_aprovado") {
      // Precisa de olho humano: reenviar não conserta. Sem dado pessoal no log.
      console.error(`[mercadopago] pagamento ${dataId} NÃO virou pedido: ${r.motivo} (${r.ref ?? "sem ref"})`);
    }
    return NextResponse.json({ ok: true, situacao: r.motivo });
  } catch (erro) {
    console.error(
      `[mercadopago] falha ao processar ${dataId}; o Mercado Pago vai reenviar:`,
      erro instanceof Error ? erro.message : erro,
    );
    return NextResponse.json({ erro: "falha temporária" }, { status: 500 });
  }
}
