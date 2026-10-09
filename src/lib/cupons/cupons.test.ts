import { describe, expect, it } from "vitest";
import type { RegistroPedido } from "../pedidos/registro";
import {
  avaliarCupom,
  descontoEmCentavos,
  inicioDoPeriodo,
  normalizarCodigo,
  precoComDesconto,
  relatorioDoCupom,
  type Cupom,
} from "./cupons";

const cupomJorge = (extra: Partial<Cupom> = {}): Cupom => ({
  codigo: "JORGE5",
  percentual: 5,
  parceiro: "Jorge",
  comissaoPercentual: 5,
  limite: { usos: 2, periodo: "semana" },
  ativo: true,
  criadoEm: "2026-10-01T12:00:00Z",
  ...extra,
});

const venda = (criadoEm: string, codigo = "JORGE5"): RegistroPedido => ({
  ref: "KMB-20261009-AAAAAA",
  pagamentoId: 1,
  criadoEm,
  cliente: { nome: "X", email: "x@x.com" },
  itens: [{ id: 1, nome: "Camisa", quantidade: 1, preco: 99.9 }],
  entrega: { descricao: "PAC", valor: 20, retirada: false, prazoDias: 5 },
  total: 99.9 - 5 + 20,
  pagamento: {},
  bling: { idPedido: 1 },
  cupom: { codigo, percentual: 5, desconto: 5, parceiro: "Jorge", comissaoPercentual: 5 },
});

// Quinta-feira, 09/10/2026, 15h em São Luís (18h UTC).
const QUINTA = new Date("2026-10-09T18:00:00Z");

describe("cupons", () => {
  it("normaliza o código digitado", () => {
    expect(normalizarCodigo("  jorge 5 ")).toBe("JORGE5");
    expect(normalizarCodigo("ção")).toBe("CAO");
  });

  it("o período começa no fuso de São Luís: dia à meia-noite, semana na segunda, mês no dia 1", () => {
    expect(inicioDoPeriodo("dia", QUINTA).toISOString()).toBe("2026-10-09T03:00:00.000Z");
    expect(inicioDoPeriodo("semana", QUINTA).toISOString()).toBe("2026-10-05T03:00:00.000Z"); // segunda 05/10
    expect(inicioDoPeriodo("mes", QUINTA).toISOString()).toBe("2026-10-01T03:00:00.000Z");
    // Domingo 23h em São Luís ainda é a mesma semana (segunda-feira anterior).
    expect(inicioDoPeriodo("semana", new Date("2026-10-12T02:00:00Z")).toISOString()).toBe("2026-10-05T03:00:00.000Z");
  });

  it("desconto por unidade, arredondado ao centavo — os itens somam o total exato", () => {
    expect(precoComDesconto(99.9, 5)).toBe(9491); // 94,905 → 94,91
    expect(descontoEmCentavos([{ p: 99.9, q: 2 }], 5)).toBe(2 * (9990 - 9491));
  });

  it("limite de usos por semana: esgota e volta na segunda-feira seguinte", () => {
    const itens = [{ p: 99.9, q: 1 }];
    const duasNaSemana = [venda("2026-10-06T15:00:00Z"), venda("2026-10-08T15:00:00Z")];
    const esgotado = avaliarCupom(cupomJorge(), itens, duasNaSemana, QUINTA);
    expect(esgotado.ok).toBe(false);
    if (!esgotado.ok) expect(esgotado.mensagem).toContain("por semana");

    // Uma das vendas foi na semana passada: ainda há 1 uso.
    const umaNaSemana = [venda("2026-10-02T15:00:00Z"), venda("2026-10-08T15:00:00Z")];
    expect(avaliarCupom(cupomJorge(), itens, umaNaSemana, QUINTA).ok).toBe(true);
  });

  it("cupom pausado, fora da validade ou inexistente não vale", () => {
    const itens = [{ p: 99.9, q: 1 }];
    expect(avaliarCupom(null, itens, [], QUINTA).ok).toBe(false);
    expect(avaliarCupom(cupomJorge({ ativo: false }), itens, [], QUINTA).ok).toBe(false);
    expect(avaliarCupom(cupomJorge({ validoAte: "2026-10-08" }), itens, [], QUINTA).ok).toBe(false);
    expect(avaliarCupom(cupomJorge({ validoDe: "2026-10-10" }), itens, [], QUINTA).ok).toBe(false);
    expect(avaliarCupom(cupomJorge({ validoDe: "2026-10-09", validoAte: "2026-10-09" }), itens, [], QUINTA).ok).toBe(true);
  });

  it("o relatório soma vendas com desconto e calcula a comissão do parceiro", () => {
    const rel = relatorioDoCupom(cupomJorge(), [venda("2026-10-06T15:00:00Z"), venda("2026-10-08T15:00:00Z")], QUINTA);
    expect(rel).toMatchObject({ usosNoPeriodo: 2, usosTotal: 2, descontoCentavos: 1000 });
    expect(rel.vendasCentavos).toBe(2 * (9990 - 500));
    expect(rel.comissaoCentavos).toBe(Math.round((2 * 9490 * 5) / 100));
  });

  it("vendas de outro cupom não contam", () => {
    const rel = relatorioDoCupom(cupomJorge(), [venda("2026-10-08T15:00:00Z", "BLACK30")], QUINTA);
    expect(rel.usosTotal).toBe(0);
  });
});
