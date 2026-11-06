import { corpoJson, dentroDoLimite } from "@/lib/play/jogos/limite";
import { falha, ok, quemPede, tratar } from "@/lib/escola/api";
import { salvarRedacao, tirarAnexo } from "@/lib/escola/concursoServico";

/** Concurso de redação, lado do aluno: salvar o rascunho ou enviar ao professor. */
export async function POST(req: Request) {
  const quem = await quemPede(req);
  if (!quem || quem.papel !== "aluno") return falha("Entre com o código da turma.", 401);
  if (!dentroDoLimite(quem.aluno.id, "escola-concurso", 30, 60_000)) return falha("Calma! Espere um pouquinho.", 429);
  const corpo = await corpoJson(req);
  try {
    if (corpo?.acao === "salvar") return ok({ redacao: await salvarRedacao(quem.aluno, quem.turma, corpo.texto, corpo.enviar) });
    if (corpo?.acao === "tirar-anexo") return ok({ redacao: await tirarAnexo(quem.aluno) });
    return falha("Pedido inválido.");
  } catch (e) {
    return tratar(e);
  }
}
