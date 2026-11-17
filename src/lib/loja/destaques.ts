import type { Categoria, Produto } from "../catalogo";
import { disponibilidade } from "../catalogo";

/**
 * Vitrine "Da nossa lojinha", na home (17/11/2026).
 *
 * Sem curadoria manual por enquanto: a home escolhe sozinha peças que estão à
 * venda e têm foto, uma por categoria, na ordem das categorias, até completar.
 * A escolha é sempre a mesma para o mesmo catálogo (nada de sorteio): quem
 * volta à home vê a mesma vitrine, e o cache da página não muda de cara.
 *
 * Para mandar na vitrine, preencha DESTAQUES_DA_HOME com os endereços das peças
 * (o trecho final do link, com ou sem o número do Bling no fim). O que estiver
 * na lista e à venda entra primeiro, na ordem escrita; o resto é completado
 * pela regra automática.
 */
export const DESTAQUES_DA_HOME: string[] = [];

export const MAXIMO_DE_DESTAQUES = 6;

/** "camisa-tradicao-16698802616" → "camisa-tradicao". */
const semId = (slug: string) => slug.replace(/-\d{6,}$/, "");

const aVenda = (p: Produto) => !p.oculto && disponibilidade(p).disponivel;

export function destaquesDaHome(
  produtos: Produto[],
  categorias: Categoria[],
  temFoto: (p: Produto) => boolean,
  curadoria: readonly string[] = DESTAQUES_DA_HOME,
  maximo: number = MAXIMO_DE_DESTAQUES,
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
