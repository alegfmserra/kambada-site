import { describe, expect, it } from "vitest";
import { contarErro, errosEsgotados } from "./limite";

describe("limite só de erros (login)", () => {
  it("entrar certo não gasta: sem erro, nunca bloqueia", () => {
    for (let i = 0; i < 50; i++) expect(errosEsgotados("1.1.1.1", "t-certo", 10, 60_000)).toBe(false);
  });

  it("bloqueia no 10º erro da janela e libera quando a janela passa", () => {
    const t0 = 1_000_000;
    for (let i = 0; i < 9; i++) contarErro("2.2.2.2", "t-erro", 60_000, t0 + i);
    expect(errosEsgotados("2.2.2.2", "t-erro", 10, 60_000, t0 + 10)).toBe(false);
    contarErro("2.2.2.2", "t-erro", 60_000, t0 + 11);
    expect(errosEsgotados("2.2.2.2", "t-erro", 10, 60_000, t0 + 12)).toBe(true);
    expect(errosEsgotados("3.3.3.3", "t-erro", 10, 60_000, t0 + 12)).toBe(false);
    expect(errosEsgotados("2.2.2.2", "t-erro", 10, 60_000, t0 + 60_001)).toBe(false);
  });
});
