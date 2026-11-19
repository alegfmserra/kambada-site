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

describe("vitrine da home por procura", () => {
  const categorias = [cat("a"), cat("b"), cat("c")];
  const produtos = [
    peca("a1", "a"),
    peca("a2", "a"),
    peca("a3", "a"),
    peca("a4-sem-foto", "a"),
    peca("b1", "b"),
    peca("b2", "b", { quantidade: 0 }),
    peca("c1", "c"),
    peca("c2", "c"),
  ];
  const procura = (notas: Record<string, number>, dia = "2026-11-18") => ({ notas: new Map(Object.entries(notas)), dia });

  it("sem dados de procura, vale a regra de sempre", () => {
    const antes = destaquesDaHome(produtos, categorias, comFoto, [], 4).map((p) => p.slug);
    expect(destaquesDaHome(produtos, categorias, comFoto, [], 4, procura({})).map((p) => p.slug)).toEqual(antes);
  });

  it("põe as mais procuradas primeiro, no máximo 2 por categoria", () => {
    const v = destaquesDaHome(produtos, categorias, comFoto, [], 4, procura({ a1: 50, a2: 40, a3: 30, c2: 20 })).map((p) => p.slug);
    expect(v.slice(0, 3)).toEqual(["a1", "a2", "c2"]);
    expect(v).not.toContain("a3");
  });

  it("nunca mostra peça esgotada nem sem foto por causa da procura", () => {
    const v = destaquesDaHome(produtos, categorias, comFoto, [], 3, procura({ b2: 99, "a4-sem-foto": 90, c1: 5 })).map((p) => p.slug);
    expect(v).not.toContain("b2");
    expect(v[0]).toBe("c1");
    expect(v.indexOf("a4-sem-foto")).toBe(-1);
  });

  it("guarda uma vaga de rodízio para peça pouco vista, que muda com o dia", () => {
    const notas = { a1: 50, a2: 40, c1: 30, c2: 20, b1: 10 };
    const hoje = destaquesDaHome(produtos, categorias, comFoto, [], 3, procura(notas, "2026-11-18")).map((p) => p.slug);
    expect(hoje.slice(0, 2)).toEqual(["a1", "a2"]);
    // A terceira não é a terceira mais procurada (c1): é uma das menos vistas que ficaram de fora.
    expect(["a3", "b1", "c2"]).toContain(hoje[2]);
    const dias = ["2026-11-18", "2026-11-19", "2026-11-20"].map(
      (d) => destaquesDaHome(produtos, categorias, comFoto, [], 3, procura(notas, d))[2].slug,
    );
    expect(new Set(dias).size).toBeGreaterThan(1);
  });

  it("a curadoria continua mandando e conta no limite da categoria", () => {
    const v = destaquesDaHome(produtos, categorias, comFoto, ["a3"], 4, procura({ a1: 50, a2: 40, c1: 30 })).map((p) => p.slug);
    expect(v[0]).toBe("a3");
    expect(v.filter((s) => s.startsWith("a") && s !== "a3").length).toBeLessThanOrEqual(2);
    expect(v.slice(1, 3)).toEqual(["a1", "c1"]);
  });
});
