import Link from "next/link";
import { rotaEscola } from "@/lib/escola/host";
import type { PassoDoAluno, TrilhaDoAluno } from "@/lib/escola/temporadaServico";
import { PASSO } from "@/lib/escola/temporadas";

const ESTILO: Record<PassoDoAluno["estado"], string> = {
  feito: "border-kambada-green bg-kambada-green/10",
  aberto: "border-kambada-amarelo hover:bg-kambada-amarelo/10",
  travado: "border-dashed border-borda opacity-70",
  producao: "border-dashed border-borda opacity-60",
};

/** Os passos da temporada, em ordem: assistir, ler, entender, brincar, mostrar o que sabe, escrever. */
export function Trilha({ trilha, compacta = false }: { trilha: TrilhaDoAluno; compacta?: boolean }) {
  return (
    <ol className={`grid gap-3 ${compacta ? "sm:grid-cols-3 lg:grid-cols-6" : "sm:grid-cols-2"}`}>
      {trilha.passos.map((p, i) => {
        const info = PASSO[p.tipo];
        const corpo = (
          <>
            <span className="flex items-center justify-between gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-kambada-grafite text-sm font-bold text-white">{i + 1}</span>
              <span className="text-xs font-bold">
                {p.estado === "feito" ? "✓ feito" : p.estado === "travado" ? "🔒 depois do quiz" : p.estado === "producao" ? "em breve" : "abrir →"}
              </span>
            </span>
            <span className="mt-2 block text-xs font-bold uppercase tracking-wider text-texto-suave">
              {info.emoji} {info.verbo}
            </span>
            <b className="block font-display leading-tight">{p.titulo}</b>
            {/* O que falta (emProducao) é nota interna da produção: o aluno vê só "chega em breve". */}
            {!compacta && (p.detalhe || p.estado === "producao") && <span className="mt-1 block text-xs text-texto-suave">{p.detalhe ?? "Chega em breve."}</span>}
          </>
        );
        const classe = `block h-full rounded-2xl border-2 p-3 text-left transition-colors ${ESTILO[p.estado]}`;
        return (
          <li key={`${p.tipo}-${p.titulo}`}>
            {p.caminho && p.estado !== "travado" ? (
              <Link href={rotaEscola(p.caminho)} className={classe}>
                {corpo}
              </Link>
            ) : (
              <div className={classe} aria-disabled>
                {corpo}
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/** Barra de progresso da temporada. */
export function Progresso({ trilha }: { trilha: TrilhaDoAluno }) {
  const pct = trilha.total ? Math.round((trilha.feitos / trilha.total) * 100) : 0;
  return (
    <div className="flex items-center gap-3 text-sm">
      <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-superficie" role="img" aria-label={`${trilha.feitos} de ${trilha.total} passos feitos`}>
        <div className="h-full rounded-full bg-kambada-amarelo" style={{ width: `${pct}%` }} />
      </div>
      <span className="shrink-0 font-semibold">
        {trilha.feitos} de {trilha.total}
      </span>
    </div>
  );
}

/** Link de "próximo passo" no fim de cada página da trilha. */
export function ProximoPasso({ trilha, atual }: { trilha: TrilhaDoAluno; atual: string }) {
  const i = trilha.passos.findIndex((p) => p.atividade === atual || p.caminho === atual);
  const prox = trilha.passos.slice(i + 1).find((p) => p.caminho && p.estado !== "producao");
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl bg-kambada-grafite p-5 text-white">
      <Link href={rotaEscola(`/aluno/temporada/${trilha.temporada.id}`)} className="text-sm font-semibold underline">
        ← Trilha da temporada
      </Link>
      {prox && (
        <Link href={rotaEscola(prox.caminho!)} className="rounded-full bg-kambada-amarelo px-5 py-2.5 font-bold text-kambada-grafite">
          Próximo: {PASSO[prox.tipo].emoji} {prox.titulo} →
        </Link>
      )}
    </div>
  );
}
