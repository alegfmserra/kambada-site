import { describe, expect, it } from "vitest";
import { MISSOES, ORDEM_NPCS } from "./missoesArraial";
import { PERGUNTAS_DO_DESAFIO, missoesAtivas } from "./arraial";

describe("Missões do Arraial — estrutura", () => {
  it("ids únicos", () => {
    expect(new Set(MISSOES.map((m) => m.id)).size).toBe(MISSOES.length);
  });

  for (const m of MISSOES) {
    describe(m.id, () => {
      it("tem as 5 conversas com falas e pista, e o anfitrião é um personagem da ordem", () => {
        expect(ORDEM_NPCS).toContain(m.anfitriao);
        for (const npc of ORDEM_NPCS) {
          const c = m.conversas[npc];
          expect(c.falas.length).toBeGreaterThanOrEqual(2);
          expect(c.pista.length).toBeGreaterThan(20);
          if (c.proximo) expect(ORDEM_NPCS).toContain(c.proximo);
        }
      });

      it("tem perguntas de sobra para o desafio, cada uma com 3 opções diferentes", () => {
        expect(m.perguntas.length).toBeGreaterThanOrEqual(PERGUNTAS_DO_DESAFIO);
        for (const p of m.perguntas) {
          expect(new Set(p.opcoes).size).toBe(3);
          expect(p.vocesabia.length).toBeGreaterThan(10);
        }
      });

      it("não promete o que não foi revisado: missão nova entra com revisado false", () => {
        expect(typeof m.revisado).toBe("boolean");
      });
    });
  }

  it("em novembro a missão do Tambor roda junto com a do boi", () => {
    const ids = missoesAtivas(new Date("2026-11-10T15:00:00Z")).map((m) => m.id);
    expect(ids).toContain("o-tambor-que-chama");
    expect(ids).toContain("o-boi-que-renasce");
  });

  it("em outro mês só a missão permanente", () => {
    expect(missoesAtivas(new Date("2026-12-10T15:00:00Z")).map((m) => m.id)).toEqual(["o-boi-que-renasce"]);
  });
});
