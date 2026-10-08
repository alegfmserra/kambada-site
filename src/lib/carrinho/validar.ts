/**
 * Validação do carrinho NO SERVIDOR — a única que vale para cobrar.
 *
 * Do navegador, aceitamos apenas pares {idBling, quantidade}. Nome, preço,
 * rótulo e embalagem saem do catálogo do Bling, consultado aqui. Assim, o
 * valor que vai para o Mercado Pago e para o pedido no Bling é sempre o do ERP.
 */

import type { Catalogo } from "../bling/produtos";
import type { Opcao, Produto } from "../catalogo";
import { embalagemDe, type Embalagem } from "../frete/embalagens";
import { emCentavos } from "../loja/dinheiro";
import { MAXIMO_POR_ITEM } from "./logica";

export type PedidoDoCliente = { idBling: number; quantidade: number }[];

export type ItemValidado = {
  idBling: number;
  slug: string;
  categoria: string;
  nome: string;
  rotulo: string;
  precoUnitario: number;
  quantidade: number;
  embalagem: Embalagem;
};

export type ResultadoValidacao = {
  itens: ItemValidado[];
  problemas: string[];
  subtotalCentavos: number;
};

/** Teto de itens distintos num pedido. Protege a API de payload absurdo. */
const MAXIMO_DE_LINHAS = 30;

export function lerPedidoDoCliente(bruto: unknown): PedidoDoCliente | null {
  if (!Array.isArray(bruto) || bruto.length === 0 || bruto.length > MAXIMO_DE_LINHAS) {
    return null;
  }
  const itens: PedidoDoCliente = [];
  for (const i of bruto) {
    if (typeof i !== "object" || i === null) return null;
    const { idBling, quantidade } = i as Record<string, unknown>;
    if (!Number.isSafeInteger(idBling) || (idBling as number) <= 0) return null;
    if (!Number.isInteger(quantidade) || (quantidade as number) < 1) return null;
    itens.push({ idBling: idBling as number, quantidade: quantidade as number });
  }
  return itens;
}

export function indexarOpcoes(catalogo: Catalogo): Map<number, { produto: Produto; opcao: Opcao }> {
  const indice = new Map<number, { produto: Produto; opcao: Opcao }>();
  for (const produto of catalogo.produtos) {
    for (const opcao of produto.opcoes ?? []) indice.set(opcao.idBling, { produto, opcao });
  }
  return indice;
}

export function validarCarrinho(
  pedido: PedidoDoCliente,
  catalogo: Catalogo,
): ResultadoValidacao {
  const indice = indexarOpcoes(catalogo);
  const itens: ItemValidado[] = [];
  const problemas: string[] = [];

  // A mesma opção duas vezes vira uma linha só — soma as quantidades.
  const somado = new Map<number, number>();
  for (const { idBling, quantidade } of pedido) {
    somado.set(idBling, (somado.get(idBling) ?? 0) + quantidade);
  }

  for (const [idBling, quantidade] of somado) {
    const achado = indice.get(idBling);
    if (!achado) {
      problemas.push("Uma das peças do carrinho não está mais à venda.");
      continue;
    }
    const { produto, opcao } = achado;
    const nome = opcao.rotulo === "Único" ? produto.nome : `${produto.nome} (${opcao.rotulo})`;

    const embalagem = embalagemDe(produto, opcao);
    if (!embalagem) {
      problemas.push(`${nome}: esta peça é vendida pelo WhatsApp.`);
      continue;
    }
    if (quantidade > MAXIMO_POR_ITEM) {
      problemas.push(`${nome}: o máximo por pedido é ${MAXIMO_POR_ITEM} unidades.`);
      continue;
    }
    if (opcao.quantidade < quantidade) {
      problemas.push(
        opcao.quantidade <= 0
          ? `${nome}: esgotou.`
          : `${nome}: só temos ${opcao.quantidade} em estoque.`,
      );
      continue;
    }

    itens.push({
      idBling,
      slug: produto.slug,
      categoria: produto.categoria,
      nome: produto.nome,
      rotulo: opcao.rotulo,
      precoUnitario: opcao.preco,
      quantidade,
      embalagem,
    });
  }

  const subtotalCentavos = itens.reduce(
    (soma, i) => soma + emCentavos(i.precoUnitario) * i.quantidade,
    0,
  );
  return { itens, problemas, subtotalCentavos };
}
