import { mkdtemp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { criarSessaoDeConta, lerSessao, sessaoDaRequisicao } from "./acesso";
import {
  autenticar,
  cadastrar,
  confirmarEmail,
  contasParaCsv,
  descadastrar,
  gerarHash,
  lerTokenDeEmail,
  listarContas,
  nomeValido,
  normalizarEmail,
  redefinirSenha,
  senhaConfere,
  tokenDeEmail,
} from "./contas";

beforeAll(async () => {
  const pasta = await mkdtemp(join(tmpdir(), "kambada-play-contas-"));
  process.env.PLAY_CONTAS_ARQUIVO = join(pasta, "contas.json");
});

describe("validação", () => {
  it("normaliza e-mail e recusa lixo", () => {
    expect(normalizarEmail("  Maria@Exemplo.COM ")).toBe("maria@exemplo.com");
    expect(normalizarEmail("sem-arroba")).toBeNull();
    expect(normalizarEmail("a@b")).toBeNull();
    expect(normalizarEmail(42)).toBeNull();
  });
  it("aceita nome com acento e recusa símbolo", () => {
    expect(nomeValido("  Maria   Wilsonira ")).toBe("Maria Wilsonira");
    expect(nomeValido("<b>x</b>")).toBeNull();
    expect(nomeValido("A")).toBeNull();
  });
  it("hash de senha confere e não se repete", () => {
    const h = gerarHash("segredo123");
    expect(senhaConfere("segredo123", h)).toBe(true);
    expect(senhaConfere("segredo124", h)).toBe(false);
    expect(gerarHash("segredo123")).not.toBe(h);
    expect(h).not.toContain("segredo");
  });
});

describe("cadastro e login", () => {
  it("cria a conta, guarda o opt-in com data e não aceita e-mail repetido", async () => {
    const r = await cadastrar({ nome: "Ana Boi", email: "Ana@Teste.com", senha: "matraca2026", novidades: true });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.conta.email).toBe("ana@teste.com");
    expect(r.conta.novidades).toBe(true);
    expect(r.conta.novidadesEm).toBeTruthy();
    expect(r.conta.confirmadoEm).toBeUndefined();
    const de2 = await cadastrar({ nome: "Outra", email: "ana@teste.com", senha: "matraca2026", novidades: false });
    expect(de2).toMatchObject({ ok: false, motivo: "email-em-uso" });
  });
  it("recusa senha curta e dados ruins", async () => {
    expect(await cadastrar({ nome: "Ana", email: "x@y.com", senha: "curta", novidades: false })).toMatchObject({
      ok: false,
      motivo: "dados",
    });
    expect(await cadastrar({ nome: "", email: "x@y.com", senha: "longa-o-bastante", novidades: false })).toMatchObject({
      ok: false,
      motivo: "dados",
    });
  });
  it("autentica com a senha certa e recusa a errada e o e-mail desconhecido", async () => {
    expect((await autenticar("ANA@teste.com", "matraca2026"))?.nome).toBe("Ana Boi");
    expect(await autenticar("ana@teste.com", "errada-errada")).toBeNull();
    expect(await autenticar("ninguem@teste.com", "matraca2026")).toBeNull();
  });
});

describe("tokens de e-mail", () => {
  it("confirma o e-mail pelo link e recusa link vencido ou de outro tipo", async () => {
    const conta = (await listarContas())[0];
    const t = tokenDeEmail("confirmar", conta.id);
    expect(lerTokenDeEmail(t, "redefinir")).toBeNull();
    expect(lerTokenDeEmail(t, "confirmar", Date.now() + 49 * 3600 * 1000)).toBeNull();
    const c = await confirmarEmail(t);
    expect(c?.confirmadoEm).toBeTruthy();
    expect(await confirmarEmail("lixo")).toBeNull();
  });
  it("redefine a senha pelo link e a antiga para de valer", async () => {
    const conta = (await listarContas())[0];
    const t = tokenDeEmail("redefinir", conta);
    expect(await redefinirSenha(t, "curta")).toBeNull();
    expect((await redefinirSenha(t, "nova-senha-123"))?.id).toBe(conta.id);
    expect(await autenticar("ana@teste.com", "matraca2026")).toBeNull();
    expect((await autenticar("ana@teste.com", "nova-senha-123"))?.id).toBe(conta.id);
    // o mesmo link não serve duas vezes
    expect(await redefinirSenha(t, "outra-senha-456")).toBeNull();
    expect((await autenticar("ana@teste.com", "nova-senha-123"))?.id).toBe(conta.id);
  });
  it("descadastra pelo link do e-mail", async () => {
    const conta = (await listarContas())[0];
    expect(await descadastrar(tokenDeEmail("descadastrar", conta.id))).toBe(true);
    expect((await listarContas())[0].novidades).toBe(false);
    expect(await descadastrar("x")).toBe(false);
  });
});

describe("sessão de conta", () => {
  it("o cookie carrega o id da conta e é lido da requisição", () => {
    const cookie = criarSessaoDeConta("abc123");
    expect(lerSessao(cookie)).toMatchObject({ v: 2, conta: "abc123" });
    const req = new Request("http://x/api", { headers: { cookie: `outro=1; kambada-play=${cookie}` } });
    expect(sessaoDaRequisicao(req)).toMatchObject({ v: 2, conta: "abc123" });
    expect(sessaoDaRequisicao(new Request("http://x/api"))).toBeNull();
  });
});

describe("exportação", () => {
  it("gera CSV com cabeçalho, separador ; e sem a senha", async () => {
    const csv = contasParaCsv(await listarContas());
    const linhas = csv.split("\r\n");
    expect(linhas[0]).toContain("email;aceita_novidades");
    expect(linhas[1]).toContain("ana@teste.com");
    expect(csv).not.toContain("scrypt$");
  });
});
