import { NextResponse } from "next/server";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";
import { normalizarTela, registrarTela, segundosValidos } from "@/lib/play/telas";

export const dynamic = "force-dynamic";

const UM_MINUTO = 60 * 1000;

/**
 * Recebe "a pessoa ficou N segundos nesta tela" do Play. Anônimo: só tela e
 * segundos são gravados (ver lib/play/telas.ts). Responde sempre 204 para não
 * atrapalhar a navegação, mesmo quando descarta o registro.
 */
export async function POST(requisicao: Request) {
  if (!dentroDoLimite(ipDaRequisicao(requisicao), "telas", 60, UM_MINUTO)) {
    return new NextResponse(null, { status: 204 });
  }
  const corpo = await corpoJson(requisicao);
  const tela = normalizarTela(corpo?.tela);
  const seg = segundosValidos(corpo?.seg);
  if (tela && seg) await registrarTela({ tela, seg });
  return new NextResponse(null, { status: 204 });
}
