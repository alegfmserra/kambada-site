/**
 * Pós-venda pela área de controle (21/10/2026) — produção, entrega/retirada e
 * cancelamento, sem a loja precisar mexer em dois lugares.
 *
 * O registro do site é a memória do pós-venda; o Bling recebe a situação do
 * pedido (em andamento, atendido, cancelado) e o estorno do estoque. Cada etapa
 * fica gravada: clicar de novo só refaz o que falhou.
 *
 * O que NÃO é automático: cancelar a nota fiscal. Até 24 h ela se cancela no
 * Bling (a área de controle mostra o link e o lembrete); depois disso é nota de
 * devolução, com o Glauco.
 */

import { chamarBling } from "../bling/cliente";
import { urlPublica } from "../checkout/posVenda";
import { CID_LOGO, emailConfigurado, emailDaLoja, enviarEmail } from "../email/enviar";
import {
  mensagemCancelamentoSolicitadoCliente,
  mensagemCancelamentoSolicitadoLoja,
  mensagemPedidoCancelado,
  mensagemProducao,
  type Mensagem,
} from "../email/posVenda";
import { buscarPagamento, estornarPagamento } from "../mercadopago/cliente";
import { EMAILS } from "../site";
import { acaoDaNota, avaliarCancelamento } from "./cancelamento";
import { atualizarRegistro, lerRegistro, type Etapa, type RegistroPedido } from "./registro";

/**
 * Situações padrão do módulo de vendas do Bling. Conferir em
 * /api/bling/diagnostico-checkout (lista "situacoesDeVenda"); se a conta usar
 * outras, sobrescrever pelas variáveis.
 */
export function situacoesBling() {
  return {
    emAndamento: Number(process.env.BLING_SITUACAO_EM_ANDAMENTO ?? 15),
    atendido: Number(process.env.BLING_SITUACAO_ATENDIDO ?? 9),
    cancelado: Number(process.env.BLING_SITUACAO_CANCELADO ?? 12),
  };
}

const agoraIso = () => new Date().toISOString();
const falha = (e: unknown): Etapa => ({ erro: e instanceof Error ? e.message : String(e) });

async function etapa(trabalho: () => Promise<unknown>): Promise<Etapa> {
  try {
    await trabalho();
    return { feitoEm: agoraIso() };
  } catch (e) {
    return falha(e);
  }
}

export async function mudarSituacaoNoBling(idPedido: number, idSituacao: number): Promise<Etapa> {
  return etapa(() => chamarBling(`/pedidos/vendas/${idPedido}/situacoes/${idSituacao}`, { metodo: "PATCH" }));
}

async function enviar(para: string, m: Mensagem, opcoes: { copiaOculta?: string } = {}): Promise<Etapa | undefined> {
  if (!emailConfigurado()) return undefined;
  return etapa(() =>
    enviarEmail({
      para,
      copiaOculta: opcoes.copiaOculta,
      assunto: m.assunto,
      texto: m.texto,
      html: m.html(CID_LOGO),
      responderPara: EMAILS.contato,
    }),
  );
}

async function exigir(ref: string): Promise<RegistroPedido> {
  const r = await lerRegistro(ref);
  if (!r) throw new Error(`pedido ${ref} não encontrado`);
  return r;
}

/** "Produção iniciada": avisa o cliente (com a regra de cancelamento) e põe o pedido "em andamento" no Bling. */
export async function iniciarProducao(ref: string, personalizado: boolean): Promise<RegistroPedido | null> {
  const r = await exigir(ref);
  if (r.producao?.email?.feitoEm && r.producao.personalizado === personalizado) return r;
  const iniciadaEm = r.producao?.iniciadaEm ?? agoraIso();
  const email = await enviar(r.cliente.email, mensagemProducao(r, personalizado, urlPublica()), { copiaOculta: emailDaLoja() });
  await mudarSituacaoNoBling(r.bling.idPedido, situacoesBling().emAndamento);
  return atualizarRegistro(ref, { producao: { iniciadaEm, personalizado, email } });
}

/** "Entregue" ou "Retirado": encerra o pós-venda e marca "atendido" no Bling. */
export async function concluirPedido(ref: string, tipo: "entregue" | "retirado"): Promise<RegistroPedido | null> {
  const r = await exigir(ref);
  const bling = await mudarSituacaoNoBling(r.bling.idPedido, situacoesBling().atendido);
  return atualizarRegistro(ref, { conclusao: { tipo, em: r.conclusao?.em ?? agoraIso(), bling } });
}

/** Desfaz um "Entregue/Retirado" marcado por engano (não mexe no Bling). */
export async function desfazerConclusao(ref: string): Promise<RegistroPedido | null> {
  await exigir(ref);
  return atualizarRegistro(ref, { conclusao: undefined });
}

/** Postagem informada: pedido "em andamento" no Bling (o rastreio já está no registro e no e-mail). */
export async function marcarPostagemNoBling(ref: string): Promise<void> {
  const r = await exigir(ref);
  if (!r.envio || r.envio.bling?.feitoEm) return;
  const bling = await mudarSituacaoNoBling(r.bling.idPedido, situacoesBling().emAndamento);
  await atualizarRegistro(ref, { envio: { ...r.envio, bling } });
}

export type ResultadoSolicitacao = { ok: true } | { ok: false; motivo: string };

/**
 * O CLIENTE pede para cancelar (página do pedido). Não estorna nada: avisa a
 * loja, que aprova na área de controle. Quem chega aqui já provou ser o dono
 * (número do pedido + e-mail da compra).
 */
export async function solicitarCancelamento(ref: string, motivo: string): Promise<ResultadoSolicitacao> {
  const r = await exigir(ref);
  const avaliacao = avaliarCancelamento(r);
  if (!avaliacao.pode) return { ok: false, motivo: avaliacao.motivo };
  if (r.cancelamento?.solicitadoEm) return { ok: true };

  const texto = motivo.trim().slice(0, 500);
  const avisoLoja = await enviar(emailDaLoja(), mensagemCancelamentoSolicitadoLoja(r, texto, urlPublica()));
  const confirmacaoCliente = await enviar(r.cliente.email, mensagemCancelamentoSolicitadoCliente(r));
  await atualizarRegistro(ref, {
    cancelamento: { ...r.cancelamento, origem: "cliente", solicitadoEm: agoraIso(), motivo: texto || undefined, avisoLoja, confirmacaoCliente },
  });
  return { ok: true };
}

/**
 * A LOJA cancela: estorna no Mercado Pago, devolve o estoque e cancela o
 * pedido no Bling, diz o que fazer com a nota e avisa o cliente. Idempotente.
 */
export async function cancelarPedido(ref: string): Promise<RegistroPedido | null> {
  const r = await exigir(ref);
  const c: NonNullable<RegistroPedido["cancelamento"]> = { origem: "loja", ...r.cancelamento };
  const salvar = () => atualizarRegistro(ref, { cancelamento: { ...c } });

  // 1. Dinheiro de volta — a etapa que decide se o pedido está cancelado.
  if (!c.estornoMp?.feitoEm) {
    c.estornoMp = await etapa(async () => {
      const p = await buscarPagamento(r.pagamentoId);
      if (p.status === "refunded") return;
      await estornarPagamento(r.pagamentoId, `cancelamento-${ref}`);
    });
    await salvar();
    if (!c.estornoMp.feitoEm) return lerRegistro(ref);
  }
  c.concluidoEm ??= agoraIso();
  c.nota ??= { acao: acaoDaNota(r) };

  // 2. Peças de volta ao estoque (só se o site tinha baixado).
  if (r.estoque?.feitoEm && !c.estoqueBling?.feitoEm) {
    c.estoqueBling = await etapa(() => chamarBling(`/pedidos/vendas/${r.bling.idPedido}/estornar-estoque`, { metodo: "POST" }));
  }
  // 3. Pedido cancelado no Bling.
  if (!c.pedidoBling?.feitoEm) c.pedidoBling = await mudarSituacaoNoBling(r.bling.idPedido, situacoesBling().cancelado);
  // 4. Cliente avisado.
  if (!c.emailCliente?.feitoEm) {
    c.emailCliente = await enviar(r.cliente.email, mensagemPedidoCancelado(r, r.pagamento.tipo), { copiaOculta: emailDaLoja() });
  }
  return salvar();
}

/** A loja resolveu a nota (cancelou no Bling ou emitiu a de devolução). */
export async function marcarNotaResolvida(ref: string): Promise<RegistroPedido | null> {
  const r = await exigir(ref);
  if (!r.cancelamento?.nota) return r;
  return atualizarRegistro(ref, { cancelamento: { ...r.cancelamento, nota: { ...r.cancelamento.nota, resolvidaEm: agoraIso() } } });
}
