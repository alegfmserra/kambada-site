import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { contasParaCsv, listarContas, publica } from "@/lib/play/contas";

export const dynamic = "force-dynamic";

/**
 * Base de contas do Kambada Play, para a equipe de marketing.
 * Protegida por REVALIDATE_SECRET (o mesmo das rotas de diagnóstico).
 *
 *   /api/play/contas?token=…            → JSON (sem senhas)
 *   /api/play/contas?token=…&formato=csv → CSV para planilha (só quem aceitou novidades: &so=novidades)
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
  let contas = await listarContas();
  if (url.searchParams.get("so") === "novidades") contas = contas.filter((c) => c.novidades && c.confirmadoEm);
  if (url.searchParams.get("formato") === "csv") {
    return new NextResponse(contasParaCsv(contas), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="kambada-play-contas-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }
  return NextResponse.json({
    total: contas.length,
    confirmadas: contas.filter((c) => c.confirmadoEm).length,
    aceitamNovidades: contas.filter((c) => c.novidades && c.confirmadoEm).length,
    contas: contas.map(publica),
  });
}
