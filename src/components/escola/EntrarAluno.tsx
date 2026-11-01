"use client";

import { useEffect, useState } from "react";
import { FIGURAS, NOME_FIGURA, type AlunoPublico } from "@/lib/escola/tipos";
import { BOTAO, chamar } from "./chamar";

/**
 * Entrada do aluno em três passos, sem teclado de letras:
 * código da turma → toca no apelido → toca nas 3 figuras do cartão.
 * `?turma=4821` (QR do cartão) já pula o primeiro passo.
 */
export function EntrarAluno({ codigoInicial }: { codigoInicial?: string }) {
  const [codigo, setCodigo] = useState(codigoInicial ?? "");
  const [turma, setTurma] = useState<{ turma: string; alunos: AlunoPublico[] } | null>(null);
  const [aluno, setAluno] = useState<AlunoPublico | null>(null);
  const [figuras, setFiguras] = useState<number[]>([]);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function buscarTurma(c: string) {
    setErro("");
    setEnviando(true);
    const r = await chamar<{ turma: string; alunos: AlunoPublico[] }>("entrar", { tipo: "turma", codigo: c });
    setEnviando(false);
    if (r.ok) setTurma({ turma: r.turma, alunos: r.alunos });
    else setErro(r.mensagem ?? "Não achei essa turma.");
  }

  useEffect(() => {
    // QR do cartão (?turma=): já busca a turma na abertura da página.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (codigoInicial && /^\d{4}$/.test(codigoInicial)) void buscarTurma(codigoInicial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function tocarFigura(i: number) {
    if (enviando || figuras.length >= 3) return;
    const novas = [...figuras, i];
    setFiguras(novas);
    setErro("");
    if (novas.length < 3) return;
    setEnviando(true);
    const r = await chamar<{ destino: string }>("entrar", { tipo: "aluno", codigo, alunoId: aluno?.id, figuras: novas });
    if (r.ok) {
      window.location.assign(r.destino);
      return;
    }
    setEnviando(false);
    setFiguras([]);
    setErro(r.mensagem ?? "As figuras não conferem.");
  }

  if (!turma) {
    return (
      <form
        className="mx-auto max-w-sm space-y-4 text-center"
        onSubmit={(e) => {
          e.preventDefault();
          void buscarTurma(codigo);
        }}
      >
        <label className="block text-lg font-bold" htmlFor="codigo">
          Código da turma
        </label>
        <input
          id="codigo"
          inputMode="numeric"
          autoComplete="off"
          maxLength={4}
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.replace(/\D/g, "").slice(0, 4))}
          className="w-full rounded-2xl border-2 border-borda bg-fundo px-4 py-4 text-center font-display text-4xl font-extrabold tracking-[0.4em] outline-none focus:border-kambada-amarelo"
          placeholder="0000"
        />
        {erro && <p className="font-semibold text-kambada-red" role="alert">{erro}</p>}
        <button type="submit" className={`${BOTAO} w-full`} disabled={codigo.length !== 4 || enviando}>
          Continuar
        </button>
        <p className="text-sm text-texto-suave">O código está no cartão que o professor entregou.</p>
      </form>
    );
  }

  if (!aluno) {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <p className="text-sm uppercase tracking-wider text-texto-suave">{turma.turma}</p>
          <h2 className="font-display text-2xl font-bold">Qual é o seu apelido?</h2>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {turma.alunos.map((a) => (
            <li key={a.id}>
              <button
                type="button"
                onClick={() => setAluno(a)}
                className="flex w-full flex-col items-center gap-1 rounded-2xl border-2 border-borda p-4 transition-colors hover:border-kambada-amarelo"
              >
                <span className="text-4xl" aria-hidden>{a.avatar}</span>
                <span className="break-all font-bold">{a.apelido}</span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="mx-auto block text-sm underline" onClick={() => setTurma(null)}>
          Não é a minha turma
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-5 text-center">
      <p className="text-5xl" aria-hidden>{aluno.avatar}</p>
      <h2 className="font-display text-2xl font-bold">Oi, {aluno.apelido}!</h2>
      <p className="text-texto-suave">Toque nas 3 figuras do seu cartão, na ordem.</p>
      <div className="flex justify-center gap-3" aria-live="polite">
        {[0, 1, 2].map((i) => (
          <span key={i} className="grid h-16 w-16 place-items-center rounded-2xl border-2 border-dashed border-borda text-4xl">
            {figuras[i] !== undefined ? FIGURAS[figuras[i]] : ""}
          </span>
        ))}
      </div>
      <div className="mx-auto grid max-w-xs grid-cols-3 gap-3">
        {FIGURAS.map((f, i) => (
          <button
            key={f}
            type="button"
            aria-label={NOME_FIGURA[i]}
            onClick={() => tocarFigura(i)}
            disabled={enviando}
            className="grid aspect-square place-items-center rounded-2xl bg-superficie text-5xl transition-transform hover:scale-105 active:scale-95 disabled:opacity-60"
          >
            {f}
          </button>
        ))}
      </div>
      {erro && <p className="font-semibold text-kambada-red" role="alert">{erro}</p>}
      <div className="flex justify-center gap-4 text-sm">
        <button type="button" className="underline" onClick={() => setFiguras([])} disabled={enviando}>
          Apagar
        </button>
        <button
          type="button"
          className="underline"
          onClick={() => {
            setAluno(null);
            setFiguras([]);
          }}
        >
          Não sou {aluno.apelido}
        </button>
      </div>
    </div>
  );
}
