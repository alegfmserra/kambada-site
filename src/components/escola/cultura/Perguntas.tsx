"use client";

import { useState } from "react";
import type { PerguntaCultura } from "@/lib/escola/cultura";
import { chamar, BOTAO } from "../chamar";

/** Avisa o servidor que o aluno terminou uma atividade de cultura (vai para o relatório do professor). */
export function avisarFeito(atividade: string, acertos?: number, total?: number) {
  void chamar("cultura", { acao: "feito", atividade, acertos, total });
}

/**
 * Perguntas de conversa depois da leitura ou do vídeo: uma de cada vez,
 * resposta na hora com a explicação. Sem segunda chance (é conversa, não
 * prova); no fim, quantas acertou.
 */
export function Perguntas({ atividade, perguntas, titulo = "Pra conversar" }: { atividade: string; perguntas: PerguntaCultura[]; titulo?: string }) {
  const [i, setI] = useState(0);
  const [escolha, setEscolha] = useState<number | null>(null);
  const [acertos, setAcertos] = useState(0);
  const [fim, setFim] = useState(false);
  const p = perguntas[i];

  function responder(n: number) {
    if (escolha !== null) return;
    setEscolha(n);
    if (n === p.correta) setAcertos((a) => a + 1);
  }

  function seguir() {
    if (i + 1 < perguntas.length) {
      setI(i + 1);
      setEscolha(null);
      return;
    }
    setFim(true);
    avisarFeito(atividade, acertos, perguntas.length);
  }

  function deNovo() {
    setI(0);
    setEscolha(null);
    setAcertos(0);
    setFim(false);
  }

  if (fim) {
    return (
      <div className="rounded-3xl border-2 border-kambada-amarelo bg-kambada-amarelo/10 p-6 text-center">
        <p className="text-4xl" aria-hidden>{acertos === perguntas.length ? "🏆" : "🎉"}</p>
        <p className="mt-2 font-display text-2xl font-extrabold">
          {acertos} de {perguntas.length}!
        </p>
        <p className="mt-1 text-sm text-texto-suave">{acertos === perguntas.length ? "Éguas, acertou tudo!" : "Boa! Quer tentar de novo?"}</p>
        <button type="button" onClick={deNovo} className="mt-4 text-sm font-semibold underline">
          Responder de novo
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border-2 border-borda p-5 sm:p-6">
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-display text-lg font-extrabold">💬 {titulo}</p>
        <p className="text-xs font-semibold text-texto-suave">
          {i + 1} de {perguntas.length}
        </p>
      </div>
      <p className="mt-3 text-lg font-semibold leading-snug">{p.pergunta}</p>
      <div className="mt-4 grid gap-2">
        {p.opcoes.map((o, n) => {
          const certa = escolha !== null && n === p.correta;
          const errada = escolha === n && n !== p.correta;
          return (
            <button
              key={o}
              type="button"
              disabled={escolha !== null}
              onClick={() => responder(n)}
              className={`rounded-2xl border-2 px-4 py-3 text-left font-semibold transition-colors ${
                certa ? "border-kambada-green bg-kambada-green/15" : errada ? "border-kambada-red bg-kambada-red/10" : "border-borda hover:border-kambada-amarelo"
              }`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {escolha !== null && (
        <div className="mt-4 space-y-3" role="status">
          <p className={`rounded-2xl p-4 text-sm font-semibold ${escolha === p.correta ? "bg-kambada-green/15" : "bg-kambada-red/10"}`}>
            {escolha === p.correta ? "✓ Isso! " : "Quase! "}
            {p.explica}
          </p>
          <button type="button" autoFocus onClick={seguir} className={`${BOTAO} w-full`}>
            {i + 1 < perguntas.length ? "Próxima →" : "Ver como fui"}
          </button>
        </div>
      )}
    </div>
  );
}

/** "Você sabia?" e glossário, em cartões. */
export function Saber({ vocesabia, glossario }: { vocesabia: string[]; glossario?: { termo: string; explica: string }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-3xl bg-kambada-grafite p-5 text-white">
        <p className="font-display text-lg font-extrabold text-kambada-amarelo">💡 Você sabia?</p>
        <ul className="mt-3 space-y-3 text-sm leading-relaxed">
          {vocesabia.map((v) => (
            <li key={v} className="flex gap-2">
              <span aria-hidden className="text-kambada-amarelo">•</span>
              {v}
            </li>
          ))}
        </ul>
      </div>
      {glossario && glossario.length > 0 && (
        <div className="rounded-3xl border-2 border-borda p-5">
          <p className="font-display text-lg font-extrabold">📖 Palavras da história</p>
          <dl className="mt-3 space-y-3 text-sm">
            {glossario.map((g) => (
              <div key={g.termo}>
                <dt className="font-bold">{g.termo}</dt>
                <dd className="text-texto-suave">{g.explica}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
