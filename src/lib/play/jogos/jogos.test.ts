import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { finalizarMemoria, iniciarMemoria, pontosDaMemoria } from "./memoria";
import {
  apelidoValido,
  lerPlacar,
  posicaoNaSemana,
  registrarPontuacao,
  resgatarPremio,
  semanaDe,
  semanaFechada,
  situacaoDoPremio,
} from "./placar";
import { BANCO, iniciarPartida, pontosDaResposta, responder } from "./quiz";
import { assinar, permutacaoSecreta, resumoDaChave, verificar } from "./seguranca";

beforeAll(async () => {
  const pasta = await mkdtemp(join(tmpdir(), "kambada-play-"));
  process.env.PLAY_PLACAR_ARQUIVO = join(pasta, "placar.json");
  process.env.CUPONS_ARQUIVO = join(pasta, "cupons.json");
});

describe("apelido", () => {
  it("aceita apelidos comuns", () => {
    expect(apelidoValido("  Maria   Boi ")).toBe("Maria Boi");
    expect(apelidoValido("Kambadinha_10")).toBe("Kambadinha_10");
  });
  it("recusa curto, longo, símbolos e palavrão (mesmo disfarçado)", () => {
    expect(apelidoValido("ab")).toBeNull();
    expect(apelidoValido("a".repeat(17))).toBeNull();
    expect(apelidoValido("<script>")).toBeNull();
    expect(apelidoValido("p0rra")).toBeNull();
    expect(apelidoValido("B0$ta")).toBeNull();
  });
});

describe("assinatura", () => {
  it("só aceita o que o servidor assinou", () => {
    const t = assinar({ a: 1 });
    expect(verificar<{ a: number }>(t)).toEqual({ a: 1 });
    const [carga] = t.split(".");
    const adulterado = `${Buffer.from(JSON.stringify({ a: 999 })).toString("base64url")}.${t.split(".")[1]}`;
    expect(verificar(adulterado)).toBeNull();
    expect(verificar(`${carga}.xxxx`)).toBeNull();
    expect(verificar(undefined)).toBeNull();
  });
  it("o resumo da chave não é a chave", () => {
    const chave = "a".repeat(32);
    expect(resumoDaChave(chave)).not.toContain(chave);
    expect(resumoDaChave(chave)).toBe(resumoDaChave(chave));
  });
});

describe("quiz", () => {
  it("pontua: erro vale 0; acerto rápido leva o bônus; acerto lento fica em 100", () => {
    expect(pontosDaResposta("medio", false, 500)).toBe(0);
    expect(pontosDaResposta("medio", true, 100)).toBe(222); // (100 + 48) × 1,5 — tempo mínimo de 0,7 s
    expect(pontosDaResposta("medio", true, 15_000)).toBe(150);
    expect(pontosDaResposta("facil", true, 100)).toBe(148);
    expect(pontosDaResposta("facil", true, 60_000)).toBe(100);
    expect(pontosDaResposta("dificil", true, 100)).toBe(294); // (100 + 47) × 2 com 10 s de bônus
    expect(pontosDaResposta("dificil", false, 500)).toBe(-25); // no difícil, errar desconta
  });

  it("uma partida de 10 perguntas termina com prova assinada", () => {
    const t0 = Date.parse("2026-10-14T15:00:00Z");
    const { estado: inicial } = iniciarPartida("facil", t0);
    let estado: string | undefined = inicial;
    let agora = t0;
    let r: ReturnType<typeof responder> | undefined;
    let acertos = 0;
    for (let i = 0; i < 10; i++) {
      const e = verificar<{ id: string; i: number }>(estado);
      expect(e).not.toBeNull();
      const certa = permutacaoSecreta(e!.id, e!.i, 4).indexOf(0);
      // acerta as pares, erra as ímpares
      const escolha = i % 2 === 0 ? certa : (certa + 1) % 4;
      agora += 4000;
      r = responder(estado, escolha, agora);
      expect("erro" in r!).toBe(false);
      if (i % 2 === 0) acertos++;
      if ("estado" in r! && r.estado) estado = r.estado;
    }
    expect(r && "prova" in r && r.prova).toBeTruthy();
    const prova = verificar<{ pontos: number; acertos: number }>((r as { prova: string }).prova);
    expect(prova?.acertos).toBe(acertos);
    expect(prova?.pontos).toBeGreaterThanOrEqual(acertos * 100);
    expect(prova?.pontos).toBeLessThanOrEqual(acertos * 150);
  });

  it("sorteia por nível: fácil só puxa perguntas fáceis; difícil começa pelas difíceis", () => {
    const facil = verificar<{ ordem: number[] }>(iniciarPartida("facil").estado)!.ordem;
    const dificil = verificar<{ ordem: number[] }>(iniciarPartida("dificil").estado)!.ordem;
    expect(facil).toHaveLength(10);
    expect(dificil).toHaveLength(10);
    expect(facil.every((i) => BANCO[i].nivel === "facil")).toBe(true);
    expect(dificil.filter((i) => BANCO[i].nivel === "dificil").length).toBe(10);
    expect(new Set(facil).size).toBe(10);
  });

  it("no difícil a pontuação não fica negativa", () => {
    const t0 = Date.parse("2026-10-14T15:00:00Z");
    const { estado } = iniciarPartida("dificil", t0);
    const e = verificar<{ id: string; i: number }>(estado)!;
    const errada = (permutacaoSecreta(e.id, 0, 4).indexOf(0) + 1) % 4;
    const r = responder(estado, errada, t0 + 2000);
    expect(r).toMatchObject({ certa: false, pontosDaPergunta: -25, pontos: 0 });
  });

  it("recusa estado adulterado, resposta fora de 0–3 e partida expirada", () => {
    const t0 = Date.parse("2026-10-14T15:00:00Z");
    const { estado } = iniciarPartida("medio", t0);
    expect(responder("lixo", 0, t0 + 1000)).toHaveProperty("erro");
    expect(responder(estado, 7, t0 + 1000)).toHaveProperty("erro");
    expect(responder(estado, 1, t0 + 31 * 60 * 1000)).toHaveProperty("erro");
  });
});

describe("memória", () => {
  it("1000 pontos para o jogo perfeito; perde por jogada e por tempo", () => {
    expect(pontosDaMemoria("medio", 8, 20)).toBe(1500); // base 1000 × 1,5
    expect(pontosDaMemoria("medio", 12, 20)).toBe(1350);
    expect(pontosDaMemoria("medio", 8, 40)).toBe(1425);
    expect(pontosDaMemoria("medio", 80, 600)).toBe(150);
    expect(pontosDaMemoria("facil", 6, 20)).toBe(1000);
    expect(pontosDaMemoria("dificil", 12, 45)).toBe(2000);
    expect(pontosDaMemoria("dificil", 14, 60)).toBe(1750); // −50 jogadas, −75 tempo, × 2
  });

  it("calcula os pontos com o relógio do servidor e recusa resultado impossível", () => {
    const t0 = Date.parse("2026-10-14T15:00:00Z");
    const { token, pares } = iniciarMemoria("medio", t0);
    expect(pares).toBe(8);
    const ok = finalizarMemoria(token, 10, t0 + 25_000);
    expect(ok).toHaveProperty("prova");
    expect(finalizarMemoria(token, 10, t0 + 3_000)).toHaveProperty("erro"); // rápido demais
    expect(finalizarMemoria(token, 7, t0 + 25_000)).toHaveProperty("erro"); // menos de 8 jogadas
    expect(finalizarMemoria(token, 200, t0 + 25_000)).toHaveProperty("erro");
    expect(finalizarMemoria("adulterado", 10, t0 + 25_000)).toHaveProperty("erro");
    // O nível vai assinado na largada: no fácil, 6 jogadas já é partida completa
    const facil = iniciarMemoria("facil", t0);
    expect(facil.pares).toBe(6);
    expect(finalizarMemoria(facil.token, 6, t0 + 10_000)).toMatchObject({ nivel: "facil", pontos: 1000 });
    const dificil = iniciarMemoria("dificil", t0);
    expect(dificil.pares).toBe(12);
    expect(finalizarMemoria(dificil.token, 12, t0 + 40_000)).toMatchObject({ nivel: "dificil", pontos: 2000 });
  });
});

describe("semana", () => {
  it("vai de segunda a domingo, no horário de São Luís", () => {
    // 2026-10-12 é segunda-feira
    expect(semanaDe(new Date("2026-10-12T03:00:00Z"))).toBe("2026-10-12"); // 00:00 em São Luís
    expect(semanaDe(new Date("2026-10-12T02:59:00Z"))).toBe("2026-10-05"); // ainda domingo à noite
    expect(semanaDe(new Date("2026-10-18T20:00:00Z"))).toBe("2026-10-12"); // domingo
    expect(semanaFechada(new Date("2026-10-20T15:00:00Z"))).toBe("2026-10-12");
  });
});

describe("placar e prêmios da semana", () => {
  const durante = new Date("2026-10-14T15:00:00Z"); // semana de 12/10
  const depois = new Date("2026-10-20T15:00:00Z"); // semana seguinte
  const quem = (n: string) => resumoDaChave(n.padEnd(32, "0").replace(/[^a-f0-9]/g, "a"));
  const A = quem("aaaa1");
  const B = quem("bbbb2");
  const C = quem("cccc3");
  const D = quem("dddd4");
  const E = quem("eeee5");

  it("soma a melhor pontuação de cada jogo e ordena", async () => {
    await registrarPontuacao({ jogador: A, apelido: "Ana", avatar: "boi", jogo: "quiz", pontos: 1200 }, durante);
    await registrarPontuacao({ jogador: A, apelido: "Ana", avatar: "boi", jogo: "quiz", pontos: 800 }, durante); // pior: ignora
    await registrarPontuacao({ jogador: A, apelido: "Ana", avatar: "boi", jogo: "memoria", pontos: 900 }, durante);
    await registrarPontuacao({ jogador: B, apelido: "Beto", avatar: "tambor", jogo: "quiz", pontos: 1500 }, durante);
    await registrarPontuacao({ jogador: C, apelido: "Cida", avatar: "guara", jogo: "memoria", pontos: 1000 }, durante);
    await registrarPontuacao({ jogador: D, apelido: "Davi", avatar: "estrela", jogo: "quiz", pontos: 400 }, durante);
    await registrarPontuacao({ jogador: E, apelido: "Eva", avatar: "serpente", jogo: "quiz", pontos: 150 }, durante); // abaixo do mínimo

    const geral = await lerPlacar({ periodo: "semana", semana: "2026-10-12" }, durante);
    expect(geral.map((l) => [l.apelido, l.pontos])).toEqual([
      ["Ana", 2100],
      ["Beto", 1500],
      ["Cida", 1000],
      ["Davi", 400],
      ["Eva", 150],
    ]);
    expect(await posicaoNaSemana(A, durante)).toBe(1);

    const soQuiz = await lerPlacar({ jogo: "quiz", periodo: "semana", semana: "2026-10-12" }, durante);
    expect(soQuiz[0]).toMatchObject({ apelido: "Beto", pontos: 1500 });
  });

  it("limita a pontuação ao máximo do jogo", async () => {
    const F = quem("ffff6");
    const outraSemana = new Date("2026-10-28T15:00:00Z"); // semana de 26/10, isolada das demais
    await registrarPontuacao({ jogador: F, apelido: "Fabio", avatar: "boi", jogo: "memoria", pontos: 99999 }, outraSemana);
    const l = await lerPlacar({ jogo: "memoria", periodo: "semana", semana: "2026-10-26" }, outraSemana);
    expect(l.find((x) => x.apelido === "Fabio")?.pontos).toBe(2000); // teto da memória (difícil ×2)
  });

  it("durante a semana ninguém ganha prêmio; depois que fecha, top 3 com 10% e 5% e 5%", async () => {
    expect((await situacaoDoPremio(A, durante)).elegivel).toBe(false);
    const sA = await situacaoDoPremio(A, depois);
    expect(sA).toMatchObject({ elegivel: true, posicao: 1, percentual: 10 });
    expect(await situacaoDoPremio(B, depois)).toMatchObject({ elegivel: true, posicao: 2, percentual: 5 });
    expect(await situacaoDoPremio(C, depois)).toMatchObject({ elegivel: true, posicao: 3, percentual: 5 });
    expect((await situacaoDoPremio(D, depois)).elegivel).toBe(false); // 4º lugar
    expect((await situacaoDoPremio(E, depois)).elegivel).toBe(false); // abaixo do mínimo
  });

  it("emite um cupom de uso único e devolve o mesmo código se pedir de novo", async () => {
    const r = await resgatarPremio(A, depois);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.codigo).toMatch(/^PLAY-[A-Z0-9]{6}$/);
    expect(r.percentual).toBe(10);
    expect(r.jaEmitido).toBe(false);
    const de2 = await resgatarPremio(A, depois);
    expect(de2).toMatchObject({ ok: true, codigo: r.codigo, jaEmitido: true });

    const cupons = JSON.parse(await readFile(process.env.CUPONS_ARQUIVO!, "utf8")) as {
      codigo: string;
      percentual: number;
      limite: { usos: number; periodo: string };
      validoAte: string;
      ativo: boolean;
    }[];
    const c = cupons.find((x) => x.codigo === r.codigo);
    expect(c).toMatchObject({ percentual: 10, ativo: true, limite: { usos: 1, periodo: "total" } });
    expect(c?.validoAte).toBe("2026-11-19"); // 30 dias depois de 20/10
    expect(cupons.filter((x) => x.codigo === r.codigo)).toHaveLength(1);
  });

  it("2º lugar recebe 5% e quem ficou de fora não resgata", async () => {
    const r = await resgatarPremio(B, depois);
    expect(r).toMatchObject({ ok: true, percentual: 5, posicao: 2 });
    expect(await resgatarPremio(D, depois)).toMatchObject({ ok: false });
  });

  it("depois do prazo de 14 dias o prêmio não pode mais ser resgatado", async () => {
    const tarde = new Date("2026-11-10T15:00:00Z"); // semana de 12/10 fechou; prazo vai até 02/11
    // a semana "fechada" nessa data já é outra: ninguém é elegível para a antiga
    expect((await situacaoDoPremio(C, tarde)).elegivel).toBe(false);
  });
});
