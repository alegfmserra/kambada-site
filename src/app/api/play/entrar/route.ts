import { NextResponse } from "next/server";
import {
  COOKIE_SESSAO,
  VALIDADE_SESSAO_S,
  credenciaisValidas,
  criarSessao,
  criarSessaoDeConta,
  destinoSeguro,
} from "@/lib/play/acesso";
import { autenticarPorUsuario, marcaDaSenha } from "@/lib/play/contas";
import { contarErro, corpoJson, errosEsgotados, ipDaRequisicao } from "@/lib/play/jogos/limite";

export const dynamic = "force-dynamic";

/**
 * Entrada sem e-mail no Kambada Play (o campo do formulário sem "@").
 * Duas portas, nesta ordem:
 *  1. conta por USUÁRIO + senha (30/10/2026; ex.: contas de demonstração para escolas);
 *  2. login único de demonstração antigo (desligado em produção, ver acesso.ts).
 * Limite: 10 tentativas ERRADAS por IP a cada 10 minutos (entrar certo não conta:
 * uma turma inteira pode entrar pelo mesmo Wi-Fi).
 */
const JANELA = 10 * 60 * 1000;

export async function POST(requisicao: Request) {
  const ip = ipDaRequisicao(requisicao);
  if (errosEsgotados(ip, "play-entrar", 10, JANELA)) {
    return NextResponse.json(
      { ok: false, mensagem: "Muitas tentativas. Espere alguns minutos e tente de novo." },
      { status: 429 },
    );
  }
  const corpo = await corpoJson(requisicao);
  const cookie = {
    name: COOKIE_SESSAO,
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VALIDADE_SESSAO_S,
  };

  const conta = corpo ? await autenticarPorUsuario(corpo.usuario, corpo.senha) : null;
  if (conta) {
    const resposta = NextResponse.json({ ok: true, destino: destinoSeguro(corpo?.de) });
    resposta.cookies.set({ ...cookie, value: criarSessaoDeConta(conta.id, marcaDaSenha(conta)) });
    return resposta;
  }

  if (corpo && credenciaisValidas(corpo.usuario, corpo.senha)) {
    const resposta = NextResponse.json({ ok: true, destino: destinoSeguro(corpo.de) });
    resposta.cookies.set({ ...cookie, value: criarSessao() });
    return resposta;
  }

  contarErro(ip, "play-entrar", JANELA);
  return NextResponse.json(
    {
      ok: false,
      mensagem:
        "Usuário ou senha incorretos. Se a sua conta é por e-mail, digite o e-mail completo. Ainda não tem conta? Crie grátis na aba \"Criar conta\".",
    },
    { status: 401 },
  );
}
