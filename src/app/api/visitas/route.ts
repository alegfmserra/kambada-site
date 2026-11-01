import { NextResponse } from "next/server";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";
import { ehRobo, lerEvento, registrarVisita } from "@/lib/visitas/visitas";

export const dynamic = "force-dynamic";

const UM_MINUTO = 60 * 1000;

/**
 * Recebe um evento anônimo de visita (página vista, tempo de tela, produto visto,
 * carrinho, clique, velocidade, compra, 404). Só grava o que `lerEvento` aceita (ver
 * lib/visitas). Robôs são descartados pelo user-agent, que NÃO é guardado.
 * Responde sempre 204 para não atrapalhar a navegação, mesmo ao descartar.
 */
export async function POST(requisicao: Request) {
  if (ehRobo(requisicao.headers.get("user-agent"))) return new NextResponse(null, { status: 204 });
  if (!dentroDoLimite(ipDaRequisicao(requisicao), "visitas", 240, UM_MINUTO)) {
    return new NextResponse(null, { status: 204 });
  }
  const evento = lerEvento(await corpoJson(requisicao));
  if (evento) await registrarVisita(evento);
  return new NextResponse(null, { status: 204 });
}
