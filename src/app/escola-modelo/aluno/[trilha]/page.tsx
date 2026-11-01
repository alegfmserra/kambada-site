import { notFound } from "next/navigation";
import { Desafio } from "@/components/escola/Desafio";
import { exigir } from "@/lib/escola/pagina";
import { trilhasDoAluno } from "@/lib/escola/servico";

export const metadata = { title: "Desafio" };

export default async function DesafioPagina({ params }: { params: Promise<{ trilha: string }> }) {
  const { turma } = await exigir("aluno");
  const { trilha } = await params;
  const t = trilhasDoAluno(turma).find((x) => x.id === trilha);
  if (!t) notFound();
  return <Desafio trilha={t} />;
}
