/**
 * Cotação de frete no Melhor Envio.
 *
 * Contrato conferido na documentação oficial em 08/10/2026
 * (docs.melhorenvio.com.br → "Cálculo de fretes por produtos"):
 *
 *   POST {base}/api/v2/me/shipment/calculate
 *   Accept / Content-Type: application/json
 *   Authorization: Bearer <token>
 *   User-Agent: "Aplicação (email de contato)" — OBRIGATÓRIO
 *
 * Por que o Melhor Envio e não o Bling: a API v3 do Bling não tem endpoint de
 * cotação. O bloco "Logísticas" cadastra transportadora, etiqueta e remessa —
 * conferido na referência oficial em 08/10/2026. O Bling segue fazendo a parte
 * de DEPOIS da venda; a cotação no carrinho é daqui.
 *
 * O token mora só na variável de ambiente MELHORENVIO_TOKEN, no painel da
 * Hostinger. Nunca no código, nunca no navegador.
 */

import { CEP_ORIGEM } from "./regras";
import type { Embalagem } from "./embalagens";

const BASES = {
  producao: "https://melhorenvio.com.br",
  sandbox: "https://sandbox.melhorenvio.com.br",
} as const;

export type VolumeCotacao = {
  id: string;
  embalagem: Embalagem;
  /** Valor unitário em reais — vira valor segurado. */
  valorUnitario: number;
  quantidade: number;
};

export type OpcaoFrete = {
  id: number;
  servico: string;
  transportadora: string;
  preco: number;
  prazoDias: number;
};

/** A resposta bruta, só com o que usamos. `error` aparece em serviço indisponível. */
type ServicoMelhorEnvio = {
  id: number;
  name: string;
  price?: string;
  custom_price?: string;
  delivery_time?: number;
  custom_delivery_time?: number;
  company?: { name?: string };
  error?: string;
};

export class ErroFrete extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly detalhe?: string,
  ) {
    super(message);
    this.name = "ErroFrete";
  }
}

export function freteConfigurado(): boolean {
  return Boolean(process.env.MELHORENVIO_TOKEN);
}

function base(): string {
  return process.env.MELHORENVIO_AMBIENTE === "sandbox" ? BASES.sandbox : BASES.producao;
}

/**
 * O User-Agent é exigido pela API com um e-mail de contato técnico. Fica em
 * variável própria para que esse e-mail seja escolha do dono da conta.
 */
function userAgent(): string {
  const contato = process.env.MELHORENVIO_CONTATO?.trim();
  return contato ? `Site Kambada (${contato})` : "Site Kambada (somoskambada.com.br)";
}

/**
 * O nome que o cliente lê: "Correios PAC", "LATAM Cargo éFácil". Quando o
 * serviço já traz o nome da transportadora ("Loggi Ponto", da Loggi), não
 * repete — sem isto a tela mostrava "Loggi Loggi Ponto".
 */
export function nomeDaEntrega(transportadora: string, servico: string): string {
  const t = transportadora.trim();
  const s = servico.trim();
  if (!t) return s;
  return s.toLowerCase().startsWith(t.toLowerCase()) ? s : `${t} ${s}`;
}

/** Corpo da requisição — separado para poder ser testado sem rede. */
export function montarCorpoCotacao(cepDestino: string, volumes: VolumeCotacao[]) {
  return {
    from: { postal_code: CEP_ORIGEM },
    to: { postal_code: cepDestino },
    products: volumes.map((v) => ({
      id: v.id,
      width: v.embalagem.largura,
      height: v.embalagem.altura,
      length: v.embalagem.comprimento,
      weight: v.embalagem.peso,
      insurance_value: Number(v.valorUnitario.toFixed(2)),
      quantity: v.quantidade,
    })),
    options: { receipt: false, own_hand: false },
  };
}

/**
 * Converte a resposta em opções utilizáveis.
 *
 * Usa `custom_price` e `custom_delivery_time` — a documentação manda usar
 * esses, que já trazem desconto e regra da conta. Serviço com `error`
 * (indisponível para o trecho) ou sem preço é descartado.
 */
export function interpretarCotacao(servicos: ServicoMelhorEnvio[]): OpcaoFrete[] {
  return servicos
    .filter((s) => !s.error)
    .map((s) => {
      const preco = Number.parseFloat(s.custom_price ?? s.price ?? "");
      const prazo = s.custom_delivery_time ?? s.delivery_time;
      return {
        id: s.id,
        servico: s.name,
        transportadora: s.company?.name ?? "",
        preco,
        prazoDias: typeof prazo === "number" ? prazo : NaN,
      };
    })
    .filter((o) => Number.isFinite(o.preco) && o.preco > 0 && Number.isFinite(o.prazoDias))
    .sort((a, b) => a.preco - b.preco || a.prazoDias - b.prazoDias);
}

export async function cotarFrete(
  cepDestino: string,
  volumes: VolumeCotacao[],
): Promise<OpcaoFrete[]> {
  const token = process.env.MELHORENVIO_TOKEN;
  if (!token) throw new ErroFrete("Cotação de frete não configurada", 503);

  const resposta = await fetch(`${base()}/api/v2/me/shipment/calculate`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": userAgent(),
    },
    body: JSON.stringify(montarCorpoCotacao(cepDestino, volumes)),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });

  if (!resposta.ok) {
    const texto = (await resposta.text()).slice(0, 400);
    throw new ErroFrete(`Melhor Envio respondeu ${resposta.status}`, resposta.status, texto);
  }

  const dados = (await resposta.json()) as ServicoMelhorEnvio[] | ServicoMelhorEnvio;
  return interpretarCotacao(Array.isArray(dados) ? dados : [dados]);
}
