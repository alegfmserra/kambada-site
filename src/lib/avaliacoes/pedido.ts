import type { Catalogo } from "../bling/produtos";
import { indexarOpcoes } from "../carrinho/validar";
import type { RegistroPedido } from "../pedidos/registro";
import { chaveDoProduto } from "./avaliacoes";

export type PecaParaAvaliar = { produto: string; produtoNome: string; opcao?: string; href: string };

/** Só avalia quem recebeu ou retirou, e o pedido não foi cancelado. */
export function pedidoPodeAvaliar(r: RegistroPedido | null): r is RegistroPedido {
  return Boolean(r?.conclusao && !r.cancelamento);
}

/**
 * As peças do pedido, uma por produto (duas camisas G e M da mesma estampa
 * viram uma avaliação). Item que saiu do catálogo fica de fora: não há
 * página onde a avaliação apareceria.
 */
export function pecasDoPedido(r: RegistroPedido, catalogo: Catalogo): PecaParaAvaliar[] {
  const indice = indexarOpcoes(catalogo);
  const pecas = new Map<string, PecaParaAvaliar>();
  for (const item of r.itens) {
    const achado = indice.get(item.id);
    if (!achado) continue;
    const chave = chaveDoProduto(achado.produto);
    const anterior = pecas.get(chave);
    if (anterior) {
      if (anterior.opcao && achado.opcao.rotulo && !anterior.opcao.includes(achado.opcao.rotulo)) {
        anterior.opcao = `${anterior.opcao}, ${achado.opcao.rotulo}`;
      }
      continue;
    }
    const opcao = achado.opcao.rotulo && achado.opcao.rotulo !== "Único" ? achado.opcao.rotulo : undefined;
    pecas.set(chave, {
      produto: chave,
      produtoNome: achado.produto.nome,
      ...(opcao ? { opcao } : {}),
      href: `/loja/${achado.produto.categoria}/${achado.produto.slug}`,
    });
  }
  return [...pecas.values()];
}
