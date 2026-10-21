import { NextResponse } from "next/server";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";
import { gravarResposta, listarRespostas, respostasParaCsv, resumir, validarResposta } from "@/lib/pesquisa/pesquisa";
import { segredoDeManutencao } from "@/lib/seguranca/segredo";

export const dynamic = "force-dynamic";

/**
 * Pesquisa de satisfação.
 *   POST                                     → grava uma resposta (anônima)
 *   GET  (Authorization: Bearer SENHA)       → resumo + respostas (JSON)
 *   GET  …&formato=csv                       → planilha
 * SENHA = REVALIDATE_SECRET (ver lib/seguranca/segredo.ts).
 */
export async function POST(requisicao: Request) {
  if (!dentroDoLimite(ipDaRequisicao(requisicao), "pesquisa", 3, 10 * 60_000)) {
    return NextResponse.json({ ok: false, mensagem: "Recebemos sua resposta. Obrigado!" }, { status: 429 });
  }
  const corpo = await corpoJson(requisicao);
  const resposta = corpo ? validarResposta(corpo) : null;
  if (!resposta) return NextResponse.json({ ok: false, mensagem: "Marque ao menos uma resposta." }, { status: 400 });
  await gravarResposta(resposta);
  return NextResponse.json({ ok: true });
}

export async function GET(requisicao: Request) {
  const url = new URL(requisicao.url);
  if (!segredoDeManutencao(requisicao)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const respostas = await listarRespostas();
  if (url.searchParams.get("formato") === "csv") {
    return new NextResponse(respostasParaCsv(respostas), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="kambada-pesquisa-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }
  return NextResponse.json({ resumo: resumir(respostas), respostas });
}
