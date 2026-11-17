import { NextResponse } from "next/server";
import { contaDaRequisicao } from "@/lib/play/contas";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";
import { registrarEventoPartida } from "@/lib/play/jogos/partidas";
import { finalizarQuebra, iniciarQuebra } from "@/lib/play/jogos/quebra";

export const dynamic = "force-dynamic";

/**
 * Quebra-cabeça das estampas.
 *   { acao: "iniciar", nivel }              -> largada assinada (horário, nível e o tabuleiro
 *                                              embaralhado aqui) + a ordem das peças
 *   { acao: "finalizar", token, trocas }    -> `trocas` é a LISTA de trocas feitas, [[a, b], ...]
 *                                              (posições); o servidor as refaz, conta e pontua
 */
export async function POST(requisicao: Request) {
  if (!dentroDoLimite(ipDaRequisicao(requisicao), "quebra", 60, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, mensagem: "Calma! Tente de novo em alguns minutos." }, { status: 429 });
  }
  const corpo = await corpoJson(requisicao);
  if (!corpo) return NextResponse.json({ ok: false, mensagem: "Requisição inválida." }, { status: 400 });
  const conta = await contaDaRequisicao(requisicao).catch(() => null);

  if (corpo.acao === "iniciar") {
    const r = iniciarQuebra(corpo.nivel, Date.now(), conta?.id ?? null);
    await registrarEventoPartida({ jogo: "quebra", tipo: "inicio", nivel: r.nivel, conta: conta?.id });
    return NextResponse.json({ ok: true, ...r });
  }
  if (corpo.acao === "finalizar") {
    const r = finalizarQuebra(corpo.token, corpo.trocas);
    if ("erro" in r) return NextResponse.json({ ok: false, mensagem: r.erro }, { status: 400 });
    await registrarEventoPartida({ jogo: "quebra", tipo: "fim", nivel: r.nivel, conta: conta?.id });
    return NextResponse.json({ ok: true, ...r });
  }
  return NextResponse.json({ ok: false, mensagem: "Ação desconhecida." }, { status: 400 });
}
