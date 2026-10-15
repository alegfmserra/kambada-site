import { useMediaQuery } from "./mediaQuery";

/**
 * Lê a preferência `prefers-reduced-motion` do sistema e mantém o valor
 * atualizado se a pessoa mudar a preferência com a página aberta. Usado
 * pelos sistemas de partícula, vento e balanço do arraial pra desligar
 * movimento não essencial quando o visitante pediu menos movimento.
 */
export function usePrefereMenosMovimento(): boolean {
  return useMediaQuery("(prefers-reduced-motion: reduce)");
}
