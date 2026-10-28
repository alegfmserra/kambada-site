import { describe, expect, it } from "vitest";
import { assinar } from "./seguranca";
import { finalizarQuebra, iniciarQuebra, pecasDoNivel, pontosDaQuebra } from "./quebra";

describe("Quebra-cabeça — níveis", () => {
  it("12, 20 e 40 peças", () => {
    expect(pecasDoNivel("facil")).toBe(12);
    expect(pecasDoNivel("medio")).toBe(20);
    expect(pecasDoNivel("dificil")).toBe(40);
  });

  it("nível inválido vira médio", () => {
    expect(iniciarQuebra("xyz").nivel).toBe("medio");
    expect(iniciarQuebra(undefined).colunas).toBe(5);
  });
});

describe("Quebra-cabeça — pontos", () => {
  it("montagem enxuta e rápida vale 1000 × multiplicador", () => {
    expect(pontosDaQuebra("facil", 12, 60)).toBe(1000);
    expect(pontosDaQuebra("medio", 20, 100)).toBe(1500);
    expect(pontosDaQuebra("dificil", 40, 200)).toBe(2000);
  });

  it("cai com trocas e tempo a mais, mas nunca abaixo de 100 × multiplicador", () => {
    expect(pontosDaQuebra("facil", 28, 96)).toBe(1000 - 100);
    expect(pontosDaQuebra("facil", 12, 146)).toBe(1000 - 100);
    expect(pontosDaQuebra("facil", 500, 5000)).toBe(100);
    expect(pontosDaQuebra("dificil", 500, 5000)).toBe(200);
  });
});

describe("Quebra-cabeça — partida", () => {
  const t0 = 1_700_000_000_000;

  it("finaliza com prova e pontos calculados no servidor", () => {
    const { token } = iniciarQuebra("facil", t0);
    const r = finalizarQuebra(token, 20, t0 + 60_000);
    if ("erro" in r) throw new Error(r.erro);
    expect(r.pontos).toBe(pontosDaQuebra("facil", 20, 60));
    expect(r.segundos).toBe(60);
    expect(r.prova).toContain(".");
  });

  it("recusa trocas impossíveis, rápidas demais, partida adulterada, de outro tipo e expirada", () => {
    const { token } = iniciarQuebra("dificil", t0);
    expect("erro" in finalizarQuebra(token, 3, t0 + 60_000)).toBe(true); // poucas trocas para 40 peças
    expect("erro" in finalizarQuebra(token, 40, t0 + 5_000)).toBe(true); // 40 trocas em 5 s
    expect("erro" in finalizarQuebra(token, 9999, t0 + 60_000)).toBe(true);
    expect("erro" in finalizarQuebra(token + "x", 40, t0 + 60_000)).toBe(true);
    expect("erro" in finalizarQuebra("lixo", 40, t0 + 60_000)).toBe(true);
    expect("erro" in finalizarQuebra(assinar({ v: 1, id: "x", t0, nivel: "facil" }), 20, t0 + 60_000)).toBe(true);
    expect("erro" in finalizarQuebra(token, 40, t0 + 91 * 60_000)).toBe(true);
    expect("erro" in finalizarQuebra(token, "40", t0 + 60_000)).toBe(true);
  });
});
