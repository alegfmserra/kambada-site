/**
 * Relatório mensal por cupom — para o influenciador dono do cupom.
 *
 * Pedido do Alexandre (11/10/2026): transparência com quem divulga. No dia 1,
 * junto com o resumo das 00:01, sai um e-mail para a loja com UM relatório por
 * parceiro referente ao mês anterior: cada pedido com data, número, valor das
 * peças com desconto e a comissão (percentual do cupom). Sem nome nem e-mail
 * de cliente — o influenciador não precisa (LGPD). A loja encaminha o PDF/CSV
 * ao parceiro e paga por Pix. O acumulado também fica em /admin/cupons.
 */

import { escaparHtml } from "../email/confirmacao";
import { emailConfigurado, emailDaLoja, enviarEmail, type Anexo } from "../email/enviar";
import { listarRegistros, type RegistroPedido } from "../pedidos/registro";
import { dataLocal } from "./resumoDiario";

const FUSO = "America/Fortaleza";
const real = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

/** "AAAA-MM" do mês anterior ao instante dado (fuso de São Luís). */
export function mesAnterior(agora = new Date()): string {
  const [a, m] = dataLocal(agora).split("-").map(Number);
  const d = new Date(Date.UTC(a, m - 2, 1)); // mês anterior
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export type LinhaRelatorio = { data: string; ref: string; pecas: number; desconto: number; baseComissao: number; comissao: number };
export type RelatorioParceiro = {
  parceiro: string;
  cupom: string;
  percentualCupom: number;
  comissaoPercentual: number;
  mes: string;
  linhas: LinhaRelatorio[];
  totalBase: number;
  totalComissao: number;
};

export function relatoriosDoMes(registros: RegistroPedido[], mes: string): RelatorioParceiro[] {
  const porChave = new Map<string, RelatorioParceiro>();
  for (const r of registros) {
    if (!r.cupom?.parceiro || !r.cupom.comissaoPercentual) continue;
    if (!dataLocal(new Date(r.criadoEm)).startsWith(mes)) continue;
    const chave = `${r.cupom.parceiro}|${r.cupom.codigo}`;
    const rel =
      porChave.get(chave) ??
      {
        parceiro: r.cupom.parceiro,
        cupom: r.cupom.codigo,
        percentualCupom: r.cupom.percentual,
        comissaoPercentual: r.cupom.comissaoPercentual,
        mes,
        linhas: [],
        totalBase: 0,
        totalComissao: 0,
      };
    const pecas = r.itens.reduce((s, i) => s + i.preco * i.quantidade, 0);
    const base = Math.round((pecas - r.cupom.desconto) * 100) / 100;
    const comissao = Math.round(base * r.cupom.comissaoPercentual) / 100;
    rel.linhas.push({
      data: new Date(r.criadoEm).toLocaleDateString("pt-BR", { timeZone: FUSO }),
      ref: r.ref,
      pecas: Math.round(pecas * 100) / 100,
      desconto: r.cupom.desconto,
      baseComissao: base,
      comissao,
    });
    rel.totalBase = Math.round((rel.totalBase + base) * 100) / 100;
    rel.totalComissao = Math.round((rel.totalComissao + comissao) * 100) / 100;
    porChave.set(chave, rel);
  }
  return [...porChave.values()].sort((a, b) => a.parceiro.localeCompare(b.parceiro, "pt-BR"));
}

const mesPorExtenso = (mes: string) => {
  const [a, m] = mes.split("-").map(Number);
  return new Date(Date.UTC(a, m - 1, 1)).toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
};

export function csvDoRelatorio(rel: RelatorioParceiro): string {
  const linhas = [["data", "pedido", "pecas", "desconto_cupom", "base_comissao", "comissao"].join(";")];
  for (const l of rel.linhas) linhas.push([l.data, l.ref, l.pecas, l.desconto, l.baseComissao, l.comissao].join(";"));
  linhas.push(["TOTAL", "", "", "", rel.totalBase, rel.totalComissao].join(";"));
  return "﻿" + linhas.join("\r\n");
}

/** HTML de um relatório, pronto para a loja encaminhar ao parceiro. */
export function htmlDoRelatorio(rel: RelatorioParceiro): string {
  const linhas = rel.linhas
    .map(
      (l) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #e3ddd0">${l.data}</td><td style="padding:6px 8px;border-bottom:1px solid #e3ddd0;font-family:monospace">${escaparHtml(l.ref)}</td><td style="padding:6px 8px;border-bottom:1px solid #e3ddd0;text-align:right">${real(l.pecas)}</td><td style="padding:6px 8px;border-bottom:1px solid #e3ddd0;text-align:right">−${real(l.desconto)}</td><td style="padding:6px 8px;border-bottom:1px solid #e3ddd0;text-align:right">${real(l.baseComissao)}</td><td style="padding:6px 8px;border-bottom:1px solid #e3ddd0;text-align:right"><strong>${real(l.comissao)}</strong></td></tr>`,
    )
    .join("");
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f3eee4;font-family:Arial,Helvetica,sans-serif;color:#201E1F">
  <div style="max-width:720px;margin:0 auto;padding:24px">
    <div style="background:#201E1F;border-radius:16px 16px 0 0;padding:18px 24px"><p style="margin:0;color:#FFD72B;font-size:20px;font-weight:bold">Kambada · Relatório do cupom ${escaparHtml(rel.cupom)}</p><p style="margin:4px 0 0;color:#fff">${escaparHtml(rel.parceiro)} · ${mesPorExtenso(rel.mes)}</p></div>
    <div style="height:6px;background:#FFD72B"></div>
    <div style="background:#fff;border-radius:0 0 16px 16px;padding:22px 24px">
      <p style="margin:0 0 14px;font-size:15px">Oi, ${escaparHtml(rel.parceiro)}! Este é o fechamento do seu cupom <strong>${escaparHtml(rel.cupom)}</strong> (${rel.percentualCupom}% de desconto para quem compra, ${rel.comissaoPercentual}% de comissão para você sobre o valor das peças já com desconto).</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead><tr style="text-align:left;font-size:12px;color:#5e6266"><th style="padding:6px 8px">Data</th><th style="padding:6px 8px">Pedido</th><th style="padding:6px 8px;text-align:right">Peças</th><th style="padding:6px 8px;text-align:right">Desconto</th><th style="padding:6px 8px;text-align:right">Base</th><th style="padding:6px 8px;text-align:right">Comissão</th></tr></thead>
        <tbody>${linhas || `<tr><td colspan="6" style="padding:10px 8px;color:#5e6266">Nenhuma venda com este cupom no mês.</td></tr>`}</tbody>
        <tfoot><tr><td colspan="4" style="padding:10px 8px;font-weight:bold">Total do mês · ${rel.linhas.length} pedido(s)</td><td style="padding:10px 8px;text-align:right;font-weight:bold">${real(rel.totalBase)}</td><td style="padding:10px 8px;text-align:right;font-weight:bold;font-size:16px">${real(rel.totalComissao)}</td></tr></tfoot>
      </table>
      <p style="margin:16px 0 0;font-size:12px;color:#5e6266">Os números do pedido são referências internas da loja; nenhum dado de cliente é compartilhado. Pagamento da comissão por Pix, combinado diretamente com a Kambada.</p>
    </div>
    <p style="margin:16px 0 0;font-size:12px;color:#5e6266;text-align:center">Kambada — moda e arte que celebram o Maranhão · São Luís, MA</p>
  </div></body></html>`;
}

export type RelatorioEnviado = { mes: string; parceiros: number; enviado: boolean; motivo?: string };

/**
 * Manda à loja, num e-mail só, os relatórios do mês anterior (um bloco HTML +
 * um CSV por parceiro), para ela encaminhar a cada influenciador.
 */
export async function enviarRelatoriosMensais(mes: string): Promise<RelatorioEnviado> {
  if (!emailConfigurado()) return { mes, parceiros: 0, enviado: false, motivo: "e-mail não configurado" };
  const registros = await listarRegistros(5000);
  const relatorios = relatoriosDoMes(registros, mes);
  const anexos: Anexo[] = relatorios.map((rel) => ({
    nome: `cupom_${rel.cupom}_${mes}.csv`,
    conteudo: Buffer.from(csvDoRelatorio(rel), "utf8"),
    tipo: "text/csv",
  }));
  for (const rel of relatorios) {
    anexos.push({ nome: `relatorio_${rel.cupom}_${mes}.html`, conteudo: Buffer.from(htmlDoRelatorio(rel), "utf8"), tipo: "text/html" });
  }
  const resumo = relatorios.length
    ? relatorios.map((r) => `• ${r.parceiro} (${r.cupom}): ${r.linhas.length} pedido(s) · base ${real(r.totalBase)} · comissão a pagar ${real(r.totalComissao)}`)
    : ["Nenhuma venda com cupom de parceiro no mês."];
  const texto = [
    `RELATÓRIOS DE CUPOM — ${mesPorExtenso(mes)}`,
    "",
    ...resumo,
    "",
    "Em anexo, um relatório por parceiro (HTML para encaminhar ao influenciador e CSV para a planilha). Nenhum dado de cliente vai neles.",
  ].join("\n");
  await enviarEmail({
    para: emailDaLoja(),
    assunto: `🤝 Relatórios de cupom — ${mesPorExtenso(mes)} · ${relatorios.length} parceiro(s)`,
    texto,
    html: `<pre style="font-family:Arial,sans-serif;white-space:pre-wrap;font-size:14px;color:#201E1F">${escaparHtml(texto)}</pre>`,
    anexos,
  });
  return { mes, parceiros: relatorios.length, enviado: true };
}
