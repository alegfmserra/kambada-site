import type { Categoria, Produto } from "../catalogo";
import {
  CATEGORIAS as CATEGORIAS_LOCAIS,
  PRODUTOS as PRODUTOS_LOCAIS,
} from "../catalogo";
import { chamarBling, listarTudo } from "./cliente";
import type { CategoriaBling, ProdutoBling } from "./tipos";
import { estaAutorizado } from "./tokens";

/**
 * Traz o catálogo do Bling e o converte para o formato que o site já usa.
 *
 * Regra de ouro: **a loja nunca fica fora do ar por causa do Bling.** Se o
 * aplicativo não estiver autorizado, se a API cair ou se o limite estourar,
 * o site serve o catálogo local — o mesmo que veio da planilha. É pior
 * mostrar preço velho do que mostrar uma página de erro para quem quer comprar.
 *
 * Toda resposta vem marcada com a origem, para o site poder avisar quando
 * estiver exibindo dado que não veio do Bling.
 */

export type Catalogo = {
  categorias: Categoria[];
  produtos: Produto[];
  origem: "bling" | "local";
  /** Preenchido quando caímos para o local por causa de uma falha. */
  motivo?: string;
};

function comAcentoNormalizado(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function paraSlug(texto: string): string {
  return comAcentoNormalizado(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * As categorias do site NÃO vêm do Bling — são curadoria nossa.
 *
 * O Bling tem só `descricao`; a chamada de cada vitrine e a foto foram
 * escolhidas à mão. Se as categorias viessem de lá, uma renomeação no ERP
 * apagaria esse trabalho e deixaria a loja com seções sem texto e sem imagem.
 *
 * Então a lista local manda, e o que vem do Bling são os **produtos**,
 * encaixados nas categorias pelo slug da descrição.
 */
function slugDaCategoriaBling(
  categorias: CategoriaBling[],
): Map<number, string> {
  return new Map(categorias.map((c) => [c.id, paraSlug(c.descricao)]));
}

function precoDoProduto(p: ProdutoBling): number {
  if (typeof p.preco === "number" && p.preco > 0) return p.preco;
  const precosDeVariacao = (p.variacoes ?? [])
    .map((v) => v.preco)
    .filter((v): v is number => typeof v === "number" && v > 0);
  return precosDeVariacao.length ? Math.min(...precosDeVariacao) : 0;
}

function precoMaximoDoProduto(p: ProdutoBling): number | undefined {
  const precos = (p.variacoes ?? [])
    .map((v) => v.preco)
    .filter((v): v is number => typeof v === "number" && v > 0);
  if (precos.length < 2) return undefined;
  const maior = Math.max(...precos);
  return maior > precoDoProduto(p) ? maior : undefined;
}

export function converterProduto(
  p: ProdutoBling,
  slugCategoria: string,
): Produto {
  const variacoes = (p.variacoes ?? []).map((v) => v.nome).filter(Boolean);

  return {
    slug: paraSlug(`${p.nome}-${p.id}`),
    nome: p.nome,
    categoria: slugCategoria,
    preco: precoDoProduto(p),
    precoMaximo: precoMaximoDoProduto(p),
    variacoes: variacoes.length ? variacoes : ["Único"],
    quantidade: p.estoque?.saldoVirtualTotal ?? 0,
  };
}

const CATALOGO_LOCAL: Catalogo = {
  categorias: CATEGORIAS_LOCAIS,
  produtos: PRODUTOS_LOCAIS,
  origem: "local",
};

export async function buscarCatalogo(): Promise<Catalogo> {
  if (!(await estaAutorizado())) {
    return {
      ...CATALOGO_LOCAL,
      motivo: "Aplicativo ainda não autorizado no Bling",
    };
  }

  try {
    const [categoriasBling, produtosBling] = await Promise.all([
      listarTudo<CategoriaBling>("/categorias/produtos"),
      listarTudo<ProdutoBling>("/produtos?criterio=2"), // 2 = somente ativos
    ]);

    const slugPorId = slugDaCategoriaBling(categoriasBling);
    const slugsConhecidos = new Set(CATEGORIAS_LOCAIS.map((c) => c.slug));

    const produtos = produtosBling
      .filter((p) => p.formato !== "V") // variação some: entra no produto-pai
      .map((p) => converterProduto(p, slugPorId.get(p.categoria?.id ?? -1) ?? ""))
      // Produto de categoria que a vitrine não tem ficaria órfão, sem página
      // onde aparecer. Fica de fora até a categoria ser criada aqui.
      .filter((p) => slugsConhecidos.has(p.categoria) && p.preco > 0);

    // Sem nenhum produto reconhecido, algo está errado no mapeamento —
    // servir uma loja vazia seria pior que servir o catálogo local.
    if (produtos.length === 0) {
      return {
        ...CATALOGO_LOCAL,
        motivo: "O Bling respondeu, mas nenhum produto casou com as categorias",
      };
    }

    // Categoria sem produto vira link quebrado no menu.
    const comProduto = new Set(produtos.map((p) => p.categoria));
    return {
      categorias: CATEGORIAS_LOCAIS.filter((c) => comProduto.has(c.slug)),
      produtos,
      origem: "bling",
    };
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : String(erro);
    // Falhar aqui não pode derrubar a loja.
    console.error("[bling] catálogo indisponível, usando o local:", motivo);
    return { ...CATALOGO_LOCAL, motivo };
  }
}

/** Saldo ao vivo de um produto, para conferir antes de fechar o pedido. */
export async function saldoAoVivo(idProduto: number): Promise<number | null> {
  try {
    const r = await chamarBling<{ data?: { saldoVirtualTotal?: number }[] }>(
      `/estoques/saldos?idsProdutos[]=${idProduto}`,
      { revalidar: 0 },
    );
    return r.data?.[0]?.saldoVirtualTotal ?? null;
  } catch {
    return null;
  }
}
