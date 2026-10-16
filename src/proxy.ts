import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  COOKIE_SESSAO,
  ROTAS_PUBLICAS,
  ehArquivoEstatico,
  sessaoValida,
} from "@/lib/play/acesso";

/**
 * Porteiro do Kambada Play: nenhuma página nem API do Play abre sem login.
 * Páginas mandam para /kambadaplay/entrar; a API responde 401.
 * (O resto do site não passa por aqui: ver `matcher`.)
 */
export function proxy(requisicao: NextRequest) {
  const { pathname, search } = requisicao.nextUrl;

  if (ROTAS_PUBLICAS.includes(pathname) || ehArquivoEstatico(pathname)) return NextResponse.next();

  if (sessaoValida(requisicao.cookies.get(COOKIE_SESSAO)?.value)) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, mensagem: "Entre no Kambada Play para jogar." }, { status: 401 });
  }

  const destino = new URL("/kambadaplay/entrar", requisicao.url);
  destino.searchParams.set("de", `${pathname}${search}`);
  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ["/kambadaplay", "/kambadaplay/:path*", "/api/play/:path*"],
};
