/**
 * Valores sorteados no teste de preço da assinatura mensal do Kambada Play
 * (27/10/2026). Cada pessoa vê um deles ("Se custasse R$ X por mês, você
 * assinaria?"). Os preços reais dos planos são R$ 9,90 (Família) e R$ 19,90 (Brincante).
 */
export const PRECOS_TESTE = [6.9, 9.9, 14.9, 19.9] as const;

const CHAVE = "kambada-preco-teste";

/** Sorteia um valor e lembra dele no navegador, para a mesma pessoa ver sempre o mesmo. */
export function precoSorteado(): number {
  try {
    const salvo = Number(localStorage.getItem(CHAVE));
    if ((PRECOS_TESTE as readonly number[]).includes(salvo)) return salvo;
  } catch {
    /* sem armazenamento: sorteia a cada abertura */
  }
  const p = PRECOS_TESTE[Math.floor(Math.random() * PRECOS_TESTE.length)];
  try {
    localStorage.setItem(CHAVE, String(p));
  } catch {
    /* tudo bem */
  }
  return p;
}
