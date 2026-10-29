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

// ---------------------------------------------------------------------------
// Produção, cancelamento (21/10/2026)
// ---------------------------------------------------------------------------

export type Mensagem = { assunto: string; texto: string; html: (cidLogo?: string) => string };

const primeiroNome = (r: RegistroPedido) => r.cliente.nome.split(" ")[0];
const reais = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const botao = (href: string, rotulo: string) =>
  `<p style="margin:0 0 22px"><a href="${href}" style="display:inline-block;background:#FFD72B;color:#201E1F;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:999px">${rotulo}</a></p>`;

/** Ao cliente: a peça dele começou a ser feita (peças sob encomenda). */
export function mensagemProducao(r: RegistroPedido, personalizado: boolean, urlDoSite: string): Mensagem {
  const e = escaparHtml;
  const link = `${urlDoSite}/pedido?ref=${encodeURIComponent(r.ref)}`;
  const regra = `Com a produção iniciada${personalizado ? " (peça personalizada)" : ""}, o pedido não pode mais ser cancelado.`;
  return {
    assunto: `Começamos a produzir o seu pedido ${r.ref} 🎨`,
    texto: [
      `Olá, ${primeiroNome(r)}!`,
      "",
      `A produção do seu pedido ${r.ref} começou hoje. Cada peça é feita à mão no nosso ateliê em São Luís.`,
      regra,
      "",
      `Acompanhe aqui: ${link}`,
      "",
      "Avisamos de novo quando estiver pronto para envio ou retirada.",
      "Kambada — São Luís, MA",
    ].join("\n"),
    html: (cid) =>
      moldura(
        `<p style="margin:0 0 12px">Olá, ${e(primeiroNome(r))}!</p>
<p style="margin:0 0 16px;font-size:20px;font-weight:bold">A produção da sua peça começou. 🎨</p>
<p style="margin:0 0 12px">Pedido <strong>${e(r.ref)}</strong>. Cada peça é feita à mão no nosso ateliê em São Luís.</p>
<p style="margin:0 0 18px;color:#6b6460">${e(regra)}</p>
${botao(link, "Acompanhar o pedido")}
<p style="margin:0">Avisamos de novo quando estiver pronto para envio ou retirada.</p>`,
        cid,
      ),
  };
}

/** À loja: o cliente pediu para cancelar pela página do pedido. */
export function mensagemCancelamentoSolicitadoLoja(r: RegistroPedido, motivo: string, urlDoSite: string): Mensagem {
  const e = escaparHtml;
  const admin = `${urlDoSite}/admin/pedidos`;
  return {
    assunto: `🛑 Pedido ${r.ref}: cliente pediu cancelamento`,
    texto: [
      `${r.cliente.nome} (${r.cliente.email}) pediu para cancelar o pedido ${r.ref} (${reais(r.total)}).`,
      motivo ? `Motivo: ${motivo}` : "Motivo: não informado.",
      "",
      `Nada foi estornado ainda. Para aprovar: ${admin} → "Cancelar e estornar".`,
      "Se já postou ou a peça é personalizada em produção, responda ao cliente explicando.",
    ].join("\n"),
    html: (cid) =>
      moldura(
        `<p style="margin:0 0 12px;font-size:20px;font-weight:bold;color:#c0392b">Pedido de cancelamento</p>
<p style="margin:0 0 8px"><strong>${e(r.cliente.nome)}</strong> (${e(r.cliente.email)}) pediu para cancelar o pedido <strong>${e(r.ref)}</strong> — ${reais(r.total)}.</p>
<p style="margin:0 0 16px">Motivo: ${motivo ? e(motivo) : "não informado"}</p>
<p style="margin:0 0 16px"><strong>Nada foi estornado ainda.</strong> Para aprovar, use "Cancelar e estornar" na área de controle.</p>
${botao(admin, "Abrir a área de controle")}`,
        cid,
      ),
  };
}

/** Ao cliente: recebemos o pedido de cancelamento. */
export function mensagemCancelamentoSolicitadoCliente(r: RegistroPedido): Mensagem {
  const e = escaparHtml;
  return {
    assunto: `Recebemos seu pedido de cancelamento — ${r.ref}`,
    texto: [
      `Olá, ${primeiroNome(r)}!`,
      "",
      `Recebemos o seu pedido para cancelar a compra ${r.ref}. Vamos conferir e, em até 1 dia útil, confirmamos por e-mail o cancelamento e a devolução de ${reais(r.total)}.`,
      "",
      "Qualquer dúvida, é só responder este e-mail.",
      "Kambada — São Luís, MA",
    ].join("\n"),
    html: (cid) =>
      moldura(
        `<p style="margin:0 0 12px">Olá, ${e(primeiroNome(r))}!</p>
<p style="margin:0 0 16px;font-size:20px;font-weight:bold">Recebemos seu pedido de cancelamento.</p>
<p style="margin:0 0 16px">Pedido <strong>${e(r.ref)}</strong>. Vamos conferir e, em até 1 dia útil, confirmamos por e-mail o cancelamento e a devolução de <strong>${reais(r.total)}</strong>.</p>
<p style="margin:0">Qualquer dúvida, é só responder este e-mail.</p>`,
        cid,
      ),
  };
}

/** Ao cliente: pedido cancelado e pagamento devolvido. */
export function mensagemPedidoCancelado(r: RegistroPedido, tipoPagamento?: string, retido = 0): Mensagem {
  const devolvido = Math.round((r.total - retido) * 100) / 100;
  const retencao = retido > 0 ? `Retivemos ${reais(retido)} referentes ao desenvolvimento da arte, já feito antes do cancelamento.` : "";
  const e = escaparHtml;
  const prazo =
    tipoPagamento === "credit_card"
      ? "No cartão de crédito, o valor aparece como crédito na fatura — pode levar até 2 faturas, conforme o banco."
      : "No Pix, o valor volta para a conta de origem, normalmente no mesmo dia.";
  return {
    assunto: `Pedido ${r.ref} cancelado — devolução de ${reais(devolvido)}`,
    texto: [
      `Olá, ${primeiroNome(r)}!`,
      "",
      `O seu pedido ${r.ref} foi cancelado e devolvemos ${reais(devolvido)} pelo Mercado Pago.`,
      retencao,
      prazo,
      "",
      "Esperamos ver você de novo por aqui. Qualquer dúvida, é só responder este e-mail.",
      "Kambada — São Luís, MA",
    ].join("\n"),
    html: (cid) =>
      moldura(
        `<p style="margin:0 0 12px">Olá, ${e(primeiroNome(r))}!</p>
<p style="margin:0 0 16px;font-size:20px;font-weight:bold">Pedido cancelado e valor devolvido.</p>
<p style="margin:0 0 8px">Pedido <strong>${e(r.ref)}</strong>: devolvemos <strong>${reais(devolvido)}</strong> pelo Mercado Pago.</p>
${retencao ? `<p style="margin:0 0 8px">${e(retencao)}</p>` : ""}
<p style="margin:0 0 16px;color:#6b6460">${e(prazo)}</p>
<p style="margin:0">Esperamos ver você de novo por aqui. Qualquer dúvida, é só responder este e-mail.</p>`,
        cid,
      ),
  };
}

/**
 * Ao cliente: pedido entregue ou retirado — agradece e convida para avaliar.
 * `linkAvaliacao` (convite assinado para avaliar as peças) vira o botão
 * principal; a pesquisa do site fica como link secundário.
 */
export function mensagemConcluido(
  r: RegistroPedido,
  tipo: "entregue" | "retirado",
  urlDoSite: string,
  linkAvaliacao?: string,
): Mensagem {
  const e = escaparHtml;
  const pesquisa = `${urlDoSite}/?avaliar=1`;
  const abertura = tipo === "retirado" ? "Obrigado por buscar seu pedido no ateliê!" : "Seu pedido chegou!";
  if (linkAvaliacao) {
    return {
      assunto: tipo === "retirado" ? `Obrigado, ${primeiroNome(r)}! Pedido ${r.ref} retirado 💛` : `Seu pedido ${r.ref} chegou! 🎉`,
      texto: [
        `Olá, ${primeiroNome(r)}!`,
        "",
        `${abertura} Pedido ${r.ref}.`,
        "Que nota você dá para as suas peças? Leva um minuto e ajuda quem ainda está em dúvida:",
        linkAvaliacao,
        "",
        `E se quiser contar como foi comprar no site: ${pesquisa}`,
        "",
        "Se algo não saiu como esperado, é só responder este e-mail.",
        "Bora vestir o Maranhão!",
        "Kambada — São Luís, MA",
      ].join("\n"),
      html: (cid) =>
        moldura(
          `<p style="margin:0 0 12px">Olá, ${e(primeiroNome(r))}!</p>
<p style="margin:0 0 16px;font-size:20px;font-weight:bold">${e(abertura)} ${tipo === "retirado" ? "💛" : "🎉"}</p>
<p style="margin:0 0 16px">Pedido <strong>${e(r.ref)}</strong>. Que nota você dá para as suas peças? Leva um minuto e ajuda quem ainda está em dúvida.</p>
${botao(linkAvaliacao, "Avaliar minhas peças")}
<p style="margin:0 0 16px;font-size:14px">E se quiser contar como foi comprar no site: <a href="${e(pesquisa)}">responder a pesquisa</a>.</p>
<p style="margin:0">Se algo não saiu como esperado, é só responder este e-mail. Bora vestir o Maranhão!</p>`,
          cid,
        ),
    };
  }
  return {
    assunto: tipo === "retirado" ? `Obrigado, ${primeiroNome(r)}! Pedido ${r.ref} retirado 💛` : `Seu pedido ${r.ref} chegou! 🎉`,
    texto: [
      `Olá, ${primeiroNome(r)}!`,
      "",
      `${abertura} Pedido ${r.ref}.`,
      "Conta pra gente como foi? São perguntas rápidas e ajudam muito a Kambada a melhorar:",
      pesquisa,
      "",
      "Se algo não saiu como esperado, é só responder este e-mail.",
      "Bora vestir o Maranhão!",
      "Kambada — São Luís, MA",
    ].join("\n"),
    html: (cid) =>
      moldura(
        `<p style="margin:0 0 12px">Olá, ${e(primeiroNome(r))}!</p>
<p style="margin:0 0 16px;font-size:20px;font-weight:bold">${e(abertura)} ${tipo === "retirado" ? "💛" : "🎉"}</p>
<p style="margin:0 0 16px">Pedido <strong>${e(r.ref)}</strong>. Conta pra gente como foi? São perguntas rápidas e ajudam muito a Kambada a melhorar.</p>
${botao(pesquisa, "Avaliar minha experiência")}
<p style="margin:0">Se algo não saiu como esperado, é só responder este e-mail. Bora vestir o Maranhão!</p>`,
        cid,
      ),
  };
}

/** Ao cliente: pedido com retirada está pronto no ateliê. */
export function mensagemProntoParaRetirada(r: RegistroPedido, endereco: string, linkWhatsApp: string): Mensagem {
  const e = escaparHtml;
  return {
    assunto: `Seu pedido ${r.ref} está pronto para retirada! 🛍️`,
    texto: [
      `Olá, ${primeiroNome(r)}!`,
      "",
      `Seu pedido ${r.ref} está pronto e esperando por você no nosso ateliê:`,
      endereco,
      "",
      `Combine o dia e o horário pelo WhatsApp antes de vir: ${linkWhatsApp}`,
      "",
      "Kambada — São Luís, MA",
    ].join("\n"),
    html: (cid) =>
      moldura(
        `<p style="margin:0 0 12px">Olá, ${e(primeiroNome(r))}!</p>
<p style="margin:0 0 16px;font-size:20px;font-weight:bold">Seu pedido está pronto para retirada. 🛍️</p>
<p style="margin:0 0 6px">Pedido <strong>${e(r.ref)}</strong>, no nosso ateliê:</p>
<p style="margin:0 0 18px;font-weight:bold">${e(endereco)}</p>
${botao(linkWhatsApp, "Combinar horário no WhatsApp")}
<p style="margin:0;color:#6b6460">Combine o dia e o horário antes de vir, para alguém estar lá para te receber.</p>`,
        cid,
      ),
  };
}
