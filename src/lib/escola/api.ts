import { NextResponse } from "next/server";
import type { Membro } from "./dados";
import { ErroEscola, quemEsta, type Quem } from "./servico";
import { sessaoDoCabecalho } from "./sessao";

/** Utilidades das rotas /api/escola/* (somente servidor). */

export function ok(dados: Record<string, unknown> = {}) {
  return NextResponse.json({ ok: true, ...dados });
}

export function falha(mensagem: string, status = 400) {
  return NextResponse.json({ ok: false, mensagem }, { status });
}

export async function quemPede(req: Request): Promise<Quem | null> {
  return quemEsta(sessaoDoCabecalho(req.headers.get("cookie")));
}

export async function membroQuePede(req: Request): Promise<Membro | null> {
  const q = await quemPede(req);
  return q && q.papel !== "aluno" ? q.membro : null;
}

/** Erros de regra viram resposta com mensagem; o resto vira 500 no log. */
export function tratar(erro: unknown) {
  if (erro instanceof ErroEscola) return falha(erro.message, erro.status);
  console.error("[escola] erro inesperado:", erro);
  return falha("Algo deu errado. Tente de novo.", 500);
}
