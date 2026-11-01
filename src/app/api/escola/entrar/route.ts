import { NextResponse } from "next/server";
import { contarErro, corpoJson, errosEsgotados, ipDaRequisicao } from "@/lib/play/jogos/limite";
import { falha, ok } from "@/lib/escola/api";
import { entrarAluno, entrarMembro, marcaDoAluno, marcaDoMembro, turmaPorCodigo } from "@/lib/escola/servico";
import { COOKIE_ESCOLA, criarSessaoEscola, opcoesCookie } from "@/lib/escola/sessao";
import { rotaEscola } from "@/lib/escola/host";

/**
 * Entrada no portal da escola.
 *  - tipo "turma": código da turma → lista de apelidos (sem senha nenhuma);
 *  - tipo "aluno": código + apelido + senha de figuras;
 *  - tipo "equipe": usuário + senha (professor ou coordenação).
 *
 * Limite só de ERROS: uma sala inteira entra pela mesma rede (mesmo IP) sem se
 * bloquear. Senha de figuras errada conta por aluno (8 em 10 min) e por IP (40).
 */
const JANELA = 10 * 60 * 1000;

export async function POST(req: Request) {
  const corpo = await corpoJson(req);
  if (!corpo) return falha("Pedido inválido.");
  const ip = ipDaRequisicao(req);

  if (corpo.tipo === "turma") {
    if (errosEsgotados(ip, "escola-codigo", 30, JANELA)) return falha("Muitos códigos errados. Espere uns minutos.", 429);
    const t = await turmaPorCodigo(corpo.codigo);
    if (!t) {
      contarErro(ip, "escola-codigo", JANELA);
      return falha("Não achei essa turma. Confira o código com o professor.", 404);
    }
    return ok(t);
  }

  if (corpo.tipo === "aluno") {
    const chave = `${ip}|${String(corpo.alunoId).slice(0, 40)}`;
    if (errosEsgotados(chave, "escola-aluno", 8, JANELA) || errosEsgotados(ip, "escola-aluno-ip", 40, JANELA)) {
      return falha("Muitas tentativas. Chame o professor para conferir o cartão.", 429);
    }
    const aluno = await entrarAluno(corpo.codigo, corpo.alunoId, corpo.figuras);
    if (!aluno) {
      contarErro(chave, "escola-aluno", JANELA);
      contarErro(ip, "escola-aluno-ip", JANELA);
      return falha("As figuras não conferem. Tente de novo, na ordem do cartão.", 401);
    }
    const r = NextResponse.json({ ok: true, destino: rotaEscola("/aluno") });
    r.cookies.set(COOKIE_ESCOLA, criarSessaoEscola("aluno", aluno.id, marcaDoAluno(aluno)), opcoesCookie("aluno"));
    return r;
  }

  if (corpo.tipo === "equipe") {
    if (errosEsgotados(ip, "escola-equipe", 10, JANELA)) return falha("Muitas tentativas erradas. Espere uns minutos.", 429);
    const m = await entrarMembro(corpo.usuario, corpo.senha);
    if (!m) {
      contarErro(ip, "escola-equipe", JANELA);
      return falha("Usuário ou senha não conferem.", 401);
    }
    const destino = rotaEscola(m.papel === "coordenacao" ? "/coordenacao" : "/professor");
    const r = NextResponse.json({ ok: true, destino });
    r.cookies.set(COOKIE_ESCOLA, criarSessaoEscola(m.papel, m.id, marcaDoMembro(m)), opcoesCookie(m.papel));
    return r;
  }

  return falha("Pedido inválido.");
}
