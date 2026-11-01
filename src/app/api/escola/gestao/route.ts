import { corpoJson } from "@/lib/play/jogos/limite";
import { falha, membroQuePede, ok, tratar } from "@/lib/escola/api";
import {
  criarAluno,
  criarProfessor,
  criarTurma,
  editarEscola,
  marcaDoMembro,
  novaSenhaProfessor,
  novasFiguras,
  removerAluno,
  removerProfessor,
  removerTurma,
  restaurarDemonstracao,
  trocarSenha,
  vincular,
} from "@/lib/escola/servico";
import { COOKIE_ESCOLA, criarSessaoEscola, opcoesCookie } from "@/lib/escola/sessao";
import { NextResponse } from "next/server";

/**
 * Gestão do portal: professor (só nas turmas dele) e coordenação (tudo).
 * As permissões são conferidas em `servico.ts`, não aqui.
 */
export async function POST(req: Request) {
  const m = await membroQuePede(req);
  if (!m) return falha("Entre como professor ou coordenação.", 401);
  const c = await corpoJson(req);
  if (!c) return falha("Pedido inválido.");
  try {
    switch (c.acao) {
      case "criar-aluno":
        return ok({ aluno: await criarAluno(m, String(c.turma), c.apelido) });
      case "novas-figuras":
        return ok({ aluno: await novasFiguras(m, c.aluno) });
      case "remover-aluno":
        await removerAluno(m, c.aluno);
        return ok();
      case "criar-professor":
        return ok({ acesso: await criarProfessor(m, c.nome, c.usuario, c.disciplinas, c.turmas) });
      case "nova-senha-professor":
        return ok({ acesso: await novaSenhaProfessor(m, c.professor) });
      case "remover-professor":
        await removerProfessor(m, c.professor);
        return ok();
      case "vincular":
        await vincular(m, c.professor, c.turma, c.ligado);
        return ok();
      case "criar-turma":
        return ok({ turma: await criarTurma(m, c.nome, c.etapa, c.professores) });
      case "remover-turma":
        await removerTurma(m, c.turma);
        return ok();
      case "editar-escola":
        await editarEscola(m, c);
        return ok();
      case "restaurar-demo":
        await restaurarDemonstracao(m);
        return ok();
      case "trocar-senha": {
        const atualizado = await trocarSenha(m, c.atual, c.nova);
        // A sessão é presa à senha: renova o cookie para quem trocou não cair.
        const r = NextResponse.json({ ok: true });
        r.cookies.set(COOKIE_ESCOLA, criarSessaoEscola(atualizado.papel, atualizado.id, marcaDoMembro(atualizado)), opcoesCookie(atualizado.papel));
        return r;
      }
      default:
        return falha("Pedido inválido.");
    }
  } catch (e) {
    return tratar(e);
  }
}
