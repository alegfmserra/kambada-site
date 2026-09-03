import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { listarTudo } from "@/lib/bling/cliente";
import { buscarCatalogo, paraSlug } from "@/lib/bling/produtos";
import type { CategoriaBling, ProdutoBling } from "@/lib/bling/tipos";
import { estaAutorizado } from "@/lib/bling/tokens";
import { CATEGORIAS } from "@/lib/catalogo";

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

  /**
   * ?detalhe=1 mostra o que o Bling realmente devolveu, para descobrir por
   * que um produto não casou com nenhuma categoria do site. Sem isto, só
   * resta adivinhar.
   */
  let detalhe: unknown = undefined;
  if (url.searchParams.get("detalhe") === "1" && autorizado) {
    try {
      const [categoriasBling, produtosBling] = await Promise.all([
        listarTudo<CategoriaBling>("/categorias/produtos"),
        listarTudo<ProdutoBling>("/produtos?criterio=2"),
      ]);

      const slugsDoSite = CATEGORIAS.map((c) => c.slug);
      const idParaSlug = new Map(
        categoriasBling.map((c) => [c.id, paraSlug(c.descricao)]),
      );

      detalhe = {
        categoriasNoBling: categoriasBling.map((c) => ({
          id: c.id,
          descricao: c.descricao,
          slugGerado: paraSlug(c.descricao),
          casaComOSite: slugsDoSite.includes(paraSlug(c.descricao)),
        })),
        slugsQueOSiteEspera: slugsDoSite,
        totalDeProdutosNoBling: produtosBling.length,
        amostraDeProdutos: produtosBling.slice(0, 12).map((p) => ({
          id: p.id,
          nome: p.nome,
          preco: p.preco,
          formato: p.formato,
          idCategoria: p.categoria?.id ?? null,
          slugDaCategoria: idParaSlug.get(p.categoria?.id ?? -1) ?? null,
        })),
      };
    } catch (e) {
      detalhe = { erro: e instanceof Error ? e.message : String(e) };
    }
  }

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
    ...(detalhe ? { detalhe } : {}),
  });
}
