import { notFound } from "next/navigation";
import { Desafio } from "@/components/escola/Desafio";
import { exigir } from "@/lib/escola/pagina";
import { MISSAO, missaoDoAluno, missaoPublica, trilhasDoAluno } from "@/lib/escola/servico";

export const metadata = { title: "Desafio" };

export default async function DesafioPagina({ params }: { params: Promise<{ trilha: string }> }) {
  const { aluno, turma } = await exigir("aluno");
  const { trilha } = await params;
  const t = trilha === MISSAO ? missaoPublica(turma, await missaoDoAluno(aluno, turma)) : trilhasDoAluno(turma).find((x) => x.id === trilha);
  if (!t) notFound();
  return <Desafio trilha={t} />;
}
