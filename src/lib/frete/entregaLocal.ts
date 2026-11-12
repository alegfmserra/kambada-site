/**
 * Entrega local pela Grande São Luís — corrida de aplicativo (Uber Moto/Flash, 99…).
 *
 * Decisão do Alexandre (12/11/2026): a taxa NÃO é tabelada. Varia com trânsito e horário, então
 * a loja cota a corrida no app na hora, combina tudo pelo WhatsApp e o cliente paga a corrida
 * por Pix (o frete do pedido no site é R$ 0). Grátis a partir de R$ 180 em produtos, só em
 * São Luís (a corrida é a da loja). Nota fiscal: "sem ocorrência de transporte", como a retirada.
 * A produção própria segue o prazo de produção; pronta entrega paga até as 15h sai no mesmo dia.
 *
 * Arquivo público (vai ao navegador): nada de dado interno aqui.
 */

/** ID fora da faixa do Melhor Envio (inteiros positivos) e diferente da retirada (-1). */
export const ID_LOCAL = -2;

export const LIMITE_GRATIS_LOCAL = 180;

export type CidadeLocal = "São Luís" | "Paço do Lumiar" | "Raposa" | "São José de Ribamar";

/** Faixas de CEP (8 dígitos) das quatro cidades da Ilha. Raposa (65138) fica dentro da faixa de Paço do Lumiar. */
const FAIXAS: { cidade: CidadeLocal; de: number; ate: number }[] = [
  { cidade: "São Luís", de: 65000000, ate: 65099999 },
  { cidade: "São José de Ribamar", de: 65110000, ate: 65119999 },
  { cidade: "Raposa", de: 65138000, ate: 65138999 },
  { cidade: "Paço do Lumiar", de: 65130000, ate: 65139999 },
];

export function cidadeLocalDoCep(cep: string): CidadeLocal | null {
  const n = Number(cep.replace(/\D/g, ""));
  if (!Number.isFinite(n) || cep.replace(/\D/g, "").length !== 8) return null;
  return FAIXAS.find((f) => n >= f.de && n <= f.ate)?.cidade ?? null;
}

/** Só São Luís tem corrida grátis; nas outras cidades a corrida é do cliente. */
export function corridaGratis(cidade: CidadeLocal, subtotalReais: number): boolean {
  return cidade === "São Luís" && Math.round(subtotalReais * 100) >= LIMITE_GRATIS_LOCAL * 100;
}

export function opcaoLocal(cidade: CidadeLocal, subtotalReais: number) {
  return {
    id: ID_LOCAL,
    nome: `Entrega em ${cidade} por aplicativo`,
    servico: "Entrega local",
    transportadora: "Kambada",
    preco: 0,
    precoOriginal: 0,
    prazoDias: 0,
    gratis: corridaGratis(cidade, subtotalReais),
    retirada: false,
    local: true,
  };
}

export function explicacaoLocal(gratis: boolean): string {
  return gratis
    ? "Corrida por nossa conta. Combinamos o horário pelo WhatsApp; pago até as 15h, pronta entrega sai no mesmo dia."
    : `A corrida é cotada no app na hora e paga por você via Pix, combinada no WhatsApp (grátis em São Luís a partir de R$ ${LIMITE_GRATIS_LOCAL}). Pronta entrega paga até as 15h sai no mesmo dia.`;
}
