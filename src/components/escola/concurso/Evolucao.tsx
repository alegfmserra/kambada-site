import { CRITERIOS, NOTA_MAXIMA } from "@/lib/escola/concurso";
import type { PontoDaEscrita } from "@/lib/escola/concursoServico";

const MAXIMO = CRITERIOS.length * NOTA_MAXIMA;

/**
 * Linha do tempo da escrita: uma barra por redação do ano (nota de 0 a 20) e,
 * embaixo, a nota de cada critério. Serve para o aluno, a turma (média) e a
 * ficha do professor.
 */
export function Evolucao({ pontos, titulo = "A escrita ao longo do ano" }: { pontos: PontoDaEscrita[]; titulo?: string }) {
  const com = pontos.filter((p) => p.total !== null);
  const primeira = com[0]?.total;
  const ultima = com[com.length - 1]?.total;
  return (
    <section className="space-y-3 rounded-3xl border-2 border-borda p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="font-display text-xl font-bold">📈 {titulo}</h2>
        {com.length >= 2 && primeira != null && ultima != null && (
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${ultima >= primeira ? "bg-kambada-green/20" : "bg-kambada-red/15"}`}>
            {ultima >= primeira ? "▲" : "▼"} {Math.abs(Math.round((ultima - primeira) * 10) / 10)} pontos desde {com[0].temporada}
          </span>
        )}
      </div>
      <div className="flex h-48 gap-3" role="img" aria-label={pontos.map((p) => `${p.temporada}: ${p.total ?? "sem nota"}`).join("; ")}>
        {pontos.map((p) => (
          <div key={p.id} className="flex flex-1 flex-col items-center gap-1">
            {/* A barra mede a altura desta faixa (que estica), não da coluna inteira. */}
            <div className="flex w-full flex-1 flex-col items-center justify-end gap-1">
              <span className="text-sm font-bold">{p.total ?? "—"}</span>
              <div className="w-full max-w-16 rounded-t-xl bg-kambada-amarelo" style={{ height: `${((p.total ?? 0) / MAXIMO) * 100}%`, minHeight: p.total ? 6 : 2, opacity: p.total === null ? 0.2 : 1 }} />
            </div>
            <span className="text-center text-xs leading-tight text-texto-suave">
              {p.temporada}
              <br />
              {p.mes}
            </span>
          </div>
        ))}
      </div>
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-texto-suave">
            <th className="py-1 font-semibold">Critério</th>
            {pontos.map((p) => (
              <th key={p.id} className="py-1 text-center font-semibold">{p.temporada}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CRITERIOS.map((c) => (
            <tr key={c.id} className="border-t border-borda">
              <td className="py-1">{c.nome}</td>
              {pontos.map((p) => (
                <td key={p.id} className="py-1 text-center font-semibold">{p.notas?.[c.id] ?? "—"}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="text-xs text-texto-suave">Nota de 0 a {MAXIMO} (cada critério de 1 a {NOTA_MAXIMA}), com a mesma grade em todas as temporadas e escolas.</p>
    </section>
  );
}
