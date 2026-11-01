import Link from "next/link";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { pontosDoAluno, ranking, trilhasDoAluno } from "@/lib/escola/servico";

export const metadata = { title: "Desafios" };

export default async function AlunoInicio() {
  const { aluno, turma } = await exigir("aluno");
  const [meus, rank] = await Promise.all([pontosDoAluno(aluno.id), ranking(turma.id)]);
  const trilhas = trilhasDoAluno(turma);
  const posicao = rank.alunos.findIndex((a) => a.id === aluno.id) + 1;

  return (
    <div className="space-y-8">
      <section className="flex flex-wrap items-center gap-4 rounded-3xl bg-kambada-grafite p-6 text-white">
        <span className="text-6xl" aria-hidden>{aluno.avatar}</span>
        <div>
          <h1 className="font-display text-3xl font-extrabold">Éguas, {aluno.apelido}!</h1>
          <p className="text-white/80">Escolha um desafio. Errou? Tem uma segunda chance com dica.</p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-display text-4xl font-extrabold text-kambada-amarelo">{meus.pontos}</p>
          <p className="text-sm text-white/70">pontos{posicao > 0 ? ` · ${posicao}º da turma` : ""}</p>
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-display text-xl font-bold">Desafios da turma</h2>
        <ul className="grid gap-4 sm:grid-cols-2">
          {trilhas.map((t) => {
            const p = meus.porTrilha[t.id];
            return (
              <li key={t.id}>
                <Link href={rotaEscola(`/aluno/${t.id}`)} className="flex h-full flex-col rounded-3xl border-2 border-borda p-5 transition-colors hover:border-kambada-amarelo">
                  <div className="flex items-center justify-between">
                    <span className="text-4xl" aria-hidden>{t.emoji}</span>
                    <span className="rounded-full bg-superficie px-3 py-1 text-xs font-bold">{t.disciplina}</span>
                  </div>
                  <h3 className="mt-3 font-display text-xl font-bold">{t.titulo}</h3>
                  <p className="mt-1 flex-1 text-sm text-texto-suave">{t.resumo}</p>
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-superficie">
                      <div className="h-full rounded-full bg-kambada-amarelo" style={{ width: `${Math.round(((p?.feitas ?? 0) / t.total) * 100)}%` }} />
                    </div>
                    <p className="mt-1 text-xs text-texto-suave">
                      {p ? `${p.feitas} de ${t.total} feitas · ${p.primeira} de primeira` : `${t.total} perguntas · ainda não jogou`}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="font-display text-xl font-bold">Ranking do {turma.nome}</h2>
          <Link href={rotaEscola("/ranking")} className="text-sm font-semibold underline">Ver todas as turmas</Link>
        </div>
        <ol className="divide-y divide-borda rounded-2xl border border-borda">
          {rank.alunos.slice(0, 5).map((a, i) => (
            <li key={a.id} className={`flex items-center gap-3 px-4 py-3 ${a.id === aluno.id ? "bg-kambada-amarelo/15 font-bold" : ""}`}>
              <span className="w-6 text-center">{["🥇", "🥈", "🥉"][i] ?? `${i + 1}º`}</span>
              <span aria-hidden>{a.avatar}</span>
              <span className="flex-1">{a.nome}</span>
              <span className="font-semibold">{a.pontos}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
