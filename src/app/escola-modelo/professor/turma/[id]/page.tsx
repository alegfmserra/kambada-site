import Link from "next/link";
import { notFound } from "next/navigation";
import { BarraStatus, Legenda } from "@/components/escola/Barras";
import { GestaoTurma } from "@/components/escola/GestaoTurma";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { ErroEscola, alunosDaTurma, disciplinasDaEtapa, podeFazer, relatorioTurma, type Celula, type Status } from "@/lib/escola/servico";
import { NOME_ETAPA } from "@/lib/escola/tipos";

export const metadata = { title: "Turma" };

const CELULA: Record<Status, { simbolo: string; classe: string; rotulo: string }> = {
  domina: { simbolo: "✓", classe: "bg-kambada-green/20 text-kambada-green", rotulo: "já domina" },
  quase: { simbolo: "↻", classe: "bg-kambada-amarelo/30 text-kambada-amarelo-escuro", rotulo: "quase lá" },
  reforco: { simbolo: "✗", classe: "bg-kambada-red/15 text-kambada-red", rotulo: "precisa de reforço" },
  nada: { simbolo: "·", classe: "text-texto-tenue", rotulo: "ainda não jogou" },
};

function titulo(c: Celula): string {
  if (c.status === "nada") return "ainda não jogou";
  return `${CELULA[c.status].rotulo}: ${c.primeira} de primeira, ${c.segunda} na segunda, ${c.reforco} com erro (últimas respostas)`;
}

export default async function TurmaPagina({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ disciplina?: string; aba?: string }>;
}) {
  const { membro } = await exigir("professor", "coordenacao", "gestor");
  const { id } = await params;
  const { disciplina, aba } = await searchParams;
  const veRelatorio = podeFazer(membro, "relatorio");
  let rel, lista;
  try {
    // Sem a permissão "Ver relatório", a turma abre direto em "Alunos e cartões".
    [rel, lista] = await Promise.all([veRelatorio ? relatorioTurma(membro, id, disciplina) : null, alunosDaTurma(membro, id)]);
  } catch (e) {
    if (e instanceof ErroEscola) notFound();
    throw e;
  }
  const emAlunos = aba === "alunos" || !rel;
  const turma = lista.turma;
  const voltar = { professor: "/professor", coordenacao: "/coordenacao", gestor: "/gestor" }[membro.papel];
  const base = rotaEscola(`/professor/turma/${id}`);
  const abaClasse = (ativa: boolean) =>
    `rounded-full px-4 py-2 text-sm font-bold ${ativa ? "bg-kambada-amarelo text-kambada-grafite" : "border-2 border-borda hover:border-kambada-amarelo"}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href={rotaEscola(voltar)} className="text-sm font-semibold underline">
            ← Voltar
          </Link>
          <h1 className="mt-1 font-display text-3xl font-extrabold">{turma.nome}</h1>
          <p className="text-texto-suave">
            {NOME_ETAPA[turma.etapa]} · código da turma <b className="tracking-widest text-texto">{turma.codigo}</b>
            {rel && ` · ${rel.participacao.ativos7d} de ${rel.participacao.total} jogaram nos últimos 7 dias (${rel.participacao.respostas7d} respostas)`}
          </p>
        </div>
        <div className="flex gap-2">
          {rel && <Link href={base} className={abaClasse(!emAlunos)}>Relatório</Link>}
          <Link href={`${base}?aba=alunos`} className={abaClasse(emAlunos)}>Alunos e cartões</Link>
        </div>
      </div>

      {emAlunos || !rel ? (
        <GestaoTurma
          turmaId={id}
          turmaNome={turma.nome}
          codigo={turma.codigo}
          alunosIniciais={podeFazer(membro, "cartoes") ? lista.alunos : lista.alunos.map((x) => ({ ...x, figuras: [] }))}
          pode={{ cadastrar: podeFazer(membro, "cadastrar-alunos"), cartoes: podeFazer(membro, "cartoes"), remover: podeFazer(membro, "remover-alunos") }}
        />
      ) : (
        <>
          <div className="flex flex-wrap gap-2">
            {disciplinasDaEtapa(rel.turma.etapa).map((d) => (
              <Link key={d} href={`${base}?disciplina=${encodeURIComponent(d)}`} className={abaClasse(d === rel.disciplina)}>
                {d}
              </Link>
            ))}
          </div>

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold">Onde a turma está em {rel.disciplina}</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {rel.resumo.map((r) => (
                <div key={r.habilidade} className="rounded-2xl bg-superficie p-4">
                  <div className="mb-2 flex justify-between text-sm">
                    <b>{r.habilidade}</b>
                    <span className="text-texto-suave">
                      {r.domina} ✓ · {r.quase} ↻ · {r.reforco} ✗
                    </span>
                  </div>
                  <BarraStatus {...r} />
                </div>
              ))}
            </div>
          </section>

          {rel.erros.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-xl font-bold">O que retomar com a turma</h2>
              <p className="text-sm text-texto-suave">Os erros mais comuns na primeira tentativa e o que eles costumam revelar.</p>
              <ul className="space-y-3">
                {rel.erros.map((e, i) => (
                  <li key={i} className="rounded-2xl border-2 border-borda p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-texto-suave">{e.habilidade}</p>
                    <p className="mt-1 text-sm">{e.questao}</p>
                    <p className="mt-2">
                      <b>{e.quantos} {e.quantos === 1 ? "aluno escolheu" : "alunos escolheram"} “{e.escolha}”</b> → {e.diagnostico}
                    </p>
                    <p className="mt-1 text-xs text-texto-suave">{e.apelidos.join(", ")}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="space-y-3">
            <h2 className="font-display text-xl font-bold">Por aluno (apelido)</h2>
            <Legenda />
            <div className="overflow-x-auto rounded-2xl border border-borda">
              <table className="w-full min-w-[32rem] text-sm">
                <thead className="bg-superficie text-left">
                  <tr>
                    <th className="px-3 py-2">Aluno</th>
                    {rel.habilidades.map((h) => (
                      <th key={h} className="px-2 py-2 text-center font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-borda">
                  {rel.linhas.map((l) => (
                    <tr key={l.aluno.id}>
                      <td className="whitespace-nowrap px-3 py-2">
                        <span aria-hidden>{l.aluno.avatar}</span> {l.aluno.apelido}
                      </td>
                      {rel.habilidades.map((h) => {
                        const c = l.celulas[h];
                        return (
                          <td key={h} className="px-2 py-1.5 text-center">
                            <span className={`inline-grid h-8 w-10 place-items-center rounded-lg font-extrabold ${CELULA[c.status].classe}`} title={titulo(c)}>
                              {CELULA[c.status].simbolo}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-texto-suave">
              Cada célula olha as últimas respostas do aluno naquela habilidade. É um retrato para o professor, não nota nem diagnóstico.
            </p>
          </section>
        </>
      )}
    </div>
  );
}
