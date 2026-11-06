import Link from "next/link";
import { Escrever } from "@/components/escola/concurso/Escrever";
import { Etiqueta, FalaKambadinha, TituloDuo } from "@/components/escola/Marca";
import { CONCURSO, CRITERIOS } from "@/lib/escola/concurso";
import { minhaRedacao, resultadoDoConcurso } from "@/lib/escola/concursoServico";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { NOME_ETAPA } from "@/lib/escola/tipos";

export const metadata = { title: "Concurso de redação" };

const FASES = [
  ["✍️", "Tu escreve", "com o que aprendeu na temporada"],
  ["🧑‍🏫", "O professor avalia", "e escolhe até 3 finalistas da turma"],
  ["🏫", "A escola escolhe", "a redação que vai representá-la"],
  ["🏆", "A rede Kambada premia", "as melhores entre as escolas"],
];

/** Concurso de redação da temporada (Carnaval de São Luís), lado do aluno. */
export default async function ConcursoDoAluno() {
  const { aluno, turma } = await exigir("aluno");
  const [minha, premiadas] = await Promise.all([minhaRedacao(aluno), resultadoDoConcurso()]);
  const p = CONCURSO.propostas[turma.etapa];
  const daEtapa = premiadas.filter((x) => x.etapa === turma.etapa);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <section className="space-y-4">
        <Etiqueta>Concurso · temporada de {CONCURSO.temporada}</Etiqueta>
        <TituloDuo antes="Concurso de Redação:" destaque="Carnaval de São Luís" />
        <FalaKambadinha>{CONCURSO.chamada}</FalaKambadinha>
        <ol className="grid gap-2 sm:grid-cols-4">
          {FASES.map(([e, t, s], i) => (
            <li key={t} className="rounded-2xl border-2 border-borda p-3 text-sm">
              <span className="text-2xl" aria-hidden>{e}</span>
              <b className="mt-1 block">{i + 1}. {t}</b>
              <span className="text-texto-suave">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      {daEtapa.length > 0 && (
        <section className="rounded-3xl bg-kambada-grafite p-5 text-white">
          <p className="font-display text-xl font-extrabold text-kambada-amarelo">🏆 Resultado da rede · {NOME_ETAPA[turma.etapa]}</p>
          <ol className="mt-3 space-y-1.5">
            {daEtapa.map((x) => (
              <li key={x.colocacao}>
                <b>{x.colocacao}º</b> · {x.avatar} {x.apelido} · {x.turma} · {x.escola}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="space-y-3 rounded-3xl border-2 border-kambada-amarelo bg-kambada-amarelo/10 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-texto-suave">A proposta · {p.genero}</p>
        <p className="text-lg font-semibold leading-snug">{p.enunciado}</p>
        <ul className="space-y-1 text-sm">
          {p.dicas.map((d) => (
            <li key={d}>✔️ {d}</li>
          ))}
        </ul>
        <p className="text-xs text-texto-suave">De {p.minPalavras} a {p.maxPalavras} palavras · {CONCURSO.prazo}.</p>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-extrabold">🎭 Para lembrar o que tu aprendeu</h2>
          <Link href={rotaEscola("/aluno/cultura/fofao")} className="text-sm font-semibold underline">Jogar “Monte o Fofão” →</Link>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2">
          {CONCURSO.inspiracao.map((x) => (
            <li key={x.titulo} className="rounded-2xl border-2 border-borda p-4 text-sm">
              <b className="block font-display">{x.titulo}</b>
              <span className="text-texto-suave">{x.texto}</span>
            </li>
          ))}
        </ul>
      </section>

      <Escrever proposta={p} inicial={minha} />

      <section className="rounded-3xl border-2 border-borda p-5 text-sm">
        <p className="font-display font-extrabold">Como o professor vai avaliar</p>
        <ul className="mt-2 space-y-1.5">
          {CRITERIOS.map((c) => (
            <li key={c.id}>
              <b>{c.nome}</b> <span className="text-texto-suave">· {c.explica}</span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-texto-suave">Cada critério vale de 1 a 5 estrelas. Fora da escola, a redação aparece só com o teu apelido.</p>
      </section>
    </div>
  );
}
