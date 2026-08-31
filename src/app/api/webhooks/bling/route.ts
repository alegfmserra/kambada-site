import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Webhook do Bling: avisa quando produto ou estoque mudam.
 *
 * Ao receber, invalidamos o cache das páginas de loja — na próxima visita o
 * site busca o catálogo atualizado. Não guardamos nada aqui.
 *
 * Três cuidados que a documentação do Bling exige na prática:
 *
 * 1. **Idempotência.** O Bling reenvia por até 3 dias e não garante a ordem.
 *    Como a ação é só invalidar cache, repetir é inofensivo — de propósito.
 * 2. **Responder rápido.** Qualquer processamento pesado aqui viraria fila de
 *    reenvio. Invalidar cache é instantâneo.
 * 3. **Responder 200 mesmo em corpo inesperado.** Devolver erro faz o Bling
 *    reenviar para sempre algo que nunca vai funcionar. Erro de verdade
 *    (segredo errado) responde 401, aí sim.
 */

function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.BLING_WEBHOOK_SECRET;
  // Sem segredo configurado, o webhook fica fechado. Falha fechada, não aberta.
  if (!esperado) return false;
  if (!recebido) return false;

  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  // Comparação de tempo constante: comparar com === vaza o segredo aos poucos.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(requisicao: Request) {
  const url = new URL(requisicao.url);
  const segredo =
    requisicao.headers.get("x-bling-signature") ?? url.searchParams.get("token");

  if (!segredoConfere(segredo)) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  let evento: unknown = null;
  try {
    evento = await requisicao.json();
  } catch {
    // Corpo ilegível não é motivo para o Bling reenviar por 3 dias.
    return NextResponse.json({ ok: true, ignorado: "corpo inválido" });
  }

  // A home mostra as categorias, /loja mostra tudo, e o padrão dinâmico
  // cobre as seis páginas de categoria de uma vez.
  revalidatePath("/", "page");
  revalidatePath("/loja", "page");
  revalidatePath("/loja/[categoria]", "page");

  const tipo =
    typeof evento === "object" && evento !== null && "event" in evento
      ? String((evento as { event: unknown }).event)
      : "desconhecido";

  return NextResponse.json({ ok: true, evento: tipo, revalidado: true });
}

/** GET serve para o Bling (e para nós) conferirem que a rota está de pé. */
export async function GET() {
  return NextResponse.json({
    ok: true,
    servico: "webhook do Bling",
    configurado: Boolean(process.env.BLING_WEBHOOK_SECRET),
  });
}
