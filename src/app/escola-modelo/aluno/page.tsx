import Link from "next/link";
import { COR_DISCIPLINA, Etiqueta, FalaKambadinha, SeloDisciplina } from "@/components/escola/Marca";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { MISSAO, escolaPublica, missaoDoAluno, pontosDoAluno, ranking, trilhasDoAluno } from "@/lib/escola/servico";

export const metadata = { title: "Desafios" };

const MEDALHA = ["🥇", "🥈", "🥉"];

export default async function AlunoInicio() {
  const { aluno, turma } = await exigir("aluno");
  const [meus, rank, escola, treinar] = await Promise.all([pontosDoAluno(aluno.id), ranking(turma.id), escolaPublica(), missaoDoAluno(aluno, turma)]);
  const trilhas = trilhasDoAluno(turma);
  const posicao = rank.alunos.findIndex((a) => a.id === aluno.id) + 1;
  const comecou = Object.keys(meus.porTrilha).length > 0;

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-kambada-grafite p-6 text-white ring-1 ring-white/10 sm:p-8">
        <div className="flex flex-wrap items-center gap-6">
          <div className="min-w-[16rem] flex-1 space-y-4">
            <Etiqueta escuro>{turma.nome} · {escola.temporada.titulo}</Etiqueta>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">
              {aluno.avatar} <span className="text-kambada-amarelo">{aluno.apelido}</span>
            </h1>
            <FalaKambadinha escuro>
              {comecou ? "Bora continuar? Errou, tem segunda chance com a minha dica!" : "Éguas, que bom te ver! Escolhe um desafio aí embaixo."}
            </FalaKambadinha>
          </div>
          <div className="rounded-2xl bg-white/10 px-6 py-4 text-center">
            <p className="font-display text-5xl font-extrabold text-kambada-amarelo">{meus.pontos}</p>
            <p className="text-sm text-white/75">pontos</p>
            {posicao > 0 && <p className="mt-1 text-sm font-bold">{MEDALHA[posicao - 1] ?? `${posicao}º`} da turma</p>}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-3xl bg-kambada-grafite p-6 text-white ring-2 ring-kambada-amarelo sm:p-8">
        <Etiqueta escuro>Novo · Arraial em 3D</Etiqueta>
        <h2 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">
          Joga o desafio <span className="text-kambada-amarelo">andando pela festa</span>
        </h2>
        <p className="mt-2 max-w-xl text-sm text-white/80">
          Anda pela praça do São João, conversa com o povo do arraial e responde as perguntas para juntar as cinco fitinhas. Os pontos valem igual aos do desafio.
        </p>
        {treinar.length > 0 && (
          <Link
            href={rotaEscola(`/aluno/arraial?trilha=${MISSAO}`)}
            className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-kambada-amarelo bg-kambada-amarelo/10 p-4 transition-colors hover:bg-kambada-amarelo/20"
          >
            <span className="text-3xl" aria-hidden>🎯</span>
            <span className="min-w-[12rem] flex-1">
              <b className="block font-display text-lg text-kambada-amarelo">Missão de reforço</b>
              <span className="text-sm text-white/85">
                O povo do arraial vai te ajudar a treinar: <b>{treinar.map((p) => p.habilidade).join(" · ")}</b>
              </span>
            </span>
            <span className="rounded-full bg-kambada-amarelo px-4 py-2 text-sm font-bold text-kambada-grafite">Começar a missão →</span>
          </Link>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {trilhas.map((t) => (
            <Link
              key={t.id}
              href={rotaEscola(`/aluno/arraial?trilha=${t.id}`)}
              className="rounded-full bg-kambada-amarelo px-4 py-2 text-sm font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
            >
              {t.emoji} {t.titulo} no Arraial →
            </Link>
          ))}
        </div>
      </section>

      <section>
        <Etiqueta>Desafios da turma</Etiqueta>
        <ul className="mt-3 grid gap-4 sm:grid-cols-2">
          {trilhas.map((t) => {
            const p = meus.porTrilha[t.id];
            const cor = COR_DISCIPLINA[t.disciplina];
            return (
              <li key={t.id}>
                <Link
                  href={rotaEscola(`/aluno/${t.id}`)}
                  className="group relative flex h-full flex-col overflow-hidden rounded-3xl border-2 border-borda p-5 transition-all hover:-translate-y-0.5 hover:border-kambada-amarelo"
                >
                  <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: cor }} aria-hidden />
                  <div className="flex items-center justify-between">
                    <span className="grid h-14 w-14 place-items-center rounded-2xl text-3xl" style={{ background: `${cor}33` }} aria-hidden>
                      {t.emoji}
                    </span>
                    <SeloDisciplina disciplina={t.disciplina} />
                  </div>
                  <h2 className="mt-3 font-display text-xl font-extrabold">{t.titulo}</h2>
                  <p className="mt-1 flex-1 text-sm text-texto-suave">{t.resumo}</p>
                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-superficie">
                      <div className="h-full rounded-full" style={{ width: `${Math.round(((p?.feitas ?? 0) / t.total) * 100)}%`, background: cor }} />
                    </div>
                    <div className="mt-2 flex items-center justify-between text-xs text-texto-suave">
                      <span>{p ? `${p.feitas} de ${t.total} feitas · ${p.primeira} de primeira` : `${t.total} perguntas · ainda não jogou`}</span>
                      <span className="rounded-full bg-kambada-amarelo px-3 py-1 font-bold text-kambada-grafite">{p ? "Continuar" : "Jogar"} →</span>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <Etiqueta>Ranking do {turma.nome}</Etiqueta>
          <Link href={rotaEscola("/ranking")} className="text-sm font-semibold underline">Ver todas as turmas</Link>
        </div>
        <ol className="divide-y divide-borda overflow-hidden rounded-2xl border border-borda">
          {rank.alunos.slice(0, 5).map((a, i) => (
            <li key={a.id} className={`flex items-center gap-3 px-4 py-3 ${a.id === aluno.id ? "bg-kambada-amarelo/15 font-bold" : ""}`}>
              <span className="w-6 text-center">{MEDALHA[i] ?? `${i + 1}º`}</span>
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
