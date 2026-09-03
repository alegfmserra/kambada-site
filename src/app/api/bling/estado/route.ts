import { timingSafeEqual } from "node:crypto";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { NextResponse } from "next/server";
import { chamarBling, listarTudo } from "@/lib/bling/cliente";
import { buscarCatalogo, montarDoBling, paraSlug } from "@/lib/bling/produtos";
import type { CategoriaBling, ProdutoBling } from "@/lib/bling/tipos";
import { arquivoTokens, estaAutorizado } from "@/lib/bling/tokens";
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

  /**
   * ?bruto=ID devolve o produto exatamente como o Bling o entrega.
   *
   * Existe porque a documentação e o comportamento real divergiram quanto ao
   * campo `formato` e à ligação entre variação e produto-pai. Adivinhar aqui
   * custaria a vitrine inteira; ler o dado cru custa uma requisição.
   */
  let bruto: unknown = undefined;
  const alvo = url.searchParams.get("bruto");
  if (alvo && autorizado) {
    // Só leitura, e só caminho reconhecível: este parâmetro não vira uma
    // porta aberta para o ERP, mesmo protegido pelo segredo.
    const caminho = /^\d+$/.test(alvo)
      ? `/produtos/${alvo}`
      : /^\/[a-zA-Z0-9/_\-?=&[\]]+$/.test(alvo)
        ? alvo
        : null;
    bruto = caminho
      ? await chamarBling<unknown>(caminho, { revalidar: 0 }).catch((e) => ({
          erro: e instanceof Error ? e.message : String(e),
        }))
      : { erro: "caminho recusado" };
  }

  /**
   * ?simular=1 monta a vitrine a partir do Bling ainda que a fonte oficial
   * seja a local. Serve para conferir o resultado ANTES de virar a chave —
   * ver a loja quebrar em produção não é forma de descobrir isso.
   */
  let simulacao: unknown = undefined;
  if (url.searchParams.get("simular") === "1" && autorizado) {
    try {
      const c = await montarDoBling();
      simulacao = {
        origem: c.origem,
        motivo: c.motivo ?? null,
        naoClassificados: c.naoClassificados ?? [],
        produtos: c.produtos.map((p) => ({
          nome: p.nome,
          categoria: p.categoria,
          preco: p.preco,
          precoMaximo: p.precoMaximo ?? null,
          quantidade: p.quantidade,
          variacoes: p.variacoes,
        })),
      };
    } catch (e) {
      simulacao = { erro: e instanceof Error ? e.message : String(e) };
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
    // Para diagnosticar perda de tokens entre implantações: mostra onde o
    // arquivo é procurado, se ele existe, e os caminhos do servidor.
    armazenamento: {
      caminhoUsado: arquivoTokens(),
      arquivoExiste: existsSync(arquivoTokens()),
      pastaDaAplicacao: process.cwd(),
      pastaPessoal: homedir(),
    },
    ...(detalhe ? { detalhe } : {}),
    ...(bruto ? { bruto } : {}),
    ...(simulacao ? { simulacao } : {}),
  });
}
