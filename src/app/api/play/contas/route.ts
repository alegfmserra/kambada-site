import { NextResponse } from "next/server";
import { contasParaCsv, estadoDoArmazenamento, listarContas, publica } from "@/lib/play/contas";
import { segredoDaExportacao } from "@/lib/seguranca/segredo";

export const dynamic = "force-dynamic";

/**
 * Base de contas do Kambada Play, para a equipe de marketing.
 * Senha própria: EXPORTACAO_SECRET (enquanto não existir, vale REVALIDATE_SECRET).
 *
 *   curl -H "Authorization: Bearer SENHA" /api/play/contas                → JSON (sem senhas)
 *   … /api/play/contas?formato=csv                                         → CSV (só quem aceitou novidades: &so=novidades)
 */
export async function GET(requisicao: Request) {
  const url = new URL(requisicao.url);
  if (!segredoDaExportacao(requisicao)) {
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
  const armazenamento = await estadoDoArmazenamento();
  return NextResponse.json({
    // "persistente: false" em produção = alerta: as contas estão caindo na pasta temporária.
    armazenamento: { persistente: armazenamento.persistente, gravavel: armazenamento.gravavel, existe: armazenamento.existe, pasta: armazenamento.arquivo.replace(/[\\/][^\\/]+$/, "") },
    total: contas.length,
    confirmadas: contas.filter((c) => c.confirmadoEm).length,
    aceitamNovidades: contas.filter((c) => c.novidades && c.confirmadoEm).length,
    contas: contas.map(publica),
  });
}
