import { describe, expect, it } from "vitest";
import type { Categoria, Produto } from "../catalogo";
import { CATEGORIAS, PRODUTOS } from "../catalogo";
import { destaquesDaHome, pecaDeCapa } from "./destaques";

const cat = (slug: string): Categoria => ({ slug, nome: slug, chamada: "" });
const peca = (slug: string, categoria: string, extra: Partial<Produto> = {}): Produto => ({
  slug,
  nome: slug,
  categoria,
  preco: 10,
  variacoes: ["Único"],
  quantidade: 3,
  ...extra,
});
const comFoto = (p: Produto) => !p.slug.includes("sem-foto");

describe("vitrine da home", () => {
  const categorias = [cat("a"), cat("b"), cat("c")];
  const produtos = [
    peca("a1", "a"),
    peca("a2", "a"),
    peca("a3-sem-foto", "a"),
    peca("b1-sem-foto", "b"),
    peca("b2", "b"),
    peca("c1", "c", { quantidade: 0 }),
    peca("c2", "c", { oculto: true }),
    peca("c3-12345678901", "c"),
  ];

  it("pega uma por categoria, com foto e à venda, e depois completa em rodadas", () => {
    expect(destaquesDaHome(produtos, categorias, comFoto, [], 4).map((p) => p.slug)).toEqual(["a1", "b2", "c3-12345678901", "a2"]);
  });

  it("só usa peça sem foto quando as com foto acabaram", () => {
    expect(destaquesDaHome(produtos, categorias, comFoto, [], 6).map((p) => p.slug)).toEqual([
      "a1", "b2", "c3-12345678901", "a2", "a3-sem-foto", "b1-sem-foto",
    ]);
  });

  it("nunca mostra esgotado nem oculto", () => {
    const slugs = destaquesDaHome(produtos, categorias, comFoto, [], 10).map((p) => p.slug);
    expect(slugs).not.toContain("c1");
    expect(slugs).not.toContain("c2");
  });

  it("a lista manual manda, aceita o endereço sem o número do Bling e ignora o que não existe", () => {
    expect(destaquesDaHome(produtos, categorias, comFoto, ["c3", "nao-existe", "a2"], 4).map((p) => p.slug)).toEqual([
      "c3-12345678901", "a2", "a1", "b2",
    ]);
  });

  it("dá sempre o mesmo resultado para o mesmo catálogo", () => {
    const um = destaquesDaHome(produtos, categorias, comFoto).map((p) => p.slug);
    const dois = destaquesDaHome([...produtos], [...categorias], comFoto).map((p) => p.slug);
    expect(um).toEqual(dois);
  });

  it("funciona com o catálogo de reserva (sem foto por peça): seis peças de categorias diferentes", () => {
    const lista = destaquesDaHome(PRODUTOS, CATEGORIAS, () => false);
    expect(lista).toHaveLength(6);
    expect(new Set(lista.map((p) => p.categoria)).size).toBe(6);
  });

  it("capa da categoria: a primeira peça à venda com foto", () => {
    expect(pecaDeCapa(produtos, "b", comFoto)?.slug).toBe("b2");
    expect(pecaDeCapa(produtos, "x", comFoto)).toBeUndefined();
  });
});
