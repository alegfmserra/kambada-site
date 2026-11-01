import Link from "next/link";
import { BarraStatus, Legenda } from "@/components/escola/Barras";
import { Etiqueta } from "@/components/escola/Marca";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { podeFazer, resumoDasTurmas } from "@/lib/escola/servico";
import { NOME_ETAPA, NOME_PAPEL } from "@/lib/escola/tipos";

export const metadata = { title: "Minhas turmas" };

export default async function ProfessorInicio() {
  const { membro } = await exigir("professor", "coordenacao", "gestor");
  const turmas = await resumoDasTurmas(membro);
  const veRelatorio = podeFazer(membro, "relatorio");
  const oQueFaz = [
    podeFazer(membro, "cadastrar-alunos") && "cadastrar apelidos",
    podeFazer(membro, "cartoes") && "imprimir os cartões",
    veRelatorio && "ver o relatório",
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      <div>
        <Etiqueta>{NOME_PAPEL[membro.papel]}</Etiqueta>
        <h1 className="font-display text-3xl font-extrabold">Olá, <span className="destaque">{membro.nome.split(" ")[0]}</span>!</h1>
        <p className="text-texto-suave">
          {membro.papel === "professor" ? "As suas turmas." : "Todas as turmas da escola."}
          {oQueFaz.length > 0 ? ` Toque numa turma para ${oQueFaz.join(", ").replace(/, ([^,]*)$/, " e $1")}.` : " Toque numa turma para ver os alunos."}
        </p>
      </div>
      {veRelatorio && <Legenda />}
      {turmas.length === 0 && <p className="rounded-2xl bg-superficie p-5">Nenhuma turma ainda. A coordenação vincula você às turmas.</p>}
      <ul className="grid gap-4 md:grid-cols-2">
        {turmas.map((t) => (
          <li key={t.id}>
            <Link href={rotaEscola(`/professor/turma/${t.id}`)} className="relative block overflow-hidden rounded-3xl border-2 border-borda p-5 transition-all hover:-translate-y-0.5 hover:border-kambada-amarelo">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-2xl font-bold">{t.nome}</h2>
                  <p className="text-sm text-texto-suave">{NOME_ETAPA[t.etapa]} · {t.professores.join(", ")}</p>
                </div>
                <span className="rounded-xl bg-superficie px-3 py-1.5 text-center">
                  <span className="block text-[10px] uppercase tracking-wider text-texto-suave">código</span>
                  <span className="font-display text-lg font-extrabold tracking-widest">{t.codigo}</span>
                </span>
              </div>
              <p className="mt-3 text-sm">
                <b>{t.ativos7d}</b> de {t.alunos} alunos jogaram nos últimos 7 dias
              </p>
              {veRelatorio && (
                <div className="mt-3 space-y-2">
                  {t.porDisciplina.map((p) => (
                    <div key={p.disciplina} className="grid grid-cols-[6.5rem_1fr] items-center gap-2 text-sm">
                      <span>{p.disciplina}</span>
                      <BarraStatus {...p} />
                    </div>
                  ))}
                </div>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
