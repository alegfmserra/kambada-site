import { minhaRedacao } from "./concursoServico";
import type { Aluno } from "./dados";
import { culturaDoAluno } from "./servico";
import { TEMPORADAS, TEMPORADA_DESTAQUE, situacaoDa, type Passo, type Temporada } from "./temporadas";

/**
 * Trilha da temporada para um aluno (somente servidor): o que ele já fez em
 * cada passo. A redação abre depois do quiz: primeiro brinca e aprende,
 * depois apresenta o que aprendeu (é o desenho pedagógico da temporada).
 */

export type EstadoPasso = "feito" | "aberto" | "travado" | "producao";
export type PassoDoAluno = Passo & { estado: EstadoPasso; detalhe?: string };
export type TrilhaDoAluno = { temporada: Temporada; passos: PassoDoAluno[]; feitos: number; total: number; situacao: ReturnType<typeof situacaoDa> };

export async function trilhaDoAluno(aluno: Aluno, t: Temporada): Promise<TrilhaDoAluno> {
  const [feitos, redacao] = await Promise.all([culturaDoAluno(aluno.id), t.passos.some((p) => p.tipo === "redacao" && p.caminho) ? minhaRedacao(aluno) : null]);
  const quiz = t.passos.find((p) => p.tipo === "quiz" && p.caminho);
  const quizFeito = !quiz || !!(quiz.atividade && feitos[quiz.atividade]);
  const passos = t.passos.map((p): PassoDoAluno => {
    if (!p.caminho) return { ...p, estado: "producao" };
    if (p.tipo === "redacao") {
      if (redacao?.enviada) return { ...p, estado: "feito", detalhe: redacao.avaliacao ? `nota ${redacao.avaliacao.total}/20` : "enviada" };
      return { ...p, estado: quizFeito ? "aberto" : "travado", detalhe: redacao?.texto ? "rascunho guardado" : undefined };
    }
    const f = p.atividade ? feitos[p.atividade] : undefined;
    return { ...p, estado: f ? "feito" : "aberto", detalhe: f?.melhor };
  });
  const comConteudo = passos.filter((p) => p.estado !== "producao");
  return { temporada: t, passos, feitos: comConteudo.filter((p) => p.estado === "feito").length, total: comConteudo.length, situacao: situacaoDa(t) };
}

/** Todas as temporadas do ano, com o progresso do aluno; a de destaque primeiro. */
export async function temporadasDoAluno(aluno: Aluno): Promise<TrilhaDoAluno[]> {
  const lista = await Promise.all(TEMPORADAS.map((t) => trilhaDoAluno(aluno, t)));
  return [...lista.filter((x) => x.temporada.id === TEMPORADA_DESTAQUE), ...lista.filter((x) => x.temporada.id !== TEMPORADA_DESTAQUE)];
}
