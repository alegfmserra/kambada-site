/**
 * Endereço do ateliê, para quem vai RETIRAR o pedido.
 *
 * SÓ O SERVIDOR IMPORTA ESTE ARQUIVO — página de sucesso e acompanhamento de
 * pedido, e apenas com pagamento aprovado. Importar num componente com
 * "use client" mandaria o endereço para o navegador de qualquer visitante,
 * contra a decisão de 08/10/2026 de revelá-lo só depois do pagamento.
 */
export const ENDERECO_ATELIE = {
  logradouro: "Rua Bom Jesus, nº 38",
  bairro: "Olho d'Água",
  cidade: "São Luís",
  uf: "MA",
} as const;

export function enderecoAtelieEmUmaLinha(): string {
  const e = ENDERECO_ATELIE;
  return `${e.logradouro} — ${e.bairro}, ${e.cidade}/${e.uf}`;
}
