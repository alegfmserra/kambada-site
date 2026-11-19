import type { Categoria, Produto } from "../catalogo";
import { disponibilidade } from "../catalogo";
import { chaveDoNome } from "./procura";

/**
 * Vitrine "Da nossa lojinha", na home (17/11/2026).
 *
 * Sem curadoria manual por enquanto: a home escolhe sozinha peças que estão à
 * venda e têm foto, uma por categoria, na ordem das categorias, até completar.
 * A escolha é sempre a mesma para o mesmo catálogo (nada de sorteio): quem
 * volta à home vê a mesma vitrine, e o cache da página não muda de cara.
 *
 * Desde 18/11/2026 (pedido do Alexandre), havendo dados de procura (visitas à
 * peça, carrinho e compras dos últimos 30 dias; lib/loja/procura.ts), a vitrine
 * mostra as mais procuradas, com três travas:
 *   - só peça à venda e com foto;
 *   - no máximo 2 por categoria, para não virar seis camisas;
 *   - uma vaga é de rodízio: uma peça pouco vista, trocada a cada dia. Sem ela,
 *     o que está na vitrine recebe clique por estar lá e nunca mais sai.
 * Sem dados (loja nova, arquivo vazio), vale a regra automática de sempre.
 *
 * Para mandar na vitrine, preencha DESTAQUES_DA_HOME com os endereços das peças
 * (o trecho final do link, com ou sem o número do Bling no fim). O que estiver
 * na lista e à venda entra primeiro, na ordem escrita; o resto é completado
 * pela regra automática.
 */
export const DESTAQUES_DA_HOME: string[] = [];

export const MAXIMO_DE_DESTAQUES = 6;
/** Quantas peças da mesma categoria a procura pode pôr na vitrine. */
export const MAXIMO_POR_CATEGORIA = 2;

/** A procura por peça (chave: `chaveDoNome`) e o dia de São Luís, que gira a vaga de rodízio. */
export type Procura = { notas: ReadonlyMap<string, number>; dia: string };

/** Número estável a partir do dia ("2026-11-18"): muda a cada dia, igual o dia inteiro. */
const numeroDoDia = (dia: string) => Math.floor(Date.parse(`${dia}T00:00:00Z`) / 86_400_000) || 0;

/** "camisa-tradicao-16698802616" → "camisa-tradicao". */
const semId = (slug: string) => slug.replace(/-\d{6,}$/, "");

const aVenda = (p: Produto) => !p.oculto && disponibilidade(p).disponivel;

export function destaquesDaHome(
  produtos: Produto[],
  categorias: Categoria[],
  temFoto: (p: Produto) => boolean,
  curadoria: readonly string[] = DESTAQUES_DA_HOME,
  maximo: number = MAXIMO_DE_DESTAQUES,
  procura?: Procura,
): Produto[] {
  const candidatos = produtos.filter(aVenda);
  const escolhidos: Produto[] = [];
  const ja = new Set<string>();
  const pegar = (p: Produto | undefined) => {
    if (!p || ja.has(p.slug) || escolhidos.length >= maximo) return;
    ja.add(p.slug);
    escolhidos.push(p);
  };

  for (const slug of curadoria) {
    pegar(candidatos.find((p) => p.slug === slug) ?? candidatos.find((p) => semId(p.slug) === semId(slug)));
  }

  // Mais procuradas (com foto), até 2 por categoria, deixando uma vaga para o rodízio.
  const nota = (p: Produto) => procura?.notas.get(chaveDoNome(p.nome)) ?? 0;
  const procuradas = candidatos
    .map((p, ordem) => ({ p, ordem, n: nota(p) }))
    .filter((x) => x.n > 0 && temFoto(x.p))
    .sort((a, b) => b.n - a.n || a.ordem - b.ordem);
  if (procuradas.length > 0) {
    const porCategoria = new Map<string, number>();
    for (const e of escolhidos) porCategoria.set(e.categoria, (porCategoria.get(e.categoria) ?? 0) + 1);
    for (const { p } of procuradas) {
      if (escolhidos.length >= maximo - 1) break;
      const daCategoria = porCategoria.get(p.categoria) ?? 0;
      if (ja.has(p.slug) || daCategoria >= MAXIMO_POR_CATEGORIA) continue;
      pegar(p);
      porCategoria.set(p.categoria, daCategoria + 1);
    }
    // Vaga de rodízio: entre as peças com foto que ficaram de fora, a metade menos vista; uma por dia.
    const deFora = candidatos
      .map((p, ordem) => ({ p, ordem, n: nota(p) }))
      .filter((x) => !ja.has(x.p.slug) && temFoto(x.p))
      .sort((a, b) => a.n - b.n || a.ordem - b.ordem);
    const poucoVistas = deFora.slice(0, Math.max(1, Math.ceil(deFora.length / 2)));
    if (poucoVistas.length > 0) pegar(poucoVistas[numeroDoDia(procura!.dia) % poucoVistas.length].p);
  }

  // Uma por categoria, em rodadas: primeiro só peças com foto; se ainda faltar
  // (catálogo de reserva, sem fotos por peça), completa com as demais.
  for (const filtro of [temFoto, () => true]) {
    let pegouAlguma = true;
    while (escolhidos.length < maximo && pegouAlguma) {
      pegouAlguma = false;
      for (const c of categorias) {
        if (escolhidos.length >= maximo) break;
        const proxima = candidatos.find((p) => p.categoria === c.slug && !ja.has(p.slug) && filtro(p));
        if (proxima) {
          pegar(proxima);
          pegouAlguma = true;
        }
      }
    }
  }
  return escolhidos;
}

/** A primeira peça à venda e com foto de uma categoria: vira a capa de quem não tem foto própria. */
export function pecaDeCapa(produtos: Produto[], categoria: string, temFoto: (p: Produto) => boolean): Produto | undefined {
  const daCategoria = produtos.filter((p) => p.categoria === categoria && !p.oculto && temFoto(p));
  return daCategoria.find(aVenda) ?? daCategoria[0];
}
