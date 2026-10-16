import { NextResponse } from "next/server";
import { COOKIE_SESSAO } from "@/lib/play/acesso";

export const dynamic = "force-dynamic";

/** Sai do Kambada Play: apaga o cookie de acesso. */
export async function POST() {
  const resposta = NextResponse.json({ ok: true });
  resposta.cookies.set({ name: COOKIE_SESSAO, value: "", path: "/", maxAge: 0 });
  return resposta;
}
