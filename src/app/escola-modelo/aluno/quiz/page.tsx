import Link from "next/link";
import { Etiqueta, FalaKambadinha, TituloDuo } from "@/components/escola/Marca";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { ASSUNTOS, PERGUNTAS_POR_PROVA, atividadeDoQuiz } from "@/lib/escola/quizzes";
import { culturaDoAluno } from "@/lib/escola/servico";

export const metadata = { title: "Quiz" };

/** Hub de quiz: "qual o assunto de hoje?". Cada prova sorteia 8 perguntas do banco do assunto. */
export default async function QuizHub() {
  const { aluno } = await exigir("aluno");
  const feitos = await culturaDoAluno(aluno.id);
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <Etiqueta>Quiz</Etiqueta>
        <TituloDuo antes="Qual é o assunto" destaque="de hoje?" />
        <FalaKambadinha>Escolhe o assunto. Cada vez que tu abre, vêm {PERGUNTAS_POR_PROVA} perguntas diferentes!</FalaKambadinha>
      </section>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ASSUNTOS.map((a) => {
          const f = feitos[atividadeDoQuiz(a.id)];
          return (
            <li key={a.id}>
              <Link
                href={rotaEscola(`/aluno/quiz/${a.id}`)}
                className="flex h-full flex-col rounded-3xl border-2 border-borda p-5 transition-all hover:-translate-y-0.5 hover:border-kambada-amarelo"
              >
                <span className="text-4xl" aria-hidden>{a.emoji}</span>
                <b className="mt-2 font-display text-xl">{a.titulo}</b>
                <span className="mt-1 flex-1 text-sm text-texto-suave">{a.resumo}</span>
                <span className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-texto-suave">{f ? `✓ ${f.vezes}×${f.melhor ? ` · melhor ${f.melhor}` : ""}` : `${a.banco.length} perguntas no banco`}</span>
                  <span className="rounded-full bg-kambada-amarelo px-3 py-1 font-bold text-kambada-grafite">{f ? "De novo" : "Começar"} →</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
