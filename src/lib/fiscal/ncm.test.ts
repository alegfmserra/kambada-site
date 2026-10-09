import { describe, expect, it } from "vitest";
import { ncmDoProduto } from "./ncm";

describe("NCM pelas notas já emitidas", () => {
  it("cada tipo de peça recebe o NCM que saiu nas NF-e da Kambada", () => {
    expect(ncmDoProduto("Camisa Cazumbá")?.ncm).toBe("61091000");
    expect(ncmDoProduto("Camisa Revoada dos Guarás Suede Unissex")?.ncm).toBe("61099000");
    expect(ncmDoProduto("Ecobag Carcará")?.ncm).toBe("63052000");
    expect(ncmDoProduto("Necessaire Guarás")?.ncm).toBe("42029200");
    expect(ncmDoProduto("Pareô Mosaico")?.ncm).toBe("62149010");
    expect(ncmDoProduto("Lápis Plantável")?.ncm).toBe("44209000");
    expect(ncmDoProduto("Placa de Madeira Redonda")?.ncm).toBe("44209000");
    expect(ncmDoProduto("Kit Ecológico Guarás")?.ncm).toBe("48209000");
    expect(ncmDoProduto("Kambada Goods")?.ncm).toBe("48202000");
  });

  it("matracas e bonés ficam no NCM das notas anteriores (validado em 09/10/2026)", () => {
    expect(ncmDoProduto("Matraca Kambada Play")?.ncm).toBe("44201100");
    expect(ncmDoProduto("Matraca Kambada Pequena com Suporte")?.ncm).toBe("44201100");
    expect(ncmDoProduto("Matraca Kambada Grande com Suporte")?.ncm).toBe("44201100");
    expect(ncmDoProduto("Boné Guarás Bege")?.ncm).toBe("42021220");
  });

  it("produto que nunca saiu em nota não recebe NCM no chute", () => {
    expect(ncmDoProduto("Livro Trilíngue")).toBeNull();
  });
});
