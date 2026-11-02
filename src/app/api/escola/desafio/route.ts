import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";
import { falha, ok, quemPede, tratar } from "@/lib/escola/api";
import { iniciarPartida, responder } from "@/lib/escola/servico";

/** Desafios do aluno: iniciar (ou retomar) uma trilha e responder. Só aluno logado. */
export async function POST(req: Request) {
  const quem = await quemPede(req);
  if (!quem || quem.papel !== "aluno") return falha("Entre com o código da turma para jogar.", 401);
  if (!dentroDoLimite(quem.aluno.id, "escola-desafio", 120, 60_000) || !dentroDoLimite(ipDaRequisicao(req), "escola-desafio-ip", 2000, 60_000)) {
    return falha("Calma! Espere um pouquinho.", 429);
  }
  const corpo = await corpoJson(req);
  try {
    if (corpo?.acao === "iniciar") return ok({ estado: await iniciarPartida(quem.aluno, quem.turma, corpo.trilha) });
    if (corpo?.acao === "responder") return ok({ resposta: await responder(quem.aluno, corpo.partida, corpo.escolha, corpo.origem) });
    return falha("Pedido inválido.");
  } catch (e) {
    return tratar(e);
  }
}
