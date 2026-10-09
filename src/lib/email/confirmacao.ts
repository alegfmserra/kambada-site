/**
 * Os e-mails de cada venda — conteúdo puro, sem envio (testável).
 *
 * 1. "Pedido confirmado" ao CLIENTE: logo da Kambada, número do pedido, peças,
 *    entrega, forma de pagamento, total e o caminho para acompanhar. Na
 *    retirada, leva o endereço do ateliê — o pagamento já foi confirmado,
 *    então é o momento certo de revelá-lo.
 * 2. "Novo pedido pago" à LOJA (somoskambada@gmail.com): tudo para separar,
 *    postar e dar baixa — inclusive contato e endereço do cliente, que não
 *    ficam guardados no site (LGPD) mas vão no aviso interno da loja.
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

/** Forma de pagamento em palavras do cliente (tipos do Mercado Pago). */
export function formaDePagamento(r: RegistroPedido): string {
  const { tipo, parcelas } = r.pagamento;
  switch (tipo) {
    case "bank_transfer":
      return "Pix";
    case "credit_card":
      return parcelas && parcelas > 1 ? `Cartão de crédito em ${parcelas}x` : "Cartão de crédito à vista";
    case "debit_card":
      return "Cartão de débito";
    case "ticket":
      return "Boleto";
    case "account_money":
      return "Saldo Mercado Pago";
    default:
      return "Mercado Pago";
  }
}

const dataDoPedido = (iso: string) =>
  new Date(iso).toLocaleString("pt-BR", {
    timeZone: "America/Fortaleza",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export type DadosEmail = {
  registro: RegistroPedido;
  urlDoSite: string;
  /** Só na retirada — e só depois do pagamento aprovado. */
  enderecoRetirada?: string;
  linkWhatsApp: string;
  /** cid da logo anexada ao e-mail; sem ela, o cabeçalho sai em texto. */
  cidLogo?: string;
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
    `Data: ${dataDoPedido(r.criadoEm)}`,
    `Pagamento: ${formaDePagamento(r)}`,
    "",
    ...r.itens.map((i) => `• ${i.quantidade}× ${i.nome} — ${real(i.preco * i.quantidade)}`),
    ...(r.cupom ? [`Cupom ${r.cupom.codigo} (${r.cupom.percentual}%): −${real(r.cupom.desconto)}`] : []),
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

function cabecalho(cidLogo?: string): string {
  return cidLogo
    ? `<img src="cid:${cidLogo}" alt="Kambada" width="180" style="display:block;width:180px;height:auto;border:0">`
    : `<p style="margin:0;color:#FFD72B;font-size:24px;font-weight:bold">Kambada</p>`;
}

function linhaTabela(rotulo: string, valor: string, destaque = false): string {
  const peso = destaque ? "font-weight:bold;" : "";
  const borda = destaque ? "border-top:1px solid #e3ddd0;" : "";
  return `<tr><td style="padding:7px 0;${borda}${peso}">${rotulo}</td><td style="padding:7px 0;text-align:right;white-space:nowrap;${borda}${peso}">${valor}</td></tr>`;
}

function linhaDesconto(r: RegistroPedido, comParceiro = false): string {
  if (!r.cupom) return "";
  const parceiro = comParceiro && r.cupom.parceiro ? ` · parceiro ${escaparHtml(r.cupom.parceiro)}` : "";
  return linhaTabela(
    `<strong>Cupom ${escaparHtml(r.cupom.codigo)}</strong> (${r.cupom.percentual}%)${parceiro}`,
    `<strong>−${real(r.cupom.desconto)}</strong>`,
  );
}

export function htmlConfirmacao(d: DadosEmail): string {
  const { registro: r } = d;
  const e = escaparHtml;
  const primeiro = e(r.cliente.nome.split(" ")[0]);
  const itens = r.itens.map((i) => linhaTabela(`${i.quantidade}× ${e(i.nome)}`, real(i.preco * i.quantidade))).join("");
  const entrega = r.entrega.retirada ? "Retirada no ateliê" : e(r.entrega.descricao);
  const valorEntrega = r.entrega.retirada || r.entrega.valor === 0 ? "Grátis" : real(r.entrega.valor);
  const acompanhar = `${d.urlDoSite}/pedido?ref=${encodeURIComponent(r.ref)}`;

  const blocoEntrega =
    r.entrega.retirada && d.enderecoRetirada
      ? `<div style="margin:22px 0;padding:16px;border:2px solid #FFD72B;border-radius:12px;background:#fffdf3">
           <p style="margin:0 0 6px;font-weight:bold">📍 Retirada no ateliê</p>
           <p style="margin:0 0 8px">${e(d.enderecoRetirada)}</p>
           <p style="margin:0">Combine o dia e o horário antes de vir:
             <a href="${e(d.linkWhatsApp)}" style="color:#201E1F;font-weight:bold">chamar no WhatsApp</a></p>
         </div>`
      : `<div style="margin:22px 0;padding:16px;border-radius:12px;background:#f6f2ea">
           <p style="margin:0 0 6px;font-weight:bold">📦 Entrega</p>
           <p style="margin:0">Avisamos quando a encomenda for postada. Prazo da transportadora:
           até ${r.entrega.prazoDias} dias úteis após a postagem.</p>
         </div>`;

  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#f3eee4;font-family:Arial,Helvetica,sans-serif;color:#201E1F">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#201E1F;border-radius:16px 16px 0 0;padding:22px 24px">
      ${cabecalho(d.cidLogo)}
    </div>
    <div style="height:6px;background:#FFD72B"></div>
    <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:26px 24px">
      <h1 style="margin:0 0 8px;font-size:24px">Pedido confirmado! 🦀</h1>
      <p style="margin:0 0 18px;font-size:15px">Oi, ${primeiro}! Seu pagamento foi aprovado e o pedido já está com a gente.</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 18px;background:#FFD72B;border-radius:12px">
        <tr><td style="padding:12px 14px"><span style="font-size:12px">Número do pedido</span><br><strong style="font-size:18px">${e(r.ref)}</strong></td>
            <td style="padding:12px 14px;text-align:right"><span style="font-size:12px">Pagamento</span><br><strong>${e(formaDePagamento(r))}</strong></td></tr>
      </table>
      <p style="margin:0 0 6px;font-size:12px;color:#5e6266">Feito em ${dataDoPedido(r.criadoEm)}</p>
      <table style="width:100%;border-collapse:collapse;font-size:15px">
        ${itens}
        ${linhaDesconto(r)}
        ${linhaTabela(`<span style="color:#5e6266">${entrega}</span>`, `<span style="color:#5e6266">${valorEntrega}</span>`)}
        ${linhaTabela("Total", real(r.total), true)}
      </table>
      ${blocoEntrega}
      <p style="margin:0 0 22px;text-align:center"><a href="${e(acompanhar)}"
        style="display:inline-block;background:#201E1F;color:#FFD72B;text-decoration:none;font-weight:bold;padding:13px 26px;border-radius:999px">
        Acompanhar meu pedido</a></p>
      <p style="margin:0;font-size:13px;color:#5e6266">
        Precisa de ajuda, troca ou devolução? <a href="${e(d.urlDoSite)}/trocas-e-devolucoes" style="color:#201E1F">Veja como funciona</a>
        ou <a href="${e(d.linkWhatsApp)}" style="color:#201E1F">fale no WhatsApp</a>.</p>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:#5e6266;text-align:center">
      Kambada — moda e arte que celebram o Maranhão · São Luís, MA<br>
      @somos.kambada · somoskambada.com.br</p>
  </div>
</body></html>`;
}

// ---------------------------------------------------------------------------
// Nota fiscal — ao cliente, com cópia oculta à loja
// ---------------------------------------------------------------------------

export type DadosNota = {
  registro: RegistroPedido;
  nota: {
    numero: string;
    serie?: number;
    chaveAcesso?: string;
    /** Link público do DANFE no Bling — vai no e-mail mesmo com o PDF anexado. */
    linkDanfe?: string;
  };
  /** O PDF (DANFE) e o XML foram anexados? Sem eles, o e-mail leva só o link. */
  anexou: { pdf: boolean; xml: boolean };
  urlDoSite: string;
  linkWhatsApp: string;
  cidLogo?: string;
};

export function assuntoNota(r: RegistroPedido, numero: string): string {
  return `Nota fiscal do seu pedido ${r.ref} — NF-e nº ${numero} · Kambada`;
}

/** Chave de acesso em blocos de 4, como no DANFE — fácil de conferir. */
const chaveLegivel = (chave: string) => chave.replace(/\D/g, "").replace(/(\d{4})(?=\d)/g, "$1 ");

function oQueVaiAnexo(a: DadosNota["anexou"]): string {
  if (a.pdf && a.xml) return "A nota vai anexada a este e-mail em PDF (DANFE) e em XML.";
  if (a.pdf) return "A nota vai anexada a este e-mail em PDF (DANFE).";
  if (a.xml) return "A nota vai anexada a este e-mail em XML.";
  return "Você pode abrir e baixar a nota pelo link abaixo.";
}

export function textoNota(d: DadosNota): string {
  const { registro: r, nota: n } = d;
  const primeiro = r.cliente.nome.split(" ")[0];
  return [
    `Oi, ${primeiro}! A nota fiscal do seu pedido ${r.ref} foi emitida.`,
    "",
    `NF-e nº ${n.numero}${n.serie !== undefined ? ` · série ${n.serie}` : ""}`,
    `Valor: ${real(r.total)}`,
    ...(n.chaveAcesso ? [`Chave de acesso: ${chaveLegivel(n.chaveAcesso)}`] : []),
    "",
    oQueVaiAnexo(d.anexou),
    ...(n.linkDanfe ? [`Ver a nota: ${n.linkDanfe}`] : []),
    "Para conferir na SEFAZ: https://www.nfe.fazenda.gov.br/portal/consultaRecaptcha.aspx",
    "",
    `Acompanhe o pedido: ${d.urlDoSite}/pedido?ref=${encodeURIComponent(r.ref)}`,
    "",
    "Obrigado por vestir a cultura do Maranhão com a gente.",
    "Kambada — São Luís, MA",
  ].join("\n");
}

export function htmlNota(d: DadosNota): string {
  const { registro: r, nota: n } = d;
  const e = escaparHtml;
  const primeiro = e(r.cliente.nome.split(" ")[0]);
  const acompanhar = `${d.urlDoSite}/pedido?ref=${encodeURIComponent(r.ref)}`;
  const botaoNota = n.linkDanfe
    ? `<p style="margin:0 0 14px;text-align:center"><a href="${e(n.linkDanfe)}"
        style="display:inline-block;background:#201E1F;color:#FFD72B;text-decoration:none;font-weight:bold;padding:13px 26px;border-radius:999px">
        Ver a nota fiscal</a></p>`
    : "";

  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#f3eee4;font-family:Arial,Helvetica,sans-serif;color:#201E1F">
  <div style="max-width:560px;margin:0 auto;padding:24px">
    <div style="background:#201E1F;border-radius:16px 16px 0 0;padding:22px 24px">
      ${cabecalho(d.cidLogo)}
    </div>
    <div style="height:6px;background:#FFD72B"></div>
    <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:26px 24px">
      <h1 style="margin:0 0 8px;font-size:24px">Sua nota fiscal chegou 🧾</h1>
      <p style="margin:0 0 18px;font-size:15px">Oi, ${primeiro}! A nota fiscal do seu pedido foi emitida e autorizada pela SEFAZ.</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 18px;background:#FFD72B;border-radius:12px">
        <tr><td style="padding:12px 14px"><span style="font-size:12px">Pedido</span><br><strong style="font-size:18px">${e(r.ref)}</strong></td>
            <td style="padding:12px 14px;text-align:right"><span style="font-size:12px">NF-e</span><br><strong style="font-size:18px">nº ${e(n.numero)}</strong>${
              n.serie !== undefined ? `<br><span style="font-size:12px">série ${n.serie}</span>` : ""
            }</td></tr>
      </table>
      <table style="width:100%;border-collapse:collapse;font-size:15px">
        ${linhaTabela("Pagamento", e(formaDePagamento(r)))}
        ${linhaTabela("Valor da nota", real(r.total), true)}
      </table>
      ${
        n.chaveAcesso
          ? `<div style="margin:18px 0;padding:14px;border-radius:12px;background:#f6f2ea">
           <p style="margin:0 0 4px;font-size:12px;color:#5e6266">Chave de acesso</p>
           <p style="margin:0;font-family:'Courier New',monospace;font-size:13px;word-break:break-all">${e(chaveLegivel(n.chaveAcesso))}</p>
         </div>`
          : ""
      }
      <p style="margin:18px 0 18px;font-size:15px">📎 ${e(oQueVaiAnexo(d.anexou))} Guarde-a: ela é a garantia da sua compra.</p>
      ${botaoNota}
      <p style="margin:0 0 22px;text-align:center"><a href="${e(acompanhar)}" style="color:#201E1F;font-weight:bold">Acompanhar meu pedido</a></p>
      <p style="margin:0;font-size:13px;color:#5e6266">
        Algum dado da nota está errado? <a href="${e(d.linkWhatsApp)}" style="color:#201E1F">Fale com a gente no WhatsApp</a>
        e corrigimos.</p>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:#5e6266;text-align:center">
      Somos Kambada LTDA · São Luís, MA<br>
      @somos.kambada · somoskambada.com.br</p>
  </div>
</body></html>`;
}

// ---------------------------------------------------------------------------
// Aviso interno à loja
// ---------------------------------------------------------------------------

export type DadosLoja = {
  registro: RegistroPedido;
  /** Contato e endereço — só neste aviso interno; não ficam guardados no site. */
  cliente: {
    telefone: string;
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  urlDoSite: string;
  cidLogo?: string;
};

export function assuntoLoja(r: RegistroPedido): string {
  const entrega = r.entrega.retirada ? "RETIRADA" : r.entrega.descricao;
  return `🟡 Novo pedido pago · ${r.ref} · ${real(r.total)} · ${entrega}`;
}

export function textoLoja(d: DadosLoja): string {
  const { registro: r, cliente: c } = d;
  return [
    `NOVO PEDIDO PAGO — ${r.ref}`,
    `${dataDoPedido(r.criadoEm)} · ${formaDePagamento(r)} · Total ${real(r.total)}`,
    "",
    "PEÇAS",
    ...r.itens.map((i) => `• ${i.quantidade}× ${i.nome} — ${real(i.preco * i.quantidade)}`),
    ...(r.cupom
      ? [
          `CUPOM ${r.cupom.codigo} (${r.cupom.percentual}%): −${real(r.cupom.desconto)}${
            r.cupom.parceiro ? ` · parceiro ${r.cupom.parceiro}` : ""
          }`,
        ]
      : []),
    "",
    r.entrega.retirada
      ? "ENTREGA: RETIRADA NO ATELIÊ (sem etiqueta — o cliente combina o horário pelo WhatsApp)"
      : `ENTREGA: ${r.entrega.descricao} — frete ${r.entrega.valor > 0 ? real(r.entrega.valor) : "GRÁTIS (custo da loja)"}`,
    "",
    "CLIENTE",
    r.cliente.nome,
    `${r.cliente.email} · ${c.telefone}`,
    `${c.logradouro}, ${c.numero}${c.complemento ? ` — ${c.complemento}` : ""} · ${c.bairro} · ${c.cidade}/${c.uf} · CEP ${c.cep}`,
    "",
    `Pedido no Bling: https://www.bling.com.br/vendas.php#edit/${r.bling.idPedido}`,
    `Controle: ${d.urlDoSite}/admin/pedidos`,
  ].join("\n");
}

export function htmlLoja(d: DadosLoja): string {
  const { registro: r, cliente: c } = d;
  const e = escaparHtml;
  const itens = r.itens.map((i) => linhaTabela(`${i.quantidade}× ${e(i.nome)}`, real(i.preco * i.quantidade))).join("");
  const entrega = r.entrega.retirada
    ? `<p style="margin:0;font-weight:bold">📍 RETIRADA NO ATELIÊ</p><p style="margin:4px 0 0">Sem etiqueta. O cliente combina o horário pelo WhatsApp.</p>`
    : `<p style="margin:0;font-weight:bold">📦 ${e(r.entrega.descricao)}</p>
       <p style="margin:4px 0 0">Frete ${r.entrega.valor > 0 ? real(r.entrega.valor) : "<strong>GRÁTIS — custo da loja</strong>"} · gerar a etiqueta no Melhor Envio com <strong>este mesmo serviço</strong>.</p>`;

  return `<!doctype html>
<html lang="pt-BR"><body style="margin:0;background:#f3eee4;font-family:Arial,Helvetica,sans-serif;color:#201E1F">
  <div style="max-width:600px;margin:0 auto;padding:24px">
    <div style="background:#201E1F;border-radius:16px 16px 0 0;padding:18px 24px">${cabecalho(d.cidLogo)}</div>
    <div style="height:6px;background:#F5821F"></div>
    <div style="background:#ffffff;border-radius:0 0 16px 16px;padding:24px">
      <h1 style="margin:0 0 4px;font-size:22px">Novo pedido pago</h1>
      <p style="margin:0 0 16px;color:#5e6266">${dataDoPedido(r.criadoEm)} · ${e(formaDePagamento(r))}</p>
      <table style="width:100%;border-collapse:collapse;margin:0 0 16px;background:#FFD72B;border-radius:12px">
        <tr><td style="padding:12px 14px"><span style="font-size:12px">Pedido</span><br><strong style="font-size:18px">${e(r.ref)}</strong></td>
            <td style="padding:12px 14px;text-align:right"><span style="font-size:12px">Total pago</span><br><strong style="font-size:18px">${real(r.total)}</strong></td></tr>
      </table>
      <h2 style="margin:0 0 4px;font-size:15px">Peças</h2>
      <table style="width:100%;border-collapse:collapse;font-size:15px">${itens}${linhaDesconto(r, true)}</table>
      <div style="margin:18px 0;padding:14px;border-radius:12px;background:#f6f2ea">${entrega}</div>
      <h2 style="margin:0 0 4px;font-size:15px">Cliente</h2>
      <p style="margin:0 0 4px"><strong>${e(r.cliente.nome)}</strong></p>
      <p style="margin:0 0 4px">${e(r.cliente.email)} · ${e(c.telefone)}</p>
      <p style="margin:0 0 18px">${e(c.logradouro)}, ${e(c.numero)}${c.complemento ? ` — ${e(c.complemento)}` : ""} · ${e(c.bairro)} · ${e(c.cidade)}/${e(c.uf)} · CEP ${e(c.cep)}</p>
      <p style="margin:0">
        <a href="https://www.bling.com.br/vendas.php#edit/${r.bling.idPedido}" style="display:inline-block;background:#201E1F;color:#FFD72B;text-decoration:none;font-weight:bold;padding:11px 20px;border-radius:999px;margin:0 6px 6px 0">Abrir no Bling</a>
        <a href="${e(d.urlDoSite)}/admin/pedidos" style="display:inline-block;border:2px solid #201E1F;color:#201E1F;text-decoration:none;font-weight:bold;padding:9px 18px;border-radius:999px">Controle de pedidos</a>
      </p>
    </div>
    <p style="margin:14px 0 0;font-size:12px;color:#5e6266;text-align:center">Aviso interno da loja — não encaminhe ao cliente (traz dados pessoais).</p>
  </div>
</body></html>`;
}
