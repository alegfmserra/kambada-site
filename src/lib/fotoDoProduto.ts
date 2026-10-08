/**
 * A foto de um produto no site.
 *
 * As fotos moram em public/fotos/produtos/<id do Bling>.jpg — os MESMOS
 * arquivos que o Bling baixa para si. O site as serve direto, sem depender do
 * link do Bling: o link de imagem do Bling é assinado e expira em dias, e
 * consultá-lo pediria uma chamada à API por produto a cada atualização do
 * catálogo. Servir daqui é mais rápido e não gasta a cota do Bling.
 *
 * Consequência a lembrar: trocar uma foto SÓ no painel do Bling não muda o
 * site. Para trocar nos dois, use o script (ver docs/fotos.md).
 */

import type { Produto } from "./catalogo";
import { FOTOS_PRODUTOS } from "./fotosProdutos";

export type FotoProduto = { src: string; largura: number; altura: number };

function porId(id: number | undefined): FotoProduto | null {
  if (!id) return null;
  const m = FOTOS_PRODUTOS[id];
  return m ? { src: `/fotos/produtos/${id}.jpg`, largura: m.largura, altura: m.altura } : null;
}

/** Foto do produto; sem ela, a da primeira variação que tiver uma. */
export function fotoDoProduto(produto: Produto): FotoProduto | null {
  return (
    porId(produto.idBling) ??
    (produto.opcoes ?? []).map((o) => porId(o.idBling)).find((f) => f !== null) ??
    null
  );
}

/** Foto de um item do carrinho: a da variação, senão a do produto-pai. */
export function fotoDoItem(idOpcao: number, slug: string): FotoProduto | null {
  const idPai = Number(slug.match(/-(\d+)$/)?.[1]);
  return porId(idOpcao) ?? porId(Number.isSafeInteger(idPai) ? idPai : undefined);
}
