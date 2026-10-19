import { describe, expect, it } from "vitest";
import {
  anotarPista,
  BONUS_PISTAS,
  iniciarDesafio,
  iniciarMissao,
  missoesAtivas,
  PERGUNTAS_DO_DESAFIO,
  pontosDaResposta,
  responderDesafio,
  type ProvaArraial,
} from "./arraial";
import { MISSOES, ORDEM_NPCS, type Missao } from "./missoesArraial";
import { verificar } from "./seguranca";

/** Joga uma partida inteira respondendo sempre a 1ª opção mostrada. */
function jogar(comPistas: boolean) {
  const t0 = Date.now();
  let { estado } = iniciarMissao(t0);
  if (comPistas) {
    for (const npc of ORDEM_NPCS) {
      const r = anotarPista(estado, npc, t0 + 1000);
      if ("erro" in r) throw new Error(r.erro);
      estado = r.estado;
    }
  }
  const d = iniciarDesafio(estado, t0 + 60_000);
  if ("erro" in d) throw new Error(d.erro);
  estado = d.estado;
  let ultima;
  for (let i = 0; i < PERGUNTAS_DO_DESAFIO; i++) {
    const r = responderDesafio(estado, 0, t0 + 61_000 + i * 2000);
    if ("erro" in r) throw new Error(r.erro);
    ultima = r;
    if (r.estado) estado = r.estado;
  }
  return ultima!;
}

describe("arraial — missões", () => {
  it("todas as missões têm as 5 conversas e perguntas com 3 opções", () => {
    for (const m of MISSOES) {
      for (const npc of ORDEM_NPCS) expect(m.conversas[npc].falas.length).toBeGreaterThan(0);
      expect(m.perguntas.length).toBeGreaterThanOrEqual(PERGUNTAS_DO_DESAFIO);
      for (const p of m.perguntas) expect(new Set(p.opcoes).size).toBe(3);
    }
  });

  it("a missão pública não leva o gabarito", () => {
    const { missao } = iniciarMissao();
    expect(JSON.stringify(missao)).not.toContain("vocesabia");
    expect(JSON.stringify(missao)).not.toContain("perguntas");
  });

  it("sem missão revisada, roda a mais recente como prévia", () => {
    const m = { ...MISSOES[0], revisado: false, temporadas: ["2026-11"] } as Missao;
    expect(missoesAtivas(new Date("2026-11-10T12:00:00Z"), [m])).toEqual([m]);
    const r = { ...m, id: "revisada", revisado: true };
    expect(missoesAtivas(new Date("2026-11-10T12:00:00Z"), [m, r])).toEqual([r]);
  });

  it("bônus de pistas só com as 5 conversas", () => {
    const com = jogar(true);
    const sem = jogar(false);
    expect(com.bonusPistas).toBe(BONUS_PISTAS);
    expect(sem.bonusPistas).toBe(0);
    const prova = verificar<ProvaArraial>(com.prova)!;
    expect(prova.jogo).toBe("arraial");
    expect(prova.pistas).toBe(5);
    expect(prova.pontos).toBeLessThanOrEqual(1000);
  });

  it("não deixa repetir o desafio na mesma partida nem anotar pista depois", () => {
    const { estado } = iniciarMissao();
    const d = iniciarDesafio(estado);
    if ("erro" in d) throw new Error(d.erro);
    expect("erro" in iniciarDesafio(d.estado)).toBe(true);
    expect("erro" in anotarPista(d.estado, "boi")).toBe(true);
  });

  it("rapidez: até 150 por acerto, 100 no mínimo, 0 no erro", () => {
    expect(pontosDaResposta(true, 0)).toBe(148);
    expect(pontosDaResposta(true, 60_000)).toBe(100);
    expect(pontosDaResposta(false, 1000)).toBe(0);
  });

  it("recusa estado adulterado e personagem desconhecido", () => {
    const { estado } = iniciarMissao();
    expect("erro" in anotarPista(estado.slice(0, -2) + "xx", "boi")).toBe(true);
    expect("erro" in anotarPista(estado, "cazumba")).toBe(true);
  });
});

describe("arraial — gabarito fora do estado", () => {
  it("o estado do desafio não traz a ordem das opções", () => {
    const { estado } = iniciarMissao();
    const d = iniciarDesafio(estado);
    if ("erro" in d) throw new Error(d.erro);
    const carga = JSON.parse(Buffer.from(d.estado.split(".")[0], "base64url").toString("utf8"));
    expect(carga.desafio.opcoes).toBeUndefined();
  });
});
