import { ANALYTICS, SITE } from "../site";
import type { Etapa, RegistroPedido } from "../pedidos/registro";

/**
 * Compra no Google Analytics 4 pelo SERVIDOR (Measurement Protocol, 06/11/2026).
 *
 * Por quê: o evento `purchase` do navegador só dispara se o cliente VOLTAR à página de
 * "pedido confirmado". Quem paga por Pix e fecha a aba nunca volta, e a primeira venda
 * real (04/11) ficou com receita R$ 0 no Analytics. Aqui o site avisa o Google quando o
 * pagamento é aprovado (webhook do Mercado Pago ou página de sucesso, o que vier antes).
 *
 * Duplicidade: o GA4 junta compras com o mesmo `transaction_id` do mesmo `client_id`; o
 * navegador manda o mesmo número do pedido, então a compra não conta em dobro. O
 * `client_id` e a sessão vêm dos cookies do próprio Google que o checkout lê no navegador
 * (nada de dado pessoal: nome, e-mail, CPF e endereço NUNCA vão ao Google).
 *
 * Só em produção e só com a chave GA4_API_SECRET (variável da Hostinger). Pedido só do
 * produto de teste não entra.
 */
const ENDERECO = "https://www.google-analytics.com/mp/collect";

export type GaDoNavegador = { c: string; s?: string };

/** Valida o que o navegador mandou (o corpo é livre): `c` = client_id "1234567890.1234567890"; `s` = sessão numérica. */
export function lerGaDoNavegador(bruto: unknown): GaDoNavegador | undefined {
  if (!bruto || typeof bruto !== "object") return undefined;
  const o = bruto as Record<string, unknown>;
  const c = typeof o.c === "string" && /^\d{5,12}\.\d{8,12}$/.test(o.c) ? o.c : undefined;
  if (!c) return undefined;
  const s = typeof o.s === "string" && /^\d{8,12}$/.test(o.s) ? o.s : undefined;
  return { c, ...(s ? { s } : {}) };
}

export function corpoDaCompra(r: RegistroPedido, ga?: GaDoNavegador): Record<string, unknown> {
  return {
    // Sem cookie do Google (bloqueador, outro aparelho): um número próprio por pedido; a compra entra como "direta".
    client_id: ga?.c ?? `${Math.abs(hash(r.ref))}.${Date.parse(r.criadoEm) / 1000 | 0}`,
    events: [
      {
        name: "purchase",
        params: {
          transaction_id: r.ref,
          currency: "BRL",
          value: r.total,
          shipping: r.entrega.valor,
          ...(r.cupom ? { coupon: r.cupom.codigo } : {}),
          items: r.itens.map((i) => ({ item_id: String(i.id), item_name: i.nome, price: i.preco, quantity: i.quantidade })),
          ...(ga?.s ? { session_id: Number(ga.s) } : {}),
          engagement_time_msec: 100,
        },
      },
    ],
  };
}

function hash(t: string): number {
  let h = 0;
  for (let i = 0; i < t.length; i++) h = (h * 31 + t.charCodeAt(i)) | 0;
  return h;
}

/**
 * Confere a configuração SEM gravar nada no Analytics: diz se a chave está na Hostinger e manda um
 * pedido de modelo ao endereço de validação do Google (/debug/mp/collect), que só devolve avisos.
 * Lista vazia de avisos = formato aceito. (O Google não confere se a chave é a certa: isso só se vê na
 * 1ª compra real no relatório "Compras de e-commerce".)
 */
export async function validarGA4(): Promise<{ chaveNaHostinger: boolean; producao: boolean; avisosDoGoogle?: unknown }> {
  const segredo = process.env.GA4_API_SECRET;
  const producao = process.env.NEXT_PUBLIC_SITE_URL === SITE.url;
  if (!segredo) return { chaveNaHostinger: false, producao };
  const modelo: RegistroPedido = {
    ref: "KMB-00000000-VALIDA",
    pagamentoId: 0,
    criadoEm: new Date().toISOString(),
    cliente: { nome: "", email: "" },
    itens: [{ id: 1, nome: "Modelo de validação", quantidade: 1, preco: 1 }],
    entrega: { descricao: "", valor: 0, retirada: true, prazoDias: 0 },
    total: 1,
    pagamento: {},
    bling: { idPedido: 0 },
  };
  const url = `https://www.google-analytics.com/debug/mp/collect?measurement_id=${ANALYTICS.ga4}&api_secret=${encodeURIComponent(segredo)}`;
  const r = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corpoDaCompra(modelo)), signal: AbortSignal.timeout(8000) });
  const j = (await r.json().catch(() => ({}))) as { validationMessages?: unknown };
  return { chaveNaHostinger: true, producao, avisosDoGoogle: j.validationMessages ?? [] };
}

/** Devolve a etapa a gravar no registro, ou `null` quando não é para enviar (sem chave, fora de produção). */
export async function enviarCompraGA4(r: RegistroPedido, ga?: GaDoNavegador): Promise<Etapa | null> {
  const segredo = process.env.GA4_API_SECRET;
  if (!segredo || process.env.NEXT_PUBLIC_SITE_URL !== SITE.url) return null;
  try {
    const url = `${ENDERECO}?measurement_id=${ANALYTICS.ga4}&api_secret=${encodeURIComponent(segredo)}`;
    const resposta = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(corpoDaCompra(r, ga)), signal: AbortSignal.timeout(6000) });
    // O Measurement Protocol responde 2xx mesmo para corpo inválido; a validação fina é pelo endereço /debug/mp/collect.
    if (resposta.status >= 200 && resposta.status < 300) return { feitoEm: new Date().toISOString() };
    return { erro: `GA4 respondeu ${resposta.status}` };
  } catch (e) {
    return { erro: e instanceof Error ? e.message.slice(0, 200) : String(e).slice(0, 200) };
  }
}
