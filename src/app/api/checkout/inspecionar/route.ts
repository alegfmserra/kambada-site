import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { buscarPedidoPorNumeroLoja, numeroLojaDe } from "@/lib/bling/pedidos";
import { lerRetrato } from "@/lib/checkout/pedido";
import { valorConfere } from "@/lib/checkout/processar";
import { emCentavos } from "@/lib/loja/dinheiro";
import { buscarPagamento, totalDoRetratoEmCentavos } from "@/lib/mercadopago/cliente";

export const dynamic = "force-dynamic";

/**
 * Raio-X de um pagamento — SÓ LEITURA. Não cria pedido, não grava nada.
 *
 * Responde "por que este pagamento não virou pedido no Bling?": lê o pagamento
 * no Mercado Pago, refaz cada conferência do processamento e diz em qual
 * delas ele pararia. Os dados do cliente (nome, CPF, endereço) NÃO saem aqui.
 *
 *   /api/checkout/inspecionar?token=REVALIDATE_SECRET&pagamento=ID
 */

function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(requisicao: Request) {
  const url = new URL(requisicao.url);
  if (!segredoConfere(url.searchParams.get("token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const id = url.searchParams.get("pagamento");
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ erro: "passe ?pagamento=<número da transação>" }, { status: 400 });
  }

  try {
    const p = await buscarPagamento(id);
    const bruto = p.metadata?.pedido;
    const retrato = lerRetrato(bruto);

    const conferencias = retrato
      ? {
          referenciaConfere: p.external_reference === retrato.ref,
          totalEsperado: totalDoRetratoEmCentavos(retrato) / 100,
          freteEsperado: retrato.frete.valor,
          valorConfere: valorConfere(
            totalDoRetratoEmCentavos(retrato),
            emCentavos(retrato.frete.valor),
            p.transaction_amount,
            p.shipping_amount,
          ),
        }
      : null;

    let pedidoNoBling: unknown;
    try {
      pedidoNoBling = (await buscarPedidoPorNumeroLoja(numeroLojaDe(id))) ?? "não existe";
    } catch (e) {
      pedidoNoBling = { erroAoConsultar: e instanceof Error ? e.message : String(e) };
    }

    const parada =
      p.status !== "approved"
        ? `não aprovado (${p.status})`
        : !retrato
          ? "sem retrato do pedido no metadata"
          : !conferencias?.referenciaConfere
            ? "referência divergente"
            : !conferencias.valorConfere
              ? "valor divergente"
              : "passaria em tudo — o problema estaria na gravação no Bling";

    return NextResponse.json({
      pagamento: {
        id: p.id,
        status: p.status,
        detalhe: p.status_detail,
        tipo: p.payment_type_id,
        valor: p.transaction_amount,
        frete: p.shipping_amount,
        aprovadoEm: p.date_approved,
        referencia: p.external_reference,
        taxas: p.fee_details?.reduce((s, f) => s + f.amount, 0),
      },
      metadata: {
        chaves: Object.keys(p.metadata ?? {}),
        tipoDoCampoPedido: typeof bruto,
        retratoLegivel: Boolean(retrato),
      },
      retrato: retrato
        ? { ref: retrato.ref, itens: retrato.itens, frete: retrato.frete }
        : null,
      conferencias,
      pedidoNoBling,
      parada,
    });
  } catch (e) {
    return NextResponse.json(
      { erro: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
