import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";

// Contas demo de teste (a senha real das contas da escola não aparece em lugar nenhum do código).
vi.mock("./contasDemo", async () => {
  // Hash no mesmo formato de gerarHash (sem importar contas.ts, que importa este módulo).
  const { randomBytes, scryptSync } = await import("node:crypto");
  const sal = randomBytes(16).toString("hex");
  const senhaHash = `scrypt$${sal}$${scryptSync("senha-de-teste-1", sal, 32).toString("hex")}`;
  return {
    CONTAS_DEMO: [
      { usuario: "escola1", apelido: "Escola Um", senhaHash },
      { usuario: "escola2", apelido: "Escola Dois", senhaHash },
    ],
    contasDemoLigadas: () => process.env.PLAY_CONTAS_DEMO !== "0",
    idDaContaDemo: (u: string) => `demo-${u}`,
  };
});

const {
  autenticar,
  autenticarPorUsuario,
  cadastrar,
  contaDaSessao,
  emailInterno,
  listarContas,
  marcaDaSenha,
  normalizarUsuario,
  precisaLembreteDeConfirmacao,
  publica,
} = await import("./contas");

beforeAll(async () => {
  const pasta = await mkdtemp(join(tmpdir(), "kambada-play-usuarios-"));
  process.env.PLAY_CONTAS_ARQUIVO = join(pasta, "contas.json");
});

describe("entrada por usuário (sem e-mail)", () => {
  it("normaliza o usuário e recusa lixo", () => {
    expect(normalizarUsuario("  Escola1 ")).toBe("escola1");
    expect(normalizarUsuario("ab")).toBeNull();
    expect(normalizarUsuario("com espaço")).toBeNull();
    expect(normalizarUsuario("a@b.com")).toBeNull();
    expect(normalizarUsuario(7)).toBeNull();
  });

  it("conta demo entra com usuário e senha, é criada uma vez e não expõe o e-mail interno", async () => {
    const c = await autenticarPorUsuario("ESCOLA1", "senha-de-teste-1");
    expect(c?.id).toBe("demo-escola1");
    expect(c?.demo).toBe(true);
    expect(c?.nome).toBe("Escola Um");
    expect(c?.email).toBe(emailInterno("escola1"));
    expect(publica(c!).email).toBe("");
    expect(publica(c!).usuario).toBe("escola1");
    const outra = await autenticarPorUsuario("escola1", "senha-de-teste-1");
    expect(outra?.id).toBe(c?.id);
    expect(await autenticarPorUsuario("escola2", "senha-de-teste-1")).not.toBeNull();
  });

  it("recusa senha errada, usuário desconhecido e o e-mail interno pela porta do e-mail", async () => {
    expect(await autenticarPorUsuario("escola1", "errada-errada")).toBeNull();
    expect(await autenticarPorUsuario("ninguem", "senha-de-teste-1")).toBeNull();
    expect(await autenticar(emailInterno("escola1"), "senha-de-teste-1")).toBeNull();
  });

  it("contas por e-mail continuam entrando como antes", async () => {
    const r = await cadastrar({ nome: "Fulana", email: "fulana@exemplo.com", senha: "senha-forte-1", novidades: false });
    expect(r.ok).toBe(true);
    expect((await autenticar("fulana@exemplo.com", "senha-forte-1"))?.usuario).toBeUndefined();
    // e-mail não vira usuário
    expect(await autenticarPorUsuario("fulana", "senha-forte-1")).toBeNull();
  });

  it("demo fica fora da base de marketing e do lembrete de e-mail", async () => {
    const lista = await listarContas();
    expect(lista.some((c) => c.demo)).toBe(false);
    expect(lista.some((c) => c.email === "fulana@exemplo.com")).toBe(true);
    const demo = (await autenticarPorUsuario("escola1", "senha-de-teste-1"))!;
    const doisDiasDepois = new Date(new Date(demo.criadoEm).getTime() + 48 * 3600 * 1000);
    expect(precisaLembreteDeConfirmacao(demo, doisDiasDepois)).toBe(false);
  });

  it("PLAY_CONTAS_DEMO=0 tranca a entrada e derruba a sessão das contas demo", async () => {
    const demo = (await autenticarPorUsuario("escola1", "senha-de-teste-1"))!;
    const sessao = { v: 2 as const, exp: Math.floor(Date.now() / 1000) + 60, conta: demo.id, s: marcaDaSenha(demo) };
    expect(await contaDaSessao(sessao)).not.toBeNull();
    process.env.PLAY_CONTAS_DEMO = "0";
    try {
      expect(await autenticarPorUsuario("escola1", "senha-de-teste-1")).toBeNull();
      expect(await contaDaSessao(sessao)).toBeNull();
    } finally {
      delete process.env.PLAY_CONTAS_DEMO;
    }
  });
});
