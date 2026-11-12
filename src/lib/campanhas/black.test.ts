import { describe, expect, it } from "vitest";
import { ativaEm, hojeSaoLuis, podeAparecerEm, popupNoAr } from "./black";

describe("Black Kambada", () => {
  it("só vale dentro da janela, inclusive nos dois dias das pontas", () => {
    expect(ativaEm("2026-11-21")).toBe(false);
    expect(ativaEm("2026-11-22")).toBe(true);
    expect(ativaEm("2026-11-30")).toBe(true);
    expect(ativaEm("2026-12-01")).toBe(false);
  });
  it("o pop-up já está no ar antes do cupom valer e sai depois do fim", () => {
    expect(popupNoAr("2026-11-11")).toBe(true);
    expect(popupNoAr("2026-11-30")).toBe(true);
    expect(popupNoAr("2026-12-01")).toBe(false);
  });
  it("não aparece em compra, conta, admin nem no Play", () => {
    for (const p of ["/checkout", "/carrinho", "/admin/cupons", "/conta", "/pedido/x", "/kambadaplay/arraial"]) expect(podeAparecerEm(p)).toBe(false);
    for (const p of ["/", "/loja", "/sobre"]) expect(podeAparecerEm(p)).toBe(true);
  });
  it("usa o dia de São Luís (UTC−3)", () => {
    expect(hojeSaoLuis(new Date("2026-11-24T01:30:00Z"))).toBe("2026-11-23");
  });
});
