/**
 * E-mails do pós-venda — conteúdo puro, sem envio (testável).
 *
 * 1. "Seu pedido foi postado" ao CLIENTE, com o código de rastreio, disparado
 *    pela área de controle quando a loja posta o pacote.
 * 2. "Pagamento estornado/contestado" à LOJA, quando o Mercado Pago avisa que
 *    um pagamento já transformado em pedido foi devolvido, contestado ou
 *    cancelado. A loja decide o resto no Bling (pedido, nota, estoque).
 */

import type { RegistroPedido } from "../pedidos/registro";
import { escaparHtml } from "./confirmacao";

export const TRANSPORTADORAS = ["Correios", "Jadlog", "Loggi", "J&T Express", "Azul Cargo"] as const;

/** Código de rastreio: letras e números, sem espaço (Correios: AA123456789BR). */
export const FORMATO_RASTREIO = /^[A-Z0-9]{8,30}$/;

export function normalizarRastreio(codigo: string): string {
  return codigo.replace(/\s+/g, "").toUpperCase();
}

/** Página de rastreio que aceita o código de qualquer uma das transportadoras usadas. */
export function linkDeRastreio(codigo: string): string {
  return `https://www.melhorrastreio.com.br/rastreio/${encodeURIComponent(codigo)}`;
}

function moldura(conteudo: string, cidLogo?: string): string {
  const topo = cidLogo
    ? `<img src="cid:${cidLogo}" alt="Kambada" width="180" style="display:block;width:180px;height:auto;border:0">`
    : `<p style="margin:0;color:#FFD72B;font-size:24px;font-weight:bold">Kambada</p>`;
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f4f1ea;font-family:Arial,Helvetica,sans-serif;color:#201E1F">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f1ea;padding:24px 0"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#201E1F;padding:20px 24px;border-bottom:5px solid #FFD72B">${topo}</td></tr>
<tr><td style="padding:24px;font-size:15px;line-height:1.6">${conteudo}</td></tr>
<tr><td style="padding:16px 24px;background:#f4f1ea;font-size:12px;color:#6b6460">Kambada — São Luís, MA</td></tr>
</table></td></tr></table></body></html>`;
}

// ---------------------------------------------------------------------------
// Postado (cliente)
// ---------------------------------------------------------------------------

export type DadosEnvio = { registro: RegistroPedido; codigo: string; transportadora: string; urlDoSite: string };

export function assuntoEnvio(r: RegistroPedido): string {
  return `Seu pedido ${r.ref} foi postado! 📦`;
}

export function textoEnvio(d: DadosEnvio): string {
  const { registro: r } = d;
  return [
    `Olá, ${r.cliente.nome.split(" ")[0]}!`,
    "",
    `Seu pedido ${r.ref} já está a caminho. Postamos pela ${d.transportadora}.`,
    `Código de rastreio: ${d.codigo}`,
    `Acompanhe aqui: ${linkDeRastreio(d.codigo)}`,
    "",
    `Prazo estimado depois da postagem: ${r.entrega.prazoDias} dias úteis (${r.entrega.descricao}).`,
    "",
    "Qualquer dúvida, é só responder este e-mail.",
    "Bora vestir o Maranhão!",
    "",
    "Kambada — São Luís, MA",
  ].join("\n");
}

export function htmlEnvio(d: DadosEnvio, cidLogo?: string): string {
  const { registro: r } = d;
  const e = escaparHtml;
  const link = linkDeRastreio(d.codigo);
  return moldura(
    `<p style="margin:0 0 12px">Olá, ${e(r.cliente.nome.split(" ")[0])}!</p>
<p style="margin:0 0 16px;font-size:20px;font-weight:bold">Seu pedido já está a caminho. 📦</p>
<p style="margin:0 0 6px">Pedido <strong>${e(r.ref)}</strong>, postado pela <strong>${e(d.transportadora)}</strong>.</p>
<p style="margin:0 0 18px">Código de rastreio: <strong style="font-family:monospace;font-size:16px">${e(d.codigo)}</strong></p>
<p style="margin:0 0 22px"><a href="${link}" style="display:inline-block;background:#FFD72B;color:#201E1F;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:999px">Acompanhar a entrega</a></p>
<p style="margin:0 0 6px;color:#6b6460">Prazo estimado depois da postagem: ${r.entrega.prazoDias} dias úteis (${e(r.entrega.descricao)}).</p>
<p style="margin:18px 0 0">Qualquer dúvida, é só responder este e-mail. Bora vestir o Maranhão!</p>`,
    cidLogo,
  );
}

// ---------------------------------------------------------------------------
// Estorno (loja)
// ---------------------------------------------------------------------------

const ROTULO_ESTORNO: Record<string, string> = {
  refunded: "DEVOLVIDO (reembolso)",
  charged_back: "CONTESTADO no cartão (chargeback)",
  cancelled: "CANCELADO",
};

export function rotuloEstorno(status: string): string {
  return ROTULO_ESTORNO[status] ?? status;
}

export function assuntoEstorno(r: RegistroPedido, status: string): string {
  return `⚠️ Pedido ${r.ref}: pagamento ${rotuloEstorno(status)}`;
}

export function textoEstorno(r: RegistroPedido, status: string): string {
  return [
    `O Mercado Pago avisou que o pagamento do pedido ${r.ref} foi ${rotuloEstorno(status)}.`,
    "",
    `Cliente: ${r.cliente.nome} (${r.cliente.email})`,
    `Total: ${r.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
    `Pedido no Bling: ${r.bling.idPedido}`,
    "",
    "O site NÃO mexeu em nada. Para fazer agora:",
    "1. Se ainda não postou: segurar o pacote.",
    "2. No Bling: cancelar o pedido e devolver o estoque das peças.",
    "3. Nota fiscal: se já foi emitida, cancelar ou emitir a de devolução (ver com o Glauco).",
    "4. Contestação (chargeback): responder no Mercado Pago com o comprovante de postagem e a nota.",
  ].join("\n");
}

export function htmlEstorno(r: RegistroPedido, status: string, cidLogo?: string): string {
  const e = escaparHtml;
  return moldura(
    `<p style="margin:0 0 12px;font-size:20px;font-weight:bold;color:#c0392b">Pagamento ${e(rotuloEstorno(status))}</p>
<p style="margin:0 0 12px">O Mercado Pago avisou que o pagamento do pedido <strong>${e(r.ref)}</strong> mudou de situação.</p>
<p style="margin:0 0 4px">Cliente: ${e(r.cliente.nome)} (${e(r.cliente.email)})</p>
<p style="margin:0 0 4px">Total: ${r.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</p>
<p style="margin:0 0 16px">Pedido no Bling: ${r.bling.idPedido}</p>
<p style="margin:0 0 6px"><strong>O site não mexeu em nada.</strong> Para fazer agora:</p>
<ol style="margin:0;padding-left:20px">
<li>Se ainda não postou: segurar o pacote.</li>
<li>No Bling: cancelar o pedido e devolver o estoque das peças.</li>
<li>Nota fiscal: se já foi emitida, cancelar ou emitir a de devolução (ver com o Glauco).</li>
<li>Contestação: responder no Mercado Pago com o comprovante de postagem e a nota.</li>
</ol>`,
    cidLogo,
  );
}
