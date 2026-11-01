import { redirect } from "next/navigation";
import { rotaEscola } from "@/lib/escola/host";
import { quemNaPagina } from "@/lib/escola/pagina";
import { ranking } from "@/lib/escola/servico";

export const metadata = { title: "Ranking" };

const MEDALHA = ["🥇", "🥈", "🥉"];

export default async function RankingPagina() {
  const quem = await quemNaPagina();
  if (!quem) redirect(rotaEscola());
  const rank = await ranking();
  const meu = quem.papel === "aluno" ? quem.aluno.id : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Ranking da temporada 🏆</h1>
        <p className="text-texto-suave">Vale a melhor resposta de cada aluno em cada pergunta. Alunos sempre por apelido.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">Turmas</h2>
          <ol className="divide-y divide-borda rounded-2xl border border-borda">
            {rank.turmas.map((t, i) => (
              <li key={t.id} className="flex items-center gap-3 px-4 py-3">
                <span className="w-8 text-center text-lg">{MEDALHA[i] ?? `${i + 1}º`}</span>
                <span className="flex-1 font-semibold">{t.nome}</span>
                <span className="text-right">
                  <span className="block font-bold">{t.pontos.toLocaleString("pt-BR")} pts</span>
                  <span className="block text-xs text-texto-suave">{t.detalhe}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">Alunos</h2>
          <ol className="divide-y divide-borda rounded-2xl border border-borda">
            {rank.alunos.map((a, i) => (
              <li key={a.id} className={`flex items-center gap-3 px-4 py-2.5 ${a.id === meu ? "bg-kambada-amarelo/15 font-bold" : ""}`}>
                <span className="w-8 text-center">{MEDALHA[i] ?? `${i + 1}º`}</span>
                <span aria-hidden>{a.avatar}</span>
                <span className="flex-1">
                  {a.nome} <span className="text-xs font-normal text-texto-suave">· {a.detalhe}</span>
                </span>
                <span className="font-semibold">{a.pontos.toLocaleString("pt-BR")}</span>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </div>
  );
}
