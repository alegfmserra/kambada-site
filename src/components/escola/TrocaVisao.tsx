"use client";

import { useState } from "react";
import { chamar } from "./chamar";

type Visao = "coordenacao" | "professor" | "aluno";
const VISOES: { id: Visao; rotulo: string; icone: string }[] = [
  { id: "coordenacao", rotulo: "Coordenação", icone: "🏫" },
  { id: "professor", rotulo: "Professor", icone: "🧑‍🏫" },
  { id: "aluno", rotulo: "Aluno", icone: "🎒" },
];

/** "Ver como" da coordenação: passeia pelas visões da própria escola sem sair. */
export function TrocaVisao({ atual }: { atual: Visao }) {
  const [indo, setIndo] = useState<Visao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  async function ir(v: Visao) {
    if (v === atual || indo) return;
    setIndo(v);
    setErro(null);
    const r = await chamar<{ destino: string }>("visao", { ver: v });
    if (r.ok && r.destino) return window.location.assign(r.destino);
    setErro(r.mensagem ?? "Não deu para trocar. Tente de novo.");
    setIndo(null);
  }
  return (
    <div className="w-full sm:w-auto">
      <div role="group" aria-label="Ver como" className="flex w-full items-center gap-0.5 rounded-full bg-white/10 p-1 text-xs sm:w-auto sm:gap-1 sm:text-sm">
        <span className="shrink-0 px-1.5 text-[10px] font-bold uppercase leading-tight tracking-wider text-kambada-amarelo sm:px-2 sm:text-[11px]">Ver como</span>
        {VISOES.map((v) => {
          const aqui = v.id === atual;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => ir(v.id)}
              aria-pressed={aqui}
              disabled={!!indo}
              className={`flex flex-1 items-center justify-center gap-1 rounded-full px-2 py-1.5 font-semibold sm:flex-none sm:px-3 sm:py-1 transition-colors ${aqui ? "bg-kambada-amarelo text-kambada-grafite" : "text-white hover:bg-white/15"} disabled:opacity-70`}
            >
              <span aria-hidden className="hidden sm:inline">
                {v.icone}
              </span>
              {indo === v.id ? "Abrindo…" : v.rotulo}
            </button>
          );
        })}
      </div>
      {erro && <p className="mt-1 text-xs text-kambada-amarelo">{erro}</p>}
    </div>
  );
}
