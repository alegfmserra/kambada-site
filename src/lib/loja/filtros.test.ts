import { describe, expect, it } from "vitest";
import type { Produto } from "../catalogo";
import { PRODUTOS } from "../catalogo";
import {
  aplicar,
  escolhaParaUrl,
  itensFiltraveis,
  lerEscolha,
  publicoDaPeca,
  publicosDaLista,
  SEM_ESCOLHA,
  tamanhoDoRotulo,
  tamanhosDaLista,
  tamanhosDaPeca,
  temFiltro,
} from "./filtros";

const camisa = (nome: string, rotulos: [string, number][], preco = 89.9): Produto => ({
  slug: nome,
  nome,
  categoria: "camisas",
  preco,
  variacoes: rotulos.map(([r]) => r),
  quantidade: rotulos.reduce((s, [, q]) => s + q, 0),
  idBling: 1,
  opcoes: rotulos.map(([rotulo, quantidade], i) => ({ rotulo, idBling: i + 2, preco, quantidade })),
});

// Nomes como estão no Bling (lib/bling/precos-corretos.ts).
const DO_BLING = [
  camisa("Camisa Tradição", [["P", 2], ["M", 0], ["G", 3], ["GG", 1]]),
  camisa("Camisa Babylook Bumba Boi", [["P", 1], ["M", 1]]),
  camisa("Camisa Bumba meu Boi Infantil", [["6 anos", 1], ["8 anos", 0], ["12 anos", 2]], 74.9),
  camisa("Camisa Revoadinha dos Guarás", [["4 anos", 1]], 74.9),
  camisa("Camisa Cazumbázinho", [["8 anos", 1]], 74.9),
  camisa("Camisa Revoada dos Guarás Suede Feminino", [["M", 1], ["GG", 2]], 74.9),
];

describe("filtros da categoria", () => {
  it("lê o tamanho do rótulo e ignora cor, estampa e Único", () => {
    expect(tamanhoDoRotulo("G")).toBe("G");
    expect(tamanhoDoRotulo("Off White GG")).toBe("GG");
    expect(tamanhoDoRotulo("Off White · xg")).toBe("XG");
    expect(tamanhoDoRotulo("Preta 6 anos")).toBe("6 anos");
    expect(tamanhoDoRotulo("14 Anos")).toBe("14 anos");
    expect(tamanhoDoRotulo("Único")).toBeNull();
    expect(tamanhoDoRotulo("Guarás Bege")).toBeNull();
  });

  it("classifica o público pelo nome e pelos tamanhos em anos", () => {
    expect(DO_BLING.map(publicoDaPeca)).toEqual(["adulto", "babylook", "infantil", "infantil", "infantil", "adulto"]);
  });

  it("só oferece tamanho com estoque, na ordem da arara", () => {
    expect(tamanhosDaPeca(DO_BLING[0])).toEqual(["P", "G", "GG"]);
    expect(tamanhosDaPeca(DO_BLING[2])).toEqual(["6 anos", "12 anos"]);
    // Catálogo de reserva (sem saldo por opção): vale a lista do estoque, se a peça tem saldo.
    const local = PRODUTOS.find((p) => p.slug === "camisa-revoada-dos-guaras")!;
    expect(tamanhosDaPeca(local)).toEqual(["P", "M", "G", "GG", "XG"]);
    expect(tamanhosDaPeca({ ...local, quantidade: 0 })).toEqual([]);
  });

  it("só as camisas ganham público e tamanho; as outras categorias só ordenam", () => {
    const itens = itensFiltraveis("camisas", DO_BLING);
    expect(publicosDaLista(itens)).toEqual(["adulto", "infantil", "babylook"]);
    expect(tamanhosDaLista(itens, null)).toEqual(["P", "M", "G", "GG", "4 anos", "6 anos", "8 anos", "12 anos"]);
    expect(tamanhosDaLista(itens, "infantil")).toEqual(["4 anos", "6 anos", "8 anos", "12 anos"]);
    expect(tamanhosDaLista(itens, "babylook")).toEqual(["P", "M"]);

    const ecobags = itensFiltraveis("ecobags", PRODUTOS.filter((p) => p.categoria === "ecobags"));
    expect(publicosDaLista(ecobags)).toEqual([]);
    expect(tamanhosDaLista(ecobags, null)).toEqual([]);
  });

  it("um público só não vira filtro", () => {
    const itens = itensFiltraveis("camisas", [DO_BLING[0], DO_BLING[5]]);
    expect(publicosDaLista(itens)).toEqual([]);
  });

  it("filtra por público e tamanho e ordena por preço mantendo a ordem da vitrine no empate", () => {
    const itens = itensFiltraveis("camisas", DO_BLING);
    expect(aplicar(itens, SEM_ESCOLHA)).toEqual([0, 1, 2, 3, 4, 5]);
    expect(aplicar(itens, { ...SEM_ESCOLHA, publico: "infantil" })).toEqual([2, 3, 4]);
    expect(aplicar(itens, { ...SEM_ESCOLHA, tamanho: "M" })).toEqual([1, 5]);
    expect(aplicar(itens, { publico: "adulto", tamanho: "GG", ordem: "preco" })).toEqual([5, 0]);
    expect(aplicar(itens, { ...SEM_ESCOLHA, ordem: "preco" })).toEqual([2, 3, 4, 5, 0, 1]);
    expect(aplicar(itens, { ...SEM_ESCOLHA, ordem: "preco-desc" })).toEqual([0, 1, 2, 3, 4, 5]);
  });

  it("guarda a escolha na URL e lê de volta, descartando o que não existe", () => {
    const itens = itensFiltraveis("camisas", DO_BLING);
    const escolha = { publico: "infantil" as const, tamanho: "6 anos", ordem: "preco" as const };
    const url = escolhaParaUrl(escolha);
    expect(url).toBe("publico=infantil&tamanho=6+anos&ordem=preco");
    expect(lerEscolha(new URLSearchParams(url), itens)).toEqual(escolha);
    expect(escolhaParaUrl(SEM_ESCOLHA)).toBe("");
    expect(lerEscolha(new URLSearchParams("publico=marciano&tamanho=XXL&ordem=aleatoria"), itens)).toEqual(SEM_ESCOLHA);
    // Tamanho de adulto com público infantil não combina: cai fora.
    expect(lerEscolha(new URLSearchParams("publico=infantil&tamanho=GG"), itens).tamanho).toBeNull();
    expect(lerEscolha(new URLSearchParams("tamanho=gg"), itens).tamanho).toBe("GG");
    expect(temFiltro(SEM_ESCOLHA)).toBe(false);
    expect(temFiltro(escolha)).toBe(true);
  });
});
