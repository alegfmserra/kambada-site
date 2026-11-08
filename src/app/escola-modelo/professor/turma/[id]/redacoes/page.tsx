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

/** Número estável a partir de um texto (FNV-1a): serve para sortear a ordem sem ela mudar a cada atualização. */
function embaralho(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) h = Math.imul(h ^ texto.charCodeAt(i), 16777619);
  return h >>> 0;
}

/** Redações da turma: anexar a folha de cada aluno, avaliar pela grade, comentar e escolher as finalistas. */
export default async function RedacoesDaTurma({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ nomes?: string }> }) {
  const { membro } = await exigir("professor", "coordenacao", "gestor");
  const { id } = await params;
  const cega = (await searchParams).nomes !== "1";
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
  // Para corrigir: ordem sorteada por professor e por dia (sem efeito de ordem nem "o melhor aluno primeiro").
  const dia = new Date().toISOString().slice(0, 10);
  const paraCorrigir = redacoes.filter((r) => !r.avaliacao).sort((a, b) => embaralho(`${membro.id}|${dia}|${a.id}`) - embaralho(`${membro.id}|${dia}|${b.id}`));
  // Corrigidas: em ordem de apelido, não de nota (a lista não vira ranking).
  const corrigidas = redacoes.filter((r) => r.avaliacao).sort((a, b) => a.apelido.localeCompare(b.apelido, "pt-BR"));
  // Finalistas só depois de corrigir todas: escolher no meio da pilha favorece as primeiras.
  const todasCorrigidas = paraCorrigir.length === 0;
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

      {paraCorrigir.length > 0 && (
        <section className="space-y-3">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-xl font-bold">Para corrigir ({paraCorrigir.length})</h2>
            <Link href={cega ? `${base}/redacoes?nomes=1` : `${base}/redacoes`} className="text-sm font-semibold underline">
              {cega ? "Mostrar os nomes" : "Esconder os nomes"}
            </Link>
          </div>
          {cega && (
            <p className="text-sm text-texto-suave">
              Correção às cegas: em ordem sorteada e sem o nome, que aparece depois de salvar a nota. Assim a nota mede o texto, não a lembrança do aluno nem a redação anterior.
            </p>
          )}
          <ul className="space-y-3">
            {paraCorrigir.map((r, i) => (
              <CartaoRedacao key={r.id} r={r} podeAvaliar={escola} cega={cega} numero={i + 1} abertaInicial={escola && i === 0} podeFinalista={false} />
            ))}
          </ul>
        </section>
      )}

      {corrigidas.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-xl font-bold">Corrigidas ({corrigidas.length})</h2>
          <p className="text-sm text-texto-suave">
            {todasCorrigidas
              ? `Tudo corrigido. Agora escolha até ${CONCURSO.finalistasPorTurma} finalistas: releia as de maior nota antes de decidir.`
              : `As finalistas se escolhem quando todas estiverem corrigidas (faltam ${paraCorrigir.length}).`}
          </p>
          <ul className="space-y-3">
            {corrigidas.map((r) => (
              <CartaoRedacao key={r.id} r={r} podeAvaliar={escola} podeFinalista={todasCorrigidas || r.finalista} />
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
