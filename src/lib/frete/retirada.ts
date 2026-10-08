/**
 * Retirada no ateliê — a opção de entrega sem transporte.
 *
 * Decisão do Alexandre (08/10/2026):
 *  - é gratuita;
 *  - antes do pagamento, o site diz só a cidade e o bairro;
 *  - o endereço completo aparece SÓ depois do pagamento aprovado (ver
 *    `enderecoAtelie.ts`, que só o servidor importa);
 *  - na nota fiscal, "sem ocorrência de transporte" (código 9 no Bling).
 *
 * Este arquivo é público (vai também para o navegador): nada de endereço aqui.
 */

/** ID fora da faixa do Melhor Envio, que só usa inteiros positivos. */
export const ID_RETIRADA = -1;

export const RETIRADA = {
  nome: "Retirar no ateliê",
  local: "São Luís — bairro do Olho d'Água",
  /** O que o cliente lê antes de pagar. */
  explicacao: "Grátis. O endereço completo chega depois da confirmação do pagamento.",
} as const;

/** A opção no mesmo formato das transportadoras, para a tela tratar igual. */
export function opcaoRetirada() {
  return {
    id: ID_RETIRADA,
    nome: `${RETIRADA.nome} — ${RETIRADA.local}`,
    servico: "Retirada",
    transportadora: "Kambada",
    preco: 0,
    precoOriginal: 0,
    prazoDias: 0,
    gratis: false,
    retirada: true,
  };
}
