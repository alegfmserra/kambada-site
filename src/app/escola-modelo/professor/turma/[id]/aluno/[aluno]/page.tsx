import Link from "next/link";
import { notFound } from "next/navigation";
import { BotaoImprimir } from "@/components/escola/BotaoImprimir";
import { COR_DISCIPLINA } from "@/components/escola/Marca";
import { QuemE, SeloSituacao } from "@/components/escola/Mapa";
import { rotaEscola } from "@/lib/escola/host";
import { exigir } from "@/lib/escola/pagina";
import { ErroEscola, fichaAluno, type Status } from "@/lib/escola/servico";
import { SIMBOLO, type Disciplina } from "@/lib/escola/tipos";

export const metadata = { title: "Ficha do aluno" };

const COR_STATUS: Record<Status, string> = { domina: "#3B8D5D", quase: "#E0AF14", reforco: "#D4432B", nada: "#9A9A9A" };
const ROTULO_STATUS: Record<Status, string> = { domina: "já domina", quase: "quase lá", reforco: "precisa de reforço", nada: "ainda não jogou" };
const COR_RESULTADO = { primeira: "#3B8D5D", segunda: "#E0AF14", reforco: "#D4432B" } as const;

/** Ficha de um aluno: onde ele está em cada habilidade, o que jogou e de onde vêm os erros. Só a equipe da turma. */
export default async function FichaPagina({ params }: { params: Promise<{ id: string; aluno: string }> }) {
  const { membro } = await exigir("professor", "coordenacao", "gestor");
  const { id, aluno: alunoId } = await params;
  let f;
  try {
    f = await fichaAluno(membro, alunoId);
  } catch (e) {
    if (e instanceof ErroEscola) notFound();
    throw e;
  }
  if (f.turmaId !== id) notFound();
  const a = f.aluno;
  const quando = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "America/Fortaleza" });
  const disciplinas = [...new Set(f.habilidades.map((h) => h.disciplina))] as Disciplina[];

  return (
    <div className="space-y-8">
      <style>{`@media print { .escola-root > header, .escola-root > footer, .escola-root > p, .nao-imprime { display:none!important } @page { size: A4; margin: 12mm } }`}</style>
      <div className="nao-imprime flex flex-wrap items-center justify-between gap-3">
        <Link href={rotaEscola(`/professor/turma/${id}`)} className="text-sm font-semibold underline">
          ← Voltar ao {a.turma}
        </Link>
        <BotaoImprimir />
      </div>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-3xl border-2 border-borda p-5">
        <div className="space-y-2">
          <div className="text-xl">
            <QuemE a={a} />
          </div>
          <p className="text-sm text-texto-suave">
            {a.turma} · {a.respostas} respostas · {a.ultima ? `jogou pela última vez em ${quando.format(new Date(a.ultima))}` : "ainda não jogou"}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <SeloSituacao s={a.situacao} />
          <span className="text-center">
            <span className="block font-display text-3xl font-extrabold">{a.pontos}</span>
            <span className="text-xs text-texto-suave">pontos</span>
          </span>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold">Onde está em cada habilidade</h2>
        {disciplinas.map((disc) => (
          <div key={disc} className="space-y-2">
            <p className="flex items-center gap-2 text-sm font-bold">
              <span className="h-3 w-3 rounded-full" style={{ background: COR_DISCIPLINA[disc] }} aria-hidden /> {disc}
            </p>
            <div className="flex flex-wrap gap-2">
              {f.habilidades
                .filter((h) => h.disciplina === disc)
                .map((h) => (
                  <span
                    key={h.habilidade}
                    className="inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-sm font-semibold"
                    style={{ borderColor: COR_STATUS[h.celula.status] }}
                    title={ROTULO_STATUS[h.celula.status]}
                  >
                    <b style={{ color: COR_STATUS[h.celula.status] }}>{h.celula.status === "nada" ? "·" : h.celula.status === "domina" ? "✓" : h.celula.status === "quase" ? "↻" : "✗"}</b>
                    {h.habilidade}
                  </span>
                ))}
            </div>
          </div>
        ))}
        <p className="text-xs text-texto-suave">✓ já domina · ↻ quase lá (acerta na segunda) · ✗ precisa de reforço · · ainda não jogou. Olha as últimas respostas de cada habilidade.</p>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">O que jogou</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {f.jogos.map((j) => (
            <li key={j.titulo} className="flex items-center justify-between gap-3 rounded-2xl bg-superficie px-4 py-3 text-sm">
              <span className="font-semibold">
                <span aria-hidden>{j.emoji}</span> {j.titulo}
              </span>
              <span className="text-texto-suave">{j.respostas ? `${j.respostas} respostas · ${j.primeira} de primeira` : "não jogou"}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl font-bold">Últimas respostas (de onde vem o resultado)</h2>
        {f.respostas.length === 0 ? (
          <p className="rounded-2xl bg-superficie p-4 text-sm text-texto-suave">Ainda sem respostas.</p>
        ) : (
          <ol className="space-y-2">
            {f.respostas.map((r, i) => (
              <li key={i} className="rounded-2xl border border-borda p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2 text-xs text-texto-suave">
                  <b className="text-base" style={{ color: COR_RESULTADO[r.resultado] }}>{SIMBOLO[r.resultado]}</b>
                  <span>{quando.format(new Date(r.em))}</span>·<span>{r.jogo}</span>·<span>{r.habilidade}</span>
                </div>
                <p className="mt-1">{r.pergunta}</p>
                {r.escolheu && (
                  <p className="mt-1">
                    Escolheu <b>“{r.escolheu}”</b>
                    {r.diagnostico && <> → {r.diagnostico}</>}
                  </p>
                )}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
