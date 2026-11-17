import { describe, expect, it } from "vitest";
import type { Produto } from "../catalogo";
import { CATEGORIAS, PRODUTOS } from "../catalogo";
import { buscarProdutos, lerTermo, normalizar, termoParaMedicao } from "./busca";

const nomes = (termo: string, produtos: Produto[] = PRODUTOS) => buscarProdutos(produtos, CATEGORIAS, termo).map((p) => p.slug);

describe("busca da loja", () => {
  it("ignora acento, maiúscula e pontuação", () => {
    expect(normalizar("  Cazumbá — Bumba-meu-Boi! ")).toBe("cazumba bumba meu boi");
    expect(nomes("CAZUMBA")).toContain("camisa-cazumba");
    expect(nomes("cazumbá")).toEqual(nomes("cazumba"));
  });

  it("acha pela categoria e tolera plural", () => {
    expect(nomes("bonés")).toEqual(["bone-guaras-bege", "bone-preto-lendas", "bone-marinho-maranhense-que-so"]);
    expect(nomes("camisas").length).toBe(PRODUTOS.filter((p) => p.categoria === "camisas").length);
    expect(nomes("ecobag")).toHaveLength(6);
  });

  it("todas as palavras precisam aparecer, em qualquer ordem", () => {
    expect(nomes("guarás boné")).toEqual(["bone-guaras-bege"]);
    expect(nomes("boné inexistente")).toEqual([]);
  });

  it("acha por tamanho, cor e estampa das opções", () => {
    expect(nomes("salmão")).toEqual(["camisa-caboclo-de-pena"]);
    expect(nomes("12 anos")).toEqual(["camisa-bumba-meu-boi-infantil"]);
    const comAtributos: Produto = {
      slug: "matraca-x",
      nome: "Matraca Kambada",
      categoria: "matracas",
      preco: 110,
      variacoes: [],
      quantidade: 1,
      opcoes: [{ rotulo: "Boizinho Miolo · Com suporte", idBling: 1, preco: 110, quantidade: 1, atributos: { estampa: "Boizinho Miolo", suporte: "Com suporte" } }],
    };
    expect(nomes("boizinho miolo", [comAtributos])).toEqual(["matraca-x"]);
  });

  it("quem casa pelo nome vem antes de quem casa só pela opção, e disponível antes de esgotado", () => {
    const lista = nomes("guarás");
    expect(lista.indexOf("ecobag-revoada-dos-guaras")).toBeLessThan(lista.indexOf("kit-ecologico-guaras"));
    const produtos: Produto[] = [
      { slug: "a", nome: "Chaveiro", categoria: "brindes", preco: 1, variacoes: ["Tradição"], quantidade: 3 },
      { slug: "b", nome: "Tradição", categoria: "camisas", preco: 1, variacoes: ["Único"], quantidade: 0 },
      { slug: "c", nome: "Tradição Texto", categoria: "camisas", preco: 1, variacoes: ["Único"], quantidade: 2 },
    ];
    expect(nomes("tradição", produtos)).toEqual(["c", "b", "a"]);
  });

  it("não mostra peça oculta e não acha nada com termo vazio", () => {
    const oculto: Produto = { slug: "t", nome: "Produto Teste", categoria: "papelaria", preco: 1, variacoes: ["Único"], quantidade: 1, oculto: true };
    expect(nomes("teste", [oculto])).toEqual([]);
    expect(nomes("   ")).toEqual([]);
    expect(nomes("!!!")).toEqual([]);
  });

  it("lê o termo da URL com segurança", () => {
    expect(lerTermo(undefined)).toBe("");
    expect(lerTermo(["  boné  preto ", "outro"])).toBe("boné preto");
    expect(lerTermo("x".repeat(200))).toHaveLength(60);
  });

  it("não manda dado pessoal para a medição", () => {
    expect(termoParaMedicao("Boné Guarás")).toBe("bone guaras");
    expect(termoParaMedicao("fulano@exemplo.com")).toBe("(oculto)");
    expect(termoParaMedicao("(98) 98888-7777")).toBe("(oculto)");
    expect(termoParaMedicao("camisa 12 anos")).toBe("camisa 12 anos");
  });
});
