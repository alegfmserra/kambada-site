import { dentroDoLimite } from "@/lib/play/jogos/limite";
import { falha, ok, quemPede, tratar } from "@/lib/escola/api";
import { LIMITE_BYTES } from "@/lib/escola/arquivos";
import { anexarCorrecao, anexarRedacao } from "@/lib/escola/concursoServico";

/**
 * Envio de arquivo (formulário multipart): o aluno anexa a redação (PDF ou
 * foto da escrita à mão); o professor anexa a correção (campo `redacao`).
 * O tipo é conferido pelos bytes em lib/escola/arquivos.ts.
 */
export async function POST(req: Request) {
  const quem = await quemPede(req);
  if (!quem) return falha("Entre no portal.", 401);
  const chave = quem.papel === "aluno" ? quem.aluno.id : quem.membro.id;
  if (!dentroDoLimite(chave, "escola-arquivo", 20, 60_000)) return falha("Calma! Espere um pouquinho.", 429);
  if (Number(req.headers.get("content-length") ?? 0) > LIMITE_BYTES + 64 * 1024) return falha("O arquivo passa de 5 MB. Diminua a foto ou o PDF e tente de novo.", 413);
  try {
    const form = await req.formData();
    const arquivo = form.get("arquivo");
    if (!(arquivo instanceof File)) return falha("Escolha um arquivo.");
    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    if (quem.papel === "aluno") return ok({ redacao: await anexarRedacao(quem.aluno, bytes, arquivo.name) });
    await anexarCorrecao(quem.membro, form.get("redacao"), bytes, arquivo.name);
    return ok();
  } catch (e) {
    return tratar(e);
  }
}
