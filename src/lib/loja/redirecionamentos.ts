import type { Produto } from "../catalogo";
import { REDIRECIONAMENTOS } from "../bling/migracao-matracas-2026-10-21";

/**
 * Para onde vai um endereço de produto que não existe mais.
 *
 * O endereço termina com o ID do Bling ("…-16698775382"). Duas saídas:
 *  1. o produto ainda existe com outro nome → a página dele (nome mudou no Bling);
 *  2. o produto foi INATIVADO e substituído (matracas, 21/10/2026: Pequena/Grande
 *     × com/sem suporte → Mini/Grande com o suporte como variação) → a página do
 *     substituto, achado pelo NOME na tabela — o ID novo só existe depois de criado.
 * Sem saída, null (a página dá 404).
 */
export function destinoDoEnderecoAntigo(
  slug: string,
  produtos: Pick<Produto, "idBling" | "nome" | "slug" | "categoria">[],
  tabela: Record<number, string> = REDIRECIONAMENTOS,
): string | null {
  const id = Number(slug.match(/-(\d{8,})$/)?.[1]);
  if (!id) return null;
  const url = (p: { categoria: string; slug: string }) => `/loja/${p.categoria}/${p.slug}`;

  const mesmoId = produtos.find((p) => p.idBling === id);
  if (mesmoId) return mesmoId.slug === slug ? null : url(mesmoId);

  const nomeNovo = tabela[id];
  const substituto = nomeNovo ? produtos.find((p) => p.nome === nomeNovo) : undefined;
  return substituto ? url(substituto) : null;
}
