import { NextResponse } from "next/server";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";
import { finalizarMemoria, iniciarMemoria } from "@/lib/play/jogos/memoria";

export const dynamic = "force-dynamic";

/**
 * Memória das estampas.
 *   { acao: "iniciar", nivel }              -> token da largada (horário + nível assinados)
 *   { acao: "finalizar", token, jogadas }   -> pontos calculados aqui + prova assinada
 */
export async function POST(requisicao: Request) {
  if (!dentroDoLimite(ipDaRequisicao(requisicao), "memoria", 60, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, mensagem: "Calma! Tente de novo em alguns minutos." }, { status: 429 });
  }
  const corpo = await corpoJson(requisicao);
  if (!corpo) return NextResponse.json({ ok: false, mensagem: "Requisição inválida." }, { status: 400 });

  if (corpo.acao === "iniciar") {
    return NextResponse.json({ ok: true, ...iniciarMemoria(corpo.nivel) });
  }
  if (corpo.acao === "finalizar") {
    const r = finalizarMemoria(corpo.token, corpo.jogadas);
    if ("erro" in r) return NextResponse.json({ ok: false, mensagem: r.erro }, { status: 400 });
    return NextResponse.json({ ok: true, ...r });
  }
  return NextResponse.json({ ok: false, mensagem: "Ação desconhecida." }, { status: 400 });
}
