import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * A queda do Bling de 20–21/10/2026: dois processos renovando com o mesmo
 * refresh token. O Bling aceita o primeiro e recusa o segundo (400). Antes, o
 * perdedor marcava a conexão como inválida por cima dos tokens novos.
 */
describe("renovação do token do Bling entre processos", () => {
  let arquivo: string;

  beforeEach(() => {
    arquivo = join(mkdtempSync(join(tmpdir(), "kambada-tokens-")), "bling-tokens.json");
    vi.stubEnv("BLING_TOKENS_ARQUIVO", arquivo);
    vi.stubEnv("BLING_CLIENT_ID", "id");
    vi.stubEnv("BLING_CLIENT_SECRET", "segredo");
    writeFileSync(
      arquivo,
      JSON.stringify({ accessToken: "a0", refreshToken: "r0", expiraEm: Date.now() - 1000, renovadoEm: 1 }),
    );
    // Bling: cada refresh token vale uma vez; o segundo uso de r0 dá 400.
    const usados = new Set<string>();
    let n = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url: string, init: { body: string }) => {
        const { refresh_token } = JSON.parse(init.body) as { refresh_token: string };
        await new Promise((r) => setTimeout(r, 20));
        if (usados.has(refresh_token)) return new Response('{"error":"invalid_grant"}', { status: 400 });
        usados.add(refresh_token);
        n += 1;
        return new Response(
          JSON.stringify({ access_token: `a${n}`, refresh_token: `r${n}`, expires_in: 21600, scope: "x" }),
          { status: 200 },
        );
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("perdedor de uma disputa usa o token novo e NÃO marca a conexão como inválida", async () => {
    const { renovarTokens } = await import("./tokens");
    // Processo A renova primeiro; o processo B ainda tem o r0 antigo em mãos.
    await renovarTokens("r0");
    const b = await renovarTokens("r0");
    const salvo = JSON.parse(readFileSync(arquivo, "utf8"));
    expect(salvo.invalido).toBeUndefined();
    expect(b.accessToken).toBe(salvo.accessToken);
  });

  it("chamadas simultâneas renovam uma vez só", async () => {
    const { tokenValido } = await import("./tokens");
    const tokens = await Promise.all([tokenValido(), tokenValido(), tokenValido()]);
    expect(new Set(tokens).size).toBe(1);
    expect(JSON.parse(readFileSync(arquivo, "utf8")).invalido).toBeUndefined();
  });

  it("refresh token realmente morto continua sendo marcado", async () => {
    const { renovarTokens } = await import("./tokens");
    await renovarTokens("r0"); // gasta r0 → arquivo com r1
    writeFileSync(arquivo, JSON.stringify({ ...JSON.parse(readFileSync(arquivo, "utf8")), refreshToken: "r0" }));
    await expect(renovarTokens("r0")).rejects.toThrow();
    expect(JSON.parse(readFileSync(arquivo, "utf8")).invalido).toBe(true);
  });
});
