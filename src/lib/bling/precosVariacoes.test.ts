import { describe, expect, it } from "vitest";
import { precoDaRegra } from "./precosVariacoes";

describe("preço por variação (Alexandre, 21/10/2026)", () => {
  it("ecobag: Mini 40, Grande 55", () => {
    expect(precoDaRegra("Ecobag Carcará", "Tamanho:Grande")).toBe(55);
    expect(precoDaRegra("Ecobag Carcará", "Tamanho:Mini")).toBe(40);
    expect(precoDaRegra("Ecobag Carcará", "Cor:Azul")).toBeNull();
  });
  it("matraca Grande: 145 sem suporte, 190 reto, 195 Leque Bordado e Topo Boi Preto", () => {
    expect(precoDaRegra("Matraca Kambada Grande", "Estampa:Boi Miolo;Suporte:Sem suporte")).toBe(145);
    expect(precoDaRegra("Matraca Kambada Grande", "Estampa:Boi Miolo;Suporte:Com suporte")).toBe(190);
    expect(precoDaRegra("Matraca Kambada Grande", "Estampa:Boi Miolo;Suporte:Leque Bordado")).toBe(195);
    expect(precoDaRegra("Matraca Kambada Grande", "Estampa:Boi Miolo;Suporte:Topo Boi Preto")).toBe(195);
  });
  it("matraca Mini: 110 sem suporte, 145 com suporte; DTF e Play ficam como estão", () => {
    expect(precoDaRegra("Matraca Kambada Mini", "Estampa:Miolinho;Suporte:Sem suporte")).toBe(110);
    expect(precoDaRegra("Matraca Kambada Mini", "Estampa:Miolinho;Suporte:Com suporte")).toBe(145);
    expect(precoDaRegra("Matraca Kambada Mini DTF", "Estampa:Boi Preto;Suporte:Sem suporte")).toBeNull();
    expect(precoDaRegra("Matraca Kambada Play", "Figura:Boi de Lado")).toBeNull();
  });
});
