import { describe, expect, it } from "vitest";
import { assinar, verificar } from "./seguranca";
import { finalizarQuebra, iniciarQuebra, pecasDoNivel, pontosDaQuebra, refazerTrocas, type ProvaQuebra } from "./quebra";

describe("Quebra-cabeça — níveis", () => {
  it("12, 20 e 40 peças", () => {
    expect(pecasDoNivel("facil")).toBe(12);
    expect(pecasDoNivel("medio")).toBe(20);
    expect(pecasDoNivel("dificil")).toBe(40);
  });

  it("nível inválido vira médio", () => {
    expect(iniciarQuebra("xyz").nivel).toBe("medio");
    expect(iniciarQuebra(undefined).colunas).toBe(5);
  });
});

describe("Quebra-cabeça — pontos", () => {
  it("montagem enxuta e rápida vale 1000 × multiplicador", () => {
    expect(pontosDaQuebra("facil", 12, 60)).toBe(1000);
    expect(pontosDaQuebra("medio", 20, 100)).toBe(1500);
    expect(pontosDaQuebra("dificil", 40, 200)).toBe(2000);
  });

  it("cai com trocas e tempo a mais, mas nunca abaixo de 100 × multiplicador", () => {
    expect(pontosDaQuebra("facil", 28, 96)).toBe(1000 - 100);
    expect(pontosDaQuebra("facil", 12, 146)).toBe(1000 - 100);
    expect(pontosDaQuebra("facil", 500, 5000)).toBe(100);
    expect(pontosDaQuebra("dificil", 500, 5000)).toBe(200);
  });
});

/** Trocas que montam o tabuleiro: põe a peça certa em cada posição, uma por vez. */
function solucao(ordemInicial: number[]): [number, number][] {
  const ordem = [...ordemInicial];
  const trocas: [number, number][] = [];
  for (let i = 0; i < ordem.length; i++) {
    if (ordem[i] === i) continue;
    const j = ordem.indexOf(i);
    trocas.push([i, j]);
    [ordem[i], ordem[j]] = [ordem[j], ordem[i]];
  }
  return trocas;
}

describe("Quebra-cabeça — partida", () => {
  const t0 = 1_700_000_000_000;

  it("o servidor embaralha o tabuleiro e nenhuma peça começa no lugar", () => {
    for (const nivel of ["facil", "medio", "dificil"] as const) {
      const { ordem } = iniciarQuebra(nivel, t0);
      expect(ordem).toHaveLength(pecasDoNivel(nivel));
      expect([...ordem].sort((a, b) => a - b)).toEqual(ordem.map((_, i) => i));
      expect(ordem.every((p, i) => p !== i)).toBe(true);
    }
  });

  it("refaz as trocas, conta e pontua aqui; a prova leva a conta", () => {
    const { token, ordem } = iniciarQuebra("facil", t0, "conta-da-ana");
    const trocas = solucao(ordem);
    const r = finalizarQuebra(token, trocas, t0 + 60_000);
    if ("erro" in r) throw new Error(r.erro);
    expect(r.trocas).toBe(trocas.length);
    expect(r.pontos).toBe(pontosDaQuebra("facil", trocas.length, 60));
    expect(r.segundos).toBe(60);
    expect(verificar<ProvaQuebra>(r.prova)).toMatchObject({ jogo: "quebra", conta: "conta-da-ana", trocas: trocas.length, pontos: r.pontos });
    // Trocas a mais (ir e voltar) também valem, e contam.
    // (duas posições cuja troca não põe nenhuma peça no lugar: a tela trava a peça que chega ao lugar)
    const a = 0;
    const b = ordem.findIndex((p, i) => i !== a && p !== a && ordem[a] !== i);
    const comVolta = finalizarQuebra(token, [[a, b], [a, b], ...trocas], t0 + 60_000);
    expect(comVolta).toMatchObject({ trocas: trocas.length + 2 });
  });

  it("não aceita mais o número de trocas informado pelo navegador", () => {
    const { token } = iniciarQuebra("facil", t0);
    expect("erro" in finalizarQuebra(token, 12, t0 + 60_000)).toBe(true);
    expect("erro" in finalizarQuebra(token, "12", t0 + 60_000)).toBe(true);
    expect("erro" in finalizarQuebra(token, [], t0 + 60_000)).toBe(true);
  });

  it("recusa lista que não monta o tabuleiro ou que faz o impossível", () => {
    const { token, ordem } = iniciarQuebra("medio", t0);
    const trocas = solucao(ordem);
    const fim = t0 + 120_000;
    expect("erro" in finalizarQuebra(token, trocas.slice(0, -1), fim)).toBe(true); // faltou a última
    expect("erro" in finalizarQuebra(token, [...trocas, trocas[0]], fim)).toBe(true); // mexeu em peça já no lugar
    expect("erro" in finalizarQuebra(token, [[0, 0], ...trocas], fim)).toBe(true); // peça com ela mesma
    expect("erro" in finalizarQuebra(token, [[0, 99], ...trocas], fim)).toBe(true); // fora do tabuleiro
    expect("erro" in finalizarQuebra(token, [[0.5, 1], ...trocas], fim)).toBe(true);
    expect("erro" in finalizarQuebra(token, [[0, 1, 2], ...trocas], fim)).toBe(true);
    expect("erro" in finalizarQuebra(token, Array.from({ length: 601 }, () => [0, 1]), fim)).toBe(true);
    expect(refazerTrocas(ordem, trocas)).toBe(trocas.length);
    expect(refazerTrocas(ordem, trocas.slice(1))).toBeNull();
  });

  it("recusa rápido demais, partida adulterada, de formato antigo e expirada", () => {
    const { token, ordem } = iniciarQuebra("dificil", t0);
    const trocas = solucao(ordem);
    expect("erro" in finalizarQuebra(token, trocas, t0 + 5_000)).toBe(true); // dezenas de trocas em 5 s
    expect("erro" in finalizarQuebra(token + "x", trocas, t0 + 200_000)).toBe(true);
    expect("erro" in finalizarQuebra("lixo", trocas, t0 + 200_000)).toBe(true);
    // Largada do protocolo antigo (sem tabuleiro): não vale mais.
    expect("erro" in finalizarQuebra(assinar({ v: 2, id: "x", t0, nivel: "dificil" }), trocas, t0 + 200_000)).toBe(true);
    expect("erro" in finalizarQuebra(token, trocas, t0 + 91 * 60_000)).toBe(true);
    expect("erro" in finalizarQuebra(token, trocas, t0 + 200_000)).toBe(false);
  });
});
