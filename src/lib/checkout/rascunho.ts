/**
 * Rascunho do checkout: o que a pessoa já digitou, guardado só nesta aba
 * (sessionStorage; some ao fechar). CPF nunca é salvo.
 *
 * Desde 17/11/2026 o CEP digitado no carrinho ou na página da peça entra no
 * mesmo rascunho, para o checkout abrir com ele preenchido e o frete já cotado.
 *
 * Arquivo público (vai ao navegador): nada de módulo de servidor aqui.
 */
export const CHAVE_RASCUNHO = "kambada:checkout:rascunho";

/** "65065060" → "65065-060"; aceita o que vier e guarda só os 8 primeiros dígitos. */
export function mascaraCep(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

/** O CEP de um rascunho já lido do armazenamento, com máscara; "" se não houver um completo. */
export function cepDoRascunho(bruto: string | null): string {
  if (!bruto) return "";
  try {
    const cep = (JSON.parse(bruto) as { cep?: unknown }).cep;
    const mascarado = typeof cep === "string" ? mascaraCep(cep) : "";
    return mascarado.length === 9 ? mascarado : "";
  } catch {
    return "";
  }
}

/** O rascunho com o CEP novo, preservando o resto. Rascunho ilegível é refeito só com o CEP. */
export function rascunhoComCep(bruto: string | null, cep: string): string {
  let atual: Record<string, unknown> = {};
  try {
    const lido: unknown = bruto ? JSON.parse(bruto) : null;
    if (lido && typeof lido === "object" && !Array.isArray(lido)) atual = lido as Record<string, unknown>;
  } catch {
    /* refaz */
  }
  // Rascunho nunca leva CPF, nem se alguém o tiver posto lá.
  delete atual.cpf;
  return JSON.stringify({ ...atual, cep: mascaraCep(cep) });
}

export function lerCepSalvo(): string {
  try {
    return cepDoRascunho(sessionStorage.getItem(CHAVE_RASCUNHO));
  } catch {
    return "";
  }
}

export function salvarCep(cep: string): void {
  try {
    sessionStorage.setItem(CHAVE_RASCUNHO, rascunhoComCep(sessionStorage.getItem(CHAVE_RASCUNHO), cep));
  } catch {
    /* sem armazenamento: a pessoa digita o CEP de novo no checkout */
  }
}
