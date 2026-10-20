import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";
import { gravarResposta, listarRespostas, respostasParaCsv, resumir, validarResposta } from "@/lib/pesquisa/pesquisa";

export const dynamic = "force-dynamic";

/**
 * Pesquisa de satisfação.
 *   POST                                → grava uma resposta (anônima)
 *   GET ?token=REVALIDATE_SECRET         → resumo + respostas (JSON)
 *   GET ?token=…&formato=csv             → planilha
 */
function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

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
  if (!segredoConfere(url.searchParams.get("token"))) {
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
