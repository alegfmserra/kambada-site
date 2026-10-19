"use client";

import { useState } from "react";
import { chamar } from "./jogador";

export function FormularioRedefinir({ token }: { token: string }) {
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    const r = await chamar("/api/play/conta", { acao: "redefinir", token, senha });
    if (!r.ok) {
      setEnviando(false);
      setErro(r.mensagem ?? "Não deu para trocar a senha.");
      return;
    }
    // Navegação completa de propósito: o cookie novo precisa passar pelo porteiro.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/kambadaplay/conta?senhaTrocada=1");
  }

  if (!token) {
    return <p className="mt-4 text-texto-suave">Link incompleto. Peça um novo em &ldquo;esqueci a senha&rdquo;.</p>;
  }
  return (
    <form onSubmit={enviar} className="mt-8 space-y-4 text-left">
      <div>
        <label htmlFor="senha" className="text-sm font-semibold text-texto-suave">
          Nova senha (mínimo de 8 caracteres)
        </label>
        <input
          id="senha"
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoComplete="new-password"
          required
          minLength={8}
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
        {enviando ? "Salvando…" : "Salvar nova senha"}
      </button>
    </form>
  );
}
