/**
 * Procura por peça (18/11/2026): a nota que ordena a vitrine "Da nossa lojinha".
 *
 * Soma três sinais dos últimos 30 dias, todos anônimos e já guardados pelo site
 * (lib/visitas e o registro de pedidos pagos):
 *   - visita à página da peça .......... 1 ponto
 *   - pôr a peça no carrinho ........... 4 pontos
 *   - compra paga e não cancelada ...... 10 pontos por unidade (até 3 por pedido)
 * A compra pesa mais de propósito: o que está na vitrine recebe mais clique só
 * por estar lá, e venda é o sinal que a vitrine não fabrica sozinha.
 *
 * Arquivo puro (sem disco): quem lê os arquivos é lib/loja/procuraDoSite.ts.
 */

export const DIAS_DA_PROCURA = 30;
export const PESO = { visita: 1, carrinho: 4, compra: 10 } as const;
const MAXIMO_DE_UNIDADES_POR_PEDIDO = 3;

export type EventoDeProcura = { em: string; tipo: string; produto?: string };
export type PedidoDeProcura = { criadoEm: string; cancelado: boolean; itens: { nome: string; quantidade: number }[] };

/** Nome da peça como chave: sem o tamanho/cor entre parênteses do pedido, sem maiúscula, sem espaço sobrando. */
export function chaveDoNome(nome: string): string {
  return nome
    .replace(/\s*\([^)]*\)\s*$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

/** Nota de procura por peça (chave: `chaveDoNome`). Só entra o que aconteceu na janela. */
export function notasDeProcura(
  eventos: EventoDeProcura[],
  pedidos: PedidoDeProcura[],
  agora = new Date(),
  dias = DIAS_DA_PROCURA,
): Map<string, number> {
  const desde = new Date(agora.getTime() - dias * 86_400_000).toISOString();
  const notas = new Map<string, number>();
  const somar = (nome: string | undefined, pontos: number) => {
    const chave = nome ? chaveDoNome(nome) : "";
    if (chave) notas.set(chave, (notas.get(chave) ?? 0) + pontos);
  };
  for (const e of eventos) {
    if (e.em < desde) continue;
    if (e.tipo === "produto") somar(e.produto, PESO.visita);
    else if (e.tipo === "carrinho") somar(e.produto, PESO.carrinho);
  }
  for (const p of pedidos) {
    if (p.cancelado || p.criadoEm < desde) continue;
    for (const i of p.itens) {
      const unidades = Math.min(Math.max(Math.round(i.quantidade) || 1, 1), MAXIMO_DE_UNIDADES_POR_PEDIDO);
      somar(i.nome, PESO.compra * unidades);
    }
  }
  return notas;
}
