import { NextResponse } from "next/server";
import { verificarSaude } from "@/lib/manutencao/saude";

export const dynamic = "force-dynamic";

/**
 * Para um monitor externo (UptimeRobot, BetterStack…): 200 quando Bling,
 * Melhor Envio, Mercado Pago e e-mail respondem; 503 quando algum falha.
 * Sem detalhes — eles ficam em /api/manutencao, que exige segredo.
 */
export async function GET() {
  const s = await verificarSaude();
  return NextResponse.json(
    { ok: s.ok, bling: s.bling.ok, melhorEnvio: s.melhorEnvio.ok, mercadoPago: s.mercadoPago.ok, email: s.email.ok },
    { status: s.ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
