import { describe, expect, it } from "vitest";
import type { RegistroPedido } from "../pedidos/registro";
import { pedidosDaConta, situacaoDoPedido } from "./pedidosDaConta";

function pedido(ref: string, email: string, extra: Partial<RegistroPedido> = {}): RegistroPedido {
  return {
    ref,
    pagamentoId: 1,
    criadoEm: `2026-10-${ref.slice(-2)}T12:00:00.000Z`,
    cliente: { nome: "Fulana", email },
    itens: [{ id: 1, nome: "Matraca Grande", quantidade: 2, preco: 95 }],
    entrega: { descricao: "PAC", valor: 20, retirada: false, prazoDias: 5 },
    total: 210,
    pagamento: {},
    bling: { idPedido: 1 },
    ...extra,
  };
}

describe("pedidosDaConta", () => {
  const registros = [
    pedido("KMB-20261010-AAAA10", "Fulana@Exemplo.com"),
    pedido("KMB-20261012-AAAA12", "outra@exemplo.com"),
    pedido("KMB-20261015-AAAA15", "fulana@exemplo.com "),
  ];

  it("só mostra pedidos com e-mail confirmado", () => {
    expect(pedidosDaConta(registros, { email: "fulana@exemplo.com" })).toEqual([]);
  });

  it("casa pelo e-mail sem diferenciar maiúsculas, mais recente primeiro", () => {
    const r = pedidosDaConta(registros, { email: "fulana@exemplo.com", confirmadoEm: "2026-10-01" });
    expect(r.map((p) => p.ref)).toEqual(["KMB-20261015-AAAA15", "KMB-20261010-AAAA10"]);
    expect(r[0].pecas).toBe(2);
    expect(r[0].itens).toEqual(["2× Matraca Grande"]);
  });

  it("situação: estorno > postado > retirada > preparação", () => {
    expect(situacaoDoPedido(pedido("KMB-20261010-AAAA10", "a@b.c"))).toBe("Pago · em preparação");
    expect(
      situacaoDoPedido(pedido("KMB-20261010-AAAA10", "a@b.c", { entrega: { descricao: "Ateliê", valor: 0, retirada: true, prazoDias: 0 } })),
    ).toBe("Pago · retirada no ateliê");
    expect(
      situacaoDoPedido(
        pedido("KMB-20261010-AAAA10", "a@b.c", { envio: { codigo: "AA1", transportadora: "Correios", postadoEm: "2026-10-16T15:00:00Z" } }),
      ),
    ).toBe("Postado em 16/10/2026");
    expect(
      situacaoDoPedido(pedido("KMB-20261010-AAAA10", "a@b.c", { estorno: { status: "refunded", detectadoEm: "2026-10-17" } })),
    ).toBe("Pagamento devolvido ou cancelado");
  });
});
