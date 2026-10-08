/**
 * Lógica pura do carrinho — sem React, sem navegador, para poder ser testada.
 *
 * O carrinho mora no navegador do cliente (localStorage). O preço que ele
 * guarda serve SÓ para exibir. Na hora de cobrar, o servidor descarta esse
 * número e reconsulta o catálogo (ver `validar.ts`): qualquer um pode editar
 * o localStorage e mandar uma camisa a R$ 0,01.
 */

import { emCentavos } from "../loja/dinheiro";

export type ItemCarrinho = {
  /** ID da OPÇÃO no Bling (o tamanho/estampa), não do produto-pai. */
  idBling: number;
  slug: string;
  categoria: string;
  nome: string;
  rotulo: string;
  /** Só para exibir. O servidor nunca confia neste valor. */
  preco: number;
  quantidade: number;
  /** Saldo visto na página do produto — teto local, reconferido no servidor. */
  estoque: number;
};

/**
 * Teto por item. Peça pintada à mão sai em lote pequeno; acima disso é
 * encomenda, e encomenda é conversa no WhatsApp, não carrinho.
 */
export const MAXIMO_POR_ITEM = 10;

function limitar(quantidade: number, estoque: number): number {
  const teto = Math.min(MAXIMO_POR_ITEM, Math.max(0, Math.floor(estoque)));
  return Math.max(0, Math.min(Math.floor(quantidade), teto));
}

export function adicionar(itens: ItemCarrinho[], novo: ItemCarrinho): ItemCarrinho[] {
  const existente = itens.find((i) => i.idBling === novo.idBling);
  if (!existente) {
    const quantidade = limitar(novo.quantidade, novo.estoque);
    return quantidade > 0 ? [...itens, { ...novo, quantidade }] : itens;
  }
  return itens.map((i) =>
    i.idBling === novo.idBling
      ? {
          ...i,
          // Preço e estoque mais recentes vencem: o cliente acabou de ver a página.
          preco: novo.preco,
          estoque: novo.estoque,
          quantidade: limitar(i.quantidade + novo.quantidade, novo.estoque),
        }
      : i,
  );
}

export function alterarQuantidade(
  itens: ItemCarrinho[],
  idBling: number,
  quantidade: number,
): ItemCarrinho[] {
  return itens
    .map((i) => (i.idBling === idBling ? { ...i, quantidade: limitar(quantidade, i.estoque) } : i))
    .filter((i) => i.quantidade > 0);
}

export function remover(itens: ItemCarrinho[], idBling: number): ItemCarrinho[] {
  return itens.filter((i) => i.idBling !== idBling);
}

export function subtotalEmCentavos(itens: ItemCarrinho[]): number {
  return itens.reduce((soma, i) => soma + emCentavos(i.preco) * i.quantidade, 0);
}

export function totalDePecas(itens: ItemCarrinho[]): number {
  return itens.reduce((soma, i) => soma + i.quantidade, 0);
}

/**
 * Lê o que veio do localStorage sem confiar no formato: dado salvo por uma
 * versão antiga do site, ou editado à mão, não pode derrubar a página.
 */
export function lerCarrinhoSalvo(bruto: unknown): ItemCarrinho[] {
  if (!Array.isArray(bruto)) return [];
  return bruto
    .filter(
      (i): i is ItemCarrinho =>
        typeof i === "object" &&
        i !== null &&
        Number.isInteger((i as ItemCarrinho).idBling) &&
        typeof (i as ItemCarrinho).nome === "string" &&
        typeof (i as ItemCarrinho).slug === "string" &&
        typeof (i as ItemCarrinho).categoria === "string" &&
        typeof (i as ItemCarrinho).preco === "number" &&
        Number.isInteger((i as ItemCarrinho).quantidade),
    )
    .map((i) => ({
      ...i,
      rotulo: typeof i.rotulo === "string" ? i.rotulo : "",
      estoque: typeof i.estoque === "number" ? i.estoque : MAXIMO_POR_ITEM,
    }))
    .map((i) => ({ ...i, quantidade: limitar(i.quantidade, i.estoque) }))
    .filter((i) => i.quantidade > 0);
}

/**
 * A mensagem do pedido completo, já com a entrega cotada — usada enquanto o
 * pagamento pelo site não estiver ligado. O cliente chega ao WhatsApp sabendo
 * o total, e a loja recebe o pedido pronto para fechar.
 *
 * Não leva CPF: na conversa ele é pedido só se for emitir nota.
 */
export function mensagemWhatsAppPedido(
  itens: ItemCarrinho[],
  entrega: { descricao: string; preco: number; prazoDias: number; gratis: boolean },
  cliente: { nome: string; cep: string; cidade: string; uf: string },
): string {
  const real = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const linhas = itens.map(
    (i) =>
      `• ${i.quantidade}× ${i.nome}${i.rotulo && i.rotulo !== "Único" ? ` (${i.rotulo})` : ""} — ${real(
        emCentavos(i.preco) * i.quantidade / 100,
      )}`,
  );
  const total = (subtotalEmCentavos(itens) + emCentavos(entrega.preco)) / 100;
  return [
    "Oi! Quero fechar este pedido pelo site:",
    ...linhas,
    `Entrega: ${entrega.descricao} — ${entrega.gratis ? "grátis" : real(entrega.preco)} (até ${entrega.prazoDias} dias úteis)`,
    `Total: ${real(total)}`,
    "",
    `Nome: ${cliente.nome}`,
    `CEP: ${cliente.cep}${cliente.cidade ? ` — ${cliente.cidade}/${cliente.uf}` : ""}`,
  ].join("\n");
}

/** A mensagem de WhatsApp com o carrinho inteiro — o plano B de toda compra. */
export function mensagemWhatsApp(itens: ItemCarrinho[]): string {
  const linhas = itens.map(
    (i) =>
      `• ${i.quantidade}× ${i.nome}${i.rotulo && i.rotulo !== "Único" ? ` (${i.rotulo})` : ""}`,
  );
  return ["Oi! Quero fechar este pedido:", ...linhas, "", "Pode me passar o total com o frete?"].join(
    "\n",
  );
}
