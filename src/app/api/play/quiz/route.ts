import { NextResponse } from "next/server";
import { sessaoDaRequisicao } from "@/lib/play/acesso";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";
import { iniciarPartida, nivelDaPartida, responder } from "@/lib/play/jogos/quiz";

export const dynamic = "force-dynamic";

/**
 * Éguas! Quem é quem? — o servidor entrega uma pergunta por vez e só revela a
 * resposta certa depois de a pessoa responder. Duas ações:
 *   { acao: "iniciar", nivel }               -> 1ª pergunta + estado assinado (nivel: facil|medio|dificil)
 *   { acao: "responder", estado, escolha }   -> certa ou errada, explicação e
 *                                               a próxima (ou a prova final)
 *
 * Sem login (degustação em /kambadaplay/experimente): só o nível fácil, e sem a
 * prova final — quem quer entrar no ranking precisa criar a conta.
 */
export async function POST(requisicao: Request) {
  if (!dentroDoLimite(ipDaRequisicao(requisicao), "quiz", 120, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, mensagem: "Calma! Tente de novo em alguns minutos." }, { status: 429 });
  }
  const corpo = await corpoJson(requisicao);
  if (!corpo) return NextResponse.json({ ok: false, mensagem: "Requisição inválida." }, { status: 400 });
  const visitante = !sessaoDaRequisicao(requisicao);

  if (corpo.acao === "iniciar") {
    return NextResponse.json({ ok: true, ...iniciarPartida(visitante ? "facil" : corpo.nivel) });
  }
  if (corpo.acao === "responder") {
    if (visitante && nivelDaPartida(corpo.estado) !== "facil") {
      return NextResponse.json({ ok: false, mensagem: "Crie sua conta grátis para jogar este nível." }, { status: 401 });
    }
    const r = responder(corpo.estado, corpo.escolha);
    if ("erro" in r) return NextResponse.json({ ok: false, mensagem: r.erro }, { status: 400 });
    if (visitante && "prova" in r) {
      const { prova: _semRanking, ...semProva } = r;
      void _semRanking;
      return NextResponse.json({ ok: true, ...semProva });
    }
    return NextResponse.json({ ok: true, ...r });
  }
  return NextResponse.json({ ok: false, mensagem: "Ação desconhecida." }, { status: 400 });
}
