/**
 * Acompanhamento de pedido pelo cliente — sem conta, sem senha, sem banco.
 *
 * O cliente informa o NÚMERO DO PEDIDO (KMB-…) e o E-MAIL usado na compra.
 * Os dois precisam bater: só o número não basta, para ninguém consultar o
 * pedido alheio chutando números. Se não baterem, a resposta é a mesma de
 * "não encontrado" — o site não confirma nem que o pedido existe.
 *
 * As fontes são as de sempre: o pagamento no Mercado Pago (com o retrato do
 * pedido dentro) e o pedido no Bling (situação e rastreio). Nada de CPF,
 * telefone ou endereço do cliente sai daqui.
 */

import { chamarBling } from "../bling/cliente";
import { buscarPedidoPorNumeroLoja, numeroLojaDe } from "../bling/pedidos";
import { buscarPagamento, buscarPagamentosDoPedido, type Pagamento } from "../mercadopago/cliente";
import { lerRegistro } from "../pedidos/registro";
import { lerRetrato } from "./pedido";

export const FORMATO_REFERENCIA = /^KMB-\d{8}-[0-9A-F]{6}$/;

export function normalizarReferencia(bruta: string): string {
  return bruta.trim().toUpperCase().replace(/\s+/g, "");
}

const normalizarEmail = (e: string) => e.trim().toLowerCase();

/** A situação do pagamento em palavras do cliente. */
export function situacaoDoPagamento(status: string): { texto: string; tom: "ok" | "espera" | "problema" } {
  switch (status) {
    case "approved":
      return { texto: "Pagamento aprovado", tom: "ok" };
    case "pending":
    case "in_process":
    case "authorized":
      return { texto: "Aguardando o pagamento", tom: "espera" };
    case "rejected":
      return { texto: "Pagamento recusado", tom: "problema" };
    case "cancelled":
      return { texto: "Pagamento cancelado", tom: "problema" };
    case "refunded":
      return { texto: "Pagamento devolvido (estornado)", tom: "problema" };
    case "charged_back":
      return { texto: "Pagamento contestado no cartão", tom: "problema" };
    default:
      return { texto: "Em verificação", tom: "espera" };
  }
}

/** Entre vários pagamentos do mesmo pedido, vale o aprovado; senão, o mais recente. */
export function pagamentoQueVale(pagamentos: Pagamento[]): Pagamento | null {
  return pagamentos.find((p) => p.status === "approved") ?? pagamentos[0] ?? null;
}

export type Acompanhamento = {
  ref: string;
  feitoEm?: string;
  itens: { nome: string; quantidade: number; preco: number }[];
  entrega: { descricao: string; valor: number; retirada: boolean };
  total: number;
  pagamento: { texto: string; tom: "ok" | "espera" | "problema"; aprovado: boolean };
  pedido: { situacao: string; rastreios: { servico?: string; codigo: string }[] } | null;
};

type PedidoBling = {
  data?: {
    situacao?: { id?: number };
    transporte?: { volumes?: { servico?: string; codigoRastreamento?: string }[] };
  };
};

const nomesDeSituacao = new Map<number, string>();

async function nomeDaSituacao(id: number): Promise<string> {
  const guardado = nomesDeSituacao.get(id);
  if (guardado) return guardado;
  const r = await chamarBling<{ data?: { nome?: string } }>(`/situacoes/${id}`, { revalidar: 3600 });
  const nome = r.data?.nome ?? "Em processamento";
  nomesDeSituacao.set(id, nome);
  return nome;
}

/** Situação e rastreio de um pedido no Bling — usado aqui e na página de controle. */
export async function situacaoNoBling(
  idPedido: number,
): Promise<{ situacao: string; rastreios: { servico?: string; codigo: string }[] }> {
  const p = await chamarBling<PedidoBling>(`/pedidos/vendas/${idPedido}`, { revalidar: 0 });
  const idSituacao = p.data?.situacao?.id;
  return {
    situacao: idSituacao ? await nomeDaSituacao(idSituacao) : "Em processamento",
    rastreios: (p.data?.transporte?.volumes ?? [])
      .filter((v) => v.codigoRastreamento)
      .map((v) => ({ servico: v.servico, codigo: v.codigoRastreamento as string })),
  };
}

/** Bling fora do ar: o pagamento aprovado já é informação útil para o cliente. */
async function situacaoNoBlingSegura(idPedido: number) {
  try {
    return await situacaoNoBling(idPedido);
  } catch {
    return { situacao: "Recebido — em separação", rastreios: [] };
  }
}

export async function acompanharPedido(
  refBruta: string,
  emailBruto: string,
): Promise<Acompanhamento | null> {
  const ref = normalizarReferencia(refBruta);
  const email = normalizarEmail(emailBruto);
  if (!FORMATO_REFERENCIA.test(ref) || !email.includes("@")) return null;

  // 1º: o registro próprio do site (pedidos a partir de 08/10/2026).
  const registro = await lerRegistro(ref);
  if (registro) {
    const pagamento = await buscarPagamento(registro.pagamentoId);
    const emails = [registro.cliente.email, pagamento.payer?.email]
      .filter((e): e is string => Boolean(e))
      .map(normalizarEmail);
    if (!emails.includes(email)) return null;
    const aprovado = pagamento.status === "approved";
    return {
      ref,
      feitoEm: registro.criadoEm,
      itens: registro.itens.map((i) => ({ nome: i.nome, quantidade: i.quantidade, preco: i.preco })),
      entrega: {
        descricao: registro.entrega.descricao,
        valor: registro.entrega.valor,
        retirada: registro.entrega.retirada,
      },
      total: registro.total,
      pagamento: { ...situacaoDoPagamento(pagamento.status), aprovado },
      pedido: aprovado ? await situacaoNoBlingSegura(registro.bling.idPedido) : null,
    };
  }

  // 2º: pedido sem registro (anterior a ele) — reconstruído do Mercado Pago.
  const pagamentos = await buscarPagamentosDoPedido(ref);
  const pagamento = pagamentoQueVale(pagamentos);
  if (!pagamento || pagamento.external_reference !== ref) return null;

  const retrato = lerRetrato(pagamento.metadata?.pedido);
  if (!retrato) return null;

  // O e-mail do formulário do site OU o que o cliente usou no Mercado Pago.
  const emailsDoPedido = [retrato.cliente.email, pagamento.payer?.email]
    .filter((e): e is string => Boolean(e))
    .map(normalizarEmail);
  if (!emailsDoPedido.includes(email)) return null;

  const aprovado = pagamento.status === "approved";
  let pedido: Acompanhamento["pedido"] = null;
  if (aprovado) {
    try {
      const idPedido = await buscarPedidoPorNumeroLoja(numeroLojaDe(pagamento.id));
      pedido = idPedido
        ? await situacaoNoBlingSegura(idPedido)
        : { situacao: "Recebido — em separação", rastreios: [] };
    } catch {
      pedido = { situacao: "Recebido — em separação", rastreios: [] };
    }
  }

  const itensCentavos = retrato.itens.reduce((s, i) => s + Math.round(i.p * 100) * i.q, 0);
  return {
    ref,
    feitoEm: pagamento.date_created,
    itens: retrato.itens.map((i) => ({ nome: i.n, quantidade: i.q, preco: i.p })),
    entrega: {
      descricao: retrato.frete.servico,
      valor: retrato.frete.valor,
      retirada: retrato.frete.retirada === true,
    },
    total: (itensCentavos + Math.round(retrato.frete.valor * 100)) / 100,
    pagamento: { ...situacaoDoPagamento(pagamento.status), aprovado },
    pedido,
  };
}
