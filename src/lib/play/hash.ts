/**
 * Hash determinístico 0..1 por índice, sem estado nem I/O. Substitui
 * `Math.random()` em geometria de partícula gerada uma vez no `useMemo`
 * (chamar uma função impura durante a renderização quebra a regra
 * `react-hooks/purity` do React Compiler); o resultado é sempre o mesmo
 * pro mesmo índice, então a distribuição "aleatória" fica estável entre
 * remounts, o que é até melhor pra depuração visual.
 */
export function hashDeterministico(indice: number): number {
  const v = Math.sin(indice * 12.9898) * 43758.5453;
  return v - Math.floor(v);
}
