import { NextResponse } from "next/server";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";
import { iniciarPartida, responder } from "@/lib/play/jogos/quiz";

export const dynamic = "force-dynamic";

/**
 * Éguas! Quem é quem? — o servidor entrega uma pergunta por vez e só revela a
 * resposta certa depois de a pessoa responder. Duas ações:
 *   { acao: "iniciar" }                      -> 1ª pergunta + estado assinado
 *   { acao: "responder", estado, escolha }   -> certa ou errada, explicação e
 *                                               a próxima (ou a prova final)
 */
export async function POST(requisicao: Request) {
  if (!dentroDoLimite(ipDaRequisicao(requisicao), "quiz", 120, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, mensagem: "Calma! Tente de novo em alguns minutos." }, { status: 429 });
  }
  const corpo = await corpoJson(requisicao);
  if (!corpo) return NextResponse.json({ ok: false, mensagem: "Requisição inválida." }, { status: 400 });

  if (corpo.acao === "iniciar") {
    return NextResponse.json({ ok: true, ...iniciarPartida() });
  }
  if (corpo.acao === "responder") {
    const r = responder(corpo.estado, corpo.escolha);
    if ("erro" in r) return NextResponse.json({ ok: false, mensagem: r.erro }, { status: 400 });
    return NextResponse.json({ ok: true, ...r });
  }
  return NextResponse.json({ ok: false, mensagem: "Ação desconhecida." }, { status: 400 });
}
