import Link from "next/link";
import { notFound } from "next/navigation";
import { AnexarFolha, CartaoRedacao } from "@/components/escola/concurso/Avaliar";
import { Evolucao } from "@/components/escola/concurso/Evolucao";
import { Etiqueta } from "@/components/escola/Marca";
import { CONCURSO, CRITERIOS, NOTA_MAXIMA } from "@/lib/escola/concurso";
import { evolucaoDaTurma, redacoesDaTurma } from "@/lib/escola/concursoServico";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { ErroEscola } from "@/lib/escola/servico";

export const metadata = { title: "Concurso de redação" };

const COMO = [
  ["🖨", "Imprima a folha", "A folha de redação do Kambada Play, com a proposta da turma e o espaço para a logo da escola."],
  ["✍️", "A turma escreve à mão", "Em sala, depois da trilha da temporada (artigo, jogos e quiz)."],
  ["📎", "Anexe a folha", "Foto ou PDF de cada folha, no aluno certo. Até 5 MB."],
  ["✅", "Corrija aqui", "Nota pela grade, comentário e, se quiser, a folha corrigida. Vira a evolução do aluno no ano."],
];

/** Redações da turma: anexar a folha de cada aluno, avaliar pela grade, comentar e escolher as finalistas. */
export default async function RedacoesDaTurma({ params }: { params: Promise<{ id: string }> }) {
  const { membro } = await exigir("professor", "coordenacao", "gestor");
  const { id } = await params;
  let dados, evolucao;
  try {
    [dados, evolucao] = await Promise.all([redacoesDaTurma(membro, id), evolucaoDaTurma(membro, id)]);
  } catch (e) {
    if (e instanceof ErroEscola) notFound();
    throw e;
  }
  const { turma, redacoes, semRedacao } = dados;
  const p = CONCURSO.propostas[turma.etapa];
  const finalistas = redacoes.filter((r) => r.finalista).length;
  const escola = membro.papel !== "gestor";
  const base = rotaEscola(`/professor/turma/${id}`);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href={base} className="text-sm font-semibold underline">← {turma.nome}</Link>
          <div className="mt-2">
            <Etiqueta>{CONCURSO.emoji} Temporada de {CONCURSO.temporada}</Etiqueta>
          </div>
          <h1 className="mt-1 font-display text-3xl font-extrabold">{CONCURSO.titulo}</h1>
          <p className="mt-1 text-sm text-texto-suave">
            {turma.nome} · {redacoes.length} de {redacoes.length + semRedacao.length} redações anexadas · {redacoes.filter((r) => r.avaliacao).length} corrigidas · {finalistas} de {CONCURSO.finalistasPorTurma} finalistas
          </p>
        </div>
        <Link href={`${base}/redacoes/folha`} target="_blank" className="rounded-full bg-kambada-amarelo px-5 py-2.5 font-bold text-kambada-grafite hover:bg-kambada-amarelo-escuro">
          🖨 Folha de redação para imprimir
        </Link>
      </div>

      <ol className="grid gap-3 sm:grid-cols-4">
        {COMO.map(([e, t, s], i) => (
          <li key={t} className="rounded-2xl border-2 border-borda p-3 text-sm">
            <span className="text-2xl" aria-hidden>{e}</span>
            <b className="mt-1 block">{i + 1}. {t}</b>
            <span className="text-texto-suave">{s}</span>
          </li>
        ))}
      </ol>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border-2 border-kambada-amarelo bg-kambada-amarelo/10 p-4 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-texto-suave">Proposta da turma · {p.genero}</p>
          <p className="mt-1 font-semibold">{p.enunciado}</p>
          <p className="mt-2 text-xs text-texto-suave">Sugestão: de {p.minPalavras} a {p.maxPalavras} palavras.</p>
        </div>
        <div className="rounded-3xl border-2 border-borda p-4 text-sm">
          <p className="font-bold">Grade (cada critério de 1 a {NOTA_MAXIMA}, total {CRITERIOS.length * NOTA_MAXIMA})</p>
          <ul className="mt-1 space-y-0.5 text-texto-suave">
            {CRITERIOS.map((c) => (
              <li key={c.id}><b className="text-texto">{c.nome}:</b> {c.explica}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-texto-suave">A mesma grade em todas as turmas, temporadas e escolas: é o que permite ver a evolução. Corrigiu, escolha até {CONCURSO.finalistasPorTurma} finalistas.</p>
        </div>
      </section>

      <Evolucao pontos={evolucao} titulo={`Média do ${turma.nome} ao longo do ano`} />

      {redacoes.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold">Redações anexadas</h2>
          <ul className="space-y-3">
            {redacoes.map((r) => (
              <CartaoRedacao key={r.id} r={r} podeAvaliar={escola} />
            ))}
          </ul>
        </section>
      )}

      {semRedacao.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold">Sem redação nesta temporada ({semRedacao.length})</h2>
          {escola ? (
            <ul className="grid gap-2 md:grid-cols-2">
              {semRedacao.map((a) => (
                <AnexarFolha key={a.alunoId} {...a} />
              ))}
            </ul>
          ) : (
            <p className="text-sm text-texto-suave">{semRedacao.map((a) => `${a.avatar} ${a.apelido}`).join(" · ")}</p>
          )}
        </section>
      )}
    </div>
  );
}
