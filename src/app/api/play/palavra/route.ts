import { NextResponse } from "next/server";
import { contaDaRequisicao } from "@/lib/play/contas";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";
import { registrarEventoPartida } from "@/lib/play/jogos/partidas";
import { iniciarDoDia, palpitar } from "@/lib/play/jogos/palavra";

export const dynamic = "force-dynamic";

/**
 * Palavra do dia maranhense. O servidor guarda a palavra e só devolve as cores:
 *   { acao: "iniciar" }               -> partida de hoje (tabuleiro vazio) + estado assinado
 *   { acao: "palpite", estado, palpite } -> cores do palpite (e a revelação quando a partida acaba)
 */
export async function POST(requisicao: Request) {
  if (!dentroDoLimite(ipDaRequisicao(requisicao), "palavra", 200, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, mensagem: "Calma! Tente de novo em alguns minutos." }, { status: 429 });
  }
  const corpo = await corpoJson(requisicao);
  if (!corpo) return NextResponse.json({ ok: false, mensagem: "Requisição inválida." }, { status: 400 });
  const conta = await contaDaRequisicao(requisicao);

  if (corpo.acao === "iniciar") {
    const r = iniciarDoDia();
    if (!r.ok) return NextResponse.json(r, { status: 503 });
    await registrarEventoPartida({ jogo: "palavra", tipo: "inicio", conta: conta?.id });
    return NextResponse.json(r);
  }
  if (corpo.acao === "palpite") {
    const r = palpitar(corpo.estado, corpo.palpite);
    if (!r.ok) return NextResponse.json(r, { status: 400 });
    if (r.situacao !== "jogando") await registrarEventoPartida({ jogo: "palavra", tipo: "fim", nivel: r.situacao, conta: conta?.id });
    return NextResponse.json(r);
  }
  return NextResponse.json({ ok: false, mensagem: "Ação desconhecida." }, { status: 400 });
}
