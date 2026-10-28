import { describe, expect, it } from "vitest";
import {
  aplicarEvento,
  BONUS_SEQUENCIA,
  diariasDoDia,
  LIMITES_DE_NIVEL,
  nivelDoXp,
  perfilNovo,
  publico,
  TETO_DIARIO_XP,
  tituloDoNivel,
  XP,
  type Evento,
} from "./perfil";

const DIA = "2026-11-03";

describe("Perfil — níveis e títulos", () => {
  it("0 xp é nível 1 e cada limite abre o nível seguinte", () => {
    expect(nivelDoXp(0)).toBe(1);
    expect(nivelDoXp(99)).toBe(1);
    expect(nivelDoXp(100)).toBe(2);
    expect(nivelDoXp(3200)).toBe(10);
    expect(nivelDoXp(99999)).toBe(10);
    expect(LIMITES_DE_NIVEL).toHaveLength(10);
  });

  it("títulos por faixa", () => {
    expect([1, 2, 3, 5, 6, 8, 9, 10].map(tituloDoNivel)).toEqual([
      "Visitante", "Visitante", "Aprendiz de brincante", "Aprendiz de brincante", "Brincante", "Brincante", "Mestre do arraial", "Mestre do arraial",
    ]);
  });
});

describe("Perfil — diárias", () => {
  it("são 3, distintas e iguais no mesmo dia", () => {
    const d = diariasDoDia(DIA);
    expect(d).toHaveLength(3);
    expect(new Set(d).size).toBe(3);
    expect(diariasDoDia(DIA)).toEqual(d);
  });

  it("giram com os dias", () => {
    const vistas = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const dia = new Date(Date.parse("2026-11-01T00:00:00Z") + i * 86_400_000).toISOString().slice(0, 10);
      diariasDoDia(dia).forEach((id) => vistas.add(id));
    }
    expect(vistas.size).toBeGreaterThanOrEqual(8);
  });

  it("completar uma diária paga 30 de XP e não repete", () => {
    const ev: Evento = { tipo: "desafio", acertos: 6, pistasCompletas: true };
    // Procura um dia em que "Conclua 1 desafio" seja a diária de provar.
    let dia = DIA;
    for (let i = 0; i < 10 && !diariasDoDia(dia).includes("desafio-1"); i++) {
      dia = new Date(Date.parse(`${dia}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10);
    }
    expect(diariasDoDia(dia)).toContain("desafio-1");
    const a = aplicarEvento(perfilNovo(), ev, dia);
    expect(a.ganho.diariasConcluidas).toContain("Conclua 1 desafio");
    expect(a.ganho.xp).toBeGreaterThanOrEqual(XP.desafioConcluido + XP.diaria);
    const b = aplicarEvento(a.perfil, ev, dia);
    expect(b.ganho.diariasConcluidas).toHaveLength(0);
  });
});

describe("Perfil — XP, teto e sequência", () => {
  it("conversa vale 30, acerto 15, desafio 100 (+ bônus de 1º dia não conta no teto)", () => {
    const c = aplicarEvento(perfilNovo(), { tipo: "conversa", npc: "boi" }, DIA);
    expect(c.perfil.xp).toBeGreaterThanOrEqual(XP.pista);
    expect(c.perfil.xpDoDia.valor).toBe(XP.pista);
    const a = aplicarEvento(c.perfil, { tipo: "acerto" }, DIA);
    expect(a.perfil.xpDoDia.valor).toBe(XP.pista + XP.acerto);
  });

  it("o teto diário segura o XP de ação, mas não o das diárias", () => {
    let p = perfilNovo();
    for (let i = 0; i < 60; i++) p = aplicarEvento(p, { tipo: "acerto" }, DIA).perfil;
    expect(p.xpDoDia.valor).toBe(TETO_DIARIO_XP);
    expect(publico(p, DIA).tetoAtingido).toBe(true);
    // No dia seguinte o teto zera.
    const amanha = aplicarEvento(p, { tipo: "acerto" }, "2026-11-04");
    expect(amanha.perfil.xpDoDia).toEqual({ dia: "2026-11-04", valor: XP.acerto });
  });

  it("sequência: dias seguidos somam, pular um dia reinicia, bônus só uma vez", () => {
    let p = perfilNovo();
    const dias = ["2026-11-01", "2026-11-02", "2026-11-03"];
    let bonus = 0;
    for (const d of dias) {
      const r = aplicarEvento(p, { tipo: "acerto" }, d);
      p = r.perfil;
      bonus += r.ganho.bonusSequencia ?? 0;
    }
    expect(p.sequencia.atual).toBe(3);
    expect(bonus).toBe(BONUS_SEQUENCIA[3]);
    // Mais um evento no mesmo dia não paga de novo.
    expect(aplicarEvento(p, { tipo: "acerto" }, "2026-11-03").ganho.bonusSequencia).toBeUndefined();
    // Pulou o dia 4: recomeça.
    expect(aplicarEvento(p, { tipo: "acerto" }, "2026-11-05").perfil.sequencia.atual).toBe(1);
    expect(p.sequencia.melhor).toBe(3);
  });

  it("subir de nível aparece no ganho", () => {
    const p = perfilNovo();
    p.xp = 90;
    const r = aplicarEvento(p, { tipo: "conversa", npc: "noivos" }, DIA);
    expect(r.ganho.subiuPara?.nivel).toBe(2);
  });

  it("o perfil público não conta sequência quebrada", () => {
    const p = aplicarEvento(perfilNovo(), { tipo: "acerto" }, "2026-11-01").perfil;
    expect(publico(p, "2026-11-02").sequencia.atual).toBe(1);
    expect(publico(p, "2026-11-05").sequencia.atual).toBe(0);
    expect(publico(p, "2026-11-05").sequencia.melhor).toBe(1);
  });
});
