import { describe, expect, it } from "vitest";
import { filtrarPartidasPorPeriodo, resumirPartidas, type EventoPartida } from "./partidas";

const e = (jogo: EventoPartida["jogo"], tipo: EventoPartida["tipo"], conta?: string, em = "2026-10-27T15:00:00.000Z"): EventoPartida => ({ em, jogo, tipo, conta });

describe("partidas do Play", () => {
  it("conta iniciadas × concluídas por jogo e por conta", () => {
    const r = resumirPartidas([
      e("quiz", "inicio", "A"), e("quiz", "fim", "A"),
      e("quiz", "inicio", "B"),
      e("memoria", "inicio", "A"),
      e("arraial", "inicio"), e("arraial", "fim"),
    ]);
    expect(r.iniciadas).toBe(4);
    expect(r.concluidas).toBe(2);
    expect(r.taxaConclusao).toBe(50);
    expect(r.porJogo.quiz).toEqual({ iniciadas: 2, concluidas: 1, taxa: 50 });
    expect(r.porJogo.memoria.taxa).toBe(0);
    expect(r.contas).toEqual({ iniciaram: 2, concluiramAoMenosUma: 1 });
  });

  it("sem eventos não inventa taxa; filtra por período", () => {
    expect(resumirPartidas([]).taxaConclusao).toBeNull();
    const a = e("quiz", "inicio", "A", "2026-10-20T12:00:00.000Z");
    const b = e("quiz", "fim", "A", "2026-10-27T12:00:00.000Z");
    expect(filtrarPartidasPorPeriodo([a, b], "2026-10-25")).toEqual([b]);
    expect(filtrarPartidasPorPeriodo([a, b], null, "2026-10-21")).toEqual([a]);
  });
});
