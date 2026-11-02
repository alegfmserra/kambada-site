import { ArraialEscolaClient } from "@/components/escola/arraial/ArraialEscolaClient";
import { exigir } from "@/lib/escola/pagina";
import { MISSAO, missaoDoAluno, missaoPublica, trilhasDoAluno } from "@/lib/escola/servico";
import "@/components/play/arraial/arraial.css";

export const metadata = { title: "Arraial 3D" };

/**
 * A praça do Arraial (mesma do Kambada Play) com as perguntas da turma.
 * `?trilha=` escolhe o desafio (ou a missão de reforço); sem ele, vale o de Matemática da etapa.
 */
export default async function ArraialDaEscola({ searchParams }: { searchParams: Promise<{ trilha?: string }> }) {
  const { aluno, turma } = await exigir("aluno");
  const { trilha: pedida } = await searchParams;
  if (pedida === MISSAO) return <ArraialEscolaClient trilha={missaoPublica(turma, await missaoDoAluno(aluno, turma))} />;
  const trilhas = trilhasDoAluno(turma);
  const trilha = trilhas.find((t) => t.id === pedida) ?? trilhas.find((t) => t.disciplina === "Matemática") ?? trilhas[0];
  if (!trilha) return <p className="py-10 text-center">Esta turma ainda não tem desafios.</p>;
  return <ArraialEscolaClient trilha={trilha} />;
}
