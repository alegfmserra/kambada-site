import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { buscarCatalogo } from "@/lib/bling/produtos";
import { estaAutorizado } from "@/lib/bling/tokens";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico da integração: diz se a loja está servindo do Bling ou do
 * catálogo local, e por quê.
 *
 * Protegido por REVALIDATE_SECRET porque revela o estado interno e a razão de
 * uma falha — informação que ajuda quem opera e ajudaria quem atacasse.
 *
 * Uso: /api/bling/estado?token=SEU_REVALIDATE_SECRET
 */

function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET(requisicao: Request) {
  const url = new URL(requisicao.url);
  if (!segredoConfere(url.searchParams.get("token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const autorizado = await estaAutorizado();
  const catalogo = await buscarCatalogo();

  const porCategoria: Record<string, number> = {};
  for (const p of catalogo.produtos) {
    porCategoria[p.categoria] = (porCategoria[p.categoria] ?? 0) + 1;
  }

  return NextResponse.json({
    autorizadoNoBling: autorizado,
    origemDoCatalogo: catalogo.origem,
    motivoDaQueda: catalogo.motivo ?? null,
    totalDeProdutos: catalogo.produtos.length,
    produtosPorCategoria: porCategoria,
    variaveis: {
      clientId: Boolean(process.env.BLING_CLIENT_ID),
      clientSecret: Boolean(process.env.BLING_CLIENT_SECRET),
      webhookSecret: Boolean(process.env.BLING_WEBHOOK_SECRET),
      redirectUri: process.env.BLING_REDIRECT_URI ?? null,
      arquivoDeTokens: process.env.BLING_TOKENS_ARQUIVO ?? "(padrão)",
    },
  });
}
