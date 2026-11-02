import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { emitirPremiosDaSemanaFechada, registrarPontuacao, situacaoDoPremio, semanaDe, semanaFechada } from "./placar";
import { PREMIOS_SEMANAIS } from "./tipos";

// Semana de 26/10 a 01/11/2026 (segunda a domingo, São Luís). O fechamento roda na segunda 02/11.
const QUARTA = new Date("2026-10-28T15:00:00Z");
const SEGUNDA = new Date("2026-11-02T13:00:00Z"); // 10h em São Luís
const jog = (n: string) => ({ jogador: `jogador-${n}`, apelido: `Apelido${n}`, avatar: "boi" as never, jogo: "quiz" as const });

describe("fechamento automático do ranking semanal", () => {
  beforeAll(async () => {
    const dir = await mkdtemp(join(tmpdir(), "kambada-premios-"));
    process.env.PLAY_PLACAR_ARQUIVO = join(dir, "placar.json");
    process.env.CUPONS_ARQUIVO = join(dir, "cupons.json");
    // 4 jogadores acima do mínimo e 1 abaixo (200 < 300).
    await registrarPontuacao({ ...jog("A"), pontos: 2500 }, QUARTA);
    await registrarPontuacao({ ...jog("B"), pontos: 1800 }, QUARTA);
    await registrarPontuacao({ ...jog("C"), pontos: 900 }, QUARTA);
    await registrarPontuacao({ ...jog("D"), pontos: 700 }, QUARTA);
    await registrarPontuacao({ ...jog("E"), pontos: 200 }, QUARTA);
  });

  it("a segunda-feira abre uma semana nova e fecha a anterior", () => {
    expect(semanaDe(QUARTA)).toBe("2026-10-26");
    expect(semanaDe(SEGUNDA)).toBe("2026-11-02");
    expect(semanaFechada(SEGUNDA)).toBe("2026-10-26");
  });

  it("emite 10 %, 8 % e 5 % para o top 3, sem esperar ninguém resgatar", async () => {
    expect(PREMIOS_SEMANAIS).toEqual([10, 8, 5]);
    const r = await emitirPremiosDaSemanaFechada(SEGUNDA);
    expect(r.semana).toBe("2026-10-26");
    expect(r.top.map((t) => t.apelido)).toEqual(["ApelidoA", "ApelidoB", "ApelidoC"]);
    expect(r.novos.map((n) => [n.posicao, n.percentual])).toEqual([[1, 10], [2, 8], [3, 5]]);
    expect(new Set(r.novos.map((n) => n.codigo)).size).toBe(3);
    // Os cupons entram na lista da loja, de uso único.
    const cupons = JSON.parse(await readFile(process.env.CUPONS_ARQUIVO!, "utf8")) as { codigo: string; percentual: number; limite: { usos: number } }[];
    const emitidos = cupons.filter((c) => r.novos.some((n) => n.codigo === c.codigo));
    expect(emitidos.map((c) => c.percentual).sort()).toEqual([10, 5, 8].sort());
    expect(emitidos.every((c) => c.limite.usos === 1)).toBe(true);
  });

  it("não duplica: rodar de novo (cron a cada 6 h) não emite nada", async () => {
    const r = await emitirPremiosDaSemanaFechada(new Date("2026-11-02T19:00:00Z"));
    expect(r.novos).toEqual([]);
    const r2 = await emitirPremiosDaSemanaFechada(new Date("2026-11-03T13:00:00Z"));
    expect(r2.novos).toEqual([]);
  });

  it("o cupom já aparece na tela do jogador e quem ficou de fora segue de fora", async () => {
    const a = await situacaoDoPremio("jogador-A", SEGUNDA);
    expect(a).toMatchObject({ elegivel: true, posicao: 1, percentual: 10, expirou: false });
    expect(a.elegivel && a.codigo).toBeTruthy();
    expect((await situacaoDoPremio("jogador-D", SEGUNDA)).elegivel).toBe(false); // 4º lugar
    expect((await situacaoDoPremio("jogador-E", SEGUNDA)).elegivel).toBe(false); // abaixo do mínimo
  });
});
