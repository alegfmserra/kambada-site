import { describe, expect, it } from "vitest";
import { chaveDoNome, notasDeProcura } from "./procura";

const agora = new Date("2026-11-18T12:00:00Z");

describe("procura por peça", () => {
  it("junta o nome do pedido (com tamanho) ao nome da peça", () => {
    expect(chaveDoNome("Camisa Tradição (G)")).toBe(chaveDoNome("  camisa  tradição "));
  });

  it("soma visita (1), carrinho (4) e compra (10 por unidade, até 3)", () => {
    const notas = notasDeProcura(
      [
        { em: "2026-11-17T10:00:00Z", tipo: "produto", produto: "Matraca" },
        { em: "2026-11-17T10:01:00Z", tipo: "carrinho", produto: "Matraca" },
        { em: "2026-11-17T10:02:00Z", tipo: "clique", produto: "Matraca" },
      ],
      [{ criadoEm: "2026-11-17T11:00:00Z", cancelado: false, itens: [{ nome: "Matraca (Boi)", quantidade: 5 }] }],
      agora,
    );
    expect(notas.get("matraca")).toBe(1 + 4 + 30);
  });

  it("ignora o que é de antes da janela e pedido cancelado", () => {
    const notas = notasDeProcura(
      [{ em: "2026-10-01T10:00:00Z", tipo: "produto", produto: "Ecobag" }],
      [
        { criadoEm: "2026-11-17T11:00:00Z", cancelado: true, itens: [{ nome: "Ecobag", quantidade: 1 }] },
        { criadoEm: "2026-09-17T11:00:00Z", cancelado: false, itens: [{ nome: "Ecobag", quantidade: 1 }] },
      ],
      agora,
    );
    expect(notas.size).toBe(0);
  });
});
