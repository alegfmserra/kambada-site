import { describe, expect, it } from "vitest";
import { ativaEm, diaMes, faixaApareceEm, faseDaBlack, fracaoRolada, hojeSaoLuis, podeAparecerEm, popupNoAr } from "./black";

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
  it("antes de abrir é lista de espera; de 22 a 30/11 mostra o código; depois encerra", () => {
    expect(faseDaBlack("2026-11-17")).toBe("espera");
    expect(faseDaBlack("2026-11-21")).toBe("espera");
    expect(faseDaBlack("2026-11-22")).toBe("aberta");
    expect(faseDaBlack("2026-11-30")).toBe("aberta");
    expect(faseDaBlack("2026-12-01")).toBe("encerrada");
  });
  it("não aparece em compra, conta, admin nem no Play", () => {
    for (const p of ["/checkout", "/carrinho", "/admin/cupons", "/conta", "/pedido/x", "/kambadaplay/arraial"]) expect(podeAparecerEm(p)).toBe(false);
    for (const p of ["/", "/loja", "/sobre"]) expect(podeAparecerEm(p)).toBe(true);
  });
  it("não interrompe leitura de artigo, encomenda nem página jurídica", () => {
    for (const p of ["/cultura/bumba-meu-boi", "/encomendas", "/termos", "/privacidade", "/trocas-e-devolucoes", "/direitos-autorais", "/contato"]) expect(podeAparecerEm(p)).toBe(false);
    for (const p of ["/cultura", "/loja/camisas", "/loja/camisas/camisa-tradicao-1"]) expect(podeAparecerEm(p)).toBe(true);
  });
  it("a faixa fina só existe dentro da loja", () => {
    for (const p of ["/loja", "/loja/camisas", "/loja/camisas/camisa-tradicao-1", "/loja/busca"]) expect(faixaApareceEm(p)).toBe(true);
    for (const p of ["/", "/lojas", "/carrinho", "/kambadaplay"]) expect(faixaApareceEm(p)).toBe(false);
  });
  it("mede a rolagem de 0 a 1 e ignora página que cabe na tela", () => {
    expect(fracaoRolada(0, 3000, 1000)).toBe(0);
    expect(fracaoRolada(1000, 3000, 1000)).toBe(0.5);
    expect(fracaoRolada(2500, 3000, 1000)).toBe(1);
    expect(fracaoRolada(100, 800, 1000)).toBe(0);
  });
  it("usa o dia de São Luís (UTC−3)", () => {
    expect(hojeSaoLuis(new Date("2026-11-24T01:30:00Z"))).toBe("2026-11-23");
    expect(diaMes("2026-11-22")).toBe("22/11");
  });
});
