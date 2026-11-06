import { afterEach, describe, expect, it, vi } from "vitest";
import { clientIdDoGoogle, sessaoDoGoogle } from "./cookiesGoogle";
import { corpoDaCompra, enviarCompraGA4, lerGaDoNavegador } from "./servidor";
import type { RegistroPedido } from "../pedidos/registro";

const registro = (extra: Partial<RegistroPedido> = {}): RegistroPedido => ({
  ref: "KMB-20261104-ABC123",
  pagamentoId: 1,
  criadoEm: "2026-11-04T18:00:00.000Z",
  cliente: { nome: "Fulana", email: "f@x.com" },
  itens: [{ id: 123, nome: "Matraca Kambada Mini (Boi)", quantidade: 1, preco: 110 }],
  entrega: { descricao: "PAC", valor: 0, retirada: true, prazoDias: 0 },
  total: 110,
  pagamento: {},
  bling: { idPedido: 9 },
  ...extra,
});

describe("cookies do Google", () => {
  it("tira o client_id do _ga e a sessão do _ga_<id> (formatos novo e antigo)", () => {
    expect(clientIdDoGoogle("GA1.1.1234567890.1730000000")).toBe("1234567890.1730000000");
    expect(clientIdDoGoogle("lixo")).toBeUndefined();
    expect(sessaoDoGoogle("GS2.1.s1762300000$o1$g1$t1762300100$j0$l0$h0")).toBe("1762300000");
    expect(sessaoDoGoogle("GS1.1.1762300000.1.1.1762300100.0.0.0")).toBe("1762300000");
    expect(sessaoDoGoogle(undefined)).toBeUndefined();
  });
});

describe("compra no GA4 pelo servidor", () => {
  it("valida o que o navegador manda", () => {
    expect(lerGaDoNavegador({ c: "1234567890.1730000000", s: "1762300000" })).toEqual({ c: "1234567890.1730000000", s: "1762300000" });
    expect(lerGaDoNavegador({ c: "1234567890.1730000000", s: "<x>" })).toEqual({ c: "1234567890.1730000000" });
    expect(lerGaDoNavegador({ c: "alert(1)" })).toBeUndefined();
    expect(lerGaDoNavegador(null)).toBeUndefined();
  });

  it("monta o evento purchase com itens, valor e sem dado pessoal", () => {
    const corpo = corpoDaCompra(registro({ cupom: { codigo: "SEACHEGA10", percentual: 10, desconto: 11 } }), { c: "1234567890.1730000000", s: "1762300000" });
    const texto = JSON.stringify(corpo);
    expect(texto).not.toContain("Fulana");
    expect(texto).not.toContain("f@x.com");
    expect(corpo.client_id).toBe("1234567890.1730000000");
    const ev = (corpo.events as { name: string; params: Record<string, unknown> }[])[0];
    expect(ev.name).toBe("purchase");
    expect(ev.params).toMatchObject({ transaction_id: "KMB-20261104-ABC123", currency: "BRL", value: 110, coupon: "SEACHEGA10", session_id: 1762300000 });
    expect(ev.params.items).toEqual([{ item_id: "123", item_name: "Matraca Kambada Mini (Boi)", price: 110, quantity: 1 }]);
  });

  it("sem cookie do Google, cria um client_id próprio estável para o mesmo pedido", () => {
    const a = corpoDaCompra(registro());
    const b = corpoDaCompra(registro());
    expect(a.client_id).toBe(b.client_id);
    expect(String(a.client_id)).toMatch(/^\d+\.\d+$/);
  });

  describe("envio", () => {
    afterEach(() => {
      vi.unstubAllEnvs();
      vi.unstubAllGlobals();
    });
    it("não envia sem a chave ou fora de produção", async () => {
      const f = vi.fn();
      vi.stubGlobal("fetch", f);
      vi.stubEnv("GA4_API_SECRET", "");
      expect(await enviarCompraGA4(registro())).toBeNull();
      vi.stubEnv("GA4_API_SECRET", "segredo");
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000");
      expect(await enviarCompraGA4(registro())).toBeNull();
      expect(f).not.toHaveBeenCalled();
    });
    it("em produção com a chave, envia uma vez ao Measurement Protocol e devolve a etapa feita", async () => {
      const f = vi.fn().mockResolvedValue({ status: 204 });
      vi.stubGlobal("fetch", f);
      vi.stubEnv("GA4_API_SECRET", "segredo");
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://somoskambada.com.br");
      const r = await enviarCompraGA4(registro(), { c: "1234567890.1730000000" });
      expect(r?.feitoEm).toBeTruthy();
      expect(f).toHaveBeenCalledTimes(1);
      expect(String(f.mock.calls[0][0])).toContain("measurement_id=G-1LGMQVBGL3");
      expect(String(f.mock.calls[0][0])).toContain("api_secret=segredo");
    });
    it("falha de rede vira erro na etapa, sem derrubar o pedido", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("rede caiu")));
      vi.stubEnv("GA4_API_SECRET", "segredo");
      vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://somoskambada.com.br");
      expect(await enviarCompraGA4(registro())).toEqual({ erro: "rede caiu" });
    });
  });
});
