import { afterEach, describe, expect, it } from "vitest";
import { podeTentar, registrarErro, senhaConfere, sessaoValida, valorDoCookie } from "./sessao";

describe("área de controle", () => {
  afterEach(() => {
    delete process.env.ADMIN_SENHA;
  });

  it("sem senha configurada (ou curta demais), ninguém entra", () => {
    expect(senhaConfere("qualquer")).toBe(false);
    process.env.ADMIN_SENHA = "curta";
    expect(senhaConfere("curta")).toBe(false);
  });

  it("a senha certa entra; o cookie é uma assinatura, não a senha", () => {
    process.env.ADMIN_SENHA = "matraca-2026-boi";
    expect(senhaConfere("matraca-2026-boi")).toBe(true);
    expect(senhaConfere("matraca-2026-bo")).toBe(false);
    const cookie = valorDoCookie();
    expect(cookie).not.toContain("matraca");
    expect(sessaoValida(cookie)).toBe(true);
    expect(sessaoValida("forjado")).toBe(false);
    expect(sessaoValida(undefined)).toBe(false);
  });

  it("trocar a senha derruba as sessões abertas", () => {
    process.env.ADMIN_SENHA = "matraca-2026-boi";
    const antigo = valorDoCookie();
    process.env.ADMIN_SENHA = "outra-senha-forte";
    expect(sessaoValida(antigo)).toBe(false);
  });

  it("cinco erros seguidos bloqueiam o IP por um tempo", () => {
    const ip = "203.0.113.9";
    for (let i = 0; i < 5; i++) registrarErro(ip);
    expect(podeTentar(ip)).toBe(false);
    expect(podeTentar("203.0.113.10")).toBe(true);
  });
});
