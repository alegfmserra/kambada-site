import { describe, expect, it } from "vitest";
import { aamm, cfopDeDevolucao, escolherNaturezaDeDevolucao, montarNotaDeDevolucao } from "./devolucao";

describe("nota de devolução (regra do Glauco: inversa da venda, sempre referenciando a nota de venda)", () => {
  it("CFOP inverso dos que a Kambada usa; o resto não se chuta", () => {
    expect(cfopDeDevolucao("5102")).toBe("1202");
    expect(cfopDeDevolucao("6.108")).toBe("2202");
    expect(cfopDeDevolucao("6102")).toBe("2202");
    expect(cfopDeDevolucao("5115")).toBeNull();
    expect(cfopDeDevolucao(undefined)).toBeNull();
  });

  it("escolhe exatamente 'Devolução de venda' — nunca a de compra nem a com ST", () => {
    const naturezas = [
      { id: 45, descricao: "Devolução de compra", situacao: 1 },
      { id: 50, descricao: "Devolução de venda com ST", situacao: 1 },
      { id: 46, descricao: "Devolução de venda", situacao: 1 },
    ];
    expect(escolherNaturezaDeDevolucao(naturezas)).toBe(46);
    expect(escolherNaturezaDeDevolucao(naturezas.slice(0, 2))).toBeNull();
  });

  it("data da nota original em AAMM", () => {
    expect(aamm("2026-10-21 10:00:00")).toBe("2610");
    expect(aamm(undefined)).toBe("");
  });

  const venda = {
    numero: "000030",
    serie: 0,
    chaveAcesso: "21261051894535000194550000000000301000000301",
    dataEmissao: "2026-10-21 10:00:00",
    contato: { id: 9, nome: "Maria", tipoPessoa: "F", numeroDocumento: "12345678900", contribuinte: 9 },
    itens: [{ codigo: "MM-01", descricao: "Matraca Mini", unidade: "UN", quantidade: 1, valor: 70, cfop: "6108", classificacaoFiscal: "44201100", origem: 0 }],
  };

  it("entrada, finalidade devolução, referência completa à nota de venda e CFOP por item", () => {
    const n = montarNotaDeDevolucao(venda, 55, "KMB-20261021-ABC123", new Date("2026-10-25T12:00:00Z"));
    expect(n.tipo).toBe(0);
    expect(n.finalidade).toBe(4);
    expect(n.naturezaOperacao).toEqual({ id: 55 });
    expect(n.documentoReferenciado).toEqual({ modelo: "55", chaveAcesso: venda.chaveAcesso, numero: "000030", serie: "0", data: "2610" });
    expect(n.itens[0].cfop).toBe("2202");
    expect(n.contato.numeroDocumento).toBe("12345678900");
    expect(n.observacoes).toContain(venda.chaveAcesso);
  });

  it("sem chave ou com CFOP sem inverso: recusa (emitir com o Glauco)", () => {
    expect(() => montarNotaDeDevolucao({ ...venda, chaveAcesso: undefined }, 55, "KMB-20261021-ABC123")).toThrow(/chave/);
    expect(() =>
      montarNotaDeDevolucao({ ...venda, itens: [{ ...venda.itens[0], cfop: "5115" }] }, 55, "KMB-20261021-ABC123"),
    ).toThrow(/manualmente/);
  });
});
