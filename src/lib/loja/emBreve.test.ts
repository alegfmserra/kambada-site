import { describe, expect, it } from "vitest";
import { disponibilidade, type Produto } from "../catalogo";
import { PRODUTOS_EM_BREVE, ehSobEncomenda } from "../bling/produtos";
import { prazoDeProducao } from "./prazos";

const peca = (extra: Partial<Produto>): Produto => ({ slug: "x", nome: "x", categoria: "camisas", preco: 10, variacoes: ["P"], quantidade: 0, ...extra });

describe("lançamento em breve", () => {
  it("sem saldo e marcada: mostra Em breve e não pode ser comprada", () => {
    expect(disponibilidade(peca({ emBreve: true }))).toEqual({ texto: "Em breve", disponivel: false });
  });

  it("sem saldo e sem a marca: continua Esgotado", () => {
    expect(disponibilidade(peca({}))).toEqual({ texto: "Esgotado", disponivel: false });
  });

  it("com saldo, a marca não muda nada", () => {
    expect(disponibilidade(peca({ emBreve: true, quantidade: 9 })).disponivel).toBe(true);
  });

  it("a Camisa Caranguejinho saiu da lista: virou pré-venda estampada sob pedido, de 1 a 2 dias", () => {
    expect(PRODUTOS_EM_BREVE.has(16741262067)).toBe(false);
    const nome = "Camisa Caranguejinho Maranhense que só";
    expect(ehSobEncomenda("camisas", nome)).toBe(true);
    expect(ehSobEncomenda("camisas", "Camisa Tradição")).toBe(false);
    expect(prazoDeProducao({ nome })).toEqual({ min: 1, max: 2 });
    expect(disponibilidade(peca({ nome, sobEncomenda: true }))).toEqual({ texto: "Feita por encomenda · 1 a 2 dias", disponivel: true });
  });
});
