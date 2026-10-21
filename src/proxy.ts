import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  COOKIE_SESSAO,
  ROTAS_PUBLICAS,
  ehArquivoEstatico,
  lerSessao,
} from "@/lib/play/acesso";
import { contaDaSessao } from "@/lib/play/contas";

/**
 * Porteiro do Kambada Play: só a degustação (quiz fácil), os planos e as telas de conta abrem sem login.
 * Páginas mandam para /kambadaplay/entrar; a API responde 401.
 * (O resto do site não passa por aqui: ver `matcher`.)
 */
export async function proxy(requisicao: NextRequest) {
  const { pathname, search } = requisicao.nextUrl;

  if (ROTAS_PUBLICAS.includes(pathname) || ehArquivoEstatico(pathname)) return NextResponse.next();

  // Demonstração passa pelo cookie; conta passa só se a senha não mudou desde o login.
  const sessao = lerSessao(requisicao.cookies.get(COOKIE_SESSAO)?.value);
  if (sessao?.v === 1 || (await contaDaSessao(sessao))) return NextResponse.next();

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ ok: false, mensagem: "Entre no Kambada Play para jogar." }, { status: 401 });
  }

  // Quem chega ao Play sem conta cai direto na degustação (quiz fácil), não num formulário.
  if (pathname === "/kambadaplay") return NextResponse.redirect(new URL("/kambadaplay/experimente", requisicao.url));

  const destino = new URL("/kambadaplay/entrar", requisicao.url);
  destino.searchParams.set("de", `${pathname}${search}`);
  return NextResponse.redirect(destino);
}

export const config = {
  matcher: ["/kambadaplay", "/kambadaplay/:path*", "/api/play/:path*"],
};
