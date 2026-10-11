import { describe, expect, it } from "vitest";
import { ordenarRotulos } from "./ordemOpcoes";

describe("ordem das opções", () => {
  it("tamanhos de roupa vão do menor para o maior", () => {
    expect(ordenarRotulos(["G", "GG", "P", "XG", "M", "PP"])).toEqual(["PP", "P", "M", "G", "GG", "XG"]);
  });

  it("idades em ordem numérica, não alfabética", () => {
    expect(ordenarRotulos(["10 anos", "12 anos", "14 anos", "6 anos", "8 anos", "2 anos"])).toEqual([
      "2 anos",
      "6 anos",
      "8 anos",
      "10 anos",
      "12 anos",
      "14 anos",
    ]);
  });

  it("cor agrupa e o tamanho ordena dentro da cor", () => {
    expect(ordenarRotulos(["Rosa G", "Off White GG", "Off White P", "Off White M", "Off White XG", "Off White G"])).toEqual([
      "Off White P",
      "Off White M",
      "Off White G",
      "Off White GG",
      "Off White XG",
      "Rosa G",
    ]);
    expect(ordenarRotulos(["Azul 2 anos", "Off White 4 anos", "Rosa 2 anos"])).toEqual([
      "Azul 2 anos",
      "Off White 4 anos",
      "Rosa 2 anos",
    ]);
  });

  it("estampas ficam em ordem alfabética e 'Único' não quebra", () => {
    expect(ordenarRotulos(["Mosaico Colorido", "Caboclo de Pena", "Bandeira do Maranhão"])).toEqual([
      "Bandeira do Maranhão",
      "Caboclo de Pena",
      "Mosaico Colorido",
    ]);
    expect(ordenarRotulos(["Único"])).toEqual(["Único"]);
  });
});

import { parcelasPermitidas } from "./parcelas";

describe("parcelas por valor (decisão de 10/10/2026)", () => {
  it("à vista abaixo de R$ 150, 2x a partir de 150, 3x a partir de 350", () => {
    expect(parcelasPermitidas(14999)).toBe(1);
    expect(parcelasPermitidas(15000)).toBe(2);
    expect(parcelasPermitidas(34999)).toBe(2);
    expect(parcelasPermitidas(35000)).toBe(3);
  });
});

import { precisaRenovar } from "../bling/tokens";

describe("renovação proativa do token do Bling", () => {
  it("renova quando faltar menos que a folga, não antes", () => {
    const agora = 1_000_000;
    const umDia = 24 * 60 * 60 * 1000;
    expect(precisaRenovar(agora + umDia - 1, umDia, agora)).toBe(true);
    expect(precisaRenovar(agora + umDia + 1, umDia, agora)).toBe(false);
    expect(precisaRenovar(agora - 1, umDia, agora)).toBe(true);
  });
});
