"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

/**
 * A opção (tamanho/estampa) que o cliente está vendo na página da peça.
 *
 * A foto fica numa coluna e o seletor na outra; os dois são componentes de
 * cliente separados dentro de uma página de servidor. Este contexto é o fio
 * entre eles: o seletor avisa qual estampa foi escolhida e a foto troca
 * (antes, a matraca mostrava sempre a mesma foto — auditoria de 10/10/2026).
 */
type Contexto = { idOpcao: number | null; escolher: (id: number | null) => void };

const OpcaoAtiva = createContext<Contexto | null>(null);

export function ProvedorOpcaoAtiva({ inicial = null, children }: { inicial?: number | null; children: ReactNode }) {
  const [idOpcao, escolher] = useState<number | null>(inicial);
  return <OpcaoAtiva.Provider value={{ idOpcao, escolher }}>{children}</OpcaoAtiva.Provider>;
}

/** Fora do provedor (ex.: testes), devolve null e nada quebra. */
export function useOpcaoAtiva(): Contexto | null {
  return useContext(OpcaoAtiva);
}
