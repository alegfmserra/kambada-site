/**
 * Chamadas autenticadas à API do Melhor Envio para etiqueta (carrinho, compra,
 * geração, impressão, rastreio, cancelamento e saldo). A cotação continua em
 * melhorEnvio.ts.
 */

import { base, ErroFrete, userAgent } from "./melhorEnvio";

/** As mensagens do Melhor Envio vêm em JSON com `message` e `errors`; mostra o essencial. */
export function traduzirErro(texto: string): string {
  try {
    const d = JSON.parse(texto) as { message?: string; error?: string; errors?: Record<string, string[]> };
    const detalhes = d.errors ? Object.values(d.errors).flat().slice(0, 3).join(" · ") : "";
    return [d.message ?? d.error, detalhes].filter(Boolean).join(" — ").slice(0, 300) || texto.slice(0, 200);
  } catch {
    return texto.slice(0, 200);
  }
}

export async function chamarMe<T>(caminho: string, corpo?: unknown): Promise<T> {
  const token = process.env.MELHORENVIO_TOKEN;
  if (!token) throw new ErroFrete("Melhor Envio não configurado", 503);
  const r = await fetch(`${base()}/api/v2/me${caminho}`, {
    method: corpo === undefined ? "GET" : "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": userAgent(),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  const texto = await r.text();
  if (!r.ok) throw new ErroFrete(`Melhor Envio respondeu ${r.status}: ${traduzirErro(texto)}`, r.status, texto.slice(0, 500));
  return (texto ? JSON.parse(texto) : {}) as T;
}

/** Saldo disponível na carteira, em reais. */
export async function saldoDaCarteira(): Promise<number> {
  const s = await chamarMe<{ balance?: number }>("/balance");
  return Number(s.balance ?? 0);
}

/** Cancela uma etiqueta ainda não postada — o valor volta para a carteira. */
export async function cancelarEtiquetaMe(idMe: string, motivo: string): Promise<void> {
  await chamarMe("/shipment/cancel", { order: { id: idMe, reason_id: "2", description: motivo.slice(0, 255) } });
}
