import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { processarPagamento } from "@/lib/checkout/processar";

export const dynamic = "force-dynamic";

/**
 * Reprocessa UM pagamento à mão — ferramenta de conserto, protegida pela
 * senha de administração (REVALIDATE_SECRET).
 *
 * Para quando um pagamento aprovado não virou pedido (aviso do Mercado Pago
 * recusado e cliente que fechou a aba antes de voltar ao site). Faz
 * exatamente o que a página de sucesso faz: relê o pagamento na API, confere
 * aprovação, referência e valor, e cria o pedido no Bling se ele ainda não
 * existir. Rodar duas vezes não duplica nada.
 *
 *   POST /api/checkout/processar?token=SENHA&pagamento=ID
 *
 * Use antes o raio-X (GET /api/checkout/inspecionar) para ver o que aconteceria.
 */

function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(requisicao: Request) {
  const url = new URL(requisicao.url);
  if (!segredoConfere(url.searchParams.get("token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const id = url.searchParams.get("pagamento");
  if (!id || !/^\d+$/.test(id)) {
    return NextResponse.json({ erro: "passe ?pagamento=<número da transação>" }, { status: 400 });
  }
  try {
    return NextResponse.json(await processarPagamento(id));
  } catch (e) {
    return NextResponse.json({ erro: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
