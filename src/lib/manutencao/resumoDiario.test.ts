import { describe, expect, it } from "vitest";
import type { RegistroPedido } from "../pedidos/registro";
import { comissoesDoDia, csvDoDia, dataLocal, diaDoResumo, msAteProximoResumo, pedidosDoDia } from "./resumoDiario";

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

  it("o resumo é sempre do dia anterior, no fuso de São Luís", () => {
    expect(diaDoResumo(new Date("2026-10-11T18:17:00Z"))).toBe("2026-10-10"); // 15:17 local
    expect(diaDoResumo(new Date("2026-10-12T03:01:00Z"))).toBe("2026-10-11"); // 00:01 local do dia 12
  });

  it("agenda a próxima 00:01 de São Luís", () => {
    // 11/10 23:00 local (12/10 02:00 UTC) → faltam 61 min
    expect(msAteProximoResumo(new Date("2026-10-12T02:00:00Z"))).toBe(61 * 60 * 1000);
    // 12/10 00:02 local → próxima é amanhã, 23h59
    expect(msAteProximoResumo(new Date("2026-10-12T03:02:00Z"))).toBe((24 * 60 - 1) * 60 * 1000);
  });

  it("comissão do parceiro: percentual sobre as peças já com desconto", () => {
    const p = pedido("2026-10-11T15:00:00Z");
    p.cupom = { codigo: "JORGE5", percentual: 5, desconto: 5, parceiro: "Jorge", comissaoPercentual: 5 };
    const c = comissoesDoDia([p, p]);
    expect(c).toEqual([{ parceiro: "Jorge", cupom: "JORGE5", pedidos: 2, vendas: 189.8, comissao: 9.49 }]);
    expect(comissoesDoDia([pedido("2026-10-11T15:00:00Z")])).toEqual([]);
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

import { mesAnterior, relatoriosDoMes, csvDoRelatorio } from "./relatorioCupons";

describe("relatório mensal por cupom", () => {
  it("mês anterior no fuso de São Luís (1º do mês às 00:01 = mês que acabou)", () => {
    expect(mesAnterior(new Date("2026-11-01T03:01:00Z"))).toBe("2026-10");
    expect(mesAnterior(new Date("2027-01-01T03:01:00Z"))).toBe("2026-12");
  });

  it("agrupa por parceiro só os pedidos do mês, sem dado de cliente, e soma a comissão", () => {
    const p = pedido("2026-10-11T15:00:00Z");
    p.cupom = { codigo: "JORGE5", percentual: 5, desconto: 5, parceiro: "Jorge", comissaoPercentual: 5 };
    const foraDoMes = pedido("2026-09-30T15:00:00Z");
    foraDoMes.cupom = p.cupom;
    const rel = relatoriosDoMes([p, foraDoMes], "2026-10");
    expect(rel).toHaveLength(1);
    expect(rel[0]).toMatchObject({ parceiro: "Jorge", cupom: "JORGE5", totalBase: 94.9, totalComissao: 4.75 });
    expect(rel[0].linhas[0].ref).toBe("KMB-20261011-ABC123");
    const csv = csvDoRelatorio(rel[0]);
    expect(csv).not.toContain("Maria");
    expect(csv).toContain("TOTAL;;;;94.9;4.75");
  });
});
