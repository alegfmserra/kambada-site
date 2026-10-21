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
 *
 * Matracas (migração de 21/10/2026): os pais novos nascem sem foto por ID.
 * Até ganharem a deles, herdam a dos pais antigos (HERANCA_DE_FOTOS), e cada
 * variação mostra a foto da ESTAMPA (scripts/preparar-fotos-estampas.mjs).
 */

import type { Opcao, Produto } from "./catalogo";
import { HERANCA_DE_FOTOS, paraSlug } from "./bling/migracao-matracas-2026-10-21";
import { FOTOS_ESTAMPAS } from "./fotosEstampas";
import { FOTOS_PRODUTOS, GALERIA_PRODUTOS } from "./fotosProdutos";

export type FotoProduto = { src: string; largura: number; altura: number };

function porId(id: number | undefined): FotoProduto | null {
  if (!id) return null;
  const m = FOTOS_PRODUTOS[id];
  return m ? { src: `/fotos/produtos/${id}.jpg${m.v ? `?v=${m.v}` : ""}`, largura: m.largura, altura: m.altura } : null;
}

function galeriaPorId(id: number): FotoProduto[] {
  return (GALERIA_PRODUTOS[id] ?? []).map((g) => ({ src: `/fotos/produtos/galeria/${id}-${g.n}.jpg${g.v ? `?v=${g.v}` : ""}`, largura: g.largura, altura: g.altura }));
}

/** "matraca-kambada-mini-16722270999" → "matraca-kambada-mini". */
const semId = (slug: string) => slug.replace(/-\d+$/, "");

/** IDs antigos de onde o produto herda foto, pelo slug (vazio para quem tem foto própria). */
function herdados(slug: string): number[] {
  return HERANCA_DE_FOTOS[semId(slug)] ?? [];
}

/**
 * Foto da estampa desta opção: primeiro a do suporte escolhido, depois a da
 * estampa em qualquer suporte. Sem atributos (variação de um atributo só,
 * como o DTF), o próprio rótulo é a estampa.
 */
function porEstampa(slugDoProduto: string, opcao: Opcao): FotoProduto | null {
  const estampa = opcao.atributos?.estampa ?? (opcao.atributos ? undefined : opcao.rotulo);
  if (!estampa || estampa === "Único") return null;
  const base = `${semId(slugDoProduto)}/${paraSlug(estampa)}`;
  const suporte = opcao.atributos?.suporte;
  // Leque Bordado / Topo Boi Preto (Grande): sem foto própria da combinação, vale a
  // da estampa com suporte; depois a da estampa; por último qualquer uma dela.
  const comAlgumSuporte = suporte && !/^sem\b/i.test(suporte);
  return (
    (suporte ? FOTOS_ESTAMPAS[`${base}/${paraSlug(suporte)}`] : undefined) ??
    (comAlgumSuporte ? FOTOS_ESTAMPAS[`${base}/com-suporte`] : undefined) ??
    FOTOS_ESTAMPAS[base] ??
    FOTOS_ESTAMPAS[`${base}/sem-suporte`] ??
    FOTOS_ESTAMPAS[`${base}/com-suporte`] ??
    null
  );
}

/** Foto do produto; sem ela, a da primeira variação que tiver uma; depois a herdada. */
export function fotoDoProduto(produto: Produto): FotoProduto | null {
  return (
    porId(produto.idBling) ??
    (produto.opcoes ?? []).map((o) => porId(o.idBling)).find((f) => f !== null) ??
    herdados(produto.slug).map(porId).find((f) => f !== null) ??
    (produto.opcoes ?? []).map((o) => porEstampa(produto.slug, o)).find((f) => f !== null) ??
    null
  );
}

/** Foto de um item do carrinho: a da variação, senão a do produto-pai, senão a herdada. */
export function fotoDoItem(idOpcao: number, slug: string): FotoProduto | null {
  const idPai = Number(slug.match(/-(\d+)$/)?.[1]);
  return (
    porId(idOpcao) ??
    porId(Number.isSafeInteger(idPai) ? idPai : undefined) ??
    herdados(slug).map(porId).find((f) => f !== null) ??
    null
  );
}

/**
 * Foto de uma opção na página do produto (troca ao escolher): a da própria
 * variação; senão a da estampa; senão null (fica a foto do produto).
 */
export function fotoDaOpcao(produto: Produto, opcao: Opcao): FotoProduto | null {
  return porId(opcao.idBling) ?? porEstampa(produto.slug, opcao);
}

/** Fotos extras do produto (galeria), na ordem em que foram publicadas. Vazio quando só há a principal. */
export function galeriaDoProduto(produto: Produto): FotoProduto[] {
  const id = produto.idBling;
  if (!id) return [];
  if (GALERIA_PRODUTOS[id] || FOTOS_PRODUTOS[id]) return galeriaPorId(id);
  // Pai novo sem foto própria: galeria dos antigos (o primeiro dá a principal).
  const [primeiro, ...outros] = herdados(produto.slug);
  if (primeiro === undefined) return [];
  return [...galeriaPorId(primeiro), ...outros.flatMap((o) => [porId(o), ...galeriaPorId(o)])].filter(
    (f): f is FotoProduto => f !== null,
  );
}
