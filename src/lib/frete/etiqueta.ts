/**
 * Etiqueta do Melhor Envio comprada pelo site (Alexandre, 21/10/2026).
 *
 * Um clique na área de controle: o site monta o frete com os dados do pedido
 * (destinatário e telefone vêm do Bling — o registro do site não guarda
 * endereço nem CPF, por LGPD), com o MESMO serviço que o cliente escolheu, a
 * nota fiscal vinculada e a caixa que o site já calcula; põe no carrinho,
 * paga com o saldo da carteira do Melhor Envio, gera e devolve o link de
 * impressão. Cada passo fica gravado: sem saldo, por exemplo, o frete fica no
 * carrinho e um novo clique continua dali.
 *
 * Depois, `acompanharEtiquetas` (a cada hora) lê a situação no Melhor Envio:
 * postado → grava o rastreio e manda o "Seu pedido foi postado"; entregue →
 * conclui o pedido e manda o "Chegou!" com a pesquisa.
 */

import { chamarBling } from "../bling/cliente";
import { buscarCatalogo } from "../bling/produtos";
import { indexarOpcoes, type ItemValidado } from "../carrinho/validar";
import { ENDERECO_ATELIE } from "../loja/enderecoAtelie";
import { liberar, reservar } from "../manutencao/reserva";
import { avisarPostagemAoCliente, concluirPedido } from "../pedidos/posVendaLoja";
import { atualizarRegistro, lerRegistro, listarRegistros, type RegistroPedido } from "../pedidos/registro";
import { SITE, WHATSAPP } from "../site";
import { montarCaixaUnica } from "./caixa";
import { cotarCarrinho } from "./cotar";
import { embalagemDe } from "./embalagens";
import { base, ErroFrete, nomeDaEntrega, userAgent } from "./melhorEnvio";
import { CEP_ORIGEM } from "./regras";

const so = (s: string | undefined) => (s ?? "").replace(/\D/g, "");

async function me<T>(caminho: string, corpo?: unknown): Promise<T> {
  const token = process.env.MELHORENVIO_TOKEN;
  if (!token) throw new ErroFrete("Melhor Envio não configurado", 503);
  const r = await fetch(`${base()}/api/v2/me${caminho}`, {
    method: corpo === undefined ? "GET" : "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      "User-Agent": userAgent(),
    },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
    cache: "no-store",
    signal: AbortSignal.timeout(30_000),
  });
  const texto = await r.text();
  if (!r.ok) throw new ErroFrete(`Melhor Envio respondeu ${r.status}: ${traduzirErro(texto)}`, r.status, texto.slice(0, 500));
  return (texto ? JSON.parse(texto) : {}) as T;
}

/** As mensagens do Melhor Envio vêm em JSON com `message` e `errors`; mostra o essencial. */
export function traduzirErro(texto: string): string {
  try {
    const d = JSON.parse(texto) as { message?: string; error?: string; errors?: Record<string, string[]> };
    const detalhes = d.errors ? Object.values(d.errors).flat().slice(0, 3).join(" · ") : "";
    return [d.message ?? d.error, detalhes].filter(Boolean).join(" — ").slice(0, 300) || texto.slice(0, 200);
  } catch {
    return texto.slice(0, 200);
  }
}

type PedidoBling = {
  data?: {
    contato?: { id?: number; nome?: string; numeroDocumento?: string };
    transporte?: {
      etiqueta?: { nome?: string; endereco?: string; numero?: string; complemento?: string; municipio?: string; uf?: string; cep?: string; bairro?: string };
    };
  };
};
type ContatoBling = { data?: { celular?: string; telefone?: string; email?: string; numeroDocumento?: string } };

/** Itens do pedido com a embalagem de cada um, a partir do catálogo (ocultos inclusive). */
async function itensComEmbalagem(r: RegistroPedido): Promise<ItemValidado[]> {
  const indice = indexarOpcoes(await buscarCatalogo());
  return r.itens.map((i) => {
    const achado = indice.get(i.id);
    const embalagem = achado ? embalagemDe(achado.produto, achado.opcao) : null;
    if (!achado || !embalagem) throw new Error(`não sei a embalagem de "${i.nome}" — gerar a etiqueta direto no Melhor Envio`);
    return {
      idBling: i.id,
      slug: achado.produto.slug,
      categoria: achado.produto.categoria,
      nome: i.nome,
      rotulo: achado.opcao.rotulo,
      precoUnitario: i.preco,
      quantidade: i.quantidade,
      embalagem,
    };
  });
}

/** Monta o corpo do carrinho do Melhor Envio. Exportada para teste. */
export function montarFreteDoCarrinho(d: {
  ref: string;
  servicoId: number;
  itens: ItemValidado[];
  destinatario: { nome: string; documento: string; telefone: string; email: string; endereco: string; numero: string; complemento?: string; bairro: string; cidade: string; uf: string; cep: string };
  chaveNota?: string;
  urlDoPedido: string;
}) {
  const caixa = montarCaixaUnica(d.itens);
  const uma = d.itens.length === 1 && d.itens[0].quantidade === 1 ? d.itens[0].embalagem : null;
  const volume = caixa ?? uma;
  if (!volume) throw new Error("os itens não cabem numa caixa só — dividir a etiqueta direto no Melhor Envio");
  const valor = d.itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0);
  const [logradouro, numero] = ENDERECO_ATELIE.logradouro.split(/,\s*nº\s*/);
  return {
    service: d.servicoId,
    from: {
      name: SITE.razaoSocial,
      phone: WHATSAPP.numero.replace(/^55/, ""),
      email: "somoskambada@gmail.com",
      company_document: so(SITE.cnpj),
      address: logradouro,
      number: numero ?? "s/n",
      district: ENDERECO_ATELIE.bairro,
      city: ENDERECO_ATELIE.cidade,
      state_abbr: ENDERECO_ATELIE.uf,
      country_id: "BR",
      postal_code: CEP_ORIGEM,
    },
    to: {
      name: d.destinatario.nome,
      phone: so(d.destinatario.telefone),
      email: d.destinatario.email,
      document: so(d.destinatario.documento),
      address: d.destinatario.endereco,
      number: d.destinatario.numero || "s/n",
      complement: d.destinatario.complemento || undefined,
      district: d.destinatario.bairro,
      city: d.destinatario.cidade,
      state_abbr: d.destinatario.uf,
      country_id: "BR",
      postal_code: so(d.destinatario.cep),
    },
    products: d.itens.map((i) => ({ name: i.nome, quantity: i.quantidade, unitary_value: Number(i.precoUnitario.toFixed(2)) })),
    volumes: [{ height: volume.altura, width: volume.largura, length: volume.comprimento, weight: volume.peso }],
    options: {
      insurance_value: Number(valor.toFixed(2)),
      receipt: false,
      own_hand: false,
      reverse: false,
      non_commercial: !d.chaveNota,
      invoice: d.chaveNota ? { key: d.chaveNota } : undefined,
      platform: "Site Kambada",
      tags: [{ tag: d.ref, url: d.urlDoPedido }],
    },
  };
}

/**
 * Compra (ou continua comprando) a etiqueta de um pedido. Idempotente: cada
 * passo feito fica gravado e não se repete.
 */
export async function gerarEtiqueta(ref: string, urlDoSite: string): Promise<RegistroPedido | null> {
  const r = await lerRegistro(ref);
  if (!r) throw new Error(`pedido ${ref} não encontrado`);
  if (r.entrega.retirada) throw new Error("pedido com retirada no ateliê não tem etiqueta");
  if (r.cancelamento?.concluidoEm || r.estorno) throw new Error("pedido cancelado");

  const e: NonNullable<RegistroPedido["etiqueta"]> = { ...r.etiqueta, erro: undefined };
  const salvar = () => atualizarRegistro(ref, { etiqueta: { ...e } });
  try {
    if (!e.idMe) {
      const pedido = (await chamarBling<PedidoBling>(`/pedidos/vendas/${r.bling.idPedido}`, { revalidar: 0 })).data;
      const end = pedido?.transporte?.etiqueta;
      if (!end?.cep || !end.endereco) throw new Error("o pedido no Bling está sem endereço de entrega");
      const contato = pedido?.contato?.id
        ? (await chamarBling<ContatoBling>(`/contatos/${pedido.contato.id}`, { revalidar: 0 })).data
        : undefined;
      const itens = await itensComEmbalagem(r);
      // O mesmo serviço que o cliente escolheu e pagou, recotado agora.
      const subtotal = Math.round(itens.reduce((s, i) => s + i.precoUnitario * i.quantidade, 0) * 100);
      const opcoes = await cotarCarrinho(so(end.cep), itens, subtotal);
      const escolhida = opcoes.find((o) => nomeDaEntrega(o.transportadora, o.servico) === r.entrega.descricao);
      if (!escolhida) {
        throw new Error(
          `o serviço "${r.entrega.descricao}" não aparece mais na cotação (${opcoes.map((o) => nomeDaEntrega(o.transportadora, o.servico)).join(", ") || "nenhum"}) — gerar direto no Melhor Envio`,
        );
      }
      let chaveNota: string | undefined;
      if (r.nfe?.idNota) {
        chaveNota = (await chamarBling<{ data?: { chaveAcesso?: string } }>(`/nfe/${r.nfe.idNota}`, { revalidar: 0 })).data?.chaveAcesso;
      }
      const corpo = montarFreteDoCarrinho({
        ref,
        servicoId: escolhida.id,
        itens,
        chaveNota,
        urlDoPedido: `${urlDoSite}/pedido?ref=${ref}`,
        destinatario: {
          nome: end.nome || pedido?.contato?.nome || r.cliente.nome,
          documento: pedido?.contato?.numeroDocumento || contato?.numeroDocumento || "",
          telefone: contato?.celular || contato?.telefone || "",
          email: r.cliente.email,
          endereco: end.endereco,
          numero: end.numero ?? "",
          complemento: end.complemento,
          bairro: end.bairro ?? "",
          cidade: end.municipio ?? "",
          uf: end.uf ?? "",
          cep: end.cep,
        },
      });
      const noCarrinho = await me<{ id?: string; price?: number }>("/cart", corpo);
      if (!noCarrinho.id) throw new Error("o Melhor Envio não devolveu o número do frete");
      Object.assign(e, {
        idMe: noCarrinho.id,
        servicoId: escolhida.id,
        servico: escolhida.servico,
        transportadora: escolhida.transportadora,
        valor: noCarrinho.price ?? escolhida.preco,
        noCarrinhoEm: new Date().toISOString(),
      });
      await salvar();
    }
    if (!e.compradaEm) {
      // Paga com o saldo da carteira. Sem saldo, para aqui: o frete fica no carrinho.
      await me("/shipment/checkout", { orders: [e.idMe] });
      e.compradaEm = new Date().toISOString();
      await salvar();
    }
    if (!e.geradaEm) {
      await me("/shipment/generate", { orders: [e.idMe] });
      e.geradaEm = new Date().toISOString();
      await salvar();
    }
    if (!e.urlImpressao) {
      const p = await me<{ url?: string }>("/shipment/print", { mode: "private", orders: [e.idMe] });
      e.urlImpressao = p.url;
    }
  } catch (erro) {
    e.erro = erro instanceof Error ? erro.message : String(erro);
  }
  return salvar();
}

type PedidoMe = { id?: string; status?: string; tracking?: string | null; posted_at?: string | null; delivered_at?: string | null };

/**
 * Lê a situação da etiqueta no Melhor Envio e anda o pedido: postado → rastreio
 * + e-mail ao cliente; entregue → pedido concluído + e-mail com a pesquisa.
 */
export async function atualizarRastreio(ref: string): Promise<RegistroPedido | null> {
  const r = await lerRegistro(ref);
  if (!r?.etiqueta?.idMe || !r.etiqueta.compradaEm) return r;
  if (r.conclusao || r.cancelamento?.concluidoEm) return r;

  let o: PedidoMe;
  try {
    o = await me<PedidoMe>(`/orders/${r.etiqueta.idMe}`);
  } catch (erro) {
    return atualizarRegistro(ref, { etiqueta: { ...r.etiqueta, erro: erro instanceof Error ? erro.message : String(erro) } });
  }
  const etiqueta = { ...r.etiqueta, situacaoMe: o.status, rastreio: o.tracking ?? r.etiqueta.rastreio, conferidaEm: new Date().toISOString(), erro: undefined };
  await atualizarRegistro(ref, { etiqueta });

  const postado = o.status === "posted" || o.status === "delivered" || Boolean(o.posted_at);
  const codigo = o.tracking ?? undefined;
  if (postado && codigo && !r.envio) {
    // Dois processos podem conferir juntos: só um manda o "postado".
    const reserva = `postado-${ref}`;
    if (await reservar(reserva)) {
      try {
        await avisarPostagemAoCliente(ref, codigo, r.etiqueta.transportadora ?? "transportadora", { automatico: true, postadoEm: o.posted_at ?? undefined });
      } catch (erro) {
        await liberar(reserva);
        throw erro;
      }
    }
  }
  if (o.status === "delivered" && (await reservar(`entregue-${ref}`))) {
    await concluirPedido(ref, "entregue");
  }
  return lerRegistro(ref);
}

/** Confere todas as etiquetas em aberto — chamado a cada hora e pela manutenção. */
export async function acompanharEtiquetas(): Promise<{ conferidas: number; erros: string[] }> {
  const abertos = (await listarRegistros(500)).filter(
    (r) => r.etiqueta?.compradaEm && !r.conclusao && !r.cancelamento?.concluidoEm && !r.estorno,
  );
  const erros: string[] = [];
  for (const r of abertos) {
    try {
      await atualizarRastreio(r.ref);
    } catch (e) {
      erros.push(`${r.ref}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }
  return { conferidas: abertos.length, erros };
}
