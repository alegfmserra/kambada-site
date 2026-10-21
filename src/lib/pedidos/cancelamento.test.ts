import { describe, expect, it } from "vitest";
import { acaoDaNota, avaliarCancelamento, etapaDoPedido } from "./cancelamento";
import type { RegistroPedido } from "./registro";

const H = 60 * 60 * 1000;
const agora = Date.parse("2026-10-21T15:00:00Z");
const iso = (msAtras: number) => new Date(agora - msAtras).toISOString();

const base: RegistroPedido = {
  ref: "KMB-20261021-ABC123",
  pagamentoId: 1,
  criadoEm: iso(2 * H),
  cliente: { nome: "Maria", email: "maria@exemplo.com" },
  itens: [{ id: 1, nome: "Matraca Mini", quantidade: 1, preco: 70 }],
  entrega: { descricao: "Correios PAC", valor: 27.59, retirada: false, prazoDias: 7 },
  total: 97.59,
  pagamento: {},
  bling: { idPedido: 10 },
};

describe("quando o pedido pode ser cancelado (regras de 21/10/2026)", () => {
  it("pago e em separação: pode", () => {
    expect(avaliarCancelamento(base, agora).pode).toBe(true);
  });

  it("postado, entregue ou retirado: não pode (vira devolução)", () => {
    expect(avaliarCancelamento({ ...base, envio: { codigo: "AA123456789BR", transportadora: "Correios", postadoEm: iso(H) } }, agora).pode).toBe(false);
    expect(avaliarCancelamento({ ...base, conclusao: { tipo: "entregue", em: iso(H) } }, agora).pode).toBe(false);
    expect(avaliarCancelamento({ ...base, conclusao: { tipo: "retirado", em: iso(H) } }, agora).pode).toBe(false);
  });

  it("produção iniciada (personalizada ou não): não pode, nem 1 hora depois", () => {
    expect(avaliarCancelamento({ ...base, producao: { iniciadaEm: iso(H), personalizado: true } }, agora).pode).toBe(false);
    expect(avaliarCancelamento({ ...base, producao: { iniciadaEm: iso(H), personalizado: false } }, agora).pode).toBe(false);
  });

  it("já cancelado ou estornado: não pode de novo", () => {
    expect(avaliarCancelamento({ ...base, cancelamento: { origem: "loja", concluidoEm: iso(H) } }, agora).pode).toBe(false);
    expect(avaliarCancelamento({ ...base, estorno: { status: "refunded", detectadoEm: iso(H) } }, agora).pode).toBe(false);
  });
});

describe("nota fiscal no cancelamento", () => {
  it("sem nota, até 24 h e depois de 24 h", () => {
    expect(acaoDaNota(base, agora)).toBe("sem-nota");
    expect(acaoDaNota({ ...base, nfe: { idNota: 5, feitoEm: iso(23 * H) } }, agora)).toBe("cancelar-no-bling");
    expect(acaoDaNota({ ...base, nfe: { idNota: 5, feitoEm: iso(25 * H) } }, agora)).toBe("devolucao-com-glauco");
  });
});

describe("etapa em palavras do cliente", () => {
  it("segue a ordem: cancelado > solicitado > concluído > postado > produção > pago", () => {
    expect(etapaDoPedido(base)).toBe("Pago · em preparação");
    expect(etapaDoPedido({ ...base, producao: { iniciadaEm: iso(H), personalizado: false } })).toMatch(/^Em produção/);
    expect(etapaDoPedido({ ...base, cancelamento: { origem: "cliente", solicitadoEm: iso(H) } })).toMatch(/solicitado/);
    expect(etapaDoPedido({ ...base, cancelamento: { origem: "loja", concluidoEm: iso(H) } })).toMatch(/^Cancelado/);
  });
});
