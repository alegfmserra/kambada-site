import { describe, expect, it } from "vitest";
import { cepDoRascunho, mascaraCep, rascunhoComCep } from "../checkout/rascunho";
import { opcaoLocal } from "./entregaLocal";
import { detalheDaEntrega, entregaMaisEmConta, mensagemDeErroDoFrete, precoDaEntrega, type OpcaoFreteNaTela } from "./exibir";
import { opcaoRetirada } from "./retirada";

const pac: OpcaoFreteNaTela = { id: 1, nome: "Correios PAC", servico: "PAC", transportadora: "Correios", preco: 24.9, precoOriginal: 24.9, prazoDias: 7, gratis: false };
const sedex: OpcaoFreteNaTela = { ...pac, id: 2, nome: "Correios SEDEX", servico: "SEDEX", preco: 41.3, precoOriginal: 41.3, prazoDias: 1 };

describe("opções de entrega na tela", () => {
  it("mostra preço, grátis com o valor riscado, retirada grátis e corrida a combinar", () => {
    expect(precoDaEntrega(pac).gratis).toBe(false);
    expect(precoDaEntrega(pac).texto).toContain("24,90");
    const gratis = precoDaEntrega({ ...pac, gratis: true, preco: 0 });
    expect(gratis.texto).toBe("Grátis");
    expect(gratis.riscado).toContain("24,90");
    expect(precoDaEntrega(opcaoRetirada())).toEqual({ texto: "Grátis", gratis: true });
    expect(precoDaEntrega(opcaoLocal("São Luís", 100)).texto).toBe("A combinar");
    expect(precoDaEntrega(opcaoLocal("São Luís", 200))).toEqual({ texto: "Grátis", gratis: true });
  });

  it("explica o prazo no singular e no plural, e a retirada sem prazo", () => {
    expect(detalheDaEntrega(sedex)).toMatch(/^até 1 dia útil após a postagem/);
    expect(detalheDaEntrega(pac)).toMatch(/^até 7 dias úteis após a postagem/);
    expect(detalheDaEntrega(opcaoRetirada())).toContain("endereço completo");
    expect(detalheDaEntrega(opcaoLocal("Raposa", 50))).toContain("Pix");
  });

  it("resume pela transportadora mais barata; sem ela, pela corrida; nunca pela retirada", () => {
    expect(entregaMaisEmConta([pac, sedex, opcaoLocal("São Luís", 50), opcaoRetirada()])?.id).toBe(1);
    expect(entregaMaisEmConta([opcaoLocal("São Luís", 50), opcaoRetirada()])?.local).toBe(true);
    expect(entregaMaisEmConta([opcaoRetirada()])).toBeNull();
  });

  it("traduz o erro do servidor para quem está comprando", () => {
    expect(mensagemDeErroDoFrete(422, "CEP inválido.")).toMatch(/Confira os 8 números/);
    expect(mensagemDeErroDoFrete(409, "Alguns itens mudaram.")).toMatch(/calcule de novo/);
    expect(mensagemDeErroDoFrete(429, "Muitas cotações seguidas. Espere alguns minutos e tente de novo.")).toMatch(/Espere/);
    expect(mensagemDeErroDoFrete(503)).toMatch(/WhatsApp/);
    expect(mensagemDeErroDoFrete(500)).toMatch(/Tente de novo/);
  });
});

describe("CEP no rascunho do checkout", () => {
  it("põe a máscara e corta em 8 dígitos", () => {
    expect(mascaraCep("65065060")).toBe("65065-060");
    expect(mascaraCep("65.065-060999")).toBe("65065-060");
    expect(mascaraCep("650")).toBe("650");
  });

  it("guarda o CEP sem apagar o que o checkout já tinha, e nunca guarda CPF", () => {
    const novo = JSON.parse(rascunhoComCep(JSON.stringify({ nome: "Fulana de Tal", cep: "01001-000", cpf: "x" }), "65065060"));
    expect(novo).toEqual({ nome: "Fulana de Tal", cep: "65065-060" });
    expect(JSON.parse(rascunhoComCep(null, "65065060"))).toEqual({ cep: "65065-060" });
    expect(JSON.parse(rascunhoComCep("{quebrado", "65065060"))).toEqual({ cep: "65065-060" });
  });

  it("só devolve CEP completo", () => {
    expect(cepDoRascunho(JSON.stringify({ cep: "65065-060" }))).toBe("65065-060");
    expect(cepDoRascunho(JSON.stringify({ cep: "6506" }))).toBe("");
    expect(cepDoRascunho(null)).toBe("");
    expect(cepDoRascunho("[]")).toBe("");
  });
});
