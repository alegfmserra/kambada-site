"use client";

import type { LinhaLiberacao } from "@/lib/escola/liberacao";
import { useAcao } from "./Coordenacao";

const SITUACAO = { pronta: "trilha completa", montagem: "em montagem", breve: "sem conteúdo ainda" } as const;

/** Liga e desliga cada temporada para a escola. Desligou, some da trilha do aluno na hora. */
export function TemporadasDaEscola({ linhas }: { linhas: LinhaLiberacao[] }) {
  const { rodar, ocupado, avisos } = useAcao();
  return (
    <div className="space-y-3">
      <ul className="divide-y divide-borda rounded-2xl border border-borda">
        {linhas.map((t) => (
          <li key={t.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className="text-2xl" aria-hidden>
              {t.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-bold">
                {t.titulo} <span className="text-sm font-normal text-texto-suave">· {t.mes}</span>
              </p>
              <p className="text-xs text-texto-suave">{SITUACAO[t.situacao]}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={t.liberada}
              aria-label={`${t.liberada ? "Fechar" : "Liberar"} ${t.titulo}`}
              disabled={ocupado}
              onClick={() => rodar({ acao: "liberar-temporada", temporada: t.id, ligada: !t.liberada }, () => `${t.titulo}: ${t.liberada ? "fechada" : "liberada"} para a escola.`)}
              className={`flex items-center gap-2 rounded-full border-2 py-1 pl-1 pr-3 text-xs font-bold transition-colors ${t.liberada ? "border-kambada-green bg-kambada-green/10" : "border-borda text-texto-suave"}`}
            >
              <span className={`relative h-5 w-9 rounded-full transition-colors ${t.liberada ? "bg-kambada-green" : "bg-borda"}`} aria-hidden>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${t.liberada ? "left-[1.125rem]" : "left-0.5"}`} />
              </span>
              {t.liberada ? "Liberada" : "Fechada"}
            </button>
          </li>
        ))}
      </ul>
      {avisos}
    </div>
  );
}
