import { NextResponse } from "next/server";
import { rotaEscola } from "@/lib/escola/host";
import { COOKIE_ESCOLA } from "@/lib/escola/sessao";

export async function POST() {
  const r = NextResponse.json({ ok: true, destino: rotaEscola() });
  r.cookies.set(COOKIE_ESCOLA, "", { path: "/", maxAge: 0 });
  return r;
}
