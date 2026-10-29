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

import { linkDeAvaliacao } from "../avaliacoes/avaliacoes";
import { chamarBling } from "../bling/cliente";
import { urlPublica } from "../checkout/posVenda";
import { CID_LOGO, emailConfigurado, emailDaLoja, enviarEmail } from "../email/enviar";
import {
  assuntoEnvio,
  htmlEnvio,
  mensagemCancelamentoSolicitadoCliente,
  mensagemCancelamentoSolicitadoLoja,
  mensagemConcluido,
  mensagemPedidoCancelado,
  mensagemProducao,
  mensagemProntoParaRetirada,
  textoEnvio,
  type Mensagem,
} from "../email/posVenda";
import { cancelarEtiquetaMe } from "../frete/meApi";
import { buscarPagamento, estornarPagamento } from "../mercadopago/cliente";
import { EMAILS, linkWhatsApp } from "../site";
import { enderecoAtelieEmUmaLinha } from "../loja/enderecoAtelie";
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

/** Retirada: avisa o cliente que está pronto, com o endereço do ateliê e o WhatsApp para combinar. */
export async function avisarProntoParaRetirada(ref: string): Promise<RegistroPedido | null> {
  const r = await exigir(ref);
  if (!r.entrega.retirada) throw new Error("pedido com entrega — use a etiqueta");
  const link = linkWhatsApp(`Oi! Meu pedido ${r.ref} está pronto — quero combinar a retirada no ateliê.`);
  const email = await enviar(r.cliente.email, mensagemProntoParaRetirada(r, enderecoAtelieEmUmaLinha(), link), {
    copiaOculta: emailDaLoja(),
  });
  return atualizarRegistro(ref, { prontoParaRetirada: { em: r.prontoParaRetirada?.em ?? agoraIso(), email } });
}

/** "Entregue" ou "Retirado": encerra o pós-venda e marca "atendido" no Bling. */
export async function concluirPedido(ref: string, tipo: "entregue" | "retirado"): Promise<RegistroPedido | null> {
  const r = await exigir(ref);
  const bling = r.conclusao?.bling?.feitoEm ? r.conclusao.bling : await mudarSituacaoNoBling(r.bling.idPedido, situacoesBling().atendido);
  // "Chegou!" com convite para avaliar as peças — uma vez só, mesmo se marcar de novo.
  const email = r.conclusao?.email?.feitoEm
    ? r.conclusao.email
    : await enviar(r.cliente.email, mensagemConcluido(r, tipo, urlPublica(), linkDeAvaliacao(urlPublica(), r.ref)));
  return atualizarRegistro(ref, { conclusao: { tipo, em: r.conclusao?.em ?? agoraIso(), bling, email } });
}

/** Desfaz um "Entregue/Retirado" marcado por engano (não mexe no Bling). */
export async function desfazerConclusao(ref: string): Promise<RegistroPedido | null> {
  await exigir(ref);
  return atualizarRegistro(ref, { conclusao: undefined });
}

/**
 * "Seu pedido foi postado": grava o rastreio, manda o e-mail ao cliente (cópia
 * oculta à loja) e põe o pedido em andamento no Bling. Usado pelo formulário
 * da área de controle e pelo acompanhamento automático da etiqueta.
 */
export async function avisarPostagemAoCliente(
  ref: string,
  codigo: string,
  transportadora: string,
  opcoes: { automatico?: boolean; postadoEm?: string } = {},
): Promise<RegistroPedido | null> {
  const r = await exigir(ref);
  const dados = { registro: r, codigo, transportadora, urlDoSite: urlPublica() };
  const email = await enviar(
    r.cliente.email,
    { assunto: assuntoEnvio(r), texto: textoEnvio(dados), html: (cid) => htmlEnvio(dados, cid) },
    { copiaOculta: emailDaLoja() },
  );
  const postadoEm = opcoes.postadoEm ? new Date(opcoes.postadoEm).toISOString() : agoraIso();
  await atualizarRegistro(ref, { envio: { codigo, transportadora, postadoEm, email, automatico: opcoes.automatico || undefined } });
  await marcarPostagemNoBling(ref).catch(() => undefined);
  return lerRegistro(ref);
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
export async function cancelarPedido(ref: string, reter = 0): Promise<RegistroPedido | null> {
  const r = await exigir(ref);
  const c: NonNullable<RegistroPedido["cancelamento"]> = { origem: "loja", ...r.cancelamento };
  if (!c.estornoMp?.feitoEm) {
    if (!(reter >= 0 && reter < r.total)) throw new Error("valor a reter inválido");
    c.retido = reter > 0 ? Math.round(reter * 100) / 100 : undefined;
  }
  const salvar = () => atualizarRegistro(ref, { cancelamento: { ...c } });

  // 1. Dinheiro de volta — a etapa que decide se o pedido está cancelado.
  if (!c.estornoMp?.feitoEm) {
    c.estornoMp = await etapa(async () => {
      const p = await buscarPagamento(r.pagamentoId);
      if (p.status === "refunded" || p.status === "partially_refunded") return;
      await estornarPagamento(r.pagamentoId, `cancelamento-${ref}`, c.retido ? r.total - c.retido : undefined);
    });
    await salvar();
    if (!c.estornoMp.feitoEm) return lerRegistro(ref);
  }
  c.concluidoEm ??= agoraIso();
  c.nota ??= { acao: acaoDaNota(r) };

  // 1b. Etiqueta comprada e ainda não postada: cancela, o valor volta à carteira.
  if (r.etiqueta?.compradaEm && r.etiqueta.idMe && !r.envio && !c.etiquetaMe?.feitoEm) {
    const idMe = r.etiqueta.idMe;
    c.etiquetaMe = await etapa(() => cancelarEtiquetaMe(idMe, `Pedido ${ref} cancelado`));
  }

  // 2. Peças de volta ao estoque (só se o site tinha baixado).
  if (r.estoque?.feitoEm && !c.estoqueBling?.feitoEm) {
    c.estoqueBling = await etapa(() => chamarBling(`/pedidos/vendas/${r.bling.idPedido}/estornar-estoque`, { metodo: "POST" }));
  }
  // 3. Pedido cancelado no Bling.
  if (!c.pedidoBling?.feitoEm) c.pedidoBling = await mudarSituacaoNoBling(r.bling.idPedido, situacoesBling().cancelado);
  // 4. Cliente avisado.
  if (!c.emailCliente?.feitoEm) {
    c.emailCliente = await enviar(r.cliente.email, mensagemPedidoCancelado(r, r.pagamento.tipo, c.retido ?? 0), { copiaOculta: emailDaLoja() });
  }
  return salvar();
}

/** Arrependimento: a peça voltou ao ateliê (antes de cancelar e estornar). */
export async function marcarPecaDevolvida(ref: string): Promise<RegistroPedido | null> {
  const r = await exigir(ref);
  if (r.devolucao?.pecaRecebidaEm) return r;
  return atualizarRegistro(ref, { devolucao: { ...r.devolucao, pecaRecebidaEm: agoraIso() } });
}

/** A loja resolveu a nota (cancelou no Bling ou emitiu a de devolução). */
export async function marcarNotaResolvida(ref: string): Promise<RegistroPedido | null> {
  const r = await exigir(ref);
  if (!r.cancelamento?.nota) return r;
  return atualizarRegistro(ref, { cancelamento: { ...r.cancelamento, nota: { ...r.cancelamento.nota, resolvidaEm: agoraIso() } } });
}

// ---------------------------------------------------------------------------
// Fase C — problema na entrega e troca de peça (21/10/2026)
// ---------------------------------------------------------------------------

const ROTULO_PROBLEMA = {
  "nao-entregue": "não entregue (tentativa sem sucesso)",
  devolvido: "devolvido ao remetente",
  extravio: "extraviado",
} as const;

export function rotuloProblema(tipo: keyof typeof ROTULO_PROBLEMA): string {
  return ROTULO_PROBLEMA[tipo];
}

/** Registra o problema e avisa a loja (uma vez por pedido e tipo). */
export async function registrarProblemaEntrega(
  ref: string,
  tipo: keyof typeof ROTULO_PROBLEMA,
  origem: "melhor-envio" | "loja",
  observacao?: string,
): Promise<RegistroPedido | null> {
  const r = await exigir(ref);
  if (r.problemaEntrega?.tipo === tipo && !r.problemaEntrega.resolvidoEm) return r;
  const { alertar } = await import("../manutencao/alertas");
  const resultado = await alertar(
    `problema-${tipo}-${ref}`,
    `Pedido ${ref}: ${rotuloProblema(tipo)}`,
    [
      `${r.cliente.nome} (${r.cliente.email}) · ${r.entrega.descricao}${r.envio ? ` · rastreio ${r.envio.codigo}` : ""}`,
      observacao ? `Obs.: ${observacao}` : "",
      "",
      tipo === "extravio"
        ? "Abrir reclamação no Melhor Envio (Pedidos → o envio → Ajuda). O seguro cobre o valor declarado, que o site já preenche com o valor das peças. Combinar com o cliente: reenvio (nova etiqueta) ou estorno."
        : "Falar com o cliente pelo WhatsApp (botão 'problema na entrega' na área de controle): confirmar endereço e horário. Se voltou ao ateliê, reenviar com nova etiqueta ou estornar.",
      `Área de controle: ${urlPublica()}/admin/pedidos`,
    ]
      .filter(Boolean)
      .join("\n"),
  );
  return atualizarRegistro(ref, {
    problemaEntrega: {
      tipo,
      origem,
      detectadoEm: agoraIso(),
      observacao: observacao?.slice(0, 300) || undefined,
      avisoLoja: resultado === "enviado" ? { feitoEm: agoraIso() } : { detalhe: resultado },
    },
  });
}

export async function resolverProblemaEntrega(ref: string): Promise<RegistroPedido | null> {
  const r = await exigir(ref);
  if (!r.problemaEntrega) return r;
  return atualizarRegistro(ref, { problemaEntrega: { ...r.problemaEntrega, resolvidoEm: agoraIso() } });
}

/** Depósito "Geral" — o único da conta (ver api/bling/estoque). */
const ID_DEPOSITO = Number(process.env.BLING_DEPOSITO ?? 14888952004);

/**
 * Troca de peça: a antiga volta ao estoque (entrada) e a nova sai (saída), com
 * observação do pedido. A nota da troca (devolução + nova venda) fica com o
 * Glauco; a etiqueta de ida da peça nova, pelo botão de etiqueta ou no
 * Melhor Envio.
 */
export async function trocarPeca(
  ref: string,
  de: { id: number; nome: string },
  para: { id: number; nome: string },
  quantidade: number,
): Promise<RegistroPedido | null> {
  const r = await exigir(ref);
  if (!r.itens.some((i) => i.id === de.id)) throw new Error("a peça a trocar não é deste pedido");
  if (!(quantidade >= 1)) throw new Error("quantidade inválida");
  const obs = `Troca do pedido ${ref} (site)`;
  const estoque = await etapa(async () => {
    await chamarBling("/estoques", {
      metodo: "POST",
      corpo: { produto: { id: de.id }, deposito: { id: ID_DEPOSITO }, operacao: "E", quantidade, observacoes: `${obs}: peça devolvida` },
    });
    await chamarBling("/estoques", {
      metodo: "POST",
      corpo: { produto: { id: para.id }, deposito: { id: ID_DEPOSITO }, operacao: "S", quantidade, observacoes: `${obs}: peça enviada` },
    });
  });
  return atualizarRegistro(ref, { trocas: [...(r.trocas ?? []), { em: agoraIso(), de, para, quantidade, estoque }] });
}
