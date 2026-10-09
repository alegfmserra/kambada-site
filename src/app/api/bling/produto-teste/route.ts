import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { chamarBling } from "@/lib/bling/cliente";
import { ID_PRODUTO_TESTE } from "@/lib/bling/produtos";

export const dynamic = "force-dynamic";

/**
 * Ajusta o preço do PRODUTO DE TESTE — e de nenhum outro.
 *
 * O ID é fixo no código (Produto Teste Kambada, criado em 08/10/2026), e o
 * preço só pode ficar entre R$ 0,01 e R$ 5,00. Serve para calibrar o teste do
 * fluxo de compra sem abrir o Bling.
 *
 *   POST /api/bling/produto-teste?token=REVALIDATE_SECRET&preco=1.00
 */


function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(requisicao: Request) {
  const url = new URL(requisicao.url);
  if (!segredoConfere(url.searchParams.get("token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const preco = Number(url.searchParams.get("preco"));
  if (!Number.isFinite(preco) || preco < 0.01 || preco > 5) {
    return NextResponse.json({ erro: "preço entre 0.01 e 5.00" }, { status: 400 });
  }

  const atual = await chamarBling<{ data: Record<string, unknown> & { nome?: string; preco?: number } }>(
    `/produtos/${ID_PRODUTO_TESTE}`,
    { revalidar: 0 },
  );
  if (atual.data.nome !== "Produto Teste Kambada") {
    return NextResponse.json({ erro: "o ID não é mais o produto de teste — nada foi alterado" }, { status: 409 });
  }
  await chamarBling(`/produtos/${ID_PRODUTO_TESTE}`, {
    metodo: "PUT",
    corpo: { ...atual.data, preco: Number(preco.toFixed(2)) },
  });
  const depois = await chamarBling<{ data: { preco?: number } }>(`/produtos/${ID_PRODUTO_TESTE}`, { revalidar: 0 });

  // O catálogo do site guarda 10 minutos; a página do produto e o carrinho
  // precisam ver o preço novo já.
  revalidatePath("/loja", "layout");
  return NextResponse.json({ antes: atual.data.preco, depois: depois.data.preco });
}
