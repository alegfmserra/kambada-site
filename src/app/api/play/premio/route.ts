import { NextResponse } from "next/server";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";
import { resgatarPremio, situacaoDoPremio } from "@/lib/play/jogos/placar";
import { urlDoSite } from "@/lib/loja/urlDoSite";
import { contaDaRequisicao } from "@/lib/play/contas";
import { enviarCupom } from "@/lib/play/emails";
import { chaveValida, resumoDaChave } from "@/lib/play/jogos/seguranca";

/** Quem é o jogador: a conta (se entrou com e-mail) ou a chave do navegador. */
async function jogadorDa(requisicao: Request, chave: unknown): Promise<string | null> {
  const conta = await contaDaRequisicao(requisicao);
  if (conta) return resumoDaChave(`conta:${conta.id}`);
  return chaveValida(chave) ? resumoDaChave(chave) : null;
}

export const dynamic = "force-dynamic";

/**
 * Prêmio da semana que fechou: cupom de 10% para o 1º lugar e de 5% para o 2º
 * e o 3º. Sem e-mail e sem cadastro: quem joga prova que é o vencedor com a
 * chave guardada no próprio navegador.
 *
 * GET  ?chave=...      -> está entre os 3 primeiros da última semana?
 * POST { chave }       -> emite (ou devolve) o cupom
 */
export async function GET(requisicao: Request) {
  if (!dentroDoLimite(ipDaRequisicao(requisicao), "premio-ler", 60, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, mensagem: "Calma! Tente de novo em alguns minutos." }, { status: 429 });
  }
  const jogador = await jogadorDa(requisicao, new URL(requisicao.url).searchParams.get("chave"));
  if (!jogador) return NextResponse.json({ ok: true, situacao: { elegivel: false } });
  return NextResponse.json({ ok: true, situacao: await situacaoDoPremio(jogador) });
}

export async function POST(requisicao: Request) {
  if (!dentroDoLimite(ipDaRequisicao(requisicao), "premio-resgatar", 10, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, mensagem: "Calma! Tente de novo em alguns minutos." }, { status: 429 });
  }
  const corpo = await corpoJson(requisicao);
  const jogador = corpo ? await jogadorDa(requisicao, corpo.chave) : null;
  if (!jogador) {
    return NextResponse.json({ ok: false, mensagem: "Requisição inválida." }, { status: 400 });
  }
  try {
    const r = await resgatarPremio(jogador);
    // Com conta confirmada e opt-in, o cupom também vai por e-mail (uma vez, na emissão).
    if (r.ok && !r.jaEmitido) {
      const conta = await contaDaRequisicao(requisicao);
      if (conta) await enviarCupom(urlDoSite(requisicao), conta, r).catch(() => undefined);
    }
    return NextResponse.json(r, { status: r.ok ? 200 : 400 });
  } catch {
    return NextResponse.json(
      { ok: false, mensagem: "Não foi possível emitir o cupom agora. Tente de novo mais tarde." },
      { status: 500 },
    );
  }
}
