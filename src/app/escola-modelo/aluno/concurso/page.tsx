import Link from "next/link";
import { LinkArquivo } from "@/components/escola/concurso/Arquivos";
import { Evolucao } from "@/components/escola/concurso/Evolucao";
import { Etiqueta, FalaKambadinha, TituloDuo } from "@/components/escola/Marca";
import { CONCURSO, CRITERIOS, NOTA_MAXIMA } from "@/lib/escola/concurso";
import { evolucaoDoAluno, minhaRedacao, resultadoDoConcurso } from "@/lib/escola/concursoServico";
import { trilhaDoAluno } from "@/lib/escola/temporadaServico";
import { temporadaPorId } from "@/lib/escola/temporadas";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { NOME_ETAPA } from "@/lib/escola/tipos";

export const metadata = { title: "Concurso de redação" };

const FASES = [
  ["✍️", "Tu escreve na folha", "em sala, com o que aprendeu na temporada"],
  ["🧑‍🏫", "O professor corrige", "e escolhe até 3 finalistas da turma"],
  ["🏫", "A escola escolhe", "a redação que vai representá-la"],
  ["🏆", "A rede Kambada premia", "as melhores entre as escolas"],
];

/** Concurso de redação da temporada (Carnaval de São Luís), lado do aluno. */
export default async function ConcursoDoAluno() {
  const { aluno, turma } = await exigir("aluno");
  const [minha, premiadas, trilha, evolucao] = await Promise.all([minhaRedacao(aluno), resultadoDoConcurso(), trilhaDoAluno(aluno, temporadaPorId("carnaval")!), evolucaoDoAluno(aluno.id)]);
  const falta = trilha.passos.filter((x) => x.tipo !== "redacao" && x.estado === "aberto");
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

      {!minha.enviada && falta.length > 0 && (
        <Link href={rotaEscola("/aluno/temporada/carnaval")} className="block rounded-3xl border-2 border-dashed border-kambada-amarelo p-4 text-sm hover:bg-kambada-amarelo/10">
          <b>Antes do dia da redação, faz a trilha da temporada:</b> falta {falta.map((x) => x.titulo).join(", ")}. É de lá que vêm as ideias para o que tu vai escrever →
        </Link>
      )}

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
        <p className="text-xs text-texto-suave">Tu escreve à mão, na folha que o professor entrega em sala · de {p.minPalavras} a {p.maxPalavras} palavras · {CONCURSO.prazo}.</p>
      </section>

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-extrabold">🎭 Para lembrar o que tu aprendeu</h2>
          <Link href={rotaEscola("/aluno/quiz/carnaval")} className="text-sm font-semibold underline">Fazer o quiz do Carnaval →</Link>
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

      <section className="space-y-3 rounded-3xl border-2 border-borda p-5">
        <h2 className="font-display text-xl font-extrabold">✍️ Tua redação</h2>
        {!minha.enviada ? (
          <p className="text-sm text-texto-suave">Quando tu entregar a folha, o professor coloca a tua redação aqui. Depois que ele corrigir, aparecem a nota, o comentário e a correção.</p>
        ) : !minha.avaliacao ? (
          <p className="text-sm">O professor já recebeu a tua redação. Falta corrigir: volta aqui depois!</p>
        ) : (
          <div className="space-y-3">
            <p className="font-display text-2xl font-extrabold">
              Nota: {minha.avaliacao.total} de {CRITERIOS.length * NOTA_MAXIMA}
            </p>
            {(minha.finalista || minha.representante || minha.colocacao) && (
              <p className="rounded-2xl bg-kambada-amarelo px-4 py-2 font-bold text-kambada-grafite">
                {minha.colocacao ? `🏆 ${minha.colocacao}º lugar na rede Kambada!` : minha.representante ? "🌟 Tua redação vai representar a escola!" : "⭐ Tu é finalista da turma!"}
              </p>
            )}
            <ul className="grid gap-2 sm:grid-cols-2">
              {CRITERIOS.map((c) => (
                <li key={c.id} className="rounded-2xl bg-superficie p-3 text-sm">
                  <b>{c.nome}</b>
                  <span className="ml-2 text-kambada-amarelo-escuro" aria-label={`${minha.avaliacao!.notas[c.id]} de ${NOTA_MAXIMA}`}>
                    {"★".repeat(minha.avaliacao!.notas[c.id] ?? 0)}
                    <span className="text-texto-tenue">{"★".repeat(NOTA_MAXIMA - (minha.avaliacao!.notas[c.id] ?? 0))}</span>
                  </span>
                </li>
              ))}
            </ul>
            {minha.avaliacao.comentario && (
              <p className="rounded-2xl bg-kambada-amarelo/15 p-4 text-sm">
                <b>Do professor:</b> {minha.avaliacao.comentario}
              </p>
            )}
            {minha.correcao && <LinkArquivo a={minha.correcao} rotulo="📝 A tua folha corrigida" />}
          </div>
        )}
        {minha.anexo && <LinkArquivo a={minha.anexo} rotulo="📎 A tua folha" />}
        <p className="text-sm">
          A nota também fica guardada em <Link href={rotaEscola("/aluno/notas")} className="font-semibold underline">📊 Minhas notas</Link>, junto com as outras matérias. A família acompanha por lá.
        </p>
      </section>

      {evolucao.some((x) => x.total !== null) && <Evolucao pontos={evolucao} titulo="A tua escrita ao longo do ano" />}

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
