import { minhaRedacao } from "./concursoServico";
import type { Aluno } from "./dados";
import { culturaDoAluno } from "./servico";
import { TEMPORADAS, TEMPORADA_DESTAQUE, situacaoDa, type Passo, type Temporada } from "./temporadas";

/**
 * Trilha da temporada para um aluno (somente servidor): o que ele já fez em
 * cada passo. A redação fecha a trilha: é escrita à mão em sala e conta
 * como feita quando o professor anexa a folha.
 */

export type EstadoPasso = "feito" | "aberto" | "travado" | "producao";
export type PassoDoAluno = Passo & { estado: EstadoPasso; detalhe?: string };
export type TrilhaDoAluno = { temporada: Temporada; passos: PassoDoAluno[]; feitos: number; total: number; situacao: ReturnType<typeof situacaoDa> };

export async function trilhaDoAluno(aluno: Aluno, t: Temporada): Promise<TrilhaDoAluno> {
  const [feitos, redacao] = await Promise.all([culturaDoAluno(aluno.id), t.passos.some((p) => p.tipo === "redacao" && p.caminho) ? minhaRedacao(aluno) : null]);
  const passos = t.passos.map((p): PassoDoAluno => {
    if (!p.caminho) return { ...p, estado: "producao" };
    if (p.tipo === "redacao") {
      // A redação é escrita à mão em sala; "feito" quando o professor anexa a folha.
      if (redacao?.enviada) return { ...p, estado: "feito", detalhe: redacao.avaliacao ? `nota ${redacao.avaliacao.total}/20` : "entregue" };
      return { ...p, estado: "aberto", detalhe: "na folha, em sala" };
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
