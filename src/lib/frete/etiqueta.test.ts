import { describe, expect, it } from "vitest";
import type { ItemValidado } from "../carrinho/validar";
import { diasUteisEntre, pedidosParados } from "../manutencao/resumoDiario";
import type { RegistroPedido } from "../pedidos/registro";
import { montarFreteDoCarrinho } from "./etiqueta";
import { traduzirErro } from "./meApi";

const embalagem = { comprimento: 30, largura: 20, altura: 5, peso: 0.4, origem: "teste" };
const item = (q: number): ItemValidado => ({
  idBling: 1,
  slug: "matraca-mini",
  categoria: "matracas",
  nome: "Matraca Mini (Boi do Maranhão)",
  rotulo: "Boi do Maranhão",
  precoUnitario: 70,
  quantidade: q,
  embalagem,
});
const destinatario = {
  nome: "Maria Teste",
  documento: "123.456.789-00",
  telefone: "(11) 99999-0000",
  email: "maria@exemplo.com",
  endereco: "Av. Paulista",
  numero: "1000",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
  cep: "01310-100",
};

describe("frete no carrinho do Melhor Envio", () => {
  it("uma peça: o serviço escolhido, a embalagem dela, a nota vinculada e o remetente da Kambada", () => {
    const c = montarFreteDoCarrinho({ ref: "KMB-20261021-ABC123", servicoId: 1, itens: [item(1)], destinatario, chaveNota: "21".repeat(22), urlDoPedido: "https://x/pedido" });
    expect(c.service).toBe(1);
    expect(c.volumes).toEqual([{ height: 5, width: 20, length: 30, weight: 0.4 }]);
    expect(c.options.invoice).toEqual({ key: "21".repeat(22) });
    expect(c.options.non_commercial).toBe(false);
    expect(c.options.insurance_value).toBe(70);
    expect(c.from.company_document).toBe("51894535000194");
    expect(c.from.address).toBe("Rua Bom Jesus");
    expect(c.from.number).toBe("38");
    expect(c.to.document).toBe("12345678900");
    expect(c.to.postal_code).toBe("01310100");
    expect(c.to.phone).toBe("11999990000");
  });

  it("várias peças: uma caixa só; sem nota: declaração de conteúdo", () => {
    const c = montarFreteDoCarrinho({ ref: "KMB-20261021-ABC123", servicoId: 2, itens: [item(2)], destinatario, urlDoPedido: "https://x" });
    expect(c.volumes).toHaveLength(1);
    expect(c.volumes[0].weight).toBeGreaterThan(0.8);
    expect(c.options.non_commercial).toBe(true);
    expect(c.options.invoice).toBeUndefined();
    expect(c.options.insurance_value).toBe(140);
  });

  it("erro do Melhor Envio vira frase legível", () => {
    expect(traduzirErro('{"message":"Saldo insuficiente","errors":{"x":["Carteira sem saldo"]}}')).toBe("Saldo insuficiente — Carteira sem saldo");
    expect(traduzirErro("texto solto")).toBe("texto solto");
  });
});

describe("pedidos parados no resumo diário", () => {
  it("conta só dias úteis", () => {
    // sábado 17/10 → quarta 21/10: seg, ter e qua = 3 dias úteis
    expect(diasUteisEntre(new Date("2026-10-17T15:00:00Z"), new Date("2026-10-21T15:00:00Z"))).toBe(3);
  });

  it("pago há mais de 3 dias úteis sem postar nem retirar entra; postado, concluído ou cancelado não", () => {
    const base: RegistroPedido = {
      ref: "KMB-20261010-AAAAAA",
      pagamentoId: 1,
      criadoEm: "2026-10-10T15:00:00Z",
      cliente: { nome: "A", email: "a@b.c" },
      itens: [],
      entrega: { descricao: "Correios PAC", valor: 10, retirada: false, prazoDias: 7 },
      total: 10,
      pagamento: {},
      bling: { idPedido: 1 },
    };
    const agora = new Date("2026-10-21T15:00:00Z");
    expect(pedidosParados([base], agora)).toHaveLength(1);
    expect(pedidosParados([{ ...base, envio: { codigo: "X", transportadora: "Correios", postadoEm: agora.toISOString() } }], agora)).toHaveLength(0);
    expect(pedidosParados([{ ...base, conclusao: { tipo: "retirado", em: agora.toISOString() } }], agora)).toHaveLength(0);
    expect(pedidosParados([{ ...base, cancelamento: { origem: "loja", concluidoEm: agora.toISOString() } }], agora)).toHaveLength(0);
    expect(pedidosParados([{ ...base, criadoEm: "2026-10-20T15:00:00Z" }], agora)).toHaveLength(0);
  });
});
