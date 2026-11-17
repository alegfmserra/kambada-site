import { beforeEach, describe, expect, it } from "vitest";
import {
  PARTIDAS_NO_RANKING_POR_DIA,
  REPETICOES_PARA_AVISAR,
  contarPartidaNoDia,
  limiteDoDiaAtingido,
  noTempoMinimo,
  partidasNoDia,
  repeticoesSeguidas,
  type ProvaDeJogo,
} from "./antifraude";
import { reiniciarUsoUnico } from "./usoUnico";

const MEIO_DIA = Date.parse("2026-11-17T15:00:00Z"); // 12h em São Luís

const memoria = (pontos: number, jogadas: number, segundos: number): ProvaDeJogo => ({
  v: 1,
  jogo: "memoria",
  partida: "p",
  conta: "c",
  nivel: "dificil",
  pontos,
  jogadas,
  segundos,
  emitidaEm: MEIO_DIA,
});

describe("freios do ranking", () => {
  beforeEach(() => {
    delete process.env.PLAY_USO_UNICO_ARQUIVO;
    reiniciarUsoUnico();
  });

  it("a conta pontua até 30 partidas por jogo por dia; cada jogo e cada conta têm a sua contagem", () => {
    expect(PARTIDAS_NO_RANKING_POR_DIA).toBe(30);
    for (let i = 1; i <= PARTIDAS_NO_RANKING_POR_DIA; i++) {
      expect(limiteDoDiaAtingido("memoria", "ana", MEIO_DIA + i)).toBe(false);
      expect(contarPartidaNoDia("memoria", "ana", MEIO_DIA + i)).toBe(i);
    }
    expect(limiteDoDiaAtingido("memoria", "ana", MEIO_DIA + 100)).toBe(true);
    expect(limiteDoDiaAtingido("quiz", "ana", MEIO_DIA + 100)).toBe(false);
    expect(limiteDoDiaAtingido("memoria", "beto", MEIO_DIA + 100)).toBe(false);
    expect(partidasNoDia("memoria", "ana", MEIO_DIA + 100)).toBe(30);
  });

  it("no dia seguinte (horário de São Luís) a contagem recomeça", () => {
    for (let i = 0; i < PARTIDAS_NO_RANKING_POR_DIA; i++) contarPartidaNoDia("quebra", "ana", MEIO_DIA);
    expect(limiteDoDiaAtingido("quebra", "ana", MEIO_DIA)).toBe(true);
    // 23h59 em São Luís ainda é o mesmo dia; 00h01 já é outro.
    expect(limiteDoDiaAtingido("quebra", "ana", Date.parse("2026-11-18T02:59:00Z"))).toBe(true);
    expect(limiteDoDiaAtingido("quebra", "ana", Date.parse("2026-11-18T03:01:00Z"))).toBe(false);
  });

  it("reconhece a partida colada no tempo mínimo do servidor", () => {
    expect(noTempoMinimo(memoria(2000, 12, 9))).toBe(true); // 12 jogadas em 9 s (piso 8,4 s)
    expect(noTempoMinimo(memoria(2000, 12, 40))).toBe(false);
    expect(noTempoMinimo({ v: 1, jogo: "quebra", partida: "p", nivel: "facil", pontos: 1000, trocas: 12, segundos: 7, emitidaEm: 0 })).toBe(true);
    expect(noTempoMinimo({ v: 1, jogo: "quebra", partida: "p", nivel: "facil", pontos: 1000, trocas: 12, segundos: 60, emitidaEm: 0 })).toBe(false);
    expect(noTempoMinimo({ v: 1, jogo: "quiz", partida: "p", nivel: "medio", pontos: 2200, acertos: 10, duracaoMs: 9000, emitidaEm: 0 })).toBe(true);
    expect(noTempoMinimo({ v: 1, jogo: "quiz", partida: "p", nivel: "medio", pontos: 1800, acertos: 10, duracaoMs: 70_000, emitidaEm: 0 })).toBe(false);
    expect(noTempoMinimo({ v: 1, jogo: "arraial", partida: "p", missao: "m", pontos: 900, acertos: 5, pistas: 5, emitidaEm: 0 })).toBe(false);
  });

  it("mesma pontuação, em sequência e no tempo mínimo, chega ao aviso na terceira vez", () => {
    expect(REPETICOES_PARA_AVISAR).toBe(3);
    expect(repeticoesSeguidas(memoria(2000, 12, 9), "ana", MEIO_DIA)).toBe(1);
    expect(repeticoesSeguidas(memoria(2000, 12, 9), "ana", MEIO_DIA + 1)).toBe(2);
    expect(repeticoesSeguidas(memoria(2000, 12, 9), "ana", MEIO_DIA + 2)).toBe(3);
    // Outra pessoa não herda a contagem.
    expect(repeticoesSeguidas(memoria(2000, 12, 9), "beto", MEIO_DIA + 3)).toBe(1);
  });

  it("pontuação diferente ou partida em tempo de gente zera a sequência", () => {
    repeticoesSeguidas(memoria(2000, 12, 9), "ana", MEIO_DIA);
    repeticoesSeguidas(memoria(2000, 12, 9), "ana", MEIO_DIA + 1);
    expect(repeticoesSeguidas(memoria(1950, 13, 10), "ana", MEIO_DIA + 2)).toBe(1); // outra pontuação
    expect(repeticoesSeguidas(memoria(1950, 13, 10), "ana", MEIO_DIA + 3)).toBe(2);
    expect(repeticoesSeguidas(memoria(1950, 13, 55), "ana", MEIO_DIA + 4)).toBe(0); // jogou como gente
    expect(repeticoesSeguidas(memoria(1950, 13, 10), "ana", MEIO_DIA + 5)).toBe(1);
  });
});
