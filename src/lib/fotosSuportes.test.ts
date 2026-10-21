import { describe, expect, it } from "vitest";
import { chaveDaFotoDoSuporte, fotosDosSuportes, nomeDoSuporte } from "./fotosSuportes";

describe("foto de demonstração do suporte (21/10/2026)", () => {
  const g = fotosDosSuportes("Matraca Kambada Grande");
  it("Folhas: preto no Boi Blackout, colorido nas outras — com o nome antigo também", () => {
    expect(g[chaveDaFotoDoSuporte("Folhas", "Boi Blackout")].src).toMatch(/folhas-preto/);
    expect(g[chaveDaFotoDoSuporte("Folhas", "Boi Miolo")].src).toMatch(/folhas-colorido/);
    expect(g[chaveDaFotoDoSuporte("Leque Bordado", "Boi Blackout")].src).toMatch(/folhas-preto/);
    expect(g[chaveDaFotoDoSuporte("Folhas")].src).toMatch(/folhas-colorido/);
  });
  it("reto e Topo Boi Preto; Mini só reto; outros produtos sem foto de suporte", () => {
    expect(g["Com suporte"].src).toMatch(/grande-reto/);
    expect(g["Topo Boi Preto"].src).toMatch(/topo-boi-preto/);
    expect(Object.keys(fotosDosSuportes("Matraca Kambada Mini"))).toEqual(["Com suporte"]);
    expect(fotosDosSuportes("Matraca Kambada Play")).toEqual({});
    expect(nomeDoSuporte("Com suporte")).toBe("suporte reto");
  });
});
