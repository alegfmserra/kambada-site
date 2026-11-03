import { corpoJson, dentroDoLimite } from "@/lib/play/jogos/limite";
import { falha, ok, quemPede, tratar } from "@/lib/escola/api";
import { registrarCultura } from "@/lib/escola/servico";

/** Área de cultura do aluno: avisa que terminou um jogo, uma HQ ou uma animação. Só aluno logado. */
export async function POST(req: Request) {
  const quem = await quemPede(req);
  if (!quem || quem.papel !== "aluno") return falha("Entre com o código da turma.", 401);
  if (!dentroDoLimite(quem.aluno.id, "escola-cultura", 60, 60_000)) return falha("Calma! Espere um pouquinho.", 429);
  const corpo = await corpoJson(req);
  try {
    if (corpo?.acao === "feito") {
      await registrarCultura(quem.aluno, corpo.atividade, corpo.acertos, corpo.total);
      return ok({});
    }
    return falha("Pedido inválido.");
  } catch (e) {
    return tratar(e);
  }
}
