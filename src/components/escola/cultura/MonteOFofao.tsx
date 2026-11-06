"use client";

import Link from "next/link";
import { useState } from "react";
import { CONCURSO, PECAS_FOFAO } from "@/lib/escola/concurso";
import { rotaEscola } from "@/lib/escola/host";
import { BOTAO, BOTAO_SECUNDARIO } from "../chamar";
import { FalaKambadinha } from "../Marca";
import { avisarFeito, Saber } from "./Perguntas";

/**
 * Jogo "Monte o Fofão" (temporada de Carnaval): a criança veste o Fofão
 * tocando nas peças; algumas são de outros personagens. Ao conferir, cada
 * peça explica por que é (ou não é) do Fofão. Acerto = peça classificada
 * certo (vestiu a certa ou deixou de fora a que não é).
 */
export function MonteOFofao() {
  const [vestidas, setVestidas] = useState<string[]>([]);
  const [conferido, setConferido] = useState(false);
  const acertos = PECAS_FOFAO.filter((p) => vestidas.includes(p.id) === p.certa).length;

  function alternar(id: string) {
    if (conferido) return;
    setVestidas((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  }

  function conferir() {
    setConferido(true);
    avisarFeito("jogo-fofao", acertos, PECAS_FOFAO.length);
  }

  function deNovo() {
    setVestidas([]);
    setConferido(false);
  }

  return (
    <div className="space-y-6">
      {!conferido && <FalaKambadinha>Bora vestir o Fofão? Toca nas peças que são dele. Cuidado: tem peça de outro personagem no meio!</FalaKambadinha>}

      <div className="grid items-start gap-5 md:grid-cols-[14rem_1fr]">
        {/* O Fofão sendo vestido: as peças escolhidas empilham no boneco. */}
        <div className="rounded-3xl bg-kambada-grafite p-5 text-center text-white" aria-live="polite">
          <p className="text-xs font-bold uppercase tracking-wider text-kambada-amarelo">O teu Fofão</p>
          <div className="mt-3 flex min-h-[10rem] flex-col items-center justify-center gap-1 text-5xl" aria-hidden>
            {vestidas.length ? vestidas.map((id) => <span key={id}>{PECAS_FOFAO.find((p) => p.id === id)!.emoji}</span>) : <span className="text-white/30">🧍</span>}
          </div>
          <p className="mt-2 text-sm text-white/80">{vestidas.length ? `${vestidas.length} peça${vestidas.length === 1 ? "" : "s"}` : "ainda sem roupa"}</p>
        </div>

        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {PECAS_FOFAO.map((p) => {
            const vestida = vestidas.includes(p.id);
            const certo = vestida === p.certa;
            return (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={vestida}
                  onClick={() => alternar(p.id)}
                  className={`flex h-full w-full flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition-all ${
                    conferido
                      ? p.certa
                        ? "border-kambada-green bg-kambada-green/15"
                        : vestida
                          ? "border-kambada-red bg-kambada-red/10"
                          : "border-borda opacity-60"
                      : vestida
                        ? "-translate-y-0.5 border-kambada-amarelo bg-kambada-amarelo/15"
                        : "border-borda hover:border-kambada-amarelo"
                  }`}
                >
                  <span className="text-4xl" aria-hidden>{p.emoji}</span>
                  <span className="text-sm font-semibold leading-tight">{p.nome}</span>
                  {conferido && (
                    <span className="text-xs text-texto-suave">
                      {certo ? "✓ " : "✗ "}
                      {p.explica}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {!conferido ? (
        <button type="button" onClick={conferir} disabled={vestidas.length === 0} className={`${BOTAO} w-full text-lg`}>
          🎭 Pronto! O Fofão vai pra rua
        </button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-3xl border-2 border-kambada-amarelo bg-kambada-amarelo/10 p-6 text-center">
            <p className="font-display text-3xl font-extrabold">{acertos} de {PECAS_FOFAO.length}</p>
            <p className="mt-1 text-sm text-texto-suave">{acertos === PECAS_FOFAO.length ? "Fofão de verdade! Pode sair no bloco." : "Olha as explicações em cada peça e tenta de novo."}</p>
            <div className="mt-4 flex flex-wrap justify-center gap-3">
              <button type="button" onClick={deNovo} className={BOTAO_SECUNDARIO}>Vestir de novo</button>
              <Link href={rotaEscola("/aluno/concurso")} className={BOTAO}>✍️ Escrever a redação do concurso</Link>
            </div>
          </div>
          <Saber vocesabia={CONCURSO.inspiracao.map((x) => `${x.titulo} ${x.texto}`)} />
        </div>
      )}
    </div>
  );
}
