import { createHash, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { rotinaDeManutencao } from "@/lib/manutencao/saude";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Manutenção sob demanda — chamada pelo cron externo (GitHub Actions, a cada
 * 6 h) além do timer interno. Protegida por MANUTENCAO_SECRET (ou, na falta,
 * REVALIDATE_SECRET) em `Authorization: Bearer <segredo>`.
 */
function autorizado(req: Request): boolean {
  const segredo = process.env.MANUTENCAO_SECRET || process.env.REVALIDATE_SECRET;
  if (!segredo) return false;
  const recebido = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!recebido) return false;
  const h = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(h(recebido), h(segredo));
}

export async function GET(req: Request) {
  if (!autorizado(req)) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  const r = await rotinaDeManutencao();
  return NextResponse.json(r, { status: r.ok ? 200 : 503 });
}

export const POST = GET;
