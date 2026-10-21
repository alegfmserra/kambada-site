import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { liberar, pastaDeDadosPresente, reservar } from "./reserva";

describe("reserva entre processos (resumo e alertas em dobro, 20–21/10/2026)", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("de várias tentativas simultâneas, só uma ganha; liberada, pode de novo", async () => {
    vi.stubEnv("BLING_TOKENS_ARQUIVO", join(mkdtempSync(join(tmpdir(), "kambada-res-")), "bling-tokens.json"));
    const r = await Promise.all([reservar("resumo-2026-10-20"), reservar("resumo-2026-10-20"), reservar("resumo-2026-10-20")]);
    expect(r.filter(Boolean)).toHaveLength(1);
    await liberar("resumo-2026-10-20");
    expect(await reservar("resumo-2026-10-20")).toBe(true);
  });

  it("processo que aponta para pasta apagada (domínio antigo) se reconhece", () => {
    const pasta = mkdtempSync(join(tmpdir(), "kambada-velha-"));
    vi.stubEnv("BLING_TOKENS_ARQUIVO", join(pasta, "bling-tokens.json"));
    expect(pastaDeDadosPresente()).toBe(true);
    rmSync(pasta, { recursive: true });
    expect(pastaDeDadosPresente()).toBe(false);
  });
});
