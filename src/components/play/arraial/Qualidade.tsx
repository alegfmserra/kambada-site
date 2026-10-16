"use client";

import { createContext, useContext } from "react";

/**
 * Três níveis de qualidade visual da praça, ajustados em runtime pelo
 * `PerformanceMonitor` da Scene (PRD, Seção 7.4, degradação graciosa):
 * alta (tudo ligado), média (bloom desligado, teto de dpr menor) e baixa
 * (pós-processamento inteiro desligado, partículas e bandeirinhas reduzidas).
 */
export type NivelQualidade = "alta" | "media" | "baixa";

const QualidadeContext = createContext<NivelQualidade>("alta");

export const QualidadeProvider = QualidadeContext.Provider;

/** Nível de qualidade atual, pra cada sistema decidir o que desligar. */
export function useQualidade(): NivelQualidade {
  return useContext(QualidadeContext);
}
