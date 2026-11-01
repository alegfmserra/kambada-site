import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  COOKIE_SESSAO,
  ROTAS_PUBLICAS,
  ehArquivoEstatico,
  lerSessao,
} from "@/lib/play/acesso";
import { contaDaSessao } from "@/lib/play/contas";
import { BASE_INTERNA, BASE_PUBLICA, ehHostDaEscola } from "@/lib/escola/host";

/**
 * Subdomínio da escola (protótipo, 01/11/2026): `modelo.…/kambadaplay` mostra
 * o portal da escola (árvore interna /escola-modelo). O Play oficial não roda
 * ali, e o portal não existe no domínio oficial (404).
 */
function portaoDaEscola(requisicao: NextRequest) {
  const { pathname, search } = requisicao.nextUrl;
  if (pathname.startsWith("/api/escola/") || ehArquivoEstatico(pathname)) return NextResponse.next();
  if (pathname.startsWith("/api/")) return new NextResponse(null, { status: 404 });
  if (pathname === BASE_PUBLICA || pathname.startsWith(`${BASE_PUBLICA}/`)) {
    return NextResponse.rewrite(new URL(`${BASE_INTERNA}${pathname.slice(BASE_PUBLICA.length)}${search}`, requisicao.url));
  }
  if (pathname.startsWith(BASE_INTERNA)) return NextResponse.next();
  // Redireciona pelo host público (atrás do proxy da Hostinger, requisicao.url pode trazer o endereço interno).
  const host = requisicao.headers.get("x-forwarded-host") ?? requisicao.headers.get("host");
  const protocolo = requisicao.headers.get("x-forwarded-proto") ?? requisicao.nextUrl.protocol.replace(":", "");
  return NextResponse.redirect(new URL(BASE_PUBLICA, host ? `${protocolo}://${host}` : requisicao.url));
}

/**
 * Porteiro do Kambada Play: só a degustação (quiz fácil), os planos e as telas de conta abrem sem login.
 * Páginas mandam para /kambadaplay/entrar; a API responde 401.
 * (O resto do site não passa por aqui: ver `matcher`.)
 */
export async function proxy(requisicao: NextRequest) {
  const { pathname, search } = requisicao.nextUrl;

  if (ehHostDaEscola(requisicao.headers.get("x-forwarded-host") ?? requisicao.headers.get("host"))) {
    return portaoDaEscola(requisicao);
  }
  if (pathname === BASE_INTERNA || pathname.startsWith(`${BASE_INTERNA}/`) || pathname.startsWith("/api/escola/")) {
    return new NextResponse(null, { status: 404 });
  }
  if (pathname === "/") return NextResponse.next();

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
  matcher: [
    "/kambadaplay",
    "/kambadaplay/:path*",
    "/api/play/:path*",
    "/escola-modelo",
    "/escola-modelo/:path*",
    "/api/escola/:path*",
    // No subdomínio da escola, o resto (raiz, loja, blog) volta para o portal e as APIs da loja dão 404.
    { source: "/:caminho((?!_next/).*)", has: [{ type: "host", value: "modelo\\..*" }] },
  ],
};
