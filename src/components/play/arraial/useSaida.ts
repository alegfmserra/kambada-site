"use client";

import { useEffect, useState } from "react";
import { usePrefereMenosMovimento } from "@/lib/play/movimento";

/** Duração da animação de saída das superfícies (bate com --dur-saida do arraial.css). */
const DURACAO_SAIDA = 150;

/**
 * Mantém uma superfície montada por alguns milissegundos depois de o valor
 * que a abre virar null, pra ela poder animar a saída (`data-saindo`). Com
 * prefers-reduced-motion a saída é imediata.
 */
export function useSaida<T>(valor: T | null): { valor: T | null; saindo: boolean } {
  const menosMovimento = usePrefereMenosMovimento();
  const [retido, setRetido] = useState<T | null>(valor);

  // Estado derivado da prop, atualizado durante o render (padrão do React
  // pra sincronizar sem efeito): enquanto há valor, o retido acompanha.
  if (valor !== null && retido !== valor) setRetido(valor);

  // Quando o valor some, o retido só é liberado depois da animação de saída.
  useEffect(() => {
    if (valor !== null) return;
    const id = window.setTimeout(() => setRetido(null), menosMovimento ? 0 : DURACAO_SAIDA);
    return () => window.clearTimeout(id);
  }, [valor, menosMovimento]);

  const saindo = valor === null && retido !== null;
  return { valor: valor ?? (saindo ? retido : null), saindo };
}
