import { NextResponse } from "next/server";
import { buscarCatalogo } from "@/lib/bling/produtos";
import { lerPedidoDoCliente, validarCarrinho } from "@/lib/carrinho/validar";
import { normalizarCodigo, validarCupom } from "@/lib/cupons/cupons";
import { emReais } from "@/lib/loja/dinheiro";

export const dynamic = "force-dynamic";

/**
 * Confere um cupom para o carrinho — só leitura; nada é reservado aqui.
 * O checkout confere de novo na hora de pagar (o limite pode ter acabado
 * no meio do caminho).
 *
 * Limite simples contra quem tenta adivinhar códigos: 20 tentativas por IP a
 * cada 10 minutos.
 */
const tentativas = new Map<string, { inicio: number; vezes: number }>();
function dentroDoLimite(ip: string): boolean {
  const agora = Date.now();
  const t = tentativas.get(ip);
  if (!t || agora - t.inicio > 10 * 60 * 1000) {
    tentativas.set(ip, { inicio: agora, vezes: 1 });
    if (tentativas.size > 5000) tentativas.delete(tentativas.keys().next().value as string);
    return true;
  }
  t.vezes += 1;
  return t.vezes <= 20;
}

export async function POST(requisicao: Request) {
  const ip = (requisicao.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "sem-ip";
  if (!dentroDoLimite(ip)) {
    return NextResponse.json({ ok: false, mensagem: "Muitas tentativas. Espere alguns minutos." }, { status: 429 });
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = (await requisicao.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, mensagem: "Requisição inválida." }, { status: 400 });
  }
  const codigo = normalizarCodigo(String(corpo.codigo ?? ""));
  const pedido = lerPedidoDoCliente(corpo.itens);
  if (!codigo || !pedido) return NextResponse.json({ ok: false, mensagem: "Informe o cupom." }, { status: 422 });

  const validacao = validarCarrinho(pedido, await buscarCatalogo());
  const itens = validacao.itens.map((i) => ({ p: i.precoUnitario, q: i.quantidade }));
  const r = await validarCupom(codigo, itens);
  if (!r.ok) return NextResponse.json({ ok: false, mensagem: r.mensagem });

  return NextResponse.json({
    ok: true,
    codigo: r.cupom.codigo,
    percentual: r.cupom.percentual,
    desconto: emReais(r.descontoCentavos),
  });
}
