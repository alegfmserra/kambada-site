"use client";

import Link from "next/link";
import { useState } from "react";
import type { Quebra } from "@/lib/escola/cultura";
import { rotaEscola } from "@/lib/escola/host";
import { BOTAO, BOTAO_SECUNDARIO } from "../chamar";
import { FalaKambadinha } from "../Marca";
import { avisarFeito } from "./Perguntas";

/** Embaralha até sair diferente da ordem certa. */
function embaralhado(n: number): number[] {
  const a = Array.from({ length: n }, (_, i) => i);
  do {
    for (let i = n - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
  } while (a.every((v, i) => v === i));
  return a;
}

/**
 * Quebra-cabeça da temporada: a imagem (capa da revistinha, pôster do
 * arraial) cortada em peças; toca numa peça e depois noutra para trocar as
 * duas de lugar. A peça que já está no lugar certo ganha borda verde.
 * "Acertos" no relatório = 3 se montou com poucas trocas, 2 com algumas, 1 se
 * precisou de muitas (é brincadeira: o que conta é ter montado).
 */
export function QuebraCabeca({ q }: { q: Quebra }) {
  const [nivel, setNivel] = useState<"facil" | "dificil">("facil");
  const [cols, rows] = q.largura >= q.altura ? (nivel === "facil" ? [4, 3] : [6, 4]) : nivel === "facil" ? [3, 4] : [4, 6];
  const total = cols * rows;
  const [pecas, setPecas] = useState(() => embaralhado(total));
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const [trocas, setTrocas] = useState(0);
  const [pronto, setPronto] = useState(false);

  function recomecar(novo = nivel) {
    const [c, r] = q.largura >= q.altura ? (novo === "facil" ? [4, 3] : [6, 4]) : novo === "facil" ? [3, 4] : [4, 6];
    setNivel(novo);
    setPecas(embaralhado(c * r));
    setEscolhida(null);
    setTrocas(0);
    setPronto(false);
  }

  function tocar(pos: number) {
    if (pronto) return;
    if (escolhida === null) {
      setEscolhida(pos);
      return;
    }
    if (escolhida === pos) {
      setEscolhida(null);
      return;
    }
    const novas = [...pecas];
    [novas[escolhida], novas[pos]] = [novas[pos], novas[escolhida]];
    setPecas(novas);
    setEscolhida(null);
    const t = trocas + 1;
    setTrocas(t);
    if (novas.every((v, i) => v === i)) {
      setPronto(true);
      const nota = t <= total ? 3 : t <= total * 2 ? 2 : 1;
      avisarFeito(q.id, nota, 3);
    }
  }

  const certas = pecas.filter((v, i) => v === i).length;

  return (
    <div className="space-y-5">
      {!pronto && <FalaKambadinha>Toca numa peça e depois noutra pra trocar as duas. As que já tão no lugar ficam verdinhas!</FalaKambadinha>}
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <span>
          <b>{certas}</b> de {total} no lugar · {trocas} trocas
        </span>
        <span className="flex gap-2">
          {(["facil", "dificil"] as const).map((n) => (
            <button key={n} type="button" onClick={() => recomecar(n)} className={`rounded-full px-3 py-1.5 font-bold ${nivel === n ? "bg-kambada-amarelo text-kambada-grafite" : "border-2 border-borda"}`}>
              {n === "facil" ? `Fácil (${q.largura >= q.altura ? "4×3" : "3×4"})` : `Difícil (${q.largura >= q.altura ? "6×4" : "4×6"})`}
            </button>
          ))}
        </span>
      </div>

      <div
        className="mx-auto grid max-w-xl overflow-hidden rounded-2xl border-4 border-kambada-grafite shadow-[8px_8px_0_0_#ffcc29]"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, aspectRatio: `${q.largura} / ${q.altura}` }}
        role="grid"
        aria-label={`Quebra-cabeça: ${q.titulo}`}
      >
        {pecas.map((peca, pos) => {
          const x = peca % cols;
          const y = Math.floor(peca / cols);
          const noLugar = peca === pos;
          return (
            <button
              key={pos}
              type="button"
              onClick={() => tocar(pos)}
              aria-label={`Peça ${pos + 1}${noLugar ? ", no lugar" : ""}${escolhida === pos ? ", escolhida" : ""}`}
              className={`relative transition-transform ${escolhida === pos ? "z-10 scale-95 ring-4 ring-kambada-amarelo" : ""} ${pronto ? "" : noLugar ? "ring-2 ring-inset ring-kambada-green" : "ring-1 ring-inset ring-black/20"}`}
              style={{
                backgroundImage: `url(${q.imagem})`,
                backgroundSize: `${cols * 100}% ${rows * 100}%`,
                backgroundPosition: `${cols > 1 ? (x / (cols - 1)) * 100 : 0}% ${rows > 1 ? (y / (rows - 1)) * 100 : 0}%`,
              }}
            />
          );
        })}
      </div>

      {pronto ? (
        <div className="rounded-3xl border-2 border-kambada-amarelo bg-kambada-amarelo/10 p-6 text-center">
          <p className="font-display text-3xl font-extrabold">🧩 Montado!</p>
          <p className="mt-1 text-sm text-texto-suave">Em {trocas} trocas. {q.legenda}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={() => recomecar()} className={BOTAO_SECUNDARIO}>Montar de novo</button>
            {nivel === "facil" && <button type="button" onClick={() => recomecar("dificil")} className={BOTAO}>Tentar o difícil</button>}
            {q.depois && (
              <Link href={rotaEscola(q.depois.caminho)} className={BOTAO_SECUNDARIO}>
                {q.depois.rotulo} →
              </Link>
            )}
          </div>
        </div>
      ) : (
        <details className="mx-auto max-w-xl text-sm">
          <summary className="cursor-pointer font-semibold">Ver a imagem inteira (dica)</summary>
          {/* eslint-disable-next-line @next/next/no-img-element -- imagem do Play, arquivo direto */}
          <img src={q.imagem} alt={q.titulo} className="mt-2 w-full rounded-xl" />
        </details>
      )}
    </div>
  );
}
