"use client";

import { useState } from "react";
import { chamar } from "./jogador";

/** Login provisório do Kambada Play. */
export function FormularioEntrada({ de }: { de: string }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    const r = await chamar<{ destino: string }>("/api/play/entrar", { usuario, senha, de });
    if (!r.ok) {
      setEnviando(false);
      setErro(r.mensagem ?? "Não deu para entrar. Tente de novo.");
      return;
    }
    window.location.assign(r.destino || "/kambadaplay");
  }

  return (
    <form onSubmit={entrar} className="mt-8 space-y-4 text-left">
      <div>
        <label htmlFor="usuario" className="text-sm font-semibold text-texto-suave">
          Login
        </label>
        <input
          id="usuario"
          name="usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          required
          className="mt-1 w-full rounded-lg border-2 border-borda bg-fundo px-4 py-3 text-texto outline-none focus:border-kambada-amarelo"
        />
      </div>
      <div>
        <label htmlFor="senha" className="text-sm font-semibold text-texto-suave">
          Senha
        </label>
        <input
          id="senha"
          name="senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="current-password"
          required
          className="mt-1 w-full rounded-lg border-2 border-borda bg-fundo px-4 py-3 text-texto outline-none focus:border-kambada-amarelo"
        />
      </div>
      {erro ? (
        <p role="alert" className="rounded-md bg-kambada-grafite/10 px-3 py-2 text-sm font-semibold text-texto">
          {erro}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-full bg-kambada-amarelo px-8 py-3.5 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro disabled:opacity-60"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
