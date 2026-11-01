import { falha, membroQuePede, tratar } from "@/lib/escola/api";
import { planilhaEscola, planilhaTurma } from "@/lib/escola/exportar";

/**
 * Baixar planilha (.xlsx): `?turma=<id>` (relatório da turma) ou `?escola=1`
 * (coordenação e gestão). As permissões são as mesmas das telas.
 */
export async function GET(req: Request) {
  const m = await membroQuePede(req);
  if (!m) return falha("Entre como professor ou coordenação.", 401);
  const url = new URL(req.url);
  try {
    const turma = url.searchParams.get("turma");
    const { nome, arquivo } = turma ? await planilhaTurma(m, turma) : await planilhaEscola(m);
    const hoje = new Date().toISOString().slice(0, 10);
    const ascii = `${nome}_${hoje}`.normalize("NFD").replace(/[^\w.-]+/g, "-");
    return new Response(new Uint8Array(arquivo), {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${ascii}.xlsx"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (e) {
    return tratar(e);
  }
}
