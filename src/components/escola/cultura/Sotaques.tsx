"use client";

import { useState } from "react";
import { INSTRUMENTOS, PERGUNTA_FINAL_SOTAQUES, SOTAQUES } from "@/lib/escola/cultura";
import { BOTAO } from "../chamar";
import { FalaKambadinha } from "../Marca";
import { avisarFeito, Saber } from "./Perguntas";
import { tocarInstrumento, tocarSotaque } from "./som";

type Fase = "montar" | "certo" | "revelado" | "final" | "fim";

/**
 * Jogo "Sotaques do Boi": em cada rodada, um sotaque do Bumba-meu-boi; a
 * criança escuta os instrumentos (toque na carta faz o som), escolhe os que
 * formam aquele batalhão e toca. Acertou de primeira = ponto. Errou duas
 * vezes, o jogo mostra os certos. No fim, uma pergunta sobre o Cazumbá
 * (ponte com a HQ "Na Batida do Tambor").
 */
export function Sotaques() {
  const [r, setR] = useState(0);
  const [marcados, setMarcados] = useState<string[]>([]);
  const [erros, setErros] = useState(0);
  const [pontos, setPontos] = useState(0);
  const [fase, setFase] = useState<Fase>("montar");
  const [escolhaFinal, setEscolhaFinal] = useState<number | null>(null);
  const s = SOTAQUES[r];
  const total = SOTAQUES.length + 1;

  function alternar(id: string) {
    if (fase !== "montar") return;
    tocarInstrumento(id);
    setMarcados((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  }

  function tocar() {
    const certo = marcados.length === s.certos.length && s.certos.every((c) => marcados.includes(c));
    if (certo) {
      if (erros === 0) setPontos((p) => p + 1);
      setFase("certo");
      tocarSotaque(s.toque);
      return;
    }
    if (erros >= 1) {
      setMarcados(s.certos);
      setFase("revelado");
      tocarSotaque(s.toque);
      return;
    }
    setErros(1);
  }

  function proximo() {
    setMarcados([]);
    setErros(0);
    if (r + 1 < SOTAQUES.length) {
      setR(r + 1);
      setFase("montar");
    } else setFase("final");
  }

  function responderFinal(n: number) {
    if (escolhaFinal !== null) return;
    setEscolhaFinal(n);
    const p = pontos + (n === PERGUNTA_FINAL_SOTAQUES.correta ? 1 : 0);
    setPontos(p);
    avisarFeito("jogo-sotaques", p, total);
  }

  function deNovo() {
    setR(0);
    setMarcados([]);
    setErros(0);
    setPontos(0);
    setEscolhaFinal(null);
    setFase("montar");
  }

  if (fase === "final" || fase === "fim") {
    const q = PERGUNTA_FINAL_SOTAQUES;
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border-2 border-borda p-5">
          <p className="font-display text-lg font-extrabold">🎭 Pergunta bônus</p>
          <p className="mt-2 text-lg font-semibold">{q.pergunta}</p>
          <div className="mt-4 grid gap-2">
            {q.opcoes.map((o, n) => (
              <button
                key={o}
                type="button"
                disabled={escolhaFinal !== null}
                onClick={() => responderFinal(n)}
                className={`rounded-2xl border-2 px-4 py-3 text-left font-semibold ${
                  escolhaFinal !== null && n === q.correta ? "border-kambada-green bg-kambada-green/15" : escolhaFinal === n ? "border-kambada-red bg-kambada-red/10" : "border-borda hover:border-kambada-amarelo"
                }`}
              >
                {o}
              </button>
            ))}
          </div>
          {escolhaFinal !== null && <p className="mt-4 rounded-2xl bg-kambada-amarelo/15 p-4 text-sm font-semibold" role="status">{q.explica}</p>}
        </div>
        {escolhaFinal !== null && (
          <div className="rounded-3xl border-2 border-kambada-amarelo bg-kambada-amarelo/10 p-6 text-center">
            <p className="text-5xl" aria-hidden>🥁🎷🪵</p>
            <p className="mt-2 font-display text-3xl font-extrabold">{pontos} de {total}</p>
            <p className="mt-1 text-sm text-texto-suave">Agora tu reconhece os sotaques do boi pelo som!</p>
            <button type="button" onClick={deNovo} className={`${BOTAO} mt-4`}>Jogar de novo</button>
          </div>
        )}
        <Saber vocesabia={["O Bumba-meu-boi do Maranhão tem cinco sotaques principais: da Ilha (matraca), de Zabumba, de Orquestra, da Baixada e de Costa-de-mão.", "Cada sotaque tem seu ritmo, suas roupas e seus personagens; um grupo de boi também é chamado de batalhão.", "O Bumba-meu-boi do Maranhão é Patrimônio Cultural Imaterial da Humanidade (UNESCO, 2019)."]} />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between text-sm">
        <span className="font-semibold">Rodada {r + 1} de {SOTAQUES.length}</span>
        <span className="font-bold">{pontos} ponto{pontos === 1 ? "" : "s"}</span>
      </div>
      <div className="rounded-3xl bg-kambada-grafite p-6 text-white">
        <p className="text-xs font-bold uppercase tracking-wider text-kambada-amarelo">Monte o batalhão do</p>
        <h2 className="mt-1 font-display text-2xl font-extrabold">{s.nome}</h2>
        <p className="mt-1 text-sm text-white/75">📍 {s.onde}</p>
      </div>

      {fase === "montar" && (
        <FalaKambadinha>
          {erros === 0 ? "Toca nas cartas para escutar cada instrumento e marca os que tocam nesse sotaque." : "Hmm, esse batalhão não soa assim. Escuta de novo e tenta mais uma vez!"}
        </FalaKambadinha>
      )}

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {INSTRUMENTOS.map((i) => {
          const marcado = marcados.includes(i.id);
          const revelado = fase !== "montar";
          const certo = s.certos.includes(i.id);
          return (
            <li key={i.id}>
              <button
                type="button"
                aria-pressed={marcado}
                onClick={() => alternar(i.id)}
                className={`flex h-full w-full flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all ${
                  revelado
                    ? certo
                      ? "border-kambada-green bg-kambada-green/15"
                      : "border-borda opacity-50"
                    : marcado
                      ? "-translate-y-0.5 border-kambada-amarelo bg-kambada-amarelo/15"
                      : "border-borda hover:border-kambada-amarelo"
                }`}
              >
                <span className="text-4xl" aria-hidden>{i.emoji}</span>
                <span className="text-sm font-semibold leading-tight">{i.nome}</span>
                {marcado && !revelado && <span className="text-xs font-bold text-kambada-amarelo-escuro">no batalhão ✓</span>}
              </button>
            </li>
          );
        })}
      </ul>

      {fase === "montar" ? (
        <button type="button" onClick={tocar} disabled={marcados.length === 0} className={`${BOTAO} w-full text-lg`}>
          🎶 Tocar o batalhão!
        </button>
      ) : (
        <div className="space-y-3" role="status">
          <p className={`rounded-2xl p-4 text-sm font-semibold ${fase === "certo" ? "bg-kambada-green/15" : "bg-kambada-amarelo/15"}`}>
            {fase === "certo" ? (erros === 0 ? "✓ Acertou de primeira! " : "✓ Agora sim! ") : "Olha os instrumentos certos (em verde): "}
            {s.explica}
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => tocarSotaque(s.toque)} className="rounded-full border-2 border-borda px-4 py-2 text-sm font-semibold">🔁 Ouvir de novo</button>
            <button type="button" autoFocus onClick={proximo} className={`${BOTAO} flex-1`}>
              {r + 1 < SOTAQUES.length ? "Próximo sotaque →" : "Pergunta bônus →"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
