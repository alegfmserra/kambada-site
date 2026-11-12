import { describe, expect, it } from "vitest";
import { cidadeLocalDoCep, corridaGratis, opcaoLocal } from "./entregaLocal";

describe("entrega local na Grande São Luís", () => {
  it("reconhece as quatro cidades da Ilha pelo CEP", () => {
    expect(cidadeLocalDoCep("65065-060")).toBe("São Luís");
    expect(cidadeLocalDoCep("65110000")).toBe("São José de Ribamar");
    expect(cidadeLocalDoCep("65130-000")).toBe("Paço do Lumiar");
    expect(cidadeLocalDoCep("65138-000")).toBe("Raposa");
  });
  it("fora da Ilha ou CEP incompleto não tem entrega local", () => {
    expect(cidadeLocalDoCep("01310100")).toBeNull();
    expect(cidadeLocalDoCep("65065")).toBeNull();
    expect(cidadeLocalDoCep("65100-000")).toBeNull();
  });
  it("corrida grátis só em São Luís e a partir de R$ 180", () => {
    expect(corridaGratis("São Luís", 179.99)).toBe(false);
    expect(corridaGratis("São Luís", 180)).toBe(true);
    expect(corridaGratis("Paço do Lumiar", 500)).toBe(false);
    expect(opcaoLocal("São Luís", 200)).toMatchObject({ preco: 0, gratis: true, local: true, retirada: false });
  });
});
