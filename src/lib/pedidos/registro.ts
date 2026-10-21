/**
 * Registro dos pedidos do site — a memória própria da loja.
 *
 * Pedido do Alexandre (08/10/2026): guardar os dados de cada venda para o
 * acompanhamento e para a página de controle. O site não tem banco de dados;
 * cada pedido vira um arquivo JSON na mesma pasta persistente das chaves do
 * Bling (fora da pasta da aplicação, então sobrevive a cada deploy).
 *
 * LGPD — guarda só o necessário para acompanhar e controlar: nome, e-mail,
 * itens, entrega e totais. CPF, telefone e endereço NÃO entram aqui: estão no
 * Bling, onde a nota fiscal precisa deles.
 *
 * Os campos `estoque`, `email` e `nfe` registram o que já foi feito depois da
 * venda — é o que impede baixar estoque ou mandar e-mail duas vezes.
 */

import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { arquivoTokens } from "../bling/tokens";

export type Etapa = { feitoEm?: string; erro?: string; detalhe?: string };

export type RegistroPedido = {
  ref: string;
  pagamentoId: number;
  criadoEm: string;
  cliente: { nome: string; email: string };
  itens: { id: number; nome: string; quantidade: number; preco: number }[];
  entrega: { descricao: string; valor: number; retirada: boolean; prazoDias: number };
  total: number;
  pagamento: { tipo?: string; parcelas?: number; taxa?: number };
  bling: { idPedido: number };
  /** Cupom usado — desconto em reais sobre as peças; parceiro/comissão para o relatório. */
  cupom?: { codigo: string; percentual: number; desconto: number; parceiro?: string; comissaoPercentual?: number };
  estoque?: Etapa;
  email?: Etapa;
  /** Aviso "novo pedido pago" à caixa da loja. */
  emailLoja?: Etapa;
  nfe?: Etapa & { idNota?: number };
  /** E-mail da nota autorizada (PDF + XML) ao cliente, com cópia oculta à loja. */
  emailNota?: Etapa;
  /**
   * Pagamento devolvido (refunded), contestado (charged_back) ou cancelado depois
   * de aprovado. O site só registra e avisa a loja: cancelar o pedido no Bling,
   * a nota e devolver o estoque é decisão humana (com o Glauco, na nota).
   */
  estorno?: { status: string; detectadoEm: string; avisoLoja?: Etapa };
  /** Postagem informada na área de controle e aviso "postamos" ao cliente. */
  envio?: { codigo: string; transportadora: string; postadoEm: string; email?: Etapa; bling?: Etapa; automatico?: boolean };
  /**
   * Etiqueta comprada pelo site no Melhor Envio (saldo da carteira). O
   * acompanhamento lê a situação lá: postado → avisa o cliente; entregue →
   * conclui o pedido e manda o e-mail com a pesquisa.
   */
  etiqueta?: {
    idMe?: string;
    servicoId?: number;
    servico?: string;
    transportadora?: string;
    valor?: number;
    noCarrinhoEm?: string;
    compradaEm?: string;
    geradaEm?: string;
    urlImpressao?: string;
    situacaoMe?: string;
    rastreio?: string;
    conferidaEm?: string;
    erro?: string;
  };
  /**
   * Nota fiscal de devolução (entrada, finalidade devolução), sempre
   * referenciando a nota de venda. Criada pelo site no Bling e enviada à SEFAZ
   * só depois de a loja conferir (lib/fiscal/devolucao.ts).
   */
  devolucao?: {
    idNota?: number;
    criadaEm?: string;
    referencia?: string;
    enviadaEm?: string;
    numero?: string;
    situacao?: number;
    erro?: string;
    /** Arrependimento: peça recebida de volta no ateliê. */
    pecaRecebidaEm?: string;
  };
  /**
   * Peça sob encomenda que começou a ser feita (área de controle). Com a
   * produção iniciada o pedido não se cancela mais (21/10/2026).
   */
  producao?: { iniciadaEm: string; personalizado: boolean; email?: Etapa };
  /**
   * Problema na entrega (Fase C): não entregue / devolvido ao remetente
   * (detectado no Melhor Envio) ou extravio (marcado pela loja).
   */
  problemaEntrega?: {
    tipo: "nao-entregue" | "devolvido" | "extravio";
    origem: "melhor-envio" | "loja";
    detectadoEm: string;
    observacao?: string;
    avisoLoja?: Etapa;
    resolvidoEm?: string;
  };
  /** Troca de peça (tamanho/cor): estoque da antiga volta, o da nova sai (Fase C). */
  trocas?: { em: string; de: { id: number; nome: string }; para: { id: number; nome: string }; quantidade: number; estoque?: Etapa }[];
  /** Retirada: a loja avisou que o pedido está pronto no ateliê. */
  prontoParaRetirada?: { em: string; email?: Etapa };
  /** Fim do pós-venda: entregue pela transportadora/em mãos ou retirado no ateliê. */
  conclusao?: { tipo: "entregue" | "retirado"; em: string; bling?: Etapa; email?: Etapa };
  /**
   * Cancelamento pedido pelo cliente (página do pedido) e/ou feito pela loja
   * (área de controle). Cada etapa guarda o que já foi feito: refazer não
   * estorna nem devolve estoque duas vezes.
   */
  cancelamento?: {
    solicitadoEm?: string;
    motivo?: string;
    origem: "cliente" | "loja";
    avisoLoja?: Etapa;
    confirmacaoCliente?: Etapa;
    concluidoEm?: string;
    estornoMp?: Etapa;
    /** Valor retido (desenvolvimento da arte de personalizada cancelada antes da produção). */
    retido?: number;
    estoqueBling?: Etapa;
    pedidoBling?: Etapa;
    /** Etiqueta do Melhor Envio cancelada (valor de volta à carteira). */
    etiquetaMe?: Etapa;
    /** NF-e: cancelar no Bling (até 24 h) ou nota de devolução com o Glauco. */
    nota?: { acao: "sem-nota" | "cancelar-no-bling" | "devolucao-com-glauco"; resolvidaEm?: string };
    emailCliente?: Etapa;
  };
};

const FORMATO_REF = /^KMB-\d{8}-[0-9A-F]{6}$/;

export function pastaDosPedidos(): string {
  return process.env.PEDIDOS_PASTA ?? join(dirname(arquivoTokens()), "pedidos");
}

function arquivoDo(ref: string): string {
  // A referência vira nome de arquivo: só passa o formato exato, nada de "../".
  if (!FORMATO_REF.test(ref)) throw new Error(`referência inválida: ${ref}`);
  return join(pastaDosPedidos(), `${ref}.json`);
}

export async function lerRegistro(ref: string): Promise<RegistroPedido | null> {
  try {
    return JSON.parse(await readFile(arquivoDo(ref), "utf8")) as RegistroPedido;
  } catch {
    return null;
  }
}

/** Grava em arquivo temporário e renomeia: um arquivo nunca fica pela metade. */
export async function salvarRegistro(r: RegistroPedido): Promise<void> {
  const destino = arquivoDo(r.ref);
  await mkdir(dirname(destino), { recursive: true });
  const temporario = `${destino}.${process.pid}.tmp`;
  await writeFile(temporario, JSON.stringify(r, null, 2), "utf8");
  await rename(temporario, destino);
  listaEmMemoria = null;
}

export async function atualizarRegistro(
  ref: string,
  mudanca: Partial<RegistroPedido>,
): Promise<RegistroPedido | null> {
  const atual = await lerRegistro(ref);
  if (!atual) return null;
  const novo = { ...atual, ...mudanca };
  await salvarRegistro(novo);
  return novo;
}

/**
 * Lista em memória: reler todos os arquivos a cada consulta de cupom era
 * O(n) de disco por tecla digitada. A chave é a lista de nomes da pasta;
 * qualquer gravação (salvarRegistro) invalida.
 */
let listaEmMemoria: { chave: string; registros: RegistroPedido[] } | null = null;

/** Os pedidos mais recentes primeiro. */
export async function listarRegistros(limite = 100): Promise<RegistroPedido[]> {
  let nomes: string[];
  try {
    nomes = (await readdir(pastaDosPedidos())).filter((n) => /^KMB-.*\.json$/.test(n)).sort();
  } catch {
    return [];
  }
  const chave = nomes.join("|");
  if (!listaEmMemoria || listaEmMemoria.chave !== chave) {
    const registros = await Promise.all(nomes.map((n) => lerRegistro(n.replace(/\.json$/, ""))));
    listaEmMemoria = {
      chave,
      registros: registros
        .filter((r): r is RegistroPedido => r !== null)
        .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm)),
    };
  }
  return listaEmMemoria.registros.slice(0, limite);
}
