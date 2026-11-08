import { redirect } from "next/navigation";
import { rotaEscola } from "@/lib/escola/host";
import { quemNaPagina } from "@/lib/escola/pagina";
import { ganhoDaSemana, ranking, type LinhaRanking } from "@/lib/escola/servico";

export const metadata = { title: "Ranking" };

const MEDALHA = ["🥇", "🥈", "🥉"];
const TOPO = 10;

function Linha({ a, i, meu }: { a: LinhaRanking; i: number; meu: boolean }) {
  return (
    <li className={`flex items-center gap-3 px-4 py-2.5 ${meu ? "bg-kambada-amarelo/15 font-bold" : ""}`} aria-current={meu ? "true" : undefined}>
      <span className="w-8 text-center">{MEDALHA[i] ?? `${i + 1}º`}</span>
      <span aria-hidden>{a.avatar}</span>
      <span className="flex-1">
        {a.nome} {meu && <span className="rounded-full bg-kambada-amarelo px-2 py-0.5 text-xs text-kambada-grafite">tu</span>}{" "}
        <span className="text-xs font-normal text-texto-suave">· {a.detalhe}</span>
      </span>
      <span className="font-semibold">{a.pontos.toLocaleString("pt-BR")}</span>
    </li>
  );
}

/**
 * Ranking da temporada. Quem está vendo sempre acha a própria linha (sem
 * rolar a lista) e, se for aluno, vê primeiro o próprio progresso da semana:
 * a comparação com ele mesmo vem antes da comparação com os outros.
 */
export default async function RankingPagina() {
  const quem = await quemNaPagina();
  if (!quem) redirect(rotaEscola());
  const meu = quem.papel === "aluno" ? quem.aluno.id : null;
  const [rank, semana] = await Promise.all([ranking(), meu ? ganhoDaSemana(meu) : Promise.resolve(0)]);
  const minha = meu ? rank.alunos.findIndex((a) => a.id === meu) : -1;
  // Fora do topo: mostra a vizinhança (um acima, eu, um abaixo).
  const vizinhos = minha >= TOPO ? rank.alunos.slice(minha - 1, minha + 2).map((a, k) => ({ a, i: minha - 1 + k })) : [];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Ranking da temporada 🏆</h1>
        <p className="text-texto-suave">Vale a melhor resposta de cada aluno em cada pergunta. Turmas pela média por aluno, para turma grande e pequena valerem igual. Alunos sempre por apelido.</p>
      </div>

      {meu && minha >= 0 && (
        <section className="flex flex-wrap items-center gap-4 rounded-3xl bg-kambada-grafite p-5 text-white">
          <span className="text-4xl" aria-hidden>{quem.papel === "aluno" ? quem.aluno.avatar : ""}</span>
          <span className="flex-1">
            <b className="block font-display text-xl">
              {rank.alunos[minha].pontos.toLocaleString("pt-BR")} pontos · {minha + 1}º de {rank.alunos.length} na escola
            </b>
            <span className="text-sm text-white/80">
              {semana > 0 ? `Esta semana tu ganhou +${semana} pontos. Continua assim!` : "Esta semana ainda sem pontos novos: cada desafio feito soma."}
            </span>
          </span>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">Turmas</h2>
          <ol className="divide-y divide-borda rounded-2xl border border-borda">
            {rank.turmas.map((t, i) => (
              <li key={t.id} className={`flex items-center gap-3 px-4 py-3 ${quem.papel === "aluno" && t.id === quem.turma.id ? "bg-kambada-amarelo/15" : ""}`}>
                <span className="w-8 text-center text-lg">{MEDALHA[i] ?? `${i + 1}º`}</span>
                <span className="flex-1 font-semibold">{t.nome}</span>
                <span className="text-right">
                  <span className="block font-bold">{t.pontos.toLocaleString("pt-BR")} por aluno</span>
                  <span className="block text-xs text-texto-suave">{t.detalhe}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>
        <section>
          <h2 className="mb-3 font-display text-xl font-bold">Alunos</h2>
          <ol className="divide-y divide-borda rounded-2xl border border-borda">
            {rank.alunos.slice(0, TOPO).map((a, i) => (
              <Linha key={a.id} a={a} i={i} meu={a.id === meu} />
            ))}
          </ol>
          {vizinhos.length > 0 && (
            <>
              <p className="py-2 text-center text-texto-suave" aria-hidden>⋯</p>
              <ol className="divide-y divide-borda rounded-2xl border border-borda">
                {vizinhos.map(({ a, i }) => (
                  <Linha key={a.id} a={a} i={i} meu={a.id === meu} />
                ))}
              </ol>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
