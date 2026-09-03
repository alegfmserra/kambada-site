import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { chamarBling, listarTudo } from "@/lib/bling/cliente";
import { ErroBling, type ProdutoBling } from "@/lib/bling/tipos";

export const dynamic = "force-dynamic";

/**
 * Cria produtos novos no Bling — Fase 1 da reestruturação "estampa é
 * produto", aprovada pelo Alexandre em 2026-09-03.
 *
 * Bonés, Necessaires e Pareôs viviam como 1 cadastro genérico + variações
 * por estampa (o padrão antigo). O padrão novo, que já vale para Camisas,
 * é a estampa ser o produto em si — mais fácil de controlar estoque por
 * peça, e pronto para virar anúncio individual num marketplace algum dia.
 *
 * Cada criação é uma dupla de chamadas: POST /produtos (cadastro), depois
 * POST /estoques com operação "B" (Balanço) para lançar o saldo inicial —
 * documentado em /api/bling/estoque. Sem a segunda chamada o produto nasce
 * com saldo zero.
 *
 * ESTA ROTA ESCREVE NO ERP:
 * - GET só ensaia.
 * - POST exige `aplicar=1`.
 * - `apenas=<slug>` restringe a um produto — a primeira execução é assim.
 * - Depois de criar, relê o produto e o saldo de estoque para provar o que
 *   ficou gravado, nunca confia só na resposta do POST.
 * - Nunca reaplica um produto já criado: se o nome já existe no Bling
 *   (ativo ou inativo), pula — para rodar a rota de novo não duplicar nada.
 */

const ID_CATEGORIA = 13568333; // "Categoria padrão" — única na conta
const ID_DEPOSITO = 14888952004; // "Geral" — único depósito, padrão:true

type NovoProduto = {
  slug: string;
  nome: string;
  preco: number;
  quantidade: number;
  origem: string;
};

/**
 * Quantidades da contagem física em Estoque_Kambada (1).xlsx, 2026-08-29,
 * já reconciliada com o Cadastro Mestre em 2026-09-03. Preços aprovados
 * pelo Alexandre — os mesmos de PRECOS_CORRETOS para Boné/Necessaire/Pareô.
 */
const NOVOS: NovoProduto[] = [
  { slug: "bone-guaras-bege", nome: "Boné Guarás Bege", preco: 55, quantidade: 22, origem: "Bonés" },
  { slug: "bone-marinho-maranhense", nome: "Boné Marinho Maranhense Que só", preco: 55, quantidade: 5, origem: "Bonés" },
  { slug: "bone-preto-lendas", nome: "Boné Preto Lendas", preco: 55, quantidade: 9, origem: "Bonés" },

  { slug: "necessaire-azulejos", nome: "Necessaire Azulejos", preco: 20, quantidade: 30, origem: "Necessaires" },
  { slug: "necessaire-guaras", nome: "Necessaire Guarás", preco: 20, quantidade: 30, origem: "Necessaires" },
  { slug: "necessaire-serpente", nome: "Necessaire Serpente Tons de Azul", preco: 20, quantidade: 40, origem: "Necessaires" },
  { slug: "necessaire-tradicao", nome: "Necessaire Tradição", preco: 20, quantidade: 14, origem: "Necessaires" },
  { slug: "necessaire-tradicao-colorida", nome: "Necessaire Tradição Colorida", preco: 20, quantidade: 30, origem: "Necessaires" },

  { slug: "pareo-cidade-azulejos", nome: "Pareô Cidade dos Azulejos", preco: 89.9, quantidade: 15, origem: "Pareôs" },
  { slug: "pareo-mosaico", nome: "Pareô Mosaico", preco: 89.9, quantidade: 15, origem: "Pareôs" },
  { slug: "pareo-reggae-roots", nome: "Pareô Reggae Roots", preco: 89.9, quantidade: 17, origem: "Pareôs" },
  { slug: "pareo-revoada-guaras", nome: "Pareô Revoada dos Guarás", preco: 89.9, quantidade: 14, origem: "Pareôs" },
];

function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Nomes já cadastrados e ativos no Bling.
 *
 * `criterio=2` é o valor já comprovado nesta integração (ver produtos.ts e
 * corrigir/route.ts) — um valor adivinhado para "todos, ativo ou não" nunca
 * foi testado, e um parâmetro errado poderia filtrar demais e deixar passar
 * um nome já existente sem avisar. Não cobre o caso raro de um produto ter
 * sido criado e inativado por engano numa rodada anterior desta MESMA rota;
 * aceitável porque, nesse caso, o pior resultado é tentar recriar — e a
 * criação em si sempre é conferida por leitura antes de contar como feita.
 */
async function nomesExistentes(): Promise<Set<string>> {
  const todos = await listarTudo<ProdutoBling>("/produtos?criterio=2", { revalidar: 0 });
  return new Set(todos.map((p) => p.nome));
}

async function responder(requisicao: Request, escrever: boolean) {
  const url = new URL(requisicao.url);
  if (!segredoConfere(url.searchParams.get("token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const apenas = url.searchParams.get("apenas");
  const alvos = NOVOS.filter((n) => apenas === null || n.slug === apenas);

  const existentes = await nomesExistentes();
  const plano = alvos.map((alvo) => ({
    ...alvo,
    acao: existentes.has(alvo.nome) ? "pular" : "criar",
    motivo: existentes.has(alvo.nome) ? "já existe" : undefined,
  }));

  if (!escrever || url.searchParams.get("aplicar") !== "1") {
    return NextResponse.json({ modo: "ensaio — nada foi escrito no Bling", plano });
  }

  const feitos: Record<string, unknown>[] = [];
  for (const item of plano) {
    if (item.acao === "pular") continue;

    try {
      const criado = await chamarBling<{ data: { id: number } }>("/produtos", {
        metodo: "POST",
        corpo: {
          nome: item.nome,
          preco: item.preco,
          tipo: "P",
          situacao: "A",
          formato: "S",
          categoria: { id: ID_CATEGORIA },
        },
      });
      const idProduto = criado.data.id;

      // Relê o produto criado — prova o que ficou gravado, não confia na
      // resposta do POST (que só devolve o id).
      const conferido = await chamarBling<{
        data: { nome: string; preco: number; situacao: string };
      }>(`/produtos/${idProduto}`, { revalidar: 0 });

      // Lança o saldo inicial. Sem isto o produto nasce com estoque zero.
      await chamarBling("/estoques", {
        metodo: "POST",
        corpo: {
          produto: { id: idProduto },
          deposito: { id: ID_DEPOSITO },
          operacao: "B",
          quantidade: item.quantidade,
          observacoes: `Cadastro criado a partir da reestruturação estampa=produto — ${item.origem}, planilha de estoque 2026-08-29. Lançado em ${new Date().toISOString().slice(0, 10)}.`,
        },
      });
      const saldo = await chamarBling<{ data?: { saldoVirtualTotal?: number }[] }>(
        `/estoques/saldos?idsProdutos[]=${idProduto}`,
        { revalidar: 0 },
      );

      feitos.push({
        slug: item.slug,
        idProduto,
        nome: conferido.data.nome,
        preco: conferido.data.preco,
        situacao: conferido.data.situacao,
        saldoConferido: saldo.data?.[0]?.saldoVirtualTotal ?? null,
        saldoEsperado: item.quantidade,
        bateu:
          conferido.data.nome === item.nome &&
          conferido.data.preco === item.preco &&
          saldo.data?.[0]?.saldoVirtualTotal === item.quantidade,
      });
    } catch (e) {
      feitos.push({
        slug: item.slug,
        nome: item.nome,
        erro: e instanceof Error ? e.message : String(e),
        respostaDoBling: e instanceof ErroBling ? e.corpo : undefined,
      });
      break; // para na primeira falha
    }
  }

  return NextResponse.json({ modo: "aplicado", feitos });
}

export async function GET(requisicao: Request) {
  return responder(requisicao, false);
}

export async function POST(requisicao: Request) {
  return responder(requisicao, true);
}
