import { describe, expect, it } from "vitest";
import { montarCaixaUnica } from "./caixa";
import { melhorPorServico } from "./cotar";
import type { Embalagem } from "./embalagens";

const camisa: Embalagem = { comprimento: 20, largura: 20, altura: 5, peso: 0.245, origem: "t" };
const matraca: Embalagem = { comprimento: 35, largura: 14, altura: 5, peso: 0.89, origem: "t" };

describe("caixa única", () => {
  it("não monta caixa para 1 unidade", () => {
    expect(montarCaixaUnica([{ embalagem: camisa, quantidade: 1 }])).toBeNull();
  });

  it("empilha 3 camisas numa caixa só", () => {
    const c = montarCaixaUnica([{ embalagem: camisa, quantidade: 3 }]);
    expect(c).toEqual({ comprimento: 20, largura: 20, altura: 17, peso: 0.835 });
  });

  it("mistura camisa e matraca usando a maior base", () => {
    const c = montarCaixaUnica([
      { embalagem: camisa, quantidade: 2 },
      { embalagem: matraca, quantidade: 1 },
    ])!;
    expect(c.comprimento).toBe(35);
    expect(c.largura).toBe(20);
    expect(c.altura).toBeGreaterThanOrEqual(5);
    expect(c.peso).toBeCloseTo(0.245 * 2 + 0.89 + 0.1, 3);
  });

  it("desiste quando passa do limite dos Correios", () => {
    expect(montarCaixaUnica([{ embalagem: matraca, quantidade: 40 }])).toBeNull();
  });
});

describe("melhor preço por serviço", () => {
  it("fica com o mais barato de cada serviço e ordena", () => {
    const r = melhorPorServico(
      [
        { id: 1, servico: "PAC", transportadora: "Correios", preco: 40, prazoDias: 8 },
        { id: 2, servico: "SEDEX", transportadora: "Correios", preco: 60, prazoDias: 3 },
      ],
      [
        { id: 1, servico: "PAC", transportadora: "Correios", preco: 25, prazoDias: 8 },
        { id: 34, servico: "Loggi Ponto", transportadora: "Loggi", preco: 30, prazoDias: 5 },
      ],
    );
    expect(r.map((o) => [o.id, o.preco])).toEqual([
      [1, 25],
      [34, 30],
      [2, 60],
    ]);
  });
});
