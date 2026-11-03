"use client";

import { useCallback, useEffect, useState } from "react";
import type { AtividadeCultural, Didatica } from "@/lib/escola/cultura";
import { BOTAO, BOTAO_SECUNDARIO } from "../chamar";
import { Perguntas, Saber } from "./Perguntas";

/**
 * Leitor de HQ da área do aluno: uma página por vez, como um gibi (setas do
 * teclado, botões grandes e bolinhas de página). Depois da última página vêm
 * o "Você sabia?", as palavras da história e as perguntas de conversa.
 */
export function LeitorHQ({ hq, didatica }: { hq: AtividadeCultural; didatica: Didatica }) {
  const total = hq.paginas ?? 1;
  const [pagina, setPagina] = useState(1);
  const [terminou, setTerminou] = useState(false);
  const src = (n: number) => `/kambadaplay/hq/${hq.slug}/${String(n).padStart(2, "0")}.webp`;

  const ir = useCallback(
    (n: number) => {
      if (n > total) {
        setTerminou(true);
        return;
      }
      setPagina(Math.max(1, n));
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [total],
  );

  useEffect(() => {
    const teclar = (e: KeyboardEvent) => {
      if (terminou) return;
      if (e.key === "ArrowRight") ir(pagina + 1);
      if (e.key === "ArrowLeft") ir(pagina - 1);
    };
    window.addEventListener("keydown", teclar);
    return () => window.removeEventListener("keydown", teclar);
  }, [pagina, terminou, ir]);

  if (terminou) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl bg-kambada-amarelo/15 p-5 text-center">
          <p className="font-display text-2xl font-extrabold">Fim da história! 📚</p>
          <p className="mt-1 text-sm text-texto-suave">Agora vamos conversar sobre ela.</p>
          <button type="button" onClick={() => { setTerminou(false); setPagina(1); }} className="mt-3 text-sm font-semibold underline">
            Ler de novo
          </button>
        </div>
        <Perguntas atividade={hq.id} perguntas={didatica.perguntas} />
        <Saber vocesabia={didatica.vocesabia} glossario={didatica.glossario} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* eslint-disable-next-line @next/next/no-img-element -- arquivo do Play, sem otimizador (mesmo endereço do app offline) */}
      <img
        key={pagina}
        onClick={() => ir(pagina + 1)}
        src={src(pagina)}
        alt={`${hq.titulo}, página ${pagina} de ${total}`}
        width={1094}
        height={1547}
        // Tocar na página também vira (a barra de botões fica presa no rodapé da tela).
        className="h-auto w-full cursor-pointer rounded-lg border-4 border-kambada-grafite bg-white shadow-[8px_8px_0_0_#ffcc29]"
      />
      {/* Pré-carrega a próxima página para virar sem espera. */}
      {pagina < total && <link rel="preload" as="image" href={src(pagina + 1)} />}
      <div className="sticky bottom-3 z-10 flex items-center justify-between gap-3 rounded-full bg-fundo/90 p-2 shadow-lg ring-1 ring-borda backdrop-blur">
        <button type="button" onClick={() => ir(pagina - 1)} disabled={pagina === 1} className={BOTAO_SECUNDARIO}>
          ← Voltar
        </button>
        <div className="flex gap-1.5" aria-label={`Página ${pagina} de ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => ir(i + 1)}
              aria-label={`Ir para a página ${i + 1}`}
              className={`h-3 w-3 rounded-full ${i + 1 === pagina ? "bg-kambada-amarelo" : "bg-borda"}`}
            />
          ))}
        </div>
        <button type="button" onClick={() => ir(pagina + 1)} className={BOTAO}>
          {pagina === total ? "Terminei ✓" : "Virar →"}
        </button>
      </div>
    </div>
  );
}
