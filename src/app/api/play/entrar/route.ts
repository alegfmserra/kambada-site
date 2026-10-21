import { NextResponse } from "next/server";
import { COOKIE_SESSAO, VALIDADE_SESSAO_S, credenciaisValidas, criarSessao, demonstracaoLigada, destinoSeguro } from "@/lib/play/acesso";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";

export const dynamic = "force-dynamic";

/** Login do Kambada Play. Limite: 8 tentativas por IP a cada 10 minutos. */
export async function POST(requisicao: Request) {
  if (!dentroDoLimite(ipDaRequisicao(requisicao), "play-entrar", 8, 10 * 60 * 1000)) {
    return NextResponse.json(
      { ok: false, mensagem: "Muitas tentativas. Espere alguns minutos e tente de novo." },
      { status: 429 },
    );
  }
  const corpo = await corpoJson(requisicao);
  if (!corpo || !credenciaisValidas(corpo.usuario, corpo.senha)) {
    return NextResponse.json(
      {
        ok: false,
        mensagem: demonstracaoLigada()
          ? "Login ou senha incorretos."
          : "Para entrar, use o e-mail da sua conta. Ainda não tem? Crie grátis na aba \"Criar conta\".",
      },
      { status: 401 },
    );
  }

  const resposta = NextResponse.json({ ok: true, destino: destinoSeguro(corpo.de) });
  resposta.cookies.set({
    name: COOKIE_SESSAO,
    value: criarSessao(),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VALIDADE_SESSAO_S,
  });
  return resposta;
}
