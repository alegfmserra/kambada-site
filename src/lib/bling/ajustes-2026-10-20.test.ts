import { describe, expect, it } from "vitest";
import {
  MACHAO,
  MATRACA_DTF,
  PLACA,
  REGATAO_DUPLICADO,
  REGATAO_PAI,
  REGATAO_VARIACAO,
  corpoMachao,
  corpoMatracaDtf,
  corpoPlaca,
  corpoRegataoPai,
  variacoesDaPlaca,
} from "./ajustes-2026-10-20";
import { embalagemDe } from "../frete/embalagens";
import { categoriaPeloNome, nomesDeProdutosPai, paiDoProduto, rotuloDaVariacao } from "./produtos";
import type { ProdutoBling } from "./tipos";

const regataoComoVeioDoBling = {
  id: REGATAO_PAI,
  nome: "Camisa Sol Nosso de Cada Dia - Regatão",
  formato: "V",
  descricaoCurta: "texto antigo",
  variacoes: [
    { id: REGATAO_VARIACAO, nome: "Camisa Sol Nosso de Cada Dia - Regatão Tamanho:G", variacao: { nome: "Tamanho:G", ordem: 1, produtoPai: { id: REGATAO_PAI, cloneInfo: true } } },
    { id: REGATAO_DUPLICADO, nome: "Camisa Sol Nosso de Cada Dia - Regatão", variacao: { nome: "", ordem: 9, produtoPai: { id: REGATAO_PAI, cloneInfo: false } } },
  ],
};

describe("Regatão (20/10/2026)", () => {
  it("renomeia só a variação G para GG e mantém a duplicada como veio", () => {
    const corpo = corpoRegataoPai(regataoComoVeioDoBling);
    const [g, dup] = corpo.variacoes as Record<string, any>[];
    expect(g.nome).toBe("Camisa Sol Nosso de Cada Dia - Regatão Tamanho:GG");
    expect(g.variacao).toEqual({ nome: "Tamanho:GG", ordem: 1, produtoPai: { id: REGATAO_PAI, cloneInfo: true } });
    expect(dup).toEqual(regataoComoVeioDoBling.variacoes[1]);
  });
  it("põe a cor off white na descrição, no padrão das outras camisas", () => {
    expect(corpoRegataoPai(regataoComoVeioDoBling).descricaoCurta).toMatch(/\nCor: off white\.\n/);
  });
  it("recusa se a variação esperada não estiver no pai", () => {
    expect(() => corpoRegataoPai({ ...regataoComoVeioDoBling, variacoes: [] })).toThrow();
  });
});

describe("Placa de Madeira Retangular", () => {
  it("tem 4 variações: Coreira/Coreiro × sem/com parafuso e puxador, a 160 e 180", () => {
    const v = variacoesDaPlaca();
    expect(v.map((x) => [x.atributos, x.preco])).toEqual([
      ["Modelo:Coreira;Fixação:Sem parafuso e puxador", 160],
      ["Modelo:Coreira;Fixação:Com parafuso e puxador", 180],
      ["Modelo:Coreiro;Fixação:Sem parafuso e puxador", 160],
      ["Modelo:Coreiro;Fixação:Com parafuso e puxador", 180],
    ]);
  });
  it("mantém o ID e vira pai, com o nome novo e a descrição nova", () => {
    const corpo = corpoPlaca({ id: PLACA.id, nome: PLACA.nomeAntigo, formato: "S", preco: 160, outroCampo: 1 });
    expect(corpo).toMatchObject({ id: PLACA.id, nome: "Placa de Madeira Retangular", formato: "V", preco: 160, outroCampo: 1 });
    expect(String(corpo.descricaoCurta)).toContain("Coreira e Coreiro");
  });
  it("a vitrine reconhece a categoria, o rótulo de cada opção e a caixa de frete", () => {
    expect(categoriaPeloNome(PLACA.nome)).toBe("decoracao");
    expect(rotuloDaVariacao(`${PLACA.nome} Modelo:Coreira;Fixação:Com parafuso e puxador`, PLACA.nome)).toBe("Coreira · Com parafuso e puxador");
    const produto = { nome: PLACA.nome, categoria: "decoracao", preco: 160 } as Parameters<typeof embalagemDe>[0];
    expect(embalagemDe(produto)).not.toBeNull();
  });
});

describe("Machão e Matraca DTF", () => {
  it("o machão nasce com a grade a zero e preço do regatão", () => {
    const c = corpoMachao();
    expect(c).toMatchObject({ nome: MACHAO.nome, preco: 89.9, formato: "V" });
    expect((c.variacoes as unknown[]).length).toBe(MACHAO.tamanhos.length);
    expect(categoriaPeloNome(MACHAO.nome)).toBe("camisas");
  });
  it("a matraca DTF não é cadastrada sem preço", () => {
    if (MATRACA_DTF.preco === null) expect(() => corpoMatracaDtf()).toThrow(/preço/);
  });
  it("a matraca DTF não é confundida com variação da Pequena pintada e tem caixa de frete", () => {
    const pais = nomesDeProdutosPai([{ id: 1, nome: "Matraca Kambada Pequena sem Suporte", formato: "V" } as ProdutoBling]);
    expect(paiDoProduto({ id: 2, nome: MATRACA_DTF.nome } as ProdutoBling, pais)).toBeNull();
    expect(categoriaPeloNome(MATRACA_DTF.nome)).toBe("matracas");
    const produto = { nome: MATRACA_DTF.nome, categoria: "matracas", preco: 1 } as Parameters<typeof embalagemDe>[0];
    expect(embalagemDe(produto)).not.toBeNull();
  });
});
