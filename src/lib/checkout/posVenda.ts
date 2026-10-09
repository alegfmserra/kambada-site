/**
 * O que acontece depois que um pagamento aprovado vira pedido no Bling.
 *
 *  1. REGISTRO — o pedido é guardado no site (acompanhamento e controle).
 *  2. ESTOQUE  — baixa no Bling na hora (decisão de 08/10/2026: evita vender
 *                peça que já acabou). O pedido continua "Em aberto" para a
 *                separação.
 *  3. NOTA     — gera a NF-e e manda o Bling transmitir à SEFAZ. Ligada por
 *                BLING_EMITIR_NFE=1.
 *  4. E-MAIL   — "Pedido confirmado" ao cliente e "Novo pedido pago" à loja,
 *                de pedidos@somoskambada.com.br.
 *  5. E-MAIL DA NOTA — com a nota AUTORIZADA, o site manda ao cliente o DANFE
 *                (PDF) e o XML, no visual da Kambada, com cópia oculta à loja
 *                (decisão do Alexandre, 09/10/2026). O e-mail do próprio Bling
 *                fica desligado (enviarEmail=false) para o cliente não receber
 *                a nota duas vezes, de dois remetentes.
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
  assuntoNota,
  htmlConfirmacao,
  htmlLoja,
  htmlNota,
  textoConfirmacao,
  textoLoja,
  textoNota,
} from "../email/confirmacao";
import { CID_LOGO, emailConfigurado, emailDaLoja, enviarEmail, type Anexo } from "../email/enviar";
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
    total: (itensCentavos + emCentavos(retrato.frete.valor) - (retrato.cupom?.descontoCentavos ?? 0)) / 100,
    ...(retrato.cupom
      ? {
          cupom: {
            codigo: retrato.cupom.codigo,
            percentual: retrato.cupom.percentual,
            desconto: retrato.cupom.descontoCentavos / 100,
            parceiro: retrato.cupom.parceiro,
            comissaoPercentual: retrato.cupom.comissaoPercentual,
          },
        }
      : {}),
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

/**
 * Situação da NF-e no Bling (especificação OpenAPI): 5 Autorizada,
 * 6 Emitida DANFE e 7 Registrada contam como feita; 4 Rejeitada,
 * 9 Denegada, 11 Bloqueada e 2 Cancelada são falha; o resto (1 Pendente,
 * 3 Aguardando recibo, 8 Aguardando protocolo, 10 Consulta) é espera.
 *
 * Lição de 09/10/2026: o Bling ACEITA o pedido de envio mesmo quando a SEFAZ
 * rejeita a nota (ali: "179 — CNPJ do emitente com situação irregular na
 * Receita"). Sem reler a situação, a etapa aparecia como feita.
 */
const NOTA_OK = new Set([5, 6, 7]);
const NOTA_FALHA: Record<number, string> = { 2: "Cancelada", 4: "Rejeitada", 9: "Denegada", 11: "Bloqueada" };

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

type NotaBling = {
  situacao?: number;
  numero?: string;
  serie?: number;
  chaveAcesso?: string;
  linkDanfe?: string;
  linkPDF?: string;
  /** Link do XML (ou, em alguns retornos, o próprio XML). */
  xml?: string;
};

async function lerNota(idNota: number): Promise<NotaBling> {
  return (await chamarBling<{ data?: NotaBling }>(`/nfe/${idNota}`, { revalidar: 0 })).data ?? {};
}

async function situacaoDaNota(idNota: number): Promise<number | undefined> {
  return (await lerNota(idNota)).situacao;
}

/**
 * A SEFAZ costuma autorizar em segundos, mas não na hora: confere algumas vezes
 * antes de deixar a nota como "aguardando" (NFE_ESPERA_MS × NFE_TENTATIVAS).
 */
async function aguardarSefaz(idNota: number): Promise<number | undefined> {
  const tentativas = Math.max(1, Number(process.env.NFE_TENTATIVAS ?? 5));
  let situacao: number | undefined;
  for (let i = 0; i < tentativas; i++) {
    await esperar(Number(process.env.NFE_ESPERA_MS ?? 3000));
    situacao = await situacaoDaNota(idNota);
    if (situacao !== undefined && (NOTA_OK.has(situacao) || NOTA_FALHA[situacao])) break;
  }
  return situacao;
}

async function etapaNota(r: RegistroPedido): Promise<RegistroPedido["nfe"]> {
  try {
    let idNota = r.nfe?.idNota;
    if (idNota) {
      // Reprocessamento: se a nota já saiu, não envia de novo.
      const antes = await situacaoDaNota(idNota);
      if (antes !== undefined && NOTA_OK.has(antes)) return { idNota, feitoEm: agoraIso() };
    } else {
      idNota = (
        await chamarBling<{ data?: { idNotaFiscal?: number } }>(
          `/pedidos/vendas/${r.bling.idPedido}/gerar-nfe`,
          { metodo: "POST" },
        )
      ).data?.idNotaFiscal;
    }
    if (!idNota) throw new Error("o Bling não devolveu o número da nota");

    // Quem manda a nota ao cliente é o site (etapa 5). Se o e-mail do site
    // estiver desligado, o Bling manda — o cliente nunca fica sem a nota.
    const blingMandaEmail = !emailConfigurado();
    await chamarBling(`/nfe/${idNota}/enviar?enviarEmail=${blingMandaEmail}`, { metodo: "POST" });
    const situacao = await aguardarSefaz(idNota);

    if (situacao !== undefined && NOTA_OK.has(situacao)) return { idNota, feitoEm: agoraIso() };
    if (situacao !== undefined && NOTA_FALHA[situacao]) {
      return {
        idNota,
        erro: `Nota ${NOTA_FALHA[situacao]} pela SEFAZ — ver o motivo na nota, no Bling`,
        detalhe: `situação ${situacao}`,
      };
    }
    // Ainda em processamento: fica pendente; "Refazer pendências" confere de novo.
    return { idNota, detalhe: `aguardando a SEFAZ (situação ${situacao ?? "?"})` };
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

/** Baixa um anexo da nota; se falhar, o e-mail segue só com o link. */
async function baixar(url: string | undefined, confere: (b: Buffer) => boolean): Promise<Buffer | null> {
  if (!url?.startsWith("https://")) return null;
  try {
    const resposta = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    if (!resposta.ok) return null;
    const b = Buffer.from(await resposta.arrayBuffer());
    return b.length > 0 && b.length < 8_000_000 && confere(b) ? b : null;
  } catch {
    return null;
  }
}

async function etapaEmailNota(r: RegistroPedido): Promise<Etapa> {
  try {
    const idNota = r.nfe?.idNota;
    if (!idNota) throw new Error("pedido sem nota");
    const n = await lerNota(idNota);
    // Só nota AUTORIZADA vai ao cliente (registros antigos podiam marcar como
    // feita uma nota que a SEFAZ rejeitou).
    if (n.situacao === undefined || !NOTA_OK.has(n.situacao)) {
      throw new Error(`a nota não está autorizada (situação ${n.situacao ?? "?"}) — não foi enviada`);
    }
    const numero = n.numero ?? String(idNota);

    const pdf = await baixar(n.linkPDF, (b) => b.subarray(0, 5).toString() === "%PDF-");
    const xmlTexto = n.xml?.trimStart().startsWith("<") ? Buffer.from(n.xml) : null;
    const xml = xmlTexto ?? (await baixar(n.xml, (b) => b.toString("utf8", 0, 200).includes("<")));
    const nomeBase = `NF-e_${numero}_Kambada`;
    const anexos: Anexo[] = [
      ...(pdf ? [{ nome: `${nomeBase}.pdf`, conteudo: pdf, tipo: "application/pdf" }] : []),
      ...(xml ? [{ nome: `${nomeBase}.xml`, conteudo: xml, tipo: "application/xml" }] : []),
    ];
    if (anexos.length === 0 && !n.linkDanfe) throw new Error("o Bling não devolveu o PDF, o XML nem o link da nota");

    const dados = {
      registro: r,
      nota: { numero, serie: n.serie, chaveAcesso: n.chaveAcesso, linkDanfe: n.linkDanfe },
      anexou: { pdf: Boolean(pdf), xml: Boolean(xml) },
      urlDoSite: urlPublica(),
      linkWhatsApp: linkWhatsApp(`Oi! Tenho uma dúvida sobre a nota fiscal do pedido ${r.ref}.`),
      cidLogo: CID_LOGO,
    };
    await enviarEmail({
      para: r.cliente.email,
      copiaOculta: emailDaLoja(),
      assunto: assuntoNota(r, numero),
      texto: textoNota(dados),
      html: htmlNota(dados),
      responderPara: emailDaLoja(),
      anexos,
    });
    return { feitoEm: agoraIso(), detalhe: anexos.map((a) => a.nome).join(", ") || "só o link" };
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
    // Depois dos dois e-mails do pedido: a nota é o último a chegar.
    if (emailConfigurado() && r.nfe?.feitoEm && !r.emailNota?.feitoEm) {
      r = { ...r, emailNota: await etapaEmailNota(r) };
      await salvarRegistro(r);
    }
    return r;
  })().finally(() => emAndamento.delete(retrato.ref));

  emAndamento.set(retrato.ref, trabalho);
  return trabalho;
}
