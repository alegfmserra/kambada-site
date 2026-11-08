import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";
import { _zerarMemoria, lerDados } from "./dados";
import { liberacoesDaEscola, liberarTemporada, temporadaAberta } from "./liberacao";
import { ErroEscola } from "./servico";
import { temporadasDoAluno } from "./temporadaServico";

beforeEach(() => {
  process.env.ESCOLA_ARQUIVO = join(mkdtempSync(join(tmpdir(), "kambada-escola-")), "escola.json");
  process.env.ESCOLA_DEMO_SENHA = "senha-dos-testes-123";
  _zerarMemoria();
});

describe("temporadas por escola", () => {
  it("começa com tudo liberado e o gestor fecha uma", async () => {
    const d = await lerDados();
    const gestor = d.membros.find((m) => m.papel === "gestor")!;
    expect((await liberacoesDaEscola()).every((l) => l.liberada)).toBe(true);
    await liberarTemporada(gestor, "carnaval", false);
    expect(await temporadaAberta("carnaval")).toBe(false);
    expect(await temporadaAberta("saojoao")).toBe(true);
    const aluno = d.alunos[0];
    expect((await temporadasDoAluno(aluno)).some((t) => t.temporada.id === "carnaval")).toBe(false);
    await liberarTemporada(gestor, "carnaval", true);
    expect(await temporadaAberta("carnaval")).toBe(true);
  });

  it("só a gestão Kambada muda e valida o pedido", async () => {
    const d = await lerDados();
    const gestor = d.membros.find((m) => m.papel === "gestor")!;
    const outro = d.membros.find((m) => m.papel !== "gestor")!;
    await expect(liberarTemporada(outro, "carnaval", false)).rejects.toBeInstanceOf(ErroEscola);
    await expect(liberarTemporada(gestor, "nao-existe", false)).rejects.toBeInstanceOf(ErroEscola);
    await expect(liberarTemporada(gestor, "carnaval", "sim")).rejects.toBeInstanceOf(ErroEscola);
  });
});
