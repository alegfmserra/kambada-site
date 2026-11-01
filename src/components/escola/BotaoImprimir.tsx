"use client";

import { BOTAO } from "./chamar";

export function BotaoImprimir() {
  return (
    <button type="button" className={BOTAO} onClick={() => window.print()}>
      🖨️ Imprimir
    </button>
  );
}
