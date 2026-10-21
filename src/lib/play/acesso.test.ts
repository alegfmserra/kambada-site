import { afterEach, describe, expect, it, vi } from "vitest";
import { ROTAS_PUBLICAS, VALIDADE_SESSAO_S, credenciaisValidas, criarSessao, criarSessaoDeConta, destinoSeguro, ehArquivoEstatico, sessaoValida } from "./acesso";

afterEach(() => {
  delete process.env.PLAY_LOGIN;
  delete process.env.PLAY_SENHA;
});

describe("login do Kambada Play", () => {
  it("aceita somoskambada / somoskambada por padrão (sem diferenciar maiúsculas no login)", () => {
    expect(credenciaisValidas("somoskambada", "somoskambada")).toBe(true);
    expect(credenciaisValidas("  SomosKambada ", "somoskambada")).toBe(true);
  });
  it("recusa senha errada, login errado e valores que não são texto", () => {
    expect(credenciaisValidas("somoskambada", "SomosKambada")).toBe(false); // a senha diferencia maiúsculas
    expect(credenciaisValidas("outro", "somoskambada")).toBe(false);
    expect(credenciaisValidas("somoskambada", "")).toBe(false);
    expect(credenciaisValidas(undefined, undefined)).toBe(false);
    expect(credenciaisValidas({}, [])).toBe(false);
    expect(credenciaisValidas("a".repeat(500), "b".repeat(500))).toBe(false);
  });
  it("PLAY_LOGIN e PLAY_SENHA trocam o padrão", () => {
    process.env.PLAY_LOGIN = "equipe";
    process.env.PLAY_SENHA = "outra-senha";
    expect(credenciaisValidas("equipe", "outra-senha")).toBe(true);
    expect(credenciaisValidas("somoskambada", "somoskambada")).toBe(false);
  });
});

describe("demonstração desligada em produção", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });
  it("em produção recusa o login e o cookie antigo de demonstração", () => {
    vi.stubEnv("PLAY_SEGREDO", "segredo-de-teste");
    const t0 = Date.parse("2026-10-20T12:00:00Z");
    const cookie = criarSessao(t0);
    vi.stubEnv("NODE_ENV", "production");
    expect(credenciaisValidas("somoskambada", "somoskambada")).toBe(false);
    expect(sessaoValida(cookie, t0 + 1000)).toBe(false);
    // Conta com e-mail continua valendo.
    expect(sessaoValida(criarSessaoDeConta("abc", "marca1", t0), t0 + 1000)).toBe(true);
  });
  it("PLAY_DEMONSTRACAO=1 religa", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("PLAY_DEMONSTRACAO", "1");
    expect(credenciaisValidas("somoskambada", "somoskambada")).toBe(true);
  });
});

describe("sessão", () => {
  it("vale até o fim da validade e não aceita cookie adulterado", () => {
    const t0 = Date.parse("2026-10-16T12:00:00Z");
    const cookie = criarSessao(t0);
    expect(sessaoValida(cookie, t0 + 1000)).toBe(true);
    expect(sessaoValida(cookie, t0 + (VALIDADE_SESSAO_S + 5) * 1000)).toBe(false);
    expect(sessaoValida(cookie + "x", t0)).toBe(false);
    expect(sessaoValida("lixo", t0)).toBe(false);
    expect(sessaoValida(undefined, t0)).toBe(false);
  });
});

describe("destino depois do login", () => {
  it("só volta para dentro do Play", () => {
    expect(destinoSeguro("/kambadaplay/jogos/quiz")).toBe("/kambadaplay/jogos/quiz");
    expect(destinoSeguro("/kambadaplay")).toBe("/kambadaplay");
    expect(destinoSeguro("https://exemplo.com")).toBe("/kambadaplay");
    expect(destinoSeguro("//exemplo.com")).toBe("/kambadaplay");
    expect(destinoSeguro("/loja")).toBe("/kambadaplay");
    expect(destinoSeguro("/kambadaplay\\..\\x")).toBe("/kambadaplay");
    expect(destinoSeguro("/kambadaplay/entrar")).toBe("/kambadaplay");
    expect(destinoSeguro("/kambadaplay/planos")).toBe("/kambadaplay");
    expect(destinoSeguro(undefined)).toBe("/kambadaplay");
  });
});

describe("arquivos estáticos", () => {
  it("imagens e vídeos passam; páginas e API não", () => {
    expect(ehArquivoEstatico("/kambadaplay/images/arraial/poster.webp")).toBe(true);
    expect(ehArquivoEstatico("/kambadaplay/draco/draco_decoder.wasm")).toBe(true);
    expect(ehArquivoEstatico("/kambadaplay/videos/x.mp4")).toBe(true);
    expect(ehArquivoEstatico("/kambadaplay")).toBe(false);
    expect(ehArquivoEstatico("/kambadaplay/jogos/quiz")).toBe(false);
    expect(ehArquivoEstatico("/api/play/placar")).toBe(false);
  });
});

describe("rotas públicas", () => {
  it("planos, entrada e exportação ficam fora do login; o hub e os jogos não", () => {
    expect(ROTAS_PUBLICAS).toContain("/kambadaplay/planos");
    expect(ROTAS_PUBLICAS).toContain("/kambadaplay/entrar");
    expect(ROTAS_PUBLICAS).toContain("/api/play/contas");
    expect(ROTAS_PUBLICAS).not.toContain("/kambadaplay");
    expect(ROTAS_PUBLICAS).not.toContain("/kambadaplay/jogos/quiz");
  });
});
