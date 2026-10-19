import { describe, expect, it } from "vitest";
import type { RegistroPedido } from "../pedidos/registro";
import { FORMATO_RASTREIO, htmlEnvio, htmlEstorno, linkDeRastreio, normalizarRastreio, textoEnvio } from "./posVenda";

const r = {
  ref: "KMB-20261020-ABC123",
  pagamentoId: 1,
  criadoEm: "2026-10-20T12:00:00.000Z",
  cliente: { nome: "Maria <b>Teste</b>", email: "maria@exemplo.com" },
  itens: [{ id: 1, nome: "Camisa", quantidade: 1, preco: 89.9 }],
  entrega: { descricao: "Correios PAC", valor: 20, retirada: false, prazoDias: 8 },
  total: 109.9,
  pagamento: {},
  bling: { idPedido: 99 },
} as RegistroPedido;

describe("e-mails do pós-venda", () => {
  it("normaliza e valida o código de rastreio", () => {
    expect(normalizarRastreio(" aa 123456789 br ")).toBe("AA123456789BR");
    expect(FORMATO_RASTREIO.test("AA123456789BR")).toBe(true);
    expect(FORMATO_RASTREIO.test("AA-1")).toBe(false);
  });

  it("postado: leva código, link e escapa o nome", () => {
    const d = { registro: r, codigo: "AA123456789BR", transportadora: "Correios", urlDoSite: "https://x" };
    expect(textoEnvio(d)).toContain(linkDeRastreio("AA123456789BR"));
    const html = htmlEnvio(d);
    expect(html).toContain("AA123456789BR");
    expect(html).not.toContain("<b>Teste</b>");
  });

  it("estorno: avisa a loja com o passo a passo", () => {
    const html = htmlEstorno(r, "charged_back");
    expect(html).toContain("CONTESTADO");
    expect(html).toContain("Glauco");
  });
});
