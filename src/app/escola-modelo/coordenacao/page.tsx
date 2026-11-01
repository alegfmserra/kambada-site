import Link from "next/link";
import { BarraStatus, Legenda } from "@/components/escola/Barras";
import { GestaoEquipe, GestaoTurmas, IdentidadeEscola, RestaurarDemo } from "@/components/escola/Coordenacao";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { CORES_ESCOLA, equipe, escolaPublica, resumoDasTurmas } from "@/lib/escola/servico";
import { NOME_ETAPA } from "@/lib/escola/tipos";

export const metadata = { title: "Coordenação" };

function Secao({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-bold">{titulo}</h2>
      {children}
    </section>
  );
}

export default async function CoordenacaoPagina() {
  const { membro } = await exigir("coordenacao");
  const [turmas, eq, escola] = await Promise.all([resumoDasTurmas(membro), equipe(membro), escolaPublica()]);
  const totalAlunos = turmas.reduce((s, t) => s + t.alunos, 0);
  const ativos = turmas.reduce((s, t) => s + t.ativos7d, 0);
  const professores = eq.membros.filter((m) => m.papel === "professor");

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-display text-3xl font-extrabold">Painel da coordenação</h1>
        <p className="text-texto-suave">Relatório geral da escola, equipe, turmas e identidade do portal.</p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          [turmas.length, "turmas"],
          [totalAlunos, "alunos"],
          [professores.length, "professores"],
          [`${totalAlunos ? Math.round((ativos / totalAlunos) * 100) : 0}%`, "jogaram nos últimos 7 dias"],
        ].map(([n, r]) => (
          <div key={String(r)} className="rounded-2xl bg-superficie p-4">
            <p className="font-display text-3xl font-extrabold">{n}</p>
            <p className="text-sm text-texto-suave">{r}</p>
          </div>
        ))}
      </div>

      <Secao titulo="Relatório geral por turma">
        <Legenda />
        <div className="overflow-x-auto rounded-2xl border border-borda">
          <table className="w-full min-w-[36rem] text-sm">
            <thead className="bg-superficie text-left">
              <tr>
                <th className="px-3 py-2">Turma</th>
                <th className="px-3 py-2">Ativos (7 dias)</th>
                <th className="px-3 py-2">Matemática</th>
                <th className="px-3 py-2">Português</th>
                <th className="px-3 py-2">Inglês</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-borda">
              {turmas.map((t) => (
                <tr key={t.id}>
                  <td className="px-3 py-2">
                    <Link href={rotaEscola(`/professor/turma/${t.id}`)} className="font-semibold underline">{t.nome}</Link>
                    <span className="block text-xs text-texto-suave">{NOME_ETAPA[t.etapa]}</span>
                  </td>
                  <td className="px-3 py-2">{t.ativos7d} de {t.alunos}</td>
                  {(["Matemática", "Português", "Inglês"] as const).map((d) => {
                    const p = t.porDisciplina.find((x) => x.disciplina === d);
                    return <td key={d} className="px-3 py-2">{p ? <BarraStatus {...p} /> : <span className="text-texto-tenue">—</span>}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Secao>

      <Secao titulo="Professores">
        <GestaoEquipe membros={eq.membros} turmas={eq.turmas} />
      </Secao>

      <Secao titulo="Turmas">
        <GestaoTurmas turmas={eq.turmas} professores={professores} />
      </Secao>

      <Secao titulo="Identidade do portal">
        <IdentidadeEscola escola={escola} cores={CORES_ESCOLA} />
      </Secao>

      {escola.demo && (
        <Secao titulo="Demonstração">
          <RestaurarDemo />
        </Secao>
      )}
    </div>
  );
}
