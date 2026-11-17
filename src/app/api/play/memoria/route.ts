import { NextResponse } from "next/server";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";
import { contaDaRequisicao } from "@/lib/play/contas";
import { iniciarMemoria, virarCarta } from "@/lib/play/jogos/memoria";
import { registrarEventoPartida } from "@/lib/play/jogos/partidas";

export const dynamic = "force-dynamic";

const DEZ_MINUTOS = 10 * 60 * 1000;

/**
 * Memória das estampas (protocolo de 17/11/2026: a mesa fica no servidor).
 *   { acao: "iniciar", nivel }        -> estado cifrado da partida + número de pares
 *   { acao: "virar", estado, pos }    -> qual carta está na posição, se fez par, o
 *                                        estado seguinte e, no último par, os
 *                                        pontos e a prova assinada
 * O navegador nunca recebe a posição das cartas que ainda não virou.
 */
export async function POST(requisicao: Request) {
  const ip = ipDaRequisicao(requisicao);
  const corpo = await corpoJson(requisicao);
  if (!corpo) return NextResponse.json({ ok: false, mensagem: "Requisição inválida." }, { status: 400 });

  if (corpo.acao === "iniciar") {
    if (!dentroDoLimite(ip, "memoria", 120, DEZ_MINUTOS)) {
      return NextResponse.json({ ok: false, mensagem: "Calma! Tente de novo em alguns minutos." }, { status: 429 });
    }
    const conta = await contaDaRequisicao(requisicao).catch(() => null);
    const r = iniciarMemoria(corpo.nivel, Date.now(), conta?.id ?? null);
    await registrarEventoPartida({ jogo: "memoria", tipo: "inicio", nivel: r.nivel, conta: conta?.id });
    return NextResponse.json({ ok: true, ...r });
  }
  if (corpo.acao === "virar") {
    // Cada carta virada é um pedido (uma turma inteira pode jogar atrás do mesmo endereço).
    if (!dentroDoLimite(ip, "memoria-virar", 6000, DEZ_MINUTOS)) {
      return NextResponse.json({ ok: false, mensagem: "Calma! Tente de novo em alguns minutos." }, { status: 429 });
    }
    const r = virarCarta(corpo.estado, corpo.pos);
    if ("erro" in r) return NextResponse.json({ ok: false, mensagem: r.erro }, { status: 400 });
    if (r.fim) {
      const conta = await contaDaRequisicao(requisicao).catch(() => null);
      await registrarEventoPartida({ jogo: "memoria", tipo: "fim", nivel: r.fim.nivel, conta: conta?.id });
    }
    return NextResponse.json({ ok: true, ...r });
  }
  return NextResponse.json({ ok: false, mensagem: "Ação desconhecida." }, { status: 400 });
}
