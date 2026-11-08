import { corpoJson } from "@/lib/play/jogos/limite";
import { avaliarRedacao, darColocacao, escolherRepresentante, marcarFinalista, tirarCorrecao, tirarRedacaoDoAluno } from "@/lib/escola/concursoServico";
import { liberarTemporada } from "@/lib/escola/liberacao";
import { falha, membroQuePede, ok, tratar } from "@/lib/escola/api";
import {
  ativarMembro,
  criarAluno,
  criarMembro,
  criarTurma,
  editarEscola,
  editarMembro,
  editarTurma,
  marcaDoMembro,
  nomearAluno,
  novaSenhaMembro,
  novasFiguras,
  novoCodigoTurma,
  permissao,
  removerAluno,
  removerMembro,
  removerTurma,
  restaurarDemonstracao,
  trocarSenha,
  vincular,
} from "@/lib/escola/servico";
import { COOKIE_ESCOLA, criarSessaoEscola, opcoesCookie } from "@/lib/escola/sessao";
import { NextResponse } from "next/server";

/**
 * Gestão do portal: professor (só nas turmas dele e conforme as permissões),
 * coordenação (a escola) e gestão Kambada (o hub: tudo, inclusive permissões).
 * As permissões são conferidas em `servico.ts`, não aqui.
 */
export async function POST(req: Request) {
  const m = await membroQuePede(req);
  if (!m) return falha("Entre como professor ou coordenação.", 401);
  const c = await corpoJson(req);
  if (!c) return falha("Pedido inválido.");
  try {
    switch (c.acao) {
      case "liberar-temporada":
        await liberarTemporada(m, c.temporada, c.ligada);
        return ok();
      case "criar-aluno":
        return ok({ aluno: await criarAluno(m, String(c.turma), c.apelido, c.nome) });
      case "nomear-aluno":
        return ok({ aluno: await nomearAluno(m, c.aluno, c.nome) });
      case "novas-figuras":
        return ok({ aluno: await novasFiguras(m, c.aluno) });
      case "remover-aluno":
        await removerAluno(m, c.aluno);
        return ok();
      case "criar-professor":
        return ok({ acesso: await criarMembro(m, { nome: c.nome, usuario: c.usuario, papel: "professor", disciplinas: c.disciplinas, turmas: c.turmas }) });
      case "criar-membro":
        return ok({ acesso: await criarMembro(m, { nome: c.nome, usuario: c.usuario, papel: c.papel, disciplinas: c.disciplinas, turmas: c.turmas, permissoes: c.permissoes }) });
      case "editar-membro":
        await editarMembro(m, c.membro, c);
        return ok();
      case "permissao":
        await permissao(m, c.membro, c.permissao, c.ligada);
        return ok();
      case "ativar-membro":
        await ativarMembro(m, c.membro, c.ativo);
        return ok();
      case "nova-senha-professor":
        return ok({ acesso: await novaSenhaMembro(m, c.professor ?? c.membro) });
      case "remover-professor":
        await removerMembro(m, c.professor ?? c.membro);
        return ok();
      case "avaliar-redacao":
        await avaliarRedacao(m, c.redacao, c.notas, c.comentario);
        return ok();
      case "finalista":
        await marcarFinalista(m, c.redacao, c.ligado);
        return ok();
      case "representante":
        await escolherRepresentante(m, c.redacao);
        return ok();
      case "tirar-redacao":
        await tirarRedacaoDoAluno(m, c.redacao);
        return ok();
      case "tirar-correcao":
        await tirarCorrecao(m, c.redacao);
        return ok();
      case "colocacao":
        await darColocacao(m, c.redacao, c.colocacao);
        return ok();
      case "vincular":
        await vincular(m, c.professor, c.turma, c.ligado);
        return ok();
      case "criar-turma":
        return ok({ turma: await criarTurma(m, c.nome, c.etapa, c.professores) });
      case "editar-turma":
        await editarTurma(m, c.turma, c.nome, c.etapa);
        return ok();
      case "novo-codigo":
        return ok({ turma: await novoCodigoTurma(m, c.turma) });
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
