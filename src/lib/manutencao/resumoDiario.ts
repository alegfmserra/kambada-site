/**
 * Resumo do dia + backup, por e-mail à loja.
 *
 * Pedido do Alexandre (11/10/2026): saber todo dia o que foi vendido pelo
 * site, e ter os dados guardados fora do servidor. Às 00:01 (São Luís) vai um
 * e-mail para a caixa da loja com o DIA ANTERIOR fechado: (1) as vendas em
 * tabela, (2) as comissões de cupom por parceiro (5% da venda para o dono do
 * cupom), (3) um CSV do dia e (4) um backup JSON de TODOS os pedidos e cupons.
 * O Gmail passa a ser o cofre: se a Hostinger perder a pasta ~/.kambada, está
 * tudo lá. Tokens (Bling) NÃO vão no backup — são segredos.
 */

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { arquivoTokens } from "../bling/tokens";
import { listarCupons } from "../cupons/cupons";
import { escaparHtml } from "../email/confirmacao";
import { emailConfigurado, emailDaLoja, enviarEmail } from "../email/enviar";
import { listarRegistros, type RegistroPedido } from "../pedidos/registro";
import { liberar, pastaDeDadosPresente, reservar } from "./reserva";

const FUSO = "America/Fortaleza";

/** "AAAA-MM-DD" no fuso de São Luís. */
export function dataLocal(d = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: FUSO, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
}
export function horaLocal(d = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-US", { timeZone: FUSO, hour: "numeric", hourCycle: "h23" }).format(d));
}

/** O resumo cobre sempre o dia anterior (fechado): roda às 00:01 de São Luís. */
export function diaDoResumo(agora = new Date()): string {
  return dataLocal(new Date(agora.getTime() - 24 * 60 * 60 * 1000));
}

/** Milissegundos até a próxima 00:01 em São Luís (UTC−3, sem horário de verão). */
export function msAteProximoResumo(agora = new Date()): number {
  const hoje = dataLocal(agora); // AAAA-MM-DD local
  const alvoHoje = new Date(`${hoje}T00:01:00-03:00`).getTime();
  const alvo = alvoHoje > agora.getTime() ? alvoHoje : alvoHoje + 24 * 60 * 60 * 1000;
  return alvo - agora.getTime();
}

/** Comissões de cupom do dia, por parceiro: 5% do valor das peças com desconto. */
export function comissoesDoDia(pedidos: RegistroPedido[]): { parceiro: string; cupom: string; pedidos: number; vendas: number; comissao: number }[] {
  const porParceiro = new Map<string, { parceiro: string; cupom: string; pedidos: number; vendas: number; comissao: number }>();
  for (const r of pedidos) {
    if (!r.cupom?.parceiro || !r.cupom.comissaoPercentual) continue;
    const chave = `${r.cupom.parceiro}|${r.cupom.codigo}`;
    const atual = porParceiro.get(chave) ?? { parceiro: r.cupom.parceiro, cupom: r.cupom.codigo, pedidos: 0, vendas: 0, comissao: 0 };
    const vendaPecas = r.itens.reduce((s, i) => s + i.preco * i.quantidade, 0) - r.cupom.desconto;
    atual.pedidos += 1;
    atual.vendas += vendaPecas;
    atual.comissao += (vendaPecas * r.cupom.comissaoPercentual) / 100;
    porParceiro.set(chave, atual);
  }
  return [...porParceiro.values()].map((c) => ({ ...c, vendas: Math.round(c.vendas * 100) / 100, comissao: Math.round(c.comissao * 100) / 100 }));
}

/** Prazo de separação prometido no site: passou disso sem postar/retirar, o resumo cobra. */
export const DIAS_UTEIS_PARADO = 3;

/** Dias úteis (seg–sex) inteiros entre duas datas. Feriados não entram — é um alerta, não um prazo legal. */
export function diasUteisEntre(inicio: Date, fim: Date): number {
  let dias = 0;
  const d = new Date(inicio);
  d.setUTCHours(12, 0, 0, 0);
  const limite = new Date(fim);
  limite.setUTCHours(12, 0, 0, 0);
  while (d < limite) {
    d.setUTCDate(d.getUTCDate() + 1);
    const semana = d.getUTCDay();
    if (semana !== 0 && semana !== 6) dias += 1;
  }
  return dias;
}

/** Pagos, sem postagem, retirada, conclusão nem cancelamento, há mais de 3 dias úteis. */
export function pedidosParados(registros: RegistroPedido[], agora = new Date()): RegistroPedido[] {
  return registros.filter(
    (r) =>
      !r.envio &&
      !r.conclusao &&
      !r.estorno &&
      !r.cancelamento?.concluidoEm &&
      diasUteisEntre(new Date(r.criadoEm), agora) > DIAS_UTEIS_PARADO,
  );
}

function arquivoEstado(): string {
  return join(dirname(arquivoTokens()), "manutencao-estado.json");
}
type Estado = { ultimoResumo?: string; ultimoRelatorioMensal?: string };
export async function lerEstadoManutencao(): Promise<Estado> { return lerEstado(); }
export async function gravarEstadoManutencao(e: Estado): Promise<void> { return gravarEstado(e); }
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
  const linhas = [["pedido", "hora", "cliente", "email", "itens", "entrega", "frete", "cupom", "desconto", "parceiro_cupom", "comissao_parceiro", "total", "pagamento", "parcelas", "taxa_mp", "pedido_bling", "estoque", "email_cliente", "nota"].join(";")];
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
        r.cupom?.parceiro ?? "",
        r.cupom?.parceiro && r.cupom.comissaoPercentual
          ? Math.round(((r.itens.reduce((s, i) => s + i.preco * i.quantidade, 0) - r.cupom.desconto) * r.cupom.comissaoPercentual) / 100 * 100) / 100
          : "",
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
  if (!pastaDeDadosPresente()) return { dia, pedidos: 0, total: 0, enviado: false, motivo: "pasta de dados ausente neste processo" };
  // Mais de um processo de pé (20/10/2026): só quem ganhar a reserva manda.
  const reserva = `resumo-${dia}`;
  if (!opcoes.forcar && !(await reservar(reserva))) return { dia, pedidos: 0, total: 0, enviado: false, motivo: "já enviado" };
  try {
    return await montarEEnviar(dia, estado);
  } catch (e) {
    if (!opcoes.forcar) await liberar(reserva).catch(() => undefined);
    throw e;
  }
}

async function montarEEnviar(dia: string, estado: Estado): Promise<ResumoEnviado> {

  const [registros, cupons] = await Promise.all([listarRegistros(5000), listarCupons()]);
  const doDia = pedidosDoDia(registros, dia).sort((a, b) => a.criadoEm.localeCompare(b.criadoEm));
  const total = doDia.reduce((s, r) => s + r.total, 0);
  const falhas = doDia.filter((r) => r.estoque?.erro || r.email?.erro || r.nfe?.erro || r.emailLoja?.erro);
  const comissoes = comissoesDoDia(doDia);
  const parados = pedidosParados(registros);
  const [a, m, d] = dia.split("-");
  const diaBr = `${d}/${m}/${a}`;
  const paradosTexto = parados.length
    ? [`⏳ ${parados.length} pedido(s) pago(s) há mais de ${DIAS_UTEIS_PARADO} dias úteis sem postar nem retirar:`, ...parados.map((r) => `• ${r.ref} · ${r.cliente.nome} · ${r.entrega.retirada ? "retirada" : r.entrega.descricao}${r.producao ? " · em produção" : ""}`)]
    : [];

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
    ...(paradosTexto.length ? ["", ...paradosTexto] : []),
    "",
    "COMISSÕES DE CUPOM DO DIA (a pagar ao dono do cupom)",
    ...(comissoes.length
      ? comissoes.map((c) => `• ${c.parceiro} (${c.cupom}): ${c.pedidos} pedido(s) · vendas ${real(c.vendas)} · comissão ${real(c.comissao)}`)
      : ["Nenhuma venda com cupom de parceiro neste dia."]),
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
      ${
        parados.length
          ? `<p style="margin:12px 0 4px;font-size:14px;color:#b45309"><strong>⏳ ${parados.length} pedido(s) pago(s) há mais de ${DIAS_UTEIS_PARADO} dias úteis sem postar nem retirar:</strong></p><ul style="margin:0;padding-left:20px;font-size:14px">${parados
              .map((r) => `<li><span style="font-family:monospace">${escaparHtml(r.ref)}</span> · ${escaparHtml(r.cliente.nome)} · ${escaparHtml(r.entrega.retirada ? "retirada" : r.entrega.descricao)}${r.producao ? " · em produção" : ""}</li>`)
              .join("")}</ul>`
          : ""
      }
      <h2 style="margin:20px 0 6px;font-size:15px">Comissões de cupom do dia</h2>
      ${
        comissoes.length
          ? `<table style="width:100%;border-collapse:collapse;font-size:14px"><thead><tr style="text-align:left;font-size:12px;color:#5e6266"><th style="padding:6px 8px">Parceiro</th><th style="padding:6px 8px">Cupom</th><th style="padding:6px 8px">Pedidos</th><th style="padding:6px 8px;text-align:right">Vendas (peças)</th><th style="padding:6px 8px;text-align:right">A pagar</th></tr></thead><tbody>${comissoes
              .map(
                (c) =>
                  `<tr><td style="padding:6px 8px;border-bottom:1px solid #e3ddd0">${escaparHtml(c.parceiro)}</td><td style="padding:6px 8px;border-bottom:1px solid #e3ddd0;font-family:monospace">${escaparHtml(c.cupom)}</td><td style="padding:6px 8px;border-bottom:1px solid #e3ddd0">${c.pedidos}</td><td style="padding:6px 8px;border-bottom:1px solid #e3ddd0;text-align:right">${real(c.vendas)}</td><td style="padding:6px 8px;border-bottom:1px solid #e3ddd0;text-align:right"><strong>${real(c.comissao)}</strong></td></tr>`,
              )
              .join("")}</tbody></table><p style="margin:6px 0 0;font-size:12px;color:#5e6266">Comissão = percentual do cupom sobre o valor das peças já com desconto. O acumulado do mês está em /admin/cupons.</p>`
          : `<p style="margin:0;font-size:14px;color:#5e6266">Nenhuma venda com cupom de parceiro neste dia.</p>`
      }
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
