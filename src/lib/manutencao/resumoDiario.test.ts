import { describe, expect, it } from "vitest";
import type { RegistroPedido } from "../pedidos/registro";
import { csvDoDia, dataLocal, diaDoResumo, pedidosDoDia } from "./resumoDiario";

const pedido = (criadoEm: string, total = 99.9): RegistroPedido => ({
  ref: "KMB-20261011-ABC123",
  pagamentoId: 1,
  criadoEm,
  cliente: { nome: 'Maria "da" Silva', email: "m@x.com" },
  itens: [{ id: 1, nome: "Camisa; Tradição", quantidade: 1, preco: 99.9 }],
  entrega: { descricao: "PAC", valor: 20, retirada: false, prazoDias: 5 },
  total,
  pagamento: { tipo: "bank_transfer" },
  bling: { idPedido: 7 },
  estoque: { feitoEm: "x" },
});

describe("resumo diário", () => {
  it("o dia é no fuso de São Luís: 23h local ainda é hoje, 02h UTC do dia seguinte também", () => {
    // 11/10 23:30 em São Luís = 12/10 02:30 UTC
    expect(dataLocal(new Date("2026-10-12T02:30:00Z"))).toBe("2026-10-11");
  });

  it("antes das 20h o resumo é de ontem; a partir das 20h, de hoje", () => {
    expect(diaDoResumo(new Date("2026-10-11T18:17:00Z"))).toBe("2026-10-10"); // 15:17 local
    expect(diaDoResumo(new Date("2026-10-12T00:17:00Z"))).toBe("2026-10-11"); // 21:17 local
  });

  it("filtra os pedidos do dia e gera CSV com ponto e vírgula escapado", () => {
    const todos = [pedido("2026-10-11T15:00:00Z"), pedido("2026-10-10T15:00:00Z")];
    const doDia = pedidosDoDia(todos, "2026-10-11");
    expect(doDia).toHaveLength(1);
    const csv = csvDoDia(doDia);
    expect(csv.split("\r\n")).toHaveLength(2);
    expect(csv).toContain('"Maria ""da"" Silva"');
    expect(csv).toContain('"1x Camisa; Tradição"');
    expect(csv).toContain(";ok;");
  });
});
