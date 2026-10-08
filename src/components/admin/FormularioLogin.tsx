"use client";

import { useActionState } from "react";
import { entrar, type EstadoLogin } from "@/app/admin/acoes";

export default function FormularioLogin() {
  const [estado, enviar, enviando] = useActionState<EstadoLogin, FormData>(entrar, {});
  return (
    <form action={enviar} className="mx-auto max-w-sm space-y-4 rounded-3xl border border-borda bg-superficie p-6">
      <div>
        <label htmlFor="adm-senha" className="block text-sm font-semibold">
          Senha da loja
        </label>
        <input
          id="adm-senha"
          name="senha"
          type="password"
          required
          autoComplete="current-password"
          className="mt-1 min-h-11 w-full rounded-xl border border-borda bg-fundo px-4 py-2.5 outline-none focus:border-kambada-amarelo-escuro"
        />
      </div>
      <p aria-live="polite" className="min-h-5 text-sm text-red-500">
        {estado.erro}
      </p>
      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-full bg-kambada-amarelo px-6 py-3.5 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro disabled:opacity-50"
      >
        {enviando ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
