import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { urlDeAutorizacao } from "@/lib/bling/tokens";

export const dynamic = "force-dynamic";

/**
 * Início da autorização. Abrir esta rota no navegador leva ao Bling, onde o
 * Alexandre aprova o aplicativo; o Bling devolve para /api/bling/callback.
 *
 * O `state` é sorteado e guardado em cookie para ser conferido na volta —
 * é o que impede que um terceiro force uma autorização forjada (CSRF).
 */
export async function GET() {
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
