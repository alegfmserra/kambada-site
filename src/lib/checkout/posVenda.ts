/**
 * O que acontece depois que um pagamento aprovado vira pedido no Bling.
 *
 *  1. REGISTRO — o pedido é guardado no site (acompanhamento e controle).
 *  2. ESTOQUE  — baixa no Bling na hora (decisão de 08/10/2026: evita vender
 *                peça que já acabou). O pedido continua "Em aberto" para a
 *                separação.
 *  3. NOTA     — gera a NF-e e manda o Bling transmitir com e-mail ao cliente.
 *                DESLIGADO até BLING_EMITIR_NFE=1: o Bling ainda não tem o
 *                certificado digital nem a configuração fiscal.
 *  4. E-MAIL   — "Pedido confirmado" ao cliente, pelo Gmail da Kambada.
 *
 * Cada etapa grava no registro quando deu certo. Chamado de novo (aviso do
 * Mercado Pago repetido, cliente recarregando a página de sucesso), só refaz o
 * que ainda não foi feito — nunca baixa estoque nem manda e-mail duas vezes.
 * Uma etapa que falha não impede as outras e fica anotada com o erro.
 */

import { chamarBling } from "../bling/cliente";
import {
  assuntoConfirmacao,
  assuntoLoja,
  htmlConfirmacao,
  htmlLoja,
  textoConfirmacao,
  textoLoja,
} from "../email/confirmacao";
import { CID_LOGO, emailConfigurado, emailDaLoja, enviarEmail } from "../email/enviar";
import { enderecoAtelieEmUmaLinha } from "../loja/enderecoAtelie";
import { emCentavos } from "../loja/dinheiro";
import type { Pagamento } from "../mercadopago/cliente";
import {
  lerRegistro,
  salvarRegistro,
  type Etapa,
  type RegistroPedido,
} from "../pedidos/registro";
import { linkWhatsApp } from "../site";
import type { RetratoPedido } from "./pedido";

/** O endereço que vai nos links do e-mail. */
export function urlPublica(): string {
  return (process.env.URL_DO_SITE ?? "https://maroon-heron-459360.hostingersite.com").replace(/\/+$/, "");
}

export function montarRegistro(
  retrato: RetratoPedido,
  pagamento: Pagamento,
  idPedido: number,
  agora = new Date(),
): RegistroPedido {
  const itensCentavos = retrato.itens.reduce((s, i) => s + emCentavos(i.p) * i.q, 0);
  const taxa = (pagamento.fee_details ?? [])
    .filter((f) => f.type === "mercadopago_fee")
    .reduce((s, f) => s + f.amount, 0);
  return {
    ref: retrato.ref,
    pagamentoId: pagamento.id,
    criadoEm: agora.toISOString(),
    // LGPD: só nome e e-mail. CPF, telefone e endereço ficam no Bling.
    cliente: { nome: retrato.cliente.nome, email: retrato.cliente.email },
    itens: retrato.itens.map((i) => ({ id: i.id, nome: i.n, quantidade: i.q, preco: i.p })),
    entrega: {
      descricao: retrato.frete.servico,
      valor: retrato.frete.valor,
      retirada: retrato.frete.retirada === true,
      prazoDias: retrato.frete.prazo,
    },
    total: (itensCentavos + emCentavos(retrato.frete.valor)) / 100,
    pagamento: {
      tipo: pagamento.payment_type_id,
      parcelas: pagamento.installments,
      taxa: taxa || undefined,
    },
    bling: { idPedido },
  };
}

const agoraIso = () => new Date().toISOString();
const falha = (e: unknown): Etapa => ({
  erro: e instanceof Error ? e.message.slice(0, 300) : String(e).slice(0, 300),
  detalhe:
    e && typeof e === "object" && "corpo" in e ? String((e as { corpo: unknown }).corpo).slice(0, 300) : undefined,
});

async function etapaEstoque(r: RegistroPedido): Promise<Etapa> {
  try {
    await chamarBling(`/pedidos/vendas/${r.bling.idPedido}/lancar-estoque`, { metodo: "POST" });
    return { feitoEm: agoraIso() };
  } catch (e) {
    return falha(e);
  }
}

async function etapaNota(r: RegistroPedido): Promise<RegistroPedido["nfe"]> {
  try {
    const idNota =
      r.nfe?.idNota ??
      (
        await chamarBling<{ data?: { idNotaFiscal?: number } }>(
          `/pedidos/vendas/${r.bling.idPedido}/gerar-nfe`,
          { metodo: "POST" },
        )
      ).data?.idNotaFiscal;
    if (!idNota) throw new Error("o Bling não devolveu o número da nota");
    // enviarEmail=true: o próprio Bling manda a nota autorizada ao cliente.
    await chamarBling(`/nfe/${idNota}/enviar?enviarEmail=true`, { metodo: "POST" });
    return { idNota, feitoEm: agoraIso() };
  } catch (e) {
    return { ...r.nfe, ...falha(e) };
  }
}

async function etapaEmail(r: RegistroPedido): Promise<Etapa> {
  try {
    const dados = {
      registro: r,
      urlDoSite: urlPublica(),
      enderecoRetirada: r.entrega.retirada ? enderecoAtelieEmUmaLinha() : undefined,
      linkWhatsApp: linkWhatsApp(
        r.entrega.retirada
          ? `Oi! Quero combinar a retirada do meu pedido ${r.ref} no ateliê.`
          : `Oi! Tenho uma dúvida sobre o meu pedido ${r.ref}.`,
      ),
      cidLogo: CID_LOGO,
    };
    await enviarEmail({
      para: r.cliente.email,
      assunto: assuntoConfirmacao(r),
      texto: textoConfirmacao(dados),
      html: htmlConfirmacao(dados),
      // Resposta do cliente cai na caixa da loja, não na de pedidos.
      responderPara: emailDaLoja(),
    });
    return { feitoEm: agoraIso() };
  } catch (e) {
    return falha(e);
  }
}

/** Aviso interno: a loja recebe o pedido pago, com o que precisa para postar. */
async function etapaEmailLoja(r: RegistroPedido, cliente: RetratoPedido["cliente"]): Promise<Etapa> {
  try {
    const dados = { registro: r, cliente, urlDoSite: urlPublica(), cidLogo: CID_LOGO };
    await enviarEmail({
      para: emailDaLoja(),
      assunto: assuntoLoja(r),
      texto: textoLoja(dados),
      html: htmlLoja(dados),
      responderPara: r.cliente.email,
    });
    return { feitoEm: agoraIso() };
  } catch (e) {
    return falha(e);
  }
}

/** Trava por pedido: duas chamadas simultâneas não fazem nada em dobro. */
const emAndamento = new Map<string, Promise<RegistroPedido>>();

export function executarPosVenda(
  retrato: RetratoPedido,
  pagamento: Pagamento,
  idPedido: number,
): Promise<RegistroPedido> {
  const andamento = emAndamento.get(retrato.ref);
  if (andamento) return andamento;

  const trabalho = (async () => {
    let r = (await lerRegistro(retrato.ref)) ?? montarRegistro(retrato, pagamento, idPedido);
    await salvarRegistro(r);

    if (!r.estoque?.feitoEm) {
      r = { ...r, estoque: await etapaEstoque(r) };
      await salvarRegistro(r);
    }
    if (process.env.BLING_EMITIR_NFE === "1" && !r.nfe?.feitoEm) {
      r = { ...r, nfe: await etapaNota(r) };
      await salvarRegistro(r);
    }
    if (emailConfigurado() && !r.email?.feitoEm) {
      r = { ...r, email: await etapaEmail(r) };
      await salvarRegistro(r);
    }
    if (emailConfigurado() && !r.emailLoja?.feitoEm) {
      r = { ...r, emailLoja: await etapaEmailLoja(r, retrato.cliente) };
      await salvarRegistro(r);
    }
    return r;
  })().finally(() => emAndamento.delete(retrato.ref));

  emAndamento.set(retrato.ref, trabalho);
  return trabalho;
}
