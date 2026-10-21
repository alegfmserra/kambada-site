import { randomBytes, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { urlDeAutorizacao } from "@/lib/bling/tokens";

export const dynamic = "force-dynamic";

/**
 * Início da autorização. Abrir esta rota no navegador leva ao Bling, onde o
 * Alexandre aprova o aplicativo; o Bling devolve para /api/bling/callback.
 *
 *   GET /api/bling/autorizar?token=REVALIDATE_SECRET
 *
 * O `state` é sorteado e guardado em cookie para ser conferido na volta —
 * é o que impede que um terceiro force uma autorização forjada (CSRF).
 *
 * A senha (20/10/2026): o `state` não impede que um estranho faça o fluxo
 * inteiro no próprio navegador e, se o aplicativo aceitar outra conta do
 * Bling, troque a conexão da loja pela dele. Sem a senha, nem começa.
 */

function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(requisicao: Request) {
  if (!segredoConfere(new URL(requisicao.url).searchParams.get("token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const state = randomBytes(16).toString("hex");

  const jar = await cookies();
  jar.set("bling_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutos: tempo de sobra para aprovar
    path: "/",
  });

  return NextResponse.redirect(urlDeAutorizacao(state));
}
