import { afterEach, describe, expect, it, vi } from "vitest";
import { confere, segredoDaExportacao, segredoDeManutencao, segredoRecebido } from "./segredo";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

const req = (url: string, headers: Record<string, string> = {}) => new Request(url, { headers });

describe("senha das rotas de manutenção", () => {
  it("lê do cabeçalho (Bearer ou X-Kambada-Segredo) antes do endereço", () => {
    expect(segredoRecebido(req("http://x/api", { authorization: "Bearer abc" }))).toBe("abc");
    expect(segredoRecebido(req("http://x/api", { "x-kambada-segredo": "def" }))).toBe("def");
    expect(segredoRecebido(req("http://x/api?token=url", { authorization: "Bearer cab" }))).toBe("cab");
    expect(segredoRecebido(req("http://x/api"))).toBeNull();
  });

  it("aceita ?token= na transição, com aviso no log", () => {
    const aviso = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(segredoRecebido(req("http://x/api/bling/estado?token=velho"))).toBe("velho");
    expect(aviso).toHaveBeenCalledOnce();
  });

  it("confere em tempo constante e recusa vazio", () => {
    expect(confere("a", "a")).toBe(true);
    expect(confere("a", "ab")).toBe(false);
    expect(confere(null, "a")).toBe(false);
    expect(confere("a", undefined)).toBe(false);
  });

  it("manutenção usa REVALIDATE_SECRET", () => {
    vi.stubEnv("REVALIDATE_SECRET", "mestra-123");
    expect(segredoDeManutencao(req("http://x", { authorization: "Bearer mestra-123" }))).toBe(true);
    expect(segredoDeManutencao(req("http://x", { authorization: "Bearer outra" }))).toBe(false);
  });

  it("exportação usa EXPORTACAO_SECRET; sem ela, a mestra", () => {
    vi.stubEnv("REVALIDATE_SECRET", "mestra-123");
    expect(segredoDaExportacao(req("http://x", { authorization: "Bearer mestra-123" }))).toBe(true);
    vi.stubEnv("EXPORTACAO_SECRET", "marketing-456");
    expect(segredoDaExportacao(req("http://x", { authorization: "Bearer marketing-456" }))).toBe(true);
    // Com senha própria, a mestra não abre mais a exportação (e a do marketing não abre o Bling).
    expect(segredoDaExportacao(req("http://x", { authorization: "Bearer mestra-123" }))).toBe(false);
    expect(segredoDeManutencao(req("http://x", { authorization: "Bearer marketing-456" }))).toBe(false);
  });
});
