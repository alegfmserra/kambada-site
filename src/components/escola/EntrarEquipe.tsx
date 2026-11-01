"use client";

import { useState } from "react";
import { BOTAO, CAMPO, chamar } from "./chamar";

export function EntrarEquipe() {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    const r = await chamar<{ destino: string }>("entrar", { tipo: "equipe", usuario, senha });
    if (r.ok) {
      window.location.assign(r.destino);
      return;
    }
    setEnviando(false);
    setErro(r.mensagem ?? "Usuário ou senha não conferem.");
  }

  return (
    <form onSubmit={entrar} className="mx-auto max-w-sm space-y-4">
      <label className="block text-sm font-semibold">
        Usuário
        <input className={CAMPO} value={usuario} onChange={(e) => setUsuario(e.target.value)} autoComplete="username" autoCapitalize="none" required />
      </label>
      <label className="block text-sm font-semibold">
        Senha
        <input className={CAMPO} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" required />
      </label>
      {erro && <p className="font-semibold text-kambada-red" role="alert">{erro}</p>}
      <button type="submit" className={`${BOTAO} w-full`} disabled={enviando}>
        Entrar
      </button>
      <p className="text-center text-sm text-texto-suave">A coordenação cria o acesso de cada professor.</p>
    </form>
  );
}
