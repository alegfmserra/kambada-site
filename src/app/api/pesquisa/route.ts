import { NextResponse } from "next/server";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";
import { filtrarPeriodo, gravarResposta, listarRespostas, respostasParaCsv, respostasParaCsvIctg, resumir, validarResposta } from "@/lib/pesquisa/pesquisa";
import { segredoDeManutencao } from "@/lib/seguranca/segredo";
import { contaDaRequisicao } from "@/lib/play/contas";

export const dynamic = "force-dynamic";

/**
 * Pesquisa de satisfação.
 *   POST                                     → grava uma resposta (com o e-mail da conta do Play, se houver login)
 *   GET  (Authorization: Bearer SENHA)       → resumo + respostas (JSON)
 *   GET  …&formato=csv                       → planilha
 *   GET  …&formato=ictg                      → planilha anonimizada (sem nome/e-mail/contato/instituição)
 *   Filtro de período em qualquer GET: &de=AAAA-MM-DD&ate=AAAA-MM-DD
 * SENHA = REVALIDATE_SECRET (ver lib/seguranca/segredo.ts).
 */
export async function POST(requisicao: Request) {
  if (!dentroDoLimite(ipDaRequisicao(requisicao), "pesquisa", 3, 10 * 60_000)) {
    return NextResponse.json({ ok: false, mensagem: "Recebemos sua resposta. Obrigado!" }, { status: 429 });
  }
  const corpo = await corpoJson(requisicao);
  const conta = corpo ? await contaDaRequisicao(requisicao).catch(() => null) : null;
  const resposta = corpo ? validarResposta(corpo, new Date(), conta?.email) : null;
  if (!resposta) return NextResponse.json({ ok: false, mensagem: "Marque ao menos uma resposta." }, { status: 400 });
  // Conta de demonstração (apresentação a escolas) não entra na pesquisa: os números vão para a FAPEMA.
  if (!conta?.demo) await gravarResposta(resposta);
  return NextResponse.json({ ok: true });
}

export async function GET(requisicao: Request) {
  const url = new URL(requisicao.url);
  if (!segredoDeManutencao(requisicao)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const data = (v: string | null) => (v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v : null);
  const respostas = filtrarPeriodo(await listarRespostas(), data(url.searchParams.get("de")), data(url.searchParams.get("ate")));
  if (url.searchParams.get("formato") === "ictg") {
    return new NextResponse(respostasParaCsvIctg(respostas), {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="kambada-pesquisa-ictg-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }
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
