import { notFound } from "next/navigation";
import { Perguntas } from "@/components/escola/cultura/Perguntas";
import { Etiqueta } from "@/components/escola/Marca";
import { ProximoPasso } from "@/components/escola/temporada/Trilha";
import { exigir } from "@/lib/escola/pagina";
import { trilhaDoAluno } from "@/lib/escola/temporadaServico";
import { temporadaPorId } from "@/lib/escola/temporadas";

export const metadata = { title: "Quiz da temporada" };

/** O quiz da temporada: só sobre o tema, a partir do artigo, da revistinha e do jogo. Feito, a redação abre. */
export default async function QuizDaTemporada({ params }: { params: Promise<{ id: string }> }) {
  const { aluno } = await exigir("aluno");
  const { id } = await params;
  const t = temporadaPorId(id);
  const passo = t?.passos.find((p) => p.tipo === "quiz" && p.atividade);
  if (!t?.quiz || !passo?.atividade) notFound();
  const trilha = await trilhaDoAluno(aluno, t);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <Etiqueta>
          {t.emoji} Temporada de {t.titulo} · quiz
        </Etiqueta>
        <h1 className="font-display text-3xl font-extrabold">{passo.titulo}</h1>
        <p className="text-texto-suave">{t.quiz.length} perguntas sobre o que tu viu no artigo, no jogo e na revistinha. Terminou, a redação abre!</p>
      </header>
      <Perguntas atividade={passo.atividade} perguntas={t.quiz} titulo={passo.titulo} />
      <ProximoPasso trilha={trilha} atual={passo.atividade} />
    </div>
  );
}
