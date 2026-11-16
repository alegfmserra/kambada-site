import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { iniciarDesafio, iniciarMissao, responderDesafio } from "./arraial";
import { iniciarPartida, responder } from "./quiz";
import { permutacaoSecreta, verificar } from "./seguranca";
import { liberarProva, lerMarca, registrarResposta, reiniciarUsoUnico, reservarProva } from "./usoUnico";

const MEIA_HORA = 30 * 60 * 1000;

describe("uso único: marcas", () => {
  beforeEach(() => {
    delete process.env.PLAY_USO_UNICO_ARQUIVO;
    reiniciarUsoUnico();
  });

  it("a mesma pergunta de uma partida só é aceita uma vez, e não se volta atrás", () => {
    expect(registrarResposta("quiz", "p1", 0, MEIA_HORA, 1000)).toBe(true);
    expect(registrarResposta("quiz", "p1", 0, MEIA_HORA, 2000)).toBe(false);
    expect(registrarResposta("quiz", "p1", 1, MEIA_HORA, 3000)).toBe(true);
    expect(registrarResposta("quiz", "p1", 0, MEIA_HORA, 4000)).toBe(false);
    // Outra partida e outro jogo não se misturam.
    expect(registrarResposta("quiz", "p2", 0, MEIA_HORA, 4000)).toBe(true);
    expect(registrarResposta("arraial", "p1", 0, MEIA_HORA, 4000)).toBe(true);
  });

  it("a marca vence sozinha", () => {
    expect(registrarResposta("quiz", "p3", 0, 1000, 10_000)).toBe(true);
    expect(lerMarca("quiz:p3", 10_500)).toBe("0");
    expect(lerMarca("quiz:p3", 11_001)).toBeNull();
  });

  it("a prova de uma partida pontua uma vez só, seja de quem for", () => {
    expect(reservarProva("quiz", "p4", "jogador-a", 60_000, 1000)).toBe(true);
    expect(reservarProva("quiz", "p4", "jogador-b", 60_000, 2000)).toBe(false);
    expect(reservarProva("quiz", "p4", "jogador-a", 60_000, 2000)).toBe(false);
    // Falhou ao gravar o placar: a prova é devolvida e pode ser enviada de novo.
    liberarProva("quiz", "p4", 3000);
    expect(reservarProva("quiz", "p4", "jogador-a", 60_000, 4000)).toBe(true);
  });
});

describe("uso único: arquivo", () => {
  let pasta = "";
  beforeEach(() => {
    pasta = mkdtempSync(join(tmpdir(), "kambada-uso-unico-"));
    process.env.PLAY_USO_UNICO_ARQUIVO = join(pasta, "uso.jsonl");
    reiniciarUsoUnico();
  });
  afterEach(() => {
    delete process.env.PLAY_USO_UNICO_ARQUIVO;
    reiniciarUsoUnico();
    rmSync(pasta, { recursive: true, force: true });
  });

  it("o que foi gravado continua valendo depois de reiniciar o processo", () => {
    expect(registrarResposta("quiz", "p5", 2, MEIA_HORA, 1000)).toBe(true);
    expect(reservarProva("memoria", "p6", "jogador-a", MEIA_HORA, 1000)).toBe(true);
    expect(reservarProva("memoria", "p7", "jogador-a", MEIA_HORA, 1000)).toBe(true);
    liberarProva("memoria", "p7", 1500);
    expect(registrarResposta("quiz", "vencida", 0, 100, 1000)).toBe(true);

    reiniciarUsoUnico(); // como se o servidor tivesse reiniciado
    expect(registrarResposta("quiz", "p5", 2, MEIA_HORA, 2000)).toBe(false);
    expect(reservarProva("memoria", "p6", "jogador-b", MEIA_HORA, 2000)).toBe(false);
    expect(reservarProva("memoria", "p7", "jogador-b", MEIA_HORA, 2000)).toBe(true);
    // Ao reler, o arquivo foi regravado sem a marca vencida.
    expect(readFileSync(process.env.PLAY_USO_UNICO_ARQUIVO!, "utf8")).not.toContain("vencida");
  });
});

describe("uso único: quiz e Arraial recusam o reenvio do mesmo estado", () => {
  beforeEach(() => {
    delete process.env.PLAY_USO_UNICO_ARQUIVO;
    reiniciarUsoUnico();
  });

  it("quiz: depois de ver a resposta certa, o mesmo estado não é aceito de novo", () => {
    const t0 = Date.parse("2026-11-15T15:00:00Z");
    const { estado } = iniciarPartida("medio", t0);
    const e = verificar<{ id: string; i: number }>(estado)!;
    const certa = permutacaoSecreta(e.id, e.i, 4).indexOf(0);
    const errada = (certa + 1) % 4;

    const primeira = responder(estado, errada, t0 + 3000);
    expect("erro" in primeira).toBe(false);
    expect("correta" in primeira && primeira.correta).toBe(certa);

    // O golpe: reenviar o estado da mesma pergunta, agora com a resposta certa.
    const reenvio = responder(estado, certa, t0 + 4000);
    expect(reenvio).toHaveProperty("erro");

    // A partida segue normalmente pelo estado novo.
    const proximo = (primeira as { estado: string }).estado;
    expect("erro" in responder(proximo, 0, t0 + 8000)).toBe(false);
  });

  it("quiz: resposta recusada (inválida ou vencida) não gasta a pergunta", () => {
    const t0 = Date.parse("2026-11-15T16:00:00Z");
    const { estado } = iniciarPartida("facil", t0);
    expect(responder(estado, 9, t0 + 1000)).toHaveProperty("erro");
    expect("erro" in responder(estado, 0, t0 + 2000)).toBe(false);
  });

  it("Arraial: o mesmo estado do desafio não é aceito duas vezes", () => {
    const t0 = Date.parse("2026-11-15T17:00:00Z");
    let { estado } = iniciarMissao(t0);
    const d = iniciarDesafio(estado, t0 + 120_000);
    if ("erro" in d) throw new Error(d.erro);
    estado = d.estado;

    const primeira = responderDesafio(estado, 1, t0 + 125_000);
    expect("erro" in primeira).toBe(false);
    expect(responderDesafio(estado, 0, t0 + 126_000)).toHaveProperty("erro");
  });
});
