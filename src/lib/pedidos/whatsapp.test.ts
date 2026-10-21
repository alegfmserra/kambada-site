import { describe, expect, it } from "vitest";
import type { RegistroPedido } from "./registro";
import { mensagemDoWhatsApp, telefoneParaWhatsApp } from "./whatsapp";

const r = {
  ref: "KMB-20261021-ABC123",
  cliente: { nome: "Maria Teste", email: "m@x.y" },
  envio: { codigo: "AA123456789BR", transportadora: "Correios", postadoEm: "2026-10-21T10:00:00Z" },
} as RegistroPedido;

describe("WhatsApp com mensagem pronta", () => {
  it("telefone do Bling no formato do wa.me", () => {
    expect(telefoneParaWhatsApp("(98) 98443-5295")).toBe("5598984435295");
    expect(telefoneParaWhatsApp("+55 98 98443-5295")).toBe("5598984435295");
    expect(telefoneParaWhatsApp("1234")).toBeNull();
    expect(telefoneParaWhatsApp(undefined)).toBeNull();
  });
  it("mensagem com primeiro nome, pedido e rastreio", () => {
    const m = mensagemDoWhatsApp(r, "rastreio");
    expect(m).toContain("Maria");
    expect(m).toContain("AA123456789BR");
    expect(mensagemDoWhatsApp(r, "producao")).toMatch(/não pode mais ser cancelado/);
  });
});
