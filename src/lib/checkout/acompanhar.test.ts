import { beforeEach, describe, expect, it, vi } from "vitest";
import { mensagemAtendimento } from "../pedido/atendimento";
import type { RetratoPedido } from "./pedido";

const pagamentos = vi.hoisted(() => ({ lista: [] as unknown[] }));

vi.mock("../mercadopago/cliente", () => ({
  buscarPagamentosDoPedido: vi.fn(async () => pagamentos.lista),
}));
vi.mock("../bling/pedidos", () => ({
  numeroLojaDe: (id: number) => `MP-${id}`,
  buscarPedidoPorNumeroLoja: vi.fn(async () => 27075266943),
}));
vi.mock("../bling/cliente", () => ({
  chamarBling: vi.fn(async (caminho: string) =>
    caminho.startsWith("/situacoes/")
      ? { data: { nome: "Em aberto" } }
      : { data: { situacao: { id: 6 }, transporte: { volumes: [{ servico: "SEDEX", codigoRastreamento: "AB123BR" }] } } },
  ),
}));

const {
  acompanharPedido,
  normalizarReferencia,
  pagamentoQueVale,
  situacaoDoPagamento,
  FORMATO_REFERENCIA,
} = await import("./acompanhar");

const REF = "KMB-20261008-FD0B8F";

function retrato(retirada = false): RetratoPedido {
  return {
    v: 1,
    ref: REF,
    itens: [{ id: 16689787486, q: 1, p: 8, n: "Lápis Plantável" }],
    frete: retirada
      ? { servico: "Retirar no ateliê", valor: 0, prazo: 0, gratis: false, retirada: true }
      : { servico: "Correios SEDEX", valor: 12.68, prazo: 2, gratis: false },
    cliente: {
      nome: "Maria da Silva",
      email: "Maria@Exemplo.com",
      telefone: "98999990000",
      cpf: "52998224725",
      cep: "65065060",
      logradouro: "Rua X",
      numero: "1",
      complemento: "",
      bairro: "Centro",
      cidade: "São Luís",
      uf: "MA",
    },
  };
}

function pagamento(status: string, r = retrato(), id = 182018170505) {
  return {
    id,
    status,
    external_reference: REF,
    date_created: "2026-10-08T07:10:00.000-04:00",
    payer: { email: "outro@pagador.com" },
    metadata: { pedido: JSON.stringify(r) },
  };
}

describe("acompanhamento de pedido", () => {
  beforeEach(() => {
    pagamentos.lista = [];
  });

  it("normaliza e reconhece o número do pedido", () => {
    expect(normalizarReferencia(" kmb-20261008-fd0b8f ")).toBe(REF);
    expect(FORMATO_REFERENCIA.test(REF)).toBe(true);
    expect(FORMATO_REFERENCIA.test("KMB-1")).toBe(false);
  });

  it("entre vários pagamentos, vale o aprovado", () => {
    const recusado = pagamento("rejected", retrato(), 1);
    const aprovado = pagamento("approved", retrato(), 2);
    expect(pagamentoQueVale([recusado, aprovado])?.id).toBe(2);
    expect(pagamentoQueVale([recusado])?.id).toBe(1);
    expect(pagamentoQueVale([])).toBeNull();
  });

  it("traduz a situação do pagamento", () => {
    expect(situacaoDoPagamento("approved").tom).toBe("ok");
    expect(situacaoDoPagamento("pending").texto).toBe("Aguardando o pagamento");
    expect(situacaoDoPagamento("refunded").tom).toBe("problema");
  });

  it("e-mail errado não revela nada — nem que o pedido existe", async () => {
    pagamentos.lista = [pagamento("approved")];
    expect(await acompanharPedido(REF, "intruso@exemplo.com")).toBeNull();
  });

  it("aceita o e-mail do formulário (sem diferenciar maiúsculas) ou o do Mercado Pago", async () => {
    pagamentos.lista = [pagamento("approved")];
    expect(await acompanharPedido(REF.toLowerCase(), "maria@exemplo.com")).not.toBeNull();
    expect(await acompanharPedido(REF, "OUTRO@pagador.com")).not.toBeNull();
  });

  it("pedido aprovado mostra situação do Bling e rastreio — e nenhum dado pessoal", async () => {
    pagamentos.lista = [pagamento("approved")];
    const a = await acompanharPedido(REF, "maria@exemplo.com");
    expect(a?.pagamento).toMatchObject({ aprovado: true, tom: "ok" });
    expect(a?.pedido).toEqual({ situacao: "Em aberto", rastreios: [{ servico: "SEDEX", codigo: "AB123BR" }] });
    expect(a?.total).toBe(20.68);
    const texto = JSON.stringify(a);
    expect(texto).not.toContain("52998224725");
    expect(texto).not.toContain("98999990000");
    expect(texto).not.toContain("Rua X");
  });

  it("pagamento pendente não consulta o Bling", async () => {
    pagamentos.lista = [pagamento("pending")];
    const a = await acompanharPedido(REF, "maria@exemplo.com");
    expect(a?.pagamento.aprovado).toBe(false);
    expect(a?.pedido).toBeNull();
  });

  it("marca a retirada no ateliê", async () => {
    pagamentos.lista = [pagamento("approved", retrato(true))];
    const a = await acompanharPedido(REF, "maria@exemplo.com");
    expect(a?.entrega).toMatchObject({ retirada: true, valor: 0 });
  });
});

describe("mensagem de atendimento", () => {
  it("leva motivo, pedido, nome e relato — e nunca CPF", () => {
    const m = mensagemAtendimento({
      motivo: "devolucao",
      ref: REF,
      nome: "Maria",
      descricao: "Não serviu.",
      recebidoEm: "2026-10-10",
    });
    expect(m).toContain("Devolução — desisti da compra");
    expect(m).toContain(`Pedido: ${REF}`);
    expect(m).toContain("Recebi em: 10/10/2026");
    expect(m).toContain("Não serviu.");
    expect(m).not.toMatch(/cpf/i);
  });

  it("em defeito, avisa que vai mandar fotos", () => {
    const m = mensagemAtendimento({ motivo: "defeito", ref: REF, nome: "Maria", descricao: "Costura soltou." });
    expect(m).toContain("Vou mandar fotos");
  });
});
