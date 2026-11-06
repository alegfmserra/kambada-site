import Link from "next/link";
import { notFound } from "next/navigation";
import { CartaoRedacao } from "@/components/escola/concurso/Avaliar";
import { Etiqueta } from "@/components/escola/Marca";
import { CONCURSO, CRITERIOS, NOTA_MAXIMA } from "@/lib/escola/concurso";
import { redacoesDaTurma } from "@/lib/escola/concursoServico";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { ErroEscola } from "@/lib/escola/servico";

export const metadata = { title: "Concurso de redação" };

/** Redações da turma: ler, avaliar pela grade, comentar e escolher as finalistas. */
export default async function RedacoesDaTurma({ params }: { params: Promise<{ id: string }> }) {
  const { membro } = await exigir("professor", "coordenacao", "gestor");
  const { id } = await params;
  let dados;
  try {
    dados = await redacoesDaTurma(membro, id);
  } catch (e) {
    if (e instanceof ErroEscola) notFound();
    throw e;
  }
  const { turma, redacoes, semTexto } = dados;
  const p = CONCURSO.propostas[turma.etapa];
  const enviadas = redacoes.filter((r) => r.enviada);
  const finalistas = redacoes.filter((r) => r.finalista).length;
  const escola = membro.papel !== "gestor";

  return (
    <div className="space-y-6">
      <div>
        <Link href={rotaEscola(`/professor/turma/${id}`)} className="text-sm font-semibold underline">← {turma.nome}</Link>
        <div className="mt-2">
          <Etiqueta>{CONCURSO.emoji} Temporada de {CONCURSO.temporada}</Etiqueta>
        </div>
        <h1 className="mt-1 font-display text-3xl font-extrabold">{CONCURSO.titulo}</h1>
        <p className="mt-1 text-sm text-texto-suave">
          {turma.nome} · {enviadas.length} enviadas de {redacoes.length + semTexto.length} alunos · {enviadas.filter((r) => r.avaliacao).length} avaliadas · {finalistas} de {CONCURSO.finalistasPorTurma} finalistas
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-3xl border-2 border-kambada-amarelo bg-kambada-amarelo/10 p-4 text-sm">
          <p className="text-xs font-bold uppercase tracking-wider text-texto-suave">Proposta da turma · {p.genero}</p>
          <p className="mt-1 font-semibold">{p.enunciado}</p>
          <p className="mt-2 text-xs text-texto-suave">De {p.minPalavras} a {p.maxPalavras} palavras.</p>
        </div>
        <div className="rounded-3xl border-2 border-borda p-4 text-sm">
          <p className="font-bold">Grade (cada critério de 1 a {NOTA_MAXIMA}, total {CRITERIOS.length * NOTA_MAXIMA})</p>
          <ul className="mt-1 space-y-0.5 text-texto-suave">
            {CRITERIOS.map((c) => (
              <li key={c.id}><b className="text-texto">{c.nome}:</b> {c.explica}</li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-texto-suave">
            A mesma grade em todas as turmas e escolas. Avaliou, escolha até {CONCURSO.finalistasPorTurma} finalistas: a coordenação escolhe entre elas a que representa a escola.
          </p>
        </div>
      </section>

      {redacoes.length > 0 ? (
        <ul className="space-y-3">
          {redacoes.map((r) => (
            <CartaoRedacao key={r.id} r={r} podeAvaliar={escola} />
          ))}
        </ul>
      ) : (
        <p className="rounded-2xl bg-superficie p-4 text-sm">Ninguém começou ainda. O concurso aparece na tela do aluno, em “Desafios”.</p>
      )}

      {semTexto.length > 0 && (
        <section className="rounded-3xl border-2 border-dashed border-borda p-4 text-sm">
          <p className="font-bold">Ainda não começaram ({semTexto.length})</p>
          <p className="mt-1 text-texto-suave">{semTexto.map((a) => `${a.avatar} ${a.apelido}${a.nome ? ` (${a.nome})` : ""}`).join(" · ")}</p>
        </section>
      )}
    </div>
  );
}
