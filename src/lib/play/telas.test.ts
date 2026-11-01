import { describe, expect, it } from "vitest";
import { duracao, normalizarTela, resumirTelas, segundosValidos } from "./telas";

describe("normalizarTela", () => {
  it("aceita telas do Play e tira query e barra final", () => {
    expect(normalizarTela("/kambadaplay")).toBe("/kambadaplay");
    expect(normalizarTela("/kambadaplay/planos/?utm_source=x#topo")).toBe("/kambadaplay/planos");
    expect(normalizarTela("/kambadaplay/jogos/quiz")).toBe("/kambadaplay/jogos/quiz");
  });
  it("nunca mede login, confirmação, redefinição nem conta", () => {
    for (const p of ["/kambadaplay/entrar", "/kambadaplay/confirmar?token=abc", "/kambadaplay/redefinir", "/kambadaplay/conta"]) {
      expect(normalizarTela(p)).toBeNull();
    }
  });
  it("recusa o que não é do Play e disfarça endereço estranho", () => {
    expect(normalizarTela("/loja")).toBeNull();
    expect(normalizarTela("/conta")).toBeNull();
    expect(normalizarTela(42)).toBeNull();
    expect(normalizarTela("/kambadaplay/Fulano@email.com")).toBe("/kambadaplay/outra");
    expect(normalizarTela("/kambadaplay/" + "a".repeat(200))).toBeNull();
  });
});

describe("segundosValidos", () => {
  it("descarta menos de 1 s e limita a 30 min", () => {
    expect(segundosValidos(0.4)).toBeNull();
    expect(segundosValidos("abc")).toBeNull();
    expect(segundosValidos(12.6)).toBe(13);
    expect(segundosValidos(99999)).toBe(1800);
  });
});

describe("resumirTelas", () => {
  it("ordena por visitas e calcula média, mediana e total", () => {
    const es = [
      { em: "2026-10-30T10:00:00Z", tela: "/kambadaplay/planos", seg: 10 },
      { em: "2026-10-30T11:00:00Z", tela: "/kambadaplay", seg: 60 },
      { em: "2026-10-31T11:00:00Z", tela: "/kambadaplay", seg: 20 },
      { em: "2026-10-31T12:00:00Z", tela: "/kambadaplay", seg: 40 },
    ];
    const r = resumirTelas(es);
    expect(r.linhas[0]).toEqual({ tela: "/kambadaplay", visitas: 3, segTotal: 120, segMedio: 40, segMediana: 40 });
    expect(r.linhas[1].tela).toBe("/kambadaplay/planos");
    expect(r.periodo).toEqual({ de: "2026-10-30", ate: "2026-10-31" });
  });
  it("sem dados, devolve vazio", () => {
    expect(resumirTelas([])).toEqual({ linhas: [], total: 0, periodo: null });
  });
});

describe("duracao", () => {
  it("formata segundos e minutos", () => {
    expect(duracao(45)).toBe("45 s");
    expect(duracao(75)).toBe("1 min 15 s");
    expect(duracao(120)).toBe("2 min");
  });
});
