import { dentroDoLimite } from "@/lib/play/jogos/limite";
import { falha, membroQuePede, ok, tratar } from "@/lib/escola/api";
import { LIMITE_BYTES } from "@/lib/escola/arquivos";
import { anexarCorrecao, anexarRedacaoDoAluno } from "@/lib/escola/concursoServico";

/**
 * Envio de arquivo (formulário multipart), só da equipe da escola:
 * `acao=redacao` + `aluno` → a folha que o aluno escreveu à mão;
 * `acao=correcao` + `redacao` → a correção do professor.
 * Aluno não envia arquivo (regra do Play: sem upload na área infantil).
 * O tipo é conferido pelos bytes em lib/escola/arquivos.ts.
 */
export async function POST(req: Request) {
  const m = await membroQuePede(req);
  if (!m) return falha("Só o professor anexa arquivos.", 403);
  if (!dentroDoLimite(m.id, "escola-arquivo", 60, 60_000)) return falha("Calma! Espere um pouquinho.", 429);
  if (Number(req.headers.get("content-length") ?? 0) > LIMITE_BYTES + 64 * 1024) return falha("O arquivo passa de 5 MB. Diminua a foto ou o PDF e tente de novo.", 413);
  try {
    const form = await req.formData();
    const arquivo = form.get("arquivo");
    if (!(arquivo instanceof File)) return falha("Escolha um arquivo.");
    const bytes = new Uint8Array(await arquivo.arrayBuffer());
    if (form.get("acao") === "redacao") await anexarRedacaoDoAluno(m, form.get("aluno"), bytes, arquivo.name);
    else if (form.get("acao") === "correcao") await anexarCorrecao(m, form.get("redacao"), bytes, arquivo.name);
    else return falha("Pedido inválido.");
    return ok();
  } catch (e) {
    return tratar(e);
  }
}
