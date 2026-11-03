"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CENAS_AUTO, PERSONAGENS_AUTO, VOCESABIA_AUTO, type CenaAuto } from "@/lib/escola/cultura";
import { rotaEscola } from "@/lib/escola/host";
import { BOTAO, BOTAO_SECUNDARIO } from "../chamar";
import { FalaKambadinha } from "../Marca";
import { avisarFeito, Saber } from "./Perguntas";

function embaralhar<T>(lista: T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Jogo "A história do Boi": as seis cenas do auto do Bumba-meu-boi vêm
 * embaralhadas; a criança toca nas cartas para pô-las na linha da história,
 * confere, e as que estão no lugar certo ficam presas (verdes). Conta como
 * acerto o que estava certo na PRIMEIRA conferida.
 */
export function AutoDoBoi() {
  const [rodada, setRodada] = useState(0);
  const baralho = useMemo(() => embaralhar(CENAS_AUTO), [rodada]); // eslint-disable-line react-hooks/exhaustive-deps
  const [linha, setLinha] = useState<(CenaAuto | null)[]>(() => CENAS_AUTO.map(() => null));
  const [presas, setPresas] = useState<boolean[]>(() => CENAS_AUTO.map(() => false));
  const [conferidas, setConferidas] = useState(0);
  const [primeira, setPrimeira] = useState<number | null>(null);
  const [aviso, setAviso] = useState("");

  const colocadas = new Set(linha.filter(Boolean).map((c) => c!.id));
  const naMao = baralho.filter((c) => !colocadas.has(c.id));
  const completa = presas.every(Boolean);

  function colocar(c: CenaAuto) {
    const vaga = linha.findIndex((x) => x === null);
    if (vaga < 0) return;
    setAviso("");
    setLinha(linha.map((x, i) => (i === vaga ? c : x)));
  }

  function tirar(i: number) {
    if (presas[i]) return;
    setLinha(linha.map((x, n) => (n === i ? null : x)));
  }

  function conferir() {
    const certas = linha.map((c, i) => c?.id === CENAS_AUTO[i].id);
    const n = certas.filter(Boolean).length;
    const vez = conferidas + 1;
    setConferidas(vez);
    if (primeira === null) setPrimeira(n);
    setPresas(certas);
    setLinha(linha.map((c, i) => (certas[i] ? c : null)));
    if (n === CENAS_AUTO.length) {
      avisarFeito("jogo-auto-do-boi", primeira ?? n, CENAS_AUTO.length);
    } else {
      setAviso(`${n} de ${CENAS_AUTO.length} no lugar certo! As outras voltaram para a mão. Lê de novo e tenta.`);
    }
  }

  function deNovo() {
    setRodada((r) => r + 1);
    setLinha(CENAS_AUTO.map(() => null));
    setPresas(CENAS_AUTO.map(() => false));
    setConferidas(0);
    setPrimeira(null);
    setAviso("");
  }

  if (completa) {
    return (
      <div className="space-y-6">
        <div className="rounded-3xl border-2 border-kambada-amarelo bg-kambada-amarelo/10 p-6 text-center">
          <p className="text-5xl" aria-hidden>🐂🎉</p>
          <h2 className="mt-2 font-display text-3xl font-extrabold">Urrou! A história está completa!</h2>
          <p className="mt-2 text-sm text-texto-suave">
            {conferidas === 1 ? "De primeira! Tu conhece o auto do boi." : `Na primeira conferida, ${primeira} de ${CENAS_AUTO.length} estavam certas. Conseguiu em ${conferidas} tentativas.`}
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            <button type="button" onClick={deNovo} className={BOTAO}>Jogar de novo</button>
            <Link href={rotaEscola("/aluno/cultura/conto")} className={BOTAO_SECUNDARIO}>📜 Ver o cordel animado</Link>
          </div>
        </div>
        <ol className="space-y-3">
          {CENAS_AUTO.map((c, i) => (
            <li key={c.id} className="flex gap-4 rounded-2xl border-2 border-borda p-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-kambada-amarelo/20 text-2xl" aria-hidden>{c.emoji}</span>
              <div>
                <p className="font-display font-bold">{i + 1}. {c.titulo}</p>
                <p className="text-sm text-texto-suave">{c.texto}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="rounded-3xl border-2 border-borda p-5">
          <p className="font-display text-lg font-extrabold">🎭 Quem é quem na brincadeira</p>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            {PERSONAGENS_AUTO.map((p) => (
              <div key={p.nome}>
                <dt className="font-bold">{p.nome}</dt>
                <dd className="text-texto-suave">{p.texto}</dd>
              </div>
            ))}
          </dl>
        </div>
        <Saber vocesabia={VOCESABIA_AUTO} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <FalaKambadinha>Bora contar a história do boi? Toca nas cartas na ordem em que tudo acontece!</FalaKambadinha>

      <section aria-label="Linha da história">
        <p className="mb-2 text-xs font-bold uppercase tracking-wider text-texto-suave">A história, do começo ao fim</p>
        <ol className="grid gap-2 sm:grid-cols-2">
          {linha.map((c, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => tirar(i)}
                disabled={!c || presas[i]}
                aria-label={c ? `${i + 1}º: ${c.titulo}${presas[i] ? " (certa)" : ". Toque para tirar"}` : `${i + 1}º: vazio`}
                className={`flex min-h-[4.5rem] w-full items-center gap-3 rounded-2xl border-2 p-3 text-left ${
                  presas[i] ? "border-kambada-green bg-kambada-green/15" : c ? "border-kambada-amarelo bg-kambada-amarelo/10" : "border-dashed border-borda"
                }`}
              >
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-kambada-grafite text-sm font-bold text-white">{i + 1}</span>
                {c ? (
                  <span>
                    <span aria-hidden>{c.emoji}</span> <b>{c.titulo}</b>
                    {presas[i] && <span className="ml-1 text-kambada-green">✓</span>}
                  </span>
                ) : (
                  <span className="text-sm text-texto-tenue">…</span>
                )}
              </button>
            </li>
          ))}
        </ol>
      </section>

      {aviso && <p role="status" className="rounded-2xl bg-kambada-amarelo/20 p-3 text-sm font-semibold">{aviso}</p>}

      {naMao.length > 0 ? (
        <section aria-label="Cartas para pôr na história">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-texto-suave">Cartas (toca para pôr na próxima vaga)</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {naMao.map((c) => (
              <li key={c.id}>
                <button type="button" onClick={() => colocar(c)} className="flex h-full w-full gap-3 rounded-2xl border-2 border-borda p-4 text-left transition-all hover:-translate-y-0.5 hover:border-kambada-amarelo">
                  <span className="text-3xl" aria-hidden>{c.emoji}</span>
                  <span>
                    <b className="block font-display">{c.titulo}</b>
                    <span className="text-sm text-texto-suave">{c.texto}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : (
        <button type="button" onClick={conferir} className={`${BOTAO} w-full text-lg`}>
          Conferir a história ✓
        </button>
      )}
    </div>
  );
}
