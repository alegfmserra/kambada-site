import { useSyncExternalStore } from "react";

/**
 * Lê uma media query do sistema (`matchMedia`) e mantém o valor atualizado
 * se ela mudar com a página aberta. `useSyncExternalStore` é o jeito correto
 * de ler estado externo mutável fora do modelo de efeitos do React, sem
 * precisar de um `useState` sincronizado por `useEffect`; no servidor,
 * `matchMedia` não existe, então assume o valor `false` até hidratar.
 */
export function useMediaQuery(query: string): boolean {
  const inscrever = (callback: () => void) => {
    const consulta = window.matchMedia(query);
    consulta.addEventListener("change", callback);
    return () => consulta.removeEventListener("change", callback);
  };
  const lerValor = () => window.matchMedia(query).matches;
  const lerValorServidor = () => false;
  return useSyncExternalStore(inscrever, lerValor, lerValorServidor);
}
