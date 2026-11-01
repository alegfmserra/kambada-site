"use client";

import { chamar } from "./chamar";

export function BotaoSair() {
  async function sair() {
    const r = await chamar<{ destino: string }>("sair", {});
    window.location.assign(r.destino ?? "/kambadaplay");
  }
  return (
    <button type="button" onClick={sair} className="rounded-full border border-white/30 px-3 py-1.5 text-sm font-semibold text-white hover:border-kambada-amarelo">
      Sair
    </button>
  );
}
