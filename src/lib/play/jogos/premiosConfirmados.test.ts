import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { cadastrar, confirmarEmail, tokenDeEmail } from "../contas";
import {
  confirmadosAte,
  emitirPremiosDaSemanaFechada,
  fimDaSemana,
  jogadorDaConta,
  registrarPontuacao,
  resgatarPremio,
  situacaoDoPremio,
} from "./placar";

// Semana de 26/10 a 01/11/2026 (segunda a domingo, São Luís); fecha às 00:00 de 02/11 (03:00 UTC).
const QUARTA = new Date("2026-10-28T15:00:00Z");
const SEGUNDA = new Date("2026-11-02T13:00:00Z");
const TERCA = new Date("2026-11-03T13:00:00Z");

const jogador: Record<string, string> = {};

async function conta(nome: string, confirmaEm?: Date): Promise<void> {
  const r = await cadastrar({ nome, email: `${nome.toLowerCase()}@exemplo.com`, senha: "senha-de-teste", novidades: false }, QUARTA);
  if (!r.ok) throw new Error(r.mensagem);
  if (confirmaEm) {
    const c = await confirmarEmail(tokenDeEmail("confirmar", r.conta.id, confirmaEm.getTime() - 1000), confirmaEm);
    if (!c) throw new Error("não confirmou");
  }
  jogador[nome] = jogadorDaConta(r.conta.id);
}

const pontuar = (nome: string, pontos: number) =>
  registrarPontuacao({ jogador: jogador[nome], apelido: `Apelido${nome}`, avatar: "boi", jogo: "quiz", pontos }, QUARTA);

describe("prêmio da semana só para conta com e-mail confirmado", () => {
  beforeAll(async () => {
    const dir = await mkdtemp(join(tmpdir(), "kambada-premios-confirmados-"));
    process.env.PLAY_PLACAR_ARQUIVO = join(dir, "placar.json");
    process.env.PLAY_CONTAS_ARQUIVO = join(dir, "contas.json");
    process.env.CUPONS_ARQUIVO = join(dir, "cupons.json");
    await conta("Ana"); // 1º lugar, nunca confirmou
    await conta("Beto", QUARTA); // 2º, confirmado
    await conta("Cida", TERCA); // 3º, confirmou só depois de a semana fechar
    await conta("Davi", new Date("2026-11-01T20:00:00Z")); // 4º, confirmou no domingo
    await conta("Eva", QUARTA); // 5º, confirmada
    await conta("Fabio", QUARTA); // 6º, confirmado: fica sem prêmio (só há três)
    await pontuar("Ana", 2500);
    await pontuar("Beto", 2000);
    await pontuar("Cida", 1500);
    await pontuar("Davi", 1000);
    await pontuar("Eva", 800);
    await pontuar("Fabio", 600);
  });

  it("a semana fecha à meia-noite de domingo para segunda, em São Luís", async () => {
    expect(fimDaSemana("2026-10-26").toISOString()).toBe("2026-11-02T03:00:00.000Z");
    const confirmados = await confirmadosAte(fimDaSemana("2026-10-26"));
    expect(confirmados.has(jogador.Beto)).toBe(true);
    expect(confirmados.has(jogador.Davi)).toBe(true);
    expect(confirmados.has(jogador.Ana)).toBe(false);
    expect(confirmados.has(jogador.Cida)).toBe(false); // confirmou na terça: tarde demais para esta semana
  });

  it("quem não confirmou aparece no ranking, mas o prêmio passa ao próximo confirmado", async () => {
    const r = await emitirPremiosDaSemanaFechada(SEGUNDA);
    expect(r.novos.map((n) => [n.apelido, n.posicao, n.percentual])).toEqual([
      ["ApelidoBeto", 1, 10],
      ["ApelidoDavi", 2, 8],
      ["ApelidoEva", 3, 5],
    ]);
    expect(r.top.map((t) => t.apelido)).toEqual(["ApelidoBeto", "ApelidoDavi", "ApelidoEva"]);
    expect(r.semConfirmacao.map((s) => s.apelido)).toEqual(["ApelidoAna", "ApelidoCida"]);
  });

  it("confirmar depois do fechamento não muda os premiados nem emite um quarto cupom", async () => {
    const r = await emitirPremiosDaSemanaFechada(TERCA);
    expect(r.novos).toEqual([]);
    expect(await resgatarPremio(jogador.Cida, TERCA)).toMatchObject({ ok: false });
    expect(await resgatarPremio(jogador.Ana, TERCA)).toMatchObject({ ok: false });
    const cupons = JSON.parse(await readFile(process.env.CUPONS_ARQUIVO!, "utf8")) as unknown[];
    expect(cupons).toHaveLength(3);
  });

  it("a tela sabe dizer a quem faltou só confirmar o e-mail", async () => {
    expect(await situacaoDoPremio(jogador.Ana, SEGUNDA)).toEqual({ elegivel: false, semana: "2026-10-26", semConfirmacao: true });
    expect(await situacaoDoPremio(jogador.Cida, TERCA)).toEqual({ elegivel: false, semana: "2026-10-26", semConfirmacao: true });
    expect(await situacaoDoPremio(jogador.Fabio, SEGUNDA)).toEqual({ elegivel: false, semana: "2026-10-26" });
    const beto = await situacaoDoPremio(jogador.Beto, SEGUNDA);
    expect(beto).toMatchObject({ elegivel: true, posicao: 1, percentual: 10 });
    expect(beto.elegivel && beto.codigo).toMatch(/^PLAY-/);
  });

  it("jogador sem conta (chave do navegador) não recebe cupom", async () => {
    await registrarPontuacao({ jogador: "chave-sem-conta", apelido: "Visitante", avatar: "boi", jogo: "memoria", pontos: 1900 }, new Date("2026-11-04T15:00:00Z"));
    const depois = new Date("2026-11-10T15:00:00Z");
    expect(await situacaoDoPremio("chave-sem-conta", depois)).toEqual({ elegivel: false, semana: "2026-11-02", semConfirmacao: true });
    expect((await emitirPremiosDaSemanaFechada(depois)).novos).toEqual([]);
  });

  it("prêmio emitido pela regra antiga continua valendo, e a posição dele não sai de novo", async () => {
    // Semana de 09/11: o 1º lugar (sem confirmar) já tinha recebido o cupom antes da mudança.
    const durante = new Date("2026-11-11T15:00:00Z");
    const fechou = new Date("2026-11-16T13:00:00Z");
    await registrarPontuacao({ jogador: jogador.Ana, apelido: "ApelidoAna", avatar: "boi", jogo: "quiz", pontos: 2500 }, durante);
    await registrarPontuacao({ jogador: jogador.Beto, apelido: "ApelidoBeto", avatar: "boi", jogo: "quiz", pontos: 2000 }, durante);
    const arquivo = process.env.PLAY_PLACAR_ARQUIVO!;
    const d = JSON.parse(await readFile(arquivo, "utf8")) as { premios: unknown[] };
    d.premios.push({ semana: "2026-11-09", jogador: jogador.Ana, posicao: 1, percentual: 10, codigo: "PLAY-ANTIGO", emitidoEm: fechou.toISOString() });
    await writeFile(arquivo, JSON.stringify(d), "utf8");

    expect(await situacaoDoPremio(jogador.Ana, fechou)).toMatchObject({ elegivel: true, posicao: 1, percentual: 10, codigo: "PLAY-ANTIGO" });
    // O Beto é o 1º confirmado, mas o 1º prêmio já saiu: ele não ganha um segundo "1º lugar".
    expect((await emitirPremiosDaSemanaFechada(fechou)).novos).toEqual([]);
    expect(await situacaoDoPremio(jogador.Beto, fechou)).toEqual({ elegivel: false, semana: "2026-11-09" });
  });
});
