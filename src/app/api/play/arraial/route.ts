import { NextResponse } from "next/server";
import { anotarPista, iniciarDesafio, iniciarMissao, responderDesafio } from "@/lib/play/jogos/arraial";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";

export const dynamic = "force-dynamic";

/**
 * Arraial da Kambada — missões com conversa encadeada e desafio final.
 *   { acao: "iniciar" }                       -> missão do mês + estado
 *   { acao: "pista", estado, npc }            -> anota a pista da conversa
 *   { acao: "desafio", estado }               -> 1ª pergunta do desafio
 *   { acao: "responder", estado, escolha, pulou? } -> resultado, próxima ou prova final
 *     (pulou: true = alguma fala foi pulada; o servidor zera o bônus de rapidez
 *      e também mede sozinho o tempo mínimo de leitura — ver arraial.ts)
 * Fica atrás do login (porteiro em src/proxy.ts): é conteúdo de assinante.
 */
export async function POST(requisicao: Request) {
  if (!dentroDoLimite(ipDaRequisicao(requisicao), "arraial", 200, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, mensagem: "Calma! Tente de novo em alguns minutos." }, { status: 429 });
  }
  const corpo = await corpoJson(requisicao);
  if (!corpo) return NextResponse.json({ ok: false, mensagem: "Requisição inválida." }, { status: 400 });

  const r =
    corpo.acao === "iniciar"
      ? iniciarMissao()
      : corpo.acao === "pista"
        ? anotarPista(corpo.estado, corpo.npc)
        : corpo.acao === "desafio"
          ? iniciarDesafio(corpo.estado)
          : corpo.acao === "responder"
            ? responderDesafio(corpo.estado, corpo.escolha, Date.now(), corpo.pulou)
            : { erro: "Ação desconhecida." };
  if ("erro" in r) return NextResponse.json({ ok: false, mensagem: r.erro }, { status: 400 });
  return NextResponse.json({ ok: true, ...r });
}
