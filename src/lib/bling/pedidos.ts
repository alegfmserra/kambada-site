/**
 * Pedido de venda no Bling — criado SÓ depois do pagamento aprovado.
 *
 * Contrato conferido na especificação OpenAPI oficial do Bling em 08/10/2026
 * (developer.bling.com.br → openapi.json):
 *
 *   POST /pedidos/vendas — obrigatórios: contato, data, dataSaida, dataPrevista,
 *                          itens, parcelas (e cada parcela exige formaPagamento.id)
 *   GET  /pedidos/vendas?numerosLojas[]=X — busca pelo número da loja
 *   GET  /contatos?numeroDocumento=CPF    — busca contato pelo CPF
 *   POST /contatos — obrigatórios: nome, situacao, tipo
 *
 * IDEMPOTÊNCIA: o `numeroLoja` do pedido é "MP-<id do pagamento>". Antes de
 * criar, o site pergunta ao Bling se esse número já existe. O Mercado Pago
 * reenvia a mesma notificação por dias, e a página de sucesso também dispara o
 * processamento — sem esta checagem, um pagamento viraria vários pedidos, e
 * cada um baixaria estoque.
 *
 * Ao criar o pedido, quem baixa o estoque e emite a nota é o Bling — conforme
 * a configuração de lá. O site não mexe em saldo.
 */

import { chamarBling } from "./cliente";
import type { RetratoPedido } from "../checkout/pedido";
import { formatarCep } from "../checkout/cliente";
import type { Pagamento } from "../mercadopago/cliente";
import { emCentavos, emReais } from "../loja/dinheiro";

export function numeroLojaDe(pagamentoId: string | number): string {
  return `MP-${pagamentoId}`;
}

/** Data de hoje no fuso de São Luís, em AAAA-MM-DD. */
export function dataLocal(agora = new Date(), somarDias = 0): string {
  const d = new Date(agora.getTime() + somarDias * 24 * 60 * 60 * 1000);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Fortaleza", // mesmo fuso do Maranhão (UTC−3, sem horário de verão)
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

type ListaComId = { data?: { id: number }[] };

export async function buscarPedidoPorNumeroLoja(numeroLoja: string): Promise<number | null> {
  const r = await chamarBling<ListaComId>(
    `/pedidos/vendas?numerosLojas[]=${encodeURIComponent(numeroLoja)}`,
    { revalidar: 0 },
  );
  return r.data?.[0]?.id ?? null;
}

export function montarContato(cliente: RetratoPedido["cliente"]) {
  return {
    nome: cliente.nome,
    situacao: "A",
    tipo: "F",
    numeroDocumento: cliente.cpf,
    email: cliente.email,
    celular: cliente.telefone,
    // 9 = não contribuinte de ICMS — pessoa física comprando para si.
    indicadorIe: 9,
    endereco: {
      geral: {
        endereco: cliente.logradouro,
        numero: cliente.numero,
        complemento: cliente.complemento,
        bairro: cliente.bairro,
        cep: formatarCep(cliente.cep),
        municipio: cliente.cidade,
        uf: cliente.uf,
      },
    },
  };
}

export async function acharOuCriarContato(cliente: RetratoPedido["cliente"]): Promise<number> {
  const existente = await chamarBling<ListaComId>(
    `/contatos?numeroDocumento=${encodeURIComponent(cliente.cpf)}`,
    { revalidar: 0 },
  );
  const id = existente.data?.[0]?.id;
  if (id) return id;

  const criado = await chamarBling<{ data?: { id: number } }>("/contatos", {
    metodo: "POST",
    corpo: montarContato(cliente),
  });
  if (!criado.data?.id) throw new Error("Bling não devolveu o ID do contato criado");
  return criado.data.id;
}

let formaEmCache: number | null = null;

/**
 * A forma de pagamento do pedido no Bling — obrigatória em cada parcela.
 *
 * Ordem: a variável BLING_FORMA_PAGAMENTO_ID (escolha explícita, que é o
 * certo) e, na falta dela, a primeira forma cadastrada com "Mercado Pago" na
 * descrição. Se nenhuma existir, para com erro claro em vez de chutar uma.
 */
export async function idFormaDePagamento(): Promise<number> {
  const daVariavel = Number(process.env.BLING_FORMA_PAGAMENTO_ID);
  if (Number.isSafeInteger(daVariavel) && daVariavel > 0) return daVariavel;
  if (formaEmCache) return formaEmCache;

  const r = await chamarBling<{ data?: { id: number; descricao?: string }[] }>(
    `/formas-pagamentos?descricao=${encodeURIComponent("Mercado Pago")}`,
    { revalidar: 3600 },
  );
  const forma = r.data?.find((f) => /mercado\s*pago/i.test(f.descricao ?? ""));
  if (!forma) {
    throw new Error(
      "Nenhuma forma de pagamento 'Mercado Pago' no Bling. Cadastre uma ou defina BLING_FORMA_PAGAMENTO_ID.",
    );
  }
  formaEmCache = forma.id;
  return forma.id;
}

export function montarPedido(params: {
  retrato: RetratoPedido;
  pagamento: Pagamento;
  idContato: number;
  idForma: number;
  agora?: Date;
}) {
  const { retrato, pagamento, idContato, idForma, agora = new Date() } = params;
  const { cliente, frete } = retrato;
  const hoje = dataLocal(agora);
  const total = emReais(
    retrato.itens.reduce((s, i) => s + emCentavos(i.p) * i.q, 0) +
      emCentavos(frete.valor) -
      (retrato.cupom?.descontoCentavos ?? 0),
  );
  const taxaMp = (pagamento.fee_details ?? [])
    .filter((f) => f.type === "mercadopago_fee")
    .reduce((s, f) => s + f.amount, 0);

  return {
    numeroLoja: numeroLojaDe(pagamento.id),
    data: hoje,
    dataSaida: hoje,
    dataPrevista: dataLocal(agora, Math.max(1, frete.prazo || 1)),
    contato: { id: idContato },
    // Cupom: as peças vão com o preço cheio e o desconto, em reais, no pedido.
    ...(retrato.cupom
      ? { desconto: { valor: emReais(retrato.cupom.descontoCentavos), unidade: "REAL" } }
      : {}),
    itens: retrato.itens.map((i) => ({
      produto: { id: i.id },
      descricao: i.n,
      unidade: "UN",
      quantidade: i.q,
      valor: Number(i.p.toFixed(2)),
    })),
    parcelas: [
      {
        dataVencimento: hoje,
        valor: total,
        formaPagamento: { id: idForma },
        observacoes: `Mercado Pago #${pagamento.id}${
          pagamento.installments ? ` · ${pagamento.installments}x` : ""
        }${pagamento.payment_type_id ? ` · ${pagamento.payment_type_id}` : ""}`,
      },
    ],
    transporte: frete.retirada
      ? {
          // 9 = Sem Ocorrência de Transporte (especificação OpenAPI do Bling,
          // conferida em 08/10/2026): o cliente retira no ateliê, e a nota
          // sai sem transporte — decisão do Alexandre.
          fretePorConta: 9,
          frete: 0,
        }
      : {
          // 0 = frete contratado pelo remetente (CIF): a loja contrata o envio
          // pelo Melhor Envio, mesmo quando o cliente paga o valor.
          // Enquadramento fiscal final: Glauco.
          fretePorConta: 0,
          frete: Number(frete.valor.toFixed(2)),
          quantidadeVolumes: 1,
          etiqueta: {
            nome: cliente.nome,
            endereco: cliente.logradouro,
            numero: cliente.numero,
            complemento: cliente.complemento,
            municipio: cliente.cidade,
            uf: cliente.uf,
            cep: formatarCep(cliente.cep),
            bairro: cliente.bairro,
            nomePais: "BRASIL",
          },
        },
    observacoes: frete.retirada
      ? `Pedido feito no site da Kambada — ${retrato.ref}. Retirada no ateliê.`
      : `Pedido feito no site da Kambada — ${retrato.ref}.`,
    observacoesInternas: [
      `Pagamento Mercado Pago #${pagamento.id} aprovado${
        pagamento.date_approved ? ` em ${pagamento.date_approved}` : ""
      }.`,
      frete.retirada
        ? "RETIRADA NO ATELIÊ — sem frete e sem transporte. Combinar dia e horário com o cliente pelo WhatsApp."
        : `Envio escolhido: ${frete.servico} (${frete.prazo} dias úteis).`,
      frete.retirada
        ? ""
        : frete.gratis
          ? "FRETE GRÁTIS para o cliente — o custo do envio é da loja; apurar na etiqueta."
          : `Frete cobrado do cliente: R$ ${frete.valor.toFixed(2)}.`,
      taxaMp ? `Taxa Mercado Pago: R$ ${taxaMp.toFixed(2)} (custo de canal).` : "",
      `Referência do site: ${retrato.ref}.`,
    ]
      .filter(Boolean)
      .join(" "),
  };
}

export type ResultadoRegistro =
  | { situacao: "criado"; idPedido: number }
  | { situacao: "ja_existia"; idPedido: number };

/**
 * Trava em memória por pagamento: se a notificação e a página de sucesso
 * chegarem no mesmo segundo, o segundo espera o primeiro em vez de criar outro
 * pedido. A checagem no Bling cobre o resto (reinício do servidor, dias depois).
 */
const emAndamento = new Map<string, Promise<ResultadoRegistro>>();

export function registrarPedidoNoBling(
  retrato: RetratoPedido,
  pagamento: Pagamento,
): Promise<ResultadoRegistro> {
  const chave = numeroLojaDe(pagamento.id);
  const andamento = emAndamento.get(chave);
  if (andamento) return andamento;

  const trabalho = (async (): Promise<ResultadoRegistro> => {
    const existente = await buscarPedidoPorNumeroLoja(chave);
    if (existente) return { situacao: "ja_existia", idPedido: existente };

    const [idContato, idForma] = await Promise.all([
      acharOuCriarContato(retrato.cliente),
      idFormaDePagamento(),
    ]);
    const criado = await chamarBling<{ data?: { id: number } }>("/pedidos/vendas", {
      metodo: "POST",
      corpo: montarPedido({ retrato, pagamento, idContato, idForma }),
    });
    if (!criado.data?.id) throw new Error("Bling não devolveu o ID do pedido criado");
    return { situacao: "criado", idPedido: criado.data.id };
  })().finally(() => emAndamento.delete(chave));

  emAndamento.set(chave, trabalho);
  return trabalho;
}
