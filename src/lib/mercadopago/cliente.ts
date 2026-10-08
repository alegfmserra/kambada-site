/**
 * Mercado Pago — Checkout Pro.
 *
 * Por que Checkout Pro e não pagamento dentro do site: no Checkout Pro o
 * cartão é digitado na página do Mercado Pago, não na nossa. O site nunca
 * toca em número de cartão — o que tira de nós a responsabilidade de
 * conformidade PCI e entrega, de graça, a análise antifraude deles. Para o
 * volume da Kambada, é o caminho certo.
 *
 * Credenciais SÓ em variável de ambiente:
 *   MERCADOPAGO_ACCESS_TOKEN   — servidor; nunca vai ao navegador
 *   MERCADOPAGO_WEBHOOK_SECRET — assinatura das notificações
 *
 * Conta: a MESMA da maquininha (confirmado pelo Alexandre em 08/10/2026), para
 * que a venda do site caia no extrato que o financeiro já concilia.
 */

import { emCentavos } from "../loja/dinheiro";
import type { RetratoPedido } from "../checkout/pedido";

const API = "https://api.mercadopago.com";

/** Teto de parcelas — a regra da loja é até 3x. */
export const PARCELAS_MAXIMAS = 3;

export class ErroMercadoPago extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detalhe?: string,
  ) {
    super(message);
    this.name = "ErroMercadoPago";
  }
}

export function mercadoPagoConfigurado(): boolean {
  return Boolean(process.env.MERCADOPAGO_ACCESS_TOKEN);
}

/**
 * Prova que a chave funciona, só lendo: pergunta ao Mercado Pago de quem ela
 * é. Devolve apenas o ambiente e o país — nada de e-mail, documento ou nome.
 */
export async function conferirChave(): Promise<
  { ok: true; ambiente: "produção" | "teste"; pais: string } | { ok: false; status: number; detalhe?: string }
> {
  try {
    const eu = await chamar<{ site_id?: string }>("/users/me");
    const token = process.env.MERCADOPAGO_ACCESS_TOKEN ?? "";
    return {
      ok: true,
      ambiente: token.startsWith("APP_USR-") ? "produção" : "teste",
      pais: eu.site_id ?? "?",
    };
  } catch (erro) {
    return erro instanceof ErroMercadoPago
      ? { ok: false, status: erro.status, detalhe: erro.detalhe?.slice(0, 200) }
      : { ok: false, status: 0, detalhe: String(erro) };
  }
}

async function chamar<T>(caminho: string, init: RequestInit = {}): Promise<T> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) throw new ErroMercadoPago("Pagamento online não configurado", 503);

  const resposta = await fetch(`${API}${caminho}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!resposta.ok) {
    const texto = (await resposta.text()).slice(0, 500);
    throw new ErroMercadoPago(`Mercado Pago respondeu ${resposta.status}`, resposta.status, texto);
  }
  return (await resposta.json()) as T;
}

export type Preferencia = { id: string; init_point: string; sandbox_init_point?: string };

/** O corpo da preferência — separado para ser testado sem rede. */
export function montarPreferencia(retrato: RetratoPedido, urlDoSite: string, agora = new Date()) {
  const { cliente } = retrato;
  const [primeiro, ...resto] = cliente.nome.split(" ");
  const expira = new Date(agora.getTime() + 24 * 60 * 60 * 1000);

  return {
    items: retrato.itens.map((i) => ({
      id: String(i.id),
      title: i.n,
      quantity: i.q,
      unit_price: Number(i.p.toFixed(2)),
      currency_id: "BRL",
    })),
    payer: {
      name: primeiro,
      surname: resto.join(" "),
      email: cliente.email,
      identification: { type: "CPF", number: cliente.cpf },
      phone: { area_code: cliente.telefone.slice(0, 2), number: cliente.telefone.slice(2) },
      address: {
        zip_code: cliente.cep,
        street_name: cliente.logradouro,
        street_number: cliente.numero,
      },
    },
    // Retirada no ateliê: não há envio a declarar.
    ...(retrato.frete.retirada
      ? {}
      : {
          shipments: {
            mode: "not_specified",
            cost: Number(retrato.frete.valor.toFixed(2)),
          },
        }),
    payment_methods: { installments: PARCELAS_MAXIMAS },
    back_urls: {
      success: `${urlDoSite}/checkout/sucesso`,
      pending: `${urlDoSite}/checkout/pendente`,
      failure: `${urlDoSite}/checkout/falha`,
    },
    auto_return: "approved",
    notification_url: `${urlDoSite}/api/webhooks/mercadopago`,
    external_reference: retrato.ref,
    statement_descriptor: "KAMBADA",
    // Preço de ontem não pode ser cobrado amanhã: a preferência vale 24 h.
    expires: true,
    expiration_date_to: expira.toISOString(),
    metadata: { pedido: JSON.stringify(retrato) },
  };
}

export async function criarPreferencia(
  retrato: RetratoPedido,
  urlDoSite: string,
): Promise<Preferencia> {
  return chamar<Preferencia>("/checkout/preferences", {
    method: "POST",
    body: JSON.stringify(montarPreferencia(retrato, urlDoSite)),
    // Evita preferência duplicada se o cliente clicar duas vezes.
    headers: { "X-Idempotency-Key": retrato.ref },
  });
}

export type Pagamento = {
  id: number;
  status: string; // approved | pending | in_process | rejected | refunded | cancelled ...
  status_detail?: string;
  external_reference?: string;
  transaction_amount?: number;
  shipping_amount?: number;
  date_approved?: string;
  payment_type_id?: string;
  installments?: number;
  metadata?: Record<string, unknown>;
  fee_details?: { type: string; amount: number }[];
  date_created?: string;
  payer?: { email?: string };
};

export async function buscarPagamento(id: string | number): Promise<Pagamento> {
  return chamar<Pagamento>(`/v1/payments/${encodeURIComponent(String(id))}`);
}

/**
 * Pagamentos de um pedido nosso, do mais recente para o mais antigo. Um
 * pedido pode ter mais de um (cartão recusado e depois Pix aprovado).
 */
export async function buscarPagamentosDoPedido(ref: string): Promise<Pagamento[]> {
  const r = await chamar<{ results?: Pagamento[] }>(
    `/v1/payments/search?external_reference=${encodeURIComponent(ref)}&sort=date_created&criteria=desc&limit=10`,
  );
  return r.results ?? [];
}

/** Total do retrato (itens + frete) em centavos — o que o pagamento tem de valer. */
export function totalDoRetratoEmCentavos(retrato: RetratoPedido): number {
  const itens = retrato.itens.reduce((s, i) => s + emCentavos(i.p) * i.q, 0);
  return itens + emCentavos(retrato.frete.valor);
}
