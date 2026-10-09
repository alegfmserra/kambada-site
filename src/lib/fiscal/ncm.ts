/**
 * NCM de cada produto — extraído das notas que a Kambada já emitiu.
 *
 * Fonte (08/10/2026): XML das NF-e 25, 26 e 27 (remessas FENACE, com a lista
 * completa de produtos) e NF-e 2 a 28 (vendas), todas pelo emissor do SEBRAE
 * e validadas pelo contador (Glauco). A regra do Alexandre: o Bling deve
 * emitir "do jeitinho que a gente vem fazendo". Por isso aqui não há NCM
 * escolhido por mim — só o que já saiu em nota. Onde as notas divergem,
 * vale a mais recente para o MESMO produto, e o alerta fica registrado.
 *
 * Produto que nunca saiu em nota (ex.: livro) devolve null: não se chuta NCM.
 */

export type RegraNcm = { ncm: string; fonte: string; alerta?: string };

const sem = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();

export function ncmDoProduto(nomeBruto: string): RegraNcm | null {
  const n = sem(nomeBruto);

  if (n.startsWith("camisa")) {
    return /suede/.test(n)
      ? { ncm: "61099000", fonte: "NF 25 — Camiseta Suede" }
      : { ncm: "61091000", fonte: "NF 25 — Camiseta 100% algodão (adulto e infantil)" };
  }
  if (n.startsWith("ecobag")) {
    return {
      ncm: "63052000",
      fonte: "NF 26 — Ecobag Grande / Mini",
      alerta: "A NF 2 (2023) usou 42021220; a 26 (2026) usou 63052000 — segui a mais recente.",
    };
  }
  if (n.startsWith("necessaire")) return { ncm: "42029200", fonte: "NF 26 — Necessaires" };
  if (n.startsWith("pareo")) return { ncm: "62149010", fonte: "NF 26 — Pareô" };
  // Boné e matraca: o Alexandre decidiu em 09/10/2026 manter o NCM que já
  // saiu nas notas ("o mesmo que usamos em outros momentos").
  if (n.startsWith("bone")) return { ncm: "42021220", fonte: "NF 27 — Boné (validado pelo Alexandre em 09/10/2026)" };
  if (n.startsWith("matraca")) {
    // Todas em 44201100 — inclusive Play e Pequena c/ Suporte, que na NF 27
    // saíram com 92060000: vale o da maioria das notas e do cadastro do Bling.
    return {
      ncm: "44201100",
      fonte: "NF 27 — Matraca Mini / Grande / Grande c/ Suporte (validado pelo Alexandre em 09/10/2026)",
    };
  }
  if (/^kit ecologico|^kit anotacao|^bloco anotacao|caderninho/.test(n)) {
    return { ncm: "48209000", fonte: "NF 27 — Bloco/Kit de Anotação Ecológico" };
  }
  if (/^bloquinho|^joguinhos|kambada goods|livrinho/.test(n)) {
    return { ncm: "48202000", fonte: "NF 27 — Bloquinho / Livrinho Kambada Goods" };
  }
  if (/^lapis/.test(n)) return { ncm: "44209000", fonte: "NF 27 — Lápis Ecológico Plantável" };
  if (/^caneta/.test(n)) return { ncm: "44209000", fonte: "NF 27 — Caneta Ecológica" };
  if (/^placa|^mandala/.test(n)) return { ncm: "44209000", fonte: "NF 27 — Placas e Mandala" };
  if (/^porta-?chave/.test(n)) {
    return {
      ncm: "44201100",
      fonte: "NF 27 — Porta Chaves",
      alerta: "A NF 2 (2023) usou 44209000; segui a NF 27 (2026).",
    };
  }
  if (/^chaveiro/.test(n)) return { ncm: "44219900", fonte: "NF 27 — Chaveiro Pinus DTF" };

  return null;
}
