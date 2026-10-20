import { describe, expect, it } from "vitest";
import { prazoDeProducao, textoDeProducao } from "./prazos";

describe("prazo de produção", () => {
  it("placa leva 4 a 10 dias; matraca, 3 a 7", () => {
    expect(prazoDeProducao({ nome: "Placa de Madeira Retangular" })).toEqual({ min: 4, max: 10 });
    expect(prazoDeProducao({ nome: "Matraca Kambada Grande com Suporte" })).toEqual({ min: 3, max: 7 });
    expect(textoDeProducao({ nome: "Placa de Madeira Redonda" })).toContain("de 4 a 10 dias");
  });
});
