/**
 * O e-mail "Pedido confirmado" — conteúdo puro, sem envio (testável).
 *
 * Vai para o cliente assim que o pagamento é aprovado e o pedido entra no
 * Bling. Leva o número do pedido, as peças, a entrega, o total e o caminho para
 * acompanhar. Na retirada, leva o endereço do ateliê — o pagamento já foi
 * confirmado, então é o momento certo de revelá-lo.
 */

import type { RegistroPedido } from "../pedidos/registro";

const real = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** Texto do cliente entra no HTML escapado: nome não vira código. */
export function escaparHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export type DadosEmail = {
  registro: RegistroPedido;
  urlDoSite: string;
  /** Só na retirada — e só depois do pagamento aprovado. */
  enderecoRetirada?: string;
  linkWhatsApp: string;
};

export function assuntoConfirmacao(r: RegistroPedido): string {
  return `Pedido confirmado — ${r.ref} · Kambada`;
}

export function textoConfirmacao(d: DadosEmail): string {
  const { registro: r } = d;
  const primeiro = r.cliente.nome.split(" ")[0];
  return [
    `Oi, ${primeiro}! Seu pagamento foi aprovado e o pedido já está com a gente.`,
    "",
    `Número do pedido: ${r.ref}`,
    "",
    ...r.itens.map((i) => `• ${i.quantidade}× ${i.nome} — ${real(i.preco * i.quantidade)}`),
    r.entrega.retirada
      ? "Retirada no ateliê — grátis"
      : `Entrega: ${r.entrega.descricao} — ${r.entrega.valor > 0 ? real(r.entrega.valor) : "grátis"}`,
    `Total: ${real(r.total)}`,
    "",
    r.entrega.retirada && d.enderecoRetirada
      ? `Retire no ateliê: ${d.enderecoRetirada}. Combine o dia e o horário pelo WhatsApp antes de vir: ${d.linkWhatsApp}`
      : `Avisamos por aqui quando a encomenda for postada. Prazo da transportadora: até ${r.entrega.prazoDias} dias úteis após a postagem.`,
    "",
    `Acompanhe o pedido: ${d.urlDoSite}/pedido?ref=${encodeURIComponent(r.ref)}`,
    `Trocas e devoluções: ${d.urlDoSite}/trocas-e-devolucoes`,
    "",
    "Obrigado por vestir a cultura do Maranhão com a gente.",
    "Kambada — São Luís, MA",
  ].join("\n");
}

export function htmlConfirmacao(d: DadosEmail): string {
  const { registro: r } = d;
  const e = escaparHtml;
  const primeiro = e(r.cliente.nome.split(" ")[0]);
  const linhas = r.itens
    .map(
      (i) =>
        `<tr><td style="padding:6px 0">${i.quantidade}× ${e(i.nome)}</td><td style="padding:6px 0;text-align:right;white-space:nowrap">${real(
          i.preco * i.quantidade,
        )}</td></tr>`,
    )
    .join("");
  const entrega = r.entrega.retirada
    ? "Retirada no ateliê"
    : e(r.entrega.descricao);
  const valorEntrega = r.entrega.retirada || r.entrega.valor === 0 ? "Grátis" : real(r.entrega.valor);
  const acompanhar = `${d.urlDoSite}/pedido?ref=${encodeURIComponent(r.ref)}`;

  const blocoEntrega =
    r.entrega.retirada && d.enderecoRetirada
      ? `<div style="margin:24px 0;padding:16px;border:2px solid #FFD72B;border-radius:12px">
           <p style="margin:0 0 6px;font-weight:bold">Retirada no ateliê</p>
           <p style="margin:0 0 8px">${e(d.enderecoRetirada)}</p>
           <p style="margin:0">Combine o dia e o horário antes de vir:
             <a href="${e(d.linkWhatsApp)}" style="color:#201E1F;font-weight:bold">chamar no WhatsApp</a></p>
         </div>`
      : `<p style="margin:24px 0">Avisamos quando a encomenda for postada. Prazo da transportadora:
           até ${r.entrega.prazoDias} dias úteis após a postagem.</p>`;

  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#f3eee4;font-family:Arial,Helvetica,sans-serif;color:#201E1F">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#201E1F;border-radius:16px 16px 0 0;padding:20px 24px">
      <p style="margin:0;color:#FFD72B;font-size:22px;font-weight:bold">Kambada</p>
    </div>
    <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:24px">
      <h1 style="margin:0 0 8px;font-size:22px">Pedido confirmado!</h1>
      <p style="margin:0 0 16px">Oi, ${primeiro}! Seu pagamento foi aprovado e o pedido já está com a gente.</p>
      <p style="margin:0 0 16px;padding:10px 14px;background:#FFD72B;border-radius:10px;font-weight:bold">
        Número do pedido: ${e(r.ref)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:15px">
        ${linhas}
        <tr><td style="padding:6px 0;color:#5e6266">${entrega}</td><td style="padding:6px 0;text-align:right;color:#5e6266">${valorEntrega}</td></tr>
        <tr><td style="padding:10px 0;border-top:1px solid #ddd;font-weight:bold">Total</td>
            <td style="padding:10px 0;border-top:1px solid #ddd;text-align:right;font-weight:bold">${real(r.total)}</td></tr>
      </table>
      ${blocoEntrega}
      <p style="margin:0 0 20px"><a href="${e(acompanhar)}"
        style="display:inline-block;background:#201E1F;color:#FFD72B;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:999px">
        Acompanhar meu pedido</a></p>
      <p style="margin:0;font-size:13px;color:#5e6266">
        Precisa de ajuda, troca ou devolução? <a href="${e(d.urlDoSite)}/trocas-e-devolucoes" style="color:#201E1F">Veja como funciona</a>
        ou <a href="${e(d.linkWhatsApp)}" style="color:#201E1F">fale no WhatsApp</a>.</p>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:#5e6266;text-align:center">
      Kambada — moda e arte que celebram o Maranhão · São Luís, MA</p>
  </div>
</body></html>`;
}
