import { NextResponse } from "next/server";
import { situacaoNoBling } from "@/lib/checkout/acompanhar";
import { chamarBling, listarTudo } from "@/lib/bling/cliente";
import { buscarCatalogo } from "@/lib/bling/produtos";
import type { ProdutoBling } from "@/lib/bling/tipos";
import { listarRegistros } from "@/lib/pedidos/registro";
import { segredoDeManutencao } from "@/lib/seguranca/segredo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Relatório de estoque do Bling (Alexandre, 21/10/2026) — SÓ LEITURA.
 *
 * Tudo o que está cadastrado (ativos, inativos), por tipo (simples, pai com
 * variações, variação), com saldo físico e virtual de cada item, e a
 * conferência dos pedidos do site cancelados: o estoque voltou? o pedido está
 * cancelado no Bling? Protegido pela senha de manutenção.
 */

type Linha = {
  id: number;
  nome: string;
  codigo?: string;
  formato?: string;
  tipoNoRelatorio: "simples" | "pai" | "variacao";
  situacao: string;
  preco?: number;
  saldoFisico?: number;
  saldoVirtual?: number;
  /** Aparece na loja do site (produto não oculto, ou opção dele). */
  noSite?: boolean;
  /** Categoria e endereço da peça no site, quando aparece. */
  categoriaNoSite?: string;
  slugNoSite?: string;
};

const SITUACAO: Record<string, string> = { A: "ativo", I: "inativo", E: "excluído" };

export async function GET(requisicao: Request) {
  if (!segredoDeManutencao(requisicao)) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });

  const listar = (tipo: string) => listarTudo<ProdutoBling & { situacao?: string }>(`/produtos?criterio=5&tipo=${tipo}`, { revalidar: 0 });
  const [simples, pais, variacoes] = await Promise.all([listar("PS"), listar("C"), listar("V")]);

  const linhas: Linha[] = [
    ...simples.map((p) => ({ p, t: "simples" as const })),
    ...pais.map((p) => ({ p, t: "pai" as const })),
    ...variacoes.map((p) => ({ p, t: "variacao" as const })),
  ].map(({ p, t }) => ({
    id: p.id,
    nome: p.nome,
    codigo: p.codigo || undefined,
    formato: p.formato,
    tipoNoRelatorio: t,
    situacao: SITUACAO[String(p.situacao ?? "")] ?? String(p.situacao ?? "?"),
    preco: typeof p.preco === "number" ? p.preco : undefined,
  }));

  // Saldos em lote (o pai soma os filhos no Bling; quem guarda peça é a variação).
  const ids = linhas.map((l) => l.id);
  const saldos = new Map<number, { fisico?: number; virtual?: number }>();
  for (let i = 0; i < ids.length; i += 100) {
    const consulta = ids.slice(i, i + 100).map((id) => `idsProdutos[]=${id}`).join("&");
    const r = await chamarBling<{ data?: { produto?: { id?: number }; saldoFisicoTotal?: number; saldoVirtualTotal?: number }[] }>(
      `/estoques/saldos?${consulta}`,
      { revalidar: 0 },
    );
    for (const s of r.data ?? []) {
      if (s.produto?.id) saldos.set(s.produto.id, { fisico: s.saldoFisicoTotal, virtual: s.saldoVirtualTotal });
    }
  }
  for (const l of linhas) {
    const s = saldos.get(l.id);
    l.saldoFisico = s?.fisico ?? 0;
    l.saldoVirtual = s?.virtual ?? 0;
  }

  // O que aparece na loja: produto não oculto (ativo, com saldo ou sob encomenda) e as opções dele.
  const catalogo = await buscarCatalogo();
  const noSite = new Map<number, { categoria: string; slug: string }>();
  for (const p of catalogo.produtos) {
    if (p.oculto) continue;
    if (p.idBling) noSite.set(p.idBling, { categoria: p.categoria, slug: p.slug });
    for (const o of p.opcoes ?? []) noSite.set(o.idBling, { categoria: p.categoria, slug: p.slug });
  }
  for (const l of linhas) {
    const n = noSite.get(l.id);
    l.noSite = Boolean(n);
    l.categoriaNoSite = n?.categoria;
    l.slugNoSite = n?.slug;
  }

  // Pedidos do site cancelados/estornados: estoque devolvido? cancelado no Bling?
  const registros = await listarRegistros(1000);
  const cancelados = registros.filter((r) => r.cancelamento?.concluidoEm || r.estorno);
  const conferencia = [];
  for (const r of cancelados) {
    let situacaoBling = "?";
    try {
      situacaoBling = (await situacaoNoBling(r.bling.idPedido)).situacao;
    } catch (e) {
      situacaoBling = `erro: ${e instanceof Error ? e.message : String(e)}`;
    }
    conferencia.push({
      ref: r.ref,
      criadoEm: r.criadoEm,
      total: r.total,
      itens: r.itens.map((i) => ({ id: i.id, nome: i.nome, quantidade: i.quantidade, saldoAgora: saldos.get(i.id)?.fisico })),
      estoqueBaixadoNaVenda: Boolean(r.estoque?.feitoEm),
      estoqueDevolvido: r.cancelamento?.estoqueBling?.feitoEm
        ? "sim"
        : r.cancelamento?.estoqueBling?.erro
          ? `falhou: ${r.cancelamento.estoqueBling.erro}`
          : r.estoque?.feitoEm
            ? "NÃO registrado"
            : "não se aplica (o site não tinha baixado)",
      estornoMercadoPago: r.cancelamento?.estornoMp?.feitoEm ? "sim" : r.estorno ? `pelo Mercado Pago (${r.estorno.status})` : "não",
      situacaoNoBling: situacaoBling,
      nota: r.cancelamento?.nota?.acao ?? (r.nfe?.idNota ? "a definir" : "sem nota"),
      notaResolvida: Boolean(r.cancelamento?.nota?.resolvidaEm),
    });
  }

  const ativos = linhas.filter((l) => l.situacao === "ativo");
  const contaveis = ativos.filter((l) => l.tipoNoRelatorio !== "pai");
  return NextResponse.json({
    geradoEm: new Date().toISOString(),
    resumo: {
      cadastrados: linhas.length,
      simples: simples.length,
      pais: pais.length,
      variacoes: variacoes.length,
      ativos: ativos.length,
      inativos: linhas.filter((l) => l.situacao === "inativo").length,
      itensAtivosComSaldo: contaveis.filter((l) => (l.saldoFisico ?? 0) > 0).length,
      itensAtivosZerados: contaveis.filter((l) => (l.saldoFisico ?? 0) === 0).length,
      itensAtivosNegativos: contaveis.filter((l) => (l.saldoFisico ?? 0) < 0).length,
      pecasEmEstoque: contaveis.reduce((s, l) => s + Math.max(0, l.saldoFisico ?? 0), 0),
      pedidosCancelados: cancelados.length,
      itensNoSite: linhas.filter((l) => l.noSite).length,
      origemDoCatalogo: catalogo.origem,
    },
    linhas,
    cancelados: conferencia,
  });
}
