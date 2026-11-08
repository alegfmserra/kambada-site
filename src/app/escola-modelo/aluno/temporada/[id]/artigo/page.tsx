import { notFound } from "next/navigation";
import { Etiqueta } from "@/components/escola/Marca";
import { LiOArtigo } from "@/components/escola/temporada/LiOArtigo";
import { ProximoPasso } from "@/components/escola/temporada/Trilha";
import { exigir } from "@/lib/escola/pagina";
import { temporadaAberta } from "@/lib/escola/liberacao";
import { trilhaDoAluno } from "@/lib/escola/temporadaServico";
import { temporadaPorId } from "@/lib/escola/temporadas";

export const metadata = { title: "Artigo da temporada" };

/** O artigo da temporada: o texto que explica (a revistinha e a animação contam; o artigo ensina e provoca). */
export default async function ArtigoDaTemporada({ params }: { params: Promise<{ id: string }> }) {
  const { aluno } = await exigir("aluno");
  const { id } = await params;
  const t = temporadaPorId(id);
  const passo = t?.passos.find((p) => p.tipo === "artigo" && p.atividade);
  if (!t?.artigo || !passo?.atividade) notFound();
  if (!(await temporadaAberta(t.id))) notFound();
  const trilha = await trilhaDoAluno(aluno, t);
  const a = t.artigo;
  const jaLeu = trilha.passos.find((p) => p.atividade === passo.atividade)?.estado === "feito";

  return (
    <article className="mx-auto max-w-2xl space-y-6">
      <header className="space-y-2">
        <Etiqueta>
          {t.emoji} Temporada de {t.titulo} · artigo
        </Etiqueta>
        <h1 className="font-display text-3xl font-extrabold leading-tight sm:text-4xl">{a.titulo}</h1>
        <p className="text-lg text-texto-suave">{a.linhaFina}</p>
      </header>
      {a.secoes.map((s) => (
        <section key={s.titulo} className="space-y-2">
          <h2 className="font-display text-xl font-bold">{s.titulo}</h2>
          <p className="text-lg leading-relaxed">{s.texto}</p>
        </section>
      ))}
      <aside className="rounded-3xl border-2 border-kambada-amarelo bg-kambada-amarelo/10 p-5">
        <p className="font-display text-lg font-extrabold">💭 Pra pensar (e levar para a redação)</p>
        <ul className="mt-2 space-y-1.5">
          {a.paraPensar.map((x) => (
            <li key={x}>• {x}</li>
          ))}
        </ul>
      </aside>
      {a.paraIrAlem
        ?.map((g) => ({ ...g, itens: g.itens.filter((i) => i.confirmado) }))
        .filter((g) => g.itens.length > 0)
        .map((g) => (
          <aside key={g.titulo} className="space-y-2 rounded-3xl bg-superficie p-5">
            <p className="font-display text-lg font-extrabold">🧭 {g.titulo}</p>
            <ul className="space-y-2">
              {g.itens.map((i) => (
                <li key={i.nome}>
                  <b>{i.nome}.</b> {i.texto}
                </li>
              ))}
            </ul>
          </aside>
        ))}
      <LiOArtigo atividade={passo.atividade} jaLeu={jaLeu} />
      <ProximoPasso trilha={trilha} atual={passo.atividade} />
    </article>
  );
}
