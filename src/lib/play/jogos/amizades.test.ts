import { describe, expect, it } from "vitest";
import { AMIGOS, coracoesDe, CONVERSAS_POR_CORACAO } from "./amizades";
import { aplicarEvento, completar, perfilNovo, publico } from "./perfil";
import { ORDEM_NPCS } from "./missoesArraial";

const DIA = "2026-11-03";

describe("Amizade", () => {
  it("todo personagem da missão tem amigo com histórias em corações crescentes", () => {
    expect(AMIGOS.map((a) => a.id).sort()).toEqual([...ORDEM_NPCS].sort());
    for (const a of AMIGOS) {
      expect(a.historias.length).toBeGreaterThanOrEqual(2);
      for (const h of a.historias) expect(h.texto.length).toBeGreaterThan(40);
    }
  });

  it("corações pelos limites de conversas", () => {
    expect([0, 1, 2, 3, 6, 10, 15, 99].map(coracoesDe)).toEqual([0, 1, 1, 2, 3, 4, 5, 5]);
    expect(CONVERSAS_POR_CORACAO).toHaveLength(5);
  });

  it("conversas somam por personagem e avisam o coração novo; história só abre no coração certo", () => {
    let p = perfilNovo();
    const avisos: (string | undefined)[] = [];
    for (let i = 0; i < 3; i++) {
      const r = aplicarEvento(p, { tipo: "conversa", npc: "boi" }, DIA);
      p = r.perfil;
      avisos.push(r.ganho.amizade);
    }
    expect(avisos).toEqual(["Boi Estrela", undefined, "Boi Estrela"]);
    const boi = publico(p, DIA).amigos.find((a) => a.id === "boi")!;
    expect(boi.coracoes).toBe(2);
    expect(boi.historias).toHaveLength(1);
    expect(boi.fechadas).toBe(1);
    expect(publico(p, DIA).amigos.find((a) => a.id === "noivos")!.coracoes).toBe(0);
  });

  it("perfil antigo sem amizade é completado", () => {
    const velho = perfilNovo() as Partial<ReturnType<typeof perfilNovo>>;
    delete velho.amizade;
    expect(completar(velho).amizade).toEqual({});
  });
});
