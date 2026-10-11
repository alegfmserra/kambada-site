/**
 * Resumo do dia + backup, por e-mail à loja.
 *
 * Pedido do Alexandre (11/10/2026): saber todo dia o que foi vendido pelo
 * site, e ter os dados guardados fora do servidor. Vai um e-mail por dia para
 * a caixa da loja com (1) as vendas do dia em tabela, (2) um CSV do dia e
 * (3) um backup JSON de TODOS os pedidos e cupons do site. O Gmail passa a ser
 * o cofre: se a Hostinger perder a pasta ~/.kambada, está tudo lá.
 * Tokens (Bling) NÃO vão no backup — são segredos.
 */

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { arquivoTokens } from "../bling/tokens";
import { listarCupons } from "../cupons/cupons";
import { escaparHtml } from "../email/confirmacao";
import { emailConfigurado, emailDaLoja, enviarEmail } from "../email/enviar";
import { listarRegistros, type RegistroPedido } from "../pedidos/registro";

const FUSO = "America/Fortaleza";

/** "AAAA-MM-DD" no fuso de São Luís. */
export function dataLocal(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
export function horaLocal(d = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: FUSO, hour: "numeric", hourCycle: "h23" }).format(d));
}

/** O dia que o resumo deve cobrir: a partir das 20h é o dia de hoje; antes, ontem. */
export function diaDoResumo(agora = new Date()): string {
  if (horaLocal(agora) >= 20) return dataLocal(agora);
  return dataLocal(new Date(agora.getTime() - 24 * 60 * 60 * 1000));
}

function arquivoEstado(): string {
  return join(dirname(arquivoTokens()), "manutencao-estado.json");
}
type Estado = { ultimoResumo?: string };
async function lerEstado(): Promise<Estado> {
  try {
    return JSON.parse(await readFile(arquivoEstado(), "utf8")) as Estado;
  } catch {
    return {};
  }
}
async function gravarEstado(e: Estado): Promise<void> {
  const c = arquivoEstado();
  await mkdir(dirname(c), { recursive: true });
  await writeFile(`${c}.tmp`, JSON.stringify(e), "utf8");
  await rename(`${c}.tmp`, c);
}

const real = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const csvCampo = (v: unknown) => {
  const s = String(v ?? "");
  return /[";\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function pedidosDoDia(registros: RegistroPedido[], dia: string): RegistroPedido[] {
  return registros.filter((r) => dataLocal(new Date(r.criadoEm)) === dia);
}

export function csvDoDia(pedidos: RegistroPedido[]): string {
  const linhas = [["pedido", "hora", "cliente", "email", "itens", "entrega", "frete", "cupom", "desconto", "total", "pagamento", "parcelas", "taxa_mp", "pedido_bling", "estoque", "email_cliente", "nota"].join(";")];
  for (const r of pedidos) {
    linhas.push(
      [
        r.ref,
        new Date(r.criadoEm).toLocaleTimeString("pt-BR", { timeZone: FUSO, hour: "2-digit", minute: "2-digit" }),
        r.cliente.nome,
        r.cliente.email,
        r.itens.map((i) => `${i.quantidade}x ${i.nome}`).join(" | "),
        r.entrega.retirada ? "retirada no ateliê" : r.entrega.descricao,
        r.entrega.retirada ? 0 : r.entrega.valor,
        r.cupom?.codigo ?? "",
        r.cupom?.desconto ?? 0,
        r.total,
        r.pagamento.tipo ?? "",
        r.pagamento.parcelas ?? "",
        r.pagamento.taxa ?? "",
        r.bling.idPedido,
        r.estoque?.feitoEm ? "ok" : r.estoque?.erro ? "FALHOU" : "pendente",
        r.email?.feitoEm ? "ok" : r.email?.erro ? "FALHOU" : "pendente",
        r.nfe?.feitoEm ? "ok" : r.nfe?.erro ? "FALHOU" : "pendente",
      ]
        .map(csvCampo)
        .join(";"),
    );
  }
  return "﻿" + linhas.join("\r\n");
}

export type ResumoEnviado = { dia: string; pedidos: number; total: number; enviado: boolean; motivo?: string };

/**
 * Manda o resumo do dia se ainda não foi mandado (ou se `forcar`).
 */
export async function enviarResumoDiario(opcoes: { forcar?: boolean; agora?: Date } = {}): Promise<ResumoEnviado> {
  const dia = diaDoResumo(opcoes.agora);
  const estado = await lerEstado();
  if (!opcoes.forcar && estado.ultimoResumo === dia) return { dia, pedidos: 0, total: 0, enviado: false, motivo: "já enviado" };
  if (!emailConfigurado()) return { dia, pedidos: 0, total: 0, enviado: false, motivo: "e-mail não configurado" };

  const [registros, cupons] = await Promise.all([listarRegistros(5000), listarCupons()]);
  const doDia = pedidosDoDia(registros, dia).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
  const total = doDia.reduce((s, r) => s + r.total, 0);
  const falhas = doDia.filter((r) => r.estoque?.erro || r.email?.erro || r.nfe?.erro || r.emailLoja?.erro);
  const [a, m, d] = dia.split("-");
  const diaBr = `${d}/${m}/${a}`;

  const linhasTexto = doDia.length
    ? doDia.map((r) => `• ${r.ref} · ${r.cliente.nome} · ${r.itens.map((i) => `${i.quantidade}× ${i.nome}`).join(", ")} · ${r.entrega.retirada ? "retirada" : r.entrega.descricao} · ${real(r.total)}`)
    : ["Nenhum pedido pago pelo site neste dia."];
  const texto = [
    `RESUMO DO DIA — ${diaBr}`,
    `${doDia.length} pedido(s) · ${real(total)}`,
    "",
    ...linhasTexto,
    "",
    falhas.length ? `⚠️ ${falhas.length} pedido(s) com etapa falhada — abrir /admin/pedidos.` : "Todas as etapas (estoque, e-mails, nota) concluídas.",
    "",
    `Anexos: pedidos do dia (CSV) e backup completo do site (${registros.length} pedidos, ${cupons.length} cupons).`,
  ].join("\n");

  const linhasHtml = doDia.length
    ? doDia
        .map(
          (r) =>
            `<tr><td style="padding:6px 8px;border-bottom:1px solid #e3ddd0;font-family:monospace">${escaparHtml(r.ref)}</td><td style="padding:6px 8px;border-bottom:1px solid #e3ddd0">${escaparHtml(r.cliente.nome)}</td><td style="padding:6px 8px;border-bottom:1px solid #e3ddd0">${escaparHtml(r.itens.map((i) => `${i.quantidade}× ${i.nome}`).join(", "))}</td><td style="padding:6px 8px;border-bottom:1px solid #e3ddd0">${escaparHtml(r.entrega.retirada ? "retirada" : r.entrega.descricao)}</td><td style="padding:6px 8px;border-bottom:1px solid #e3ddd0;text-align:right;white-space:nowrap">${real(r.total)}</td></tr>`,
        )
        .join("")
    : `<tr><td colspan="5" style="padding:10px 8px;color:#5e6266">Nenhum pedido pago pelo site neste dia.</td></tr>`;
  const html = `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f3eee4;font-family:Arial,Helvetica,sans-serif;color:#201E1F">
  <div style="max-width:720px;margin:0 auto;padding:24px">
    <div style="background:#201E1F;border-radius:16px 16px 0 0;padding:18px 24px"><p style="margin:0;color:#FFD72B;font-size:20px;font-weight:bold">Kambada · Resumo do dia ${diaBr}</p></div>
    <div style="height:6px;background:#FFD72B"></div>
    <div style="background:#fff;border-radius:0 0 16px 16px;padding:22px 24px">
      <p style="margin:0 0 14px;font-size:18px"><strong>${doDia.length}</strong> pedido(s) · <strong>${real(total)}</strong></p>
      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead><tr style="text-align:left;font-size:12px;color:#5e6266"><th style="padding:6px 8px">Pedido</th><th style="padding:6px 8px">Cliente</th><th style="padding:6px 8px">Peças</th><th style="padding:6px 8px">Entrega</th><th style="padding:6px 8px;text-align:right">Total</th></tr></thead>
        <tbody>${linhasHtml}</tbody>
      </table>
      <p style="margin:16px 0 0;font-size:14px">${falhas.length ? `⚠️ <strong>${falhas.length}</strong> pedido(s) com etapa falhada — abrir o controle de pedidos.` : "✅ Todas as etapas (estoque, e-mails, nota) concluídas."}</p>
      <p style="margin:14px 0 0;font-size:12px;color:#5e6266">Anexos: pedidos do dia em CSV e backup completo do site (${registros.length} pedidos, ${cupons.length} cupons). Guarde este e-mail: ele é a cópia de segurança.</p>
    </div>
  </div></body></html>`;

  const backup = JSON.stringify({ geradoEm: new Date().toISOString(), registros, cupons }, null, 1);
  await enviarEmail({
    para: emailDaLoja(),
    assunto: `📊 Resumo do dia ${diaBr} · ${doDia.length} pedido(s) · ${real(total)}`,
    texto,
    html,
    anexos: [
      { nome: `pedidos_${dia}.csv`, conteudo: Buffer.from(csvDoDia(doDia), "utf8"), tipo: "text/csv" },
      { nome: `backup_kambada_${dia}.json`, conteudo: Buffer.from(backup, "utf8"), tipo: "application/json" },
    ],
  });
  await gravarEstado({ ...estado, ultimoResumo: dia });
  return { dia, pedidos: doDia.length, total, enviado: true };
}
