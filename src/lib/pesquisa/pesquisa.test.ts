import { describe, expect, it } from "vitest";
import { respostasParaCsv, resumir, validarResposta } from "./pesquisa";

describe("pesquisa de satisfação", () => {
  it("aceita só opções conhecidas e corta texto longo", () => {
    const r = validarResposta({
      nota: 5,
      funcionou: "com-problemas",
      problema: "x".repeat(900),
      curtiu: ["loja", "play", "invasor", "loja"],
      valorPlay: "muito",
      assinaria: "hackeado",
      pagina: "/loja?utm=1",
      largura: 390,
    });
    expect(r?.nota).toBe(5);
    expect(r?.problema).toHaveLength(500);
    expect(r?.curtiu).toEqual(["loja", "play"]);
    expect(r?.assinaria).toBeUndefined();
    expect(r?.pagina).toBe("/loja");
  });

  it("recusa resposta vazia e nota fora de 1–5", () => {
    expect(validarResposta({})).toBeNull();
    expect(validarResposta({ nota: 9 })).toBeNull();
    expect(validarResposta({ pagina: "/" })).toBeNull();
  });

  it("CSV neutraliza fórmula e resume a nota média", () => {
    const a = validarResposta({ nota: 4, comentario: "=HYPERLINK(1)" })!;
    const b = validarResposta({ nota: 5, assinaria: "familia" })!;
    expect(respostasParaCsv([a])).toContain(`"'=HYPERLINK(1)"`);
    const s = resumir([a, b]);
    expect(s.notaMedia).toBe(4.5);
    expect(s.assinaria["Sim — Família (R$ 9,90/mês)"]).toBe(1);
  });
});
