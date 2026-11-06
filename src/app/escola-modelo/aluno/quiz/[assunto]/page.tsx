import Link from "next/link";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { Perguntas } from "@/components/escola/cultura/Perguntas";
import { Etiqueta } from "@/components/escola/Marca";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { assuntoPorId, atividadeDoQuiz, sortearProva } from "@/lib/escola/quizzes";
import { TEMPORADAS } from "@/lib/escola/temporadas";

export const metadata = { title: "Quiz" };

/** Uma prova do assunto: 8 perguntas sorteadas a cada vez que a página abre. */
export default async function ProvaDoQuiz({ params }: { params: Promise<{ assunto: string }> }) {
  await connection();
  await exigir("aluno");
  const { assunto } = await params;
  const a = assuntoPorId(assunto);
  if (!a) notFound();
  const atividade = atividadeDoQuiz(a.id);
  const prova = sortearProva(a);
  const temporada = TEMPORADAS.find((t) => t.passos.some((p) => p.atividade === atividade));

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex flex-wrap justify-between gap-2 text-sm font-semibold">
        <Link href={rotaEscola("/aluno/quiz")} className="underline">
          ← Outros assuntos
        </Link>
        {temporada && (
          <Link href={rotaEscola(`/aluno/temporada/${temporada.id}`)} className="underline">
            Trilha da temporada: {temporada.titulo} →
          </Link>
        )}
      </div>
      <header className="space-y-2">
        <Etiqueta>Quiz · {a.banco.length} perguntas no banco</Etiqueta>
        <h1 className="font-display text-3xl font-extrabold">
          <span aria-hidden>{a.emoji}</span> {a.titulo}
        </h1>
        <p className="text-texto-suave">{prova.length} perguntas sorteadas para ti. Quer outras? É só abrir de novo.</p>
      </header>
      {/* key: uma prova nova a cada carga, sem resto de estado da anterior. */}
      <Perguntas key={prova.map((q) => q.pergunta).join("|")} atividade={atividade} perguntas={prova} titulo={a.titulo} />
      {/* Link comum (não o do Next): a página recarrega e o servidor sorteia de novo. */}
      <a href={rotaEscola(`/aluno/quiz/${a.id}`)} className="block text-center text-sm font-semibold underline">
        🔀 Sortear outra prova
      </a>
    </div>
  );
}
