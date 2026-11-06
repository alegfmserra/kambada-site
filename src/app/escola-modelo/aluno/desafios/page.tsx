import Link from "next/link";
import { COR_DISCIPLINA, Etiqueta, FalaKambadinha, SeloDisciplina, TituloDuo } from "@/components/escola/Marca";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { MISSAO, missaoDoAluno, pontosDoAluno, trilhasDoAluno } from "@/lib/escola/servico";

export const metadata = { title: "Desafios" };

/** Os desafios das matérias: a tela de perguntas, o mesmo desafio no Arraial 3D e a missão de reforço. */
export default async function DesafiosDoAluno() {
  const { aluno, turma } = await exigir("aluno");
  const [meus, treinar] = await Promise.all([pontosDoAluno(aluno.id), missaoDoAluno(aluno, turma)]);
  const trilhas = trilhasDoAluno(turma);

  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <Etiqueta>Desafios · {turma.nome}</Etiqueta>
        <TituloDuo antes="Os desafios" destaque="da turma" />
        <FalaKambadinha>Escolhe um desafio. Errou? Tem segunda chance com a minha dica. Os pontos vão para o ranking!</FalaKambadinha>
      </section>

      {treinar.length > 0 && (
        <Link
          href={rotaEscola(`/aluno/arraial?trilha=${MISSAO}`)}
          className="flex flex-wrap items-center gap-3 rounded-3xl border-2 border-kambada-amarelo bg-kambada-amarelo/10 p-5 transition-colors hover:bg-kambada-amarelo/20"
        >
          <span className="text-4xl" aria-hidden>🎯</span>
          <span className="min-w-[12rem] flex-1">
            <b className="block font-display text-xl">Missão de reforço</b>
            <span className="text-sm text-texto-suave">
              No Arraial 3D, o povo da festa te ajuda a treinar: <b className="text-texto">{treinar.map((p) => p.habilidade).join(" · ")}</b>
            </span>
          </span>
          <span className="rounded-full bg-kambada-amarelo px-4 py-2 text-sm font-bold text-kambada-grafite">Começar a missão →</span>
        </Link>
      )}

      <ul className="grid gap-4 sm:grid-cols-2">
        {trilhas.map((t) => {
          const p = meus.porTrilha[t.id];
          const cor = COR_DISCIPLINA[t.disciplina];
          return (
            <li key={t.id} className="relative flex flex-col overflow-hidden rounded-3xl border-2 border-borda p-5">
              <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: cor }} aria-hidden />
              <div className="flex items-center justify-between">
                <span className="grid h-14 w-14 place-items-center rounded-2xl text-3xl" style={{ background: `${cor}33` }} aria-hidden>
                  {t.emoji}
                </span>
                <SeloDisciplina disciplina={t.disciplina} />
              </div>
              <h2 className="mt-3 font-display text-xl font-extrabold">{t.titulo}</h2>
              <p className="mt-1 flex-1 text-sm text-texto-suave">{t.resumo}</p>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-superficie">
                <div className="h-full rounded-full" style={{ width: `${Math.round(((p?.feitas ?? 0) / t.total) * 100)}%`, background: cor }} />
              </div>
              <p className="mt-2 text-xs text-texto-suave">{p ? `${p.feitas} de ${t.total} feitas · ${p.primeira} de primeira` : `${t.total} perguntas · ainda não jogou`}</p>
              {/* Dois jeitos de jogar o mesmo desafio: os pontos são os mesmos. */}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={rotaEscola(`/aluno/${t.id}`)} className="rounded-full bg-kambada-amarelo px-4 py-2 text-sm font-bold text-kambada-grafite hover:bg-kambada-amarelo-escuro">
                  {p ? "Continuar" : "Jogar"} →
                </Link>
                <Link href={rotaEscola(`/aluno/arraial?trilha=${t.id}`)} className="rounded-full border-2 border-borda px-4 py-2 text-sm font-bold hover:border-kambada-amarelo">
                  🎉 No Arraial 3D
                </Link>
              </div>
            </li>
          );
        })}
      </ul>

      <p className="text-center text-sm text-texto-suave">
        Quer ver como tu tá em cada matéria? <Link href={rotaEscola("/aluno/notas")} className="font-semibold underline">Minhas notas →</Link>
      </p>
    </div>
  );
}
