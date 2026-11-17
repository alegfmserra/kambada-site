import type { Produto } from "../catalogo";
import { compararOpcoes } from "./ordemOpcoes";

/**
 * Filtros e ordenação das categorias (17/11/2026).
 *
 * Só existe filtro que os dados sustentam. O catálogo não tem data de cadastro,
 * então não há "Mais novos": a ordem padrão é a da vitrine. Público e tamanho
 * saem do nome da peça e das opções com estoque, e só nas Camisas, a única
 * categoria que mistura adulto, infantil e babylook.
 *
 * Arquivo puro (vai ao navegador): nada de módulo de servidor aqui.
 */

export type Publico = "adulto" | "infantil" | "babylook";

export const ROTULO_DO_PUBLICO: Record<Publico, string> = {
  adulto: "Adulto",
  infantil: "Infantil",
  babylook: "Babylook",
};

export type Ordem = "vitrine" | "preco" | "preco-desc";

export const ORDENS: { valor: Ordem; rotulo: string }[] = [
  { valor: "vitrine", rotulo: "Ordem da vitrine" },
  { valor: "preco", rotulo: "Menor preço" },
  { valor: "preco-desc", rotulo: "Maior preço" },
];

/** Categorias em que público e tamanho viram filtro. */
const COM_PUBLICO_E_TAMANHO = new Set(["camisas"]);

const TAMANHOS_DE_ROUPA = ["PP", "P", "M", "G", "GG", "XG", "XGG", "EG", "EGG", "XXG"];

/**
 * O tamanho escrito num rótulo de opção: "Off White GG" → "GG", "Preta 6 anos"
 * → "6 anos", "Tamanho:M" já chega como "M". Rótulo sem tamanho (uma cor, uma
 * estampa, "Único") devolve null.
 */
export function tamanhoDoRotulo(rotulo: string): string | null {
  const texto = rotulo.trim();
  const idade = texto.match(/(\d{1,2})\s*anos?$/i);
  if (idade) return `${Number(idade[1])} anos`;
  const ultima = texto.split(/[\s·]+/).pop()?.toUpperCase() ?? "";
  return TAMANHOS_DE_ROUPA.includes(ultima) ? ultima : null;
}

/** Os rótulos das opções que podem ser compradas agora (com saldo, ou peça feita por encomenda). */
function rotulosDisponiveis(produto: Produto): string[] {
  if (produto.opcoes?.length) {
    const semLimite = Boolean(produto.sobEncomenda || produto.estoqueLivre);
    return produto.opcoes.filter((o) => semLimite || o.quantidade > 0).flatMap((o) => [o.atributos?.tamanho ?? o.rotulo]);
  }
  // Catálogo de reserva: não há saldo por opção; vale a lista contada no estoque.
  return produto.quantidade > 0 ? produto.variacoes : [];
}

/** Tamanhos disponíveis da peça, na ordem de uma arara (P → XG, 2 → 14 anos). */
export function tamanhosDaPeca(produto: Produto): string[] {
  const achados = rotulosDisponiveis(produto).map(tamanhoDoRotulo).filter((t): t is string => t !== null);
  return [...new Set(achados)].sort(compararOpcoes);
}

/**
 * Para quem é a camisa. Infantil: o nome diz ("Infantil") ou os tamanhos são
 * em anos (a Revoadinha e o Cazumbázinho não têm "Infantil" no nome). Babylook:
 * o nome diz. O resto é adulto.
 */
export function publicoDaPeca(produto: Produto): Publico {
  if (/baby\s*look/i.test(produto.nome)) return "babylook";
  const emAnos = [...produto.variacoes, ...(produto.opcoes ?? []).map((o) => o.rotulo)].some((r) => /\d\s*anos?$/i.test(r.trim()));
  if (/infantil/i.test(produto.nome) || emAnos) return "infantil";
  return "adulto";
}

/** O que a vitrine precisa saber de cada peça para filtrar e ordenar (vai ao navegador). */
export type ItemFiltravel = { preco: number; publico?: Publico; tamanhos: string[] };

export function itensFiltraveis(categoria: string, produtos: Produto[]): ItemFiltravel[] {
  const comFiltro = COM_PUBLICO_E_TAMANHO.has(categoria);
  return produtos.map((p) => ({
    preco: p.preco,
    ...(comFiltro ? { publico: publicoDaPeca(p) } : {}),
    tamanhos: comFiltro ? tamanhosDaPeca(p) : [],
  }));
}

export type Escolha = { publico: Publico | null; tamanho: string | null; ordem: Ordem };

export const SEM_ESCOLHA: Escolha = { publico: null, tamanho: null, ordem: "vitrine" };

/** Públicos presentes na lista, na ordem fixa. Um só público não é filtro: devolve vazio. */
export function publicosDaLista(itens: ItemFiltravel[]): Publico[] {
  const presentes = (Object.keys(ROTULO_DO_PUBLICO) as Publico[]).filter((p) => itens.some((i) => i.publico === p));
  return presentes.length >= 2 ? presentes : [];
}

/** Tamanhos disponíveis dentro do público escolhido (ou de todos). Um só tamanho não é filtro. */
export function tamanhosDaLista(itens: ItemFiltravel[], publico: Publico | null): string[] {
  const doPublico = publico ? itens.filter((i) => i.publico === publico) : itens;
  const todos = [...new Set(doPublico.flatMap((i) => i.tamanhos))].sort(compararOpcoes);
  return todos.length >= 2 ? todos : [];
}

/** Lê a escolha da URL, descartando o que não existe na lista (link antigo, digitado à mão). */
export function lerEscolha(parametros: URLSearchParams, itens: ItemFiltravel[]): Escolha {
  const p = parametros.get("publico");
  const publico = publicosDaLista(itens).find((x) => x === p) ?? null;
  const t = (parametros.get("tamanho") ?? "").trim().toLowerCase();
  const tamanho = tamanhosDaLista(itens, publico).find((x) => x.toLowerCase() === t) ?? null;
  const o = parametros.get("ordem");
  const ordem = ORDENS.find((x) => x.valor === o)?.valor ?? "vitrine";
  return { publico, tamanho, ordem };
}

/** A escolha como parâmetros de URL (vazio quando é o padrão), para o link poder ser compartilhado. */
export function escolhaParaUrl(escolha: Escolha): string {
  const q = new URLSearchParams();
  if (escolha.publico) q.set("publico", escolha.publico);
  if (escolha.tamanho) q.set("tamanho", escolha.tamanho);
  if (escolha.ordem !== "vitrine") q.set("ordem", escolha.ordem);
  return q.toString();
}

export const temFiltro = (e: Escolha) => e.publico !== null || e.tamanho !== null || e.ordem !== "vitrine";

/** Os índices das peças que passam no filtro, já na ordem pedida (empate mantém a ordem da vitrine). */
export function aplicar(itens: ItemFiltravel[], escolha: Escolha): number[] {
  const indices = itens
    .map((_, i) => i)
    .filter((i) => (!escolha.publico || itens[i].publico === escolha.publico) && (!escolha.tamanho || itens[i].tamanhos.includes(escolha.tamanho)));
  if (escolha.ordem === "preco") indices.sort((a, b) => itens[a].preco - itens[b].preco || a - b);
  if (escolha.ordem === "preco-desc") indices.sort((a, b) => itens[b].preco - itens[a].preco || a - b);
  return indices;
}
