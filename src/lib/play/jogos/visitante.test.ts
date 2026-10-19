import { describe, expect, it } from "vitest";
import { iniciarPartida, nivelDaPartida } from "./quiz";

describe("quiz de visitante (degustação sem conta)", () => {
  it("lê o nível de uma partida assinada", () => {
    expect(nivelDaPartida(iniciarPartida("facil").estado)).toBe("facil");
    expect(nivelDaPartida(iniciarPartida("dificil").estado)).toBe("dificil");
  });

  it("recusa estado adulterado", () => {
    const { estado } = iniciarPartida("facil");
    expect(nivelDaPartida(estado.slice(0, -2) + "xx")).toBeNull();
    expect(nivelDaPartida("lixo")).toBeNull();
    expect(nivelDaPartida(undefined)).toBeNull();
  });
});
