/**
 * Validação da assinatura das notificações do Mercado Pago.
 *
 * Conforme a documentação oficial (validação de notificações, 2024):
 *
 *   x-signature: "ts=<timestamp>,v1=<hmac hex>"
 *   manifest:    "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
 *   assinatura:  HMAC-SHA256(segredo, manifest), em hexadecimal
 *
 * `data.id` vem da query string e, se for alfanumérico, entra em minúsculas.
 * Par ausente na notificação sai do manifest.
 *
 * IMPORTANTE: isto é defesa em profundidade, não a defesa principal. O site
 * NUNCA cria pedido com base no corpo da notificação — sempre reconsulta o
 * pagamento na API do Mercado Pago com o nosso token. Uma notificação forjada,
 * mesmo que passasse por aqui, apontaria para um pagamento que não existe na
 * nossa conta.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export function lerCabecalhoAssinatura(cabecalho: string | null): { ts?: string; v1?: string } {
  const partes: Record<string, string> = {};
  for (const par of (cabecalho ?? "").split(",")) {
    const [chave, ...valor] = par.split("=");
    if (chave && valor.length) partes[chave.trim()] = valor.join("=").trim();
  }
  return { ts: partes.ts, v1: partes.v1 };
}

export function montarManifest(dataId?: string | null, requestId?: string | null, ts?: string): string {
  let manifest = "";
  if (dataId) manifest += `id:${/[a-z]/i.test(dataId) ? dataId.toLowerCase() : dataId};`;
  if (requestId) manifest += `request-id:${requestId};`;
  if (ts) manifest += `ts:${ts};`;
  return manifest;
}

export function assinaturaValida(params: {
  cabecalho: string | null;
  requestId: string | null;
  dataId: string | null;
  segredo: string;
}): boolean {
  const { ts, v1 } = lerCabecalhoAssinatura(params.cabecalho);
  if (!ts || !v1) return false;

  const esperado = createHmac("sha256", params.segredo)
    .update(montarManifest(params.dataId, params.requestId, ts))
    .digest("hex");

  const a = Buffer.from(esperado, "utf8");
  const b = Buffer.from(v1, "utf8");
  // Comparação em tempo constante: comparar com === vaza o segredo aos poucos.
  return a.length === b.length && timingSafeEqual(a, b);
}
