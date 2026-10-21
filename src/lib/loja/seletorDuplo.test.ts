import { describe, expect, it } from "vitest";
import type { Opcao } from "../catalogo";
import { acharOpcao, eixoMudaPreco, eixosDasOpcoes, escolher, opcaoParaFoto, precoDoValor, rotuloDoValor, valorExiste } from "./seletorDuplo";

const op = (id: number, estampa: string, suporte: string, preco: number): Opcao => ({
  rotulo: `${estampa} · ${suporte}`,
  idBling: id,
  preco,
  quantidade: 0,
  atributos: { estampa, suporte },
});

// Grande: Mosaico nos dois suportes; Leque Bordado só com suporte.
const opcoes = [op(1, "Leque Bordado", "Com suporte", 190), op(2, "Mosaico Colorido", "Com suporte", 190), op(3, "Mosaico Colorido", "Sem suporte", 145)];

describe("seletor Estampa × Suporte", () => {
  it("monta dois eixos: estampa primeiro, suporte com 'Sem' antes de 'Com'", () => {
    expect(eixosDasOpcoes(opcoes)).toEqual([
      { chave: "estampa", rotulo: "Estampa", valores: ["Leque Bordado", "Mosaico Colorido"] },
      { chave: "suporte", rotulo: "Suporte", valores: ["Sem suporte", "Com suporte"] },
    ]);
  });

  it("não monta eixos para lista comum (tamanhos) nem para opção única", () => {
    expect(eixosDasOpcoes([{ rotulo: "P", idBling: 1, preco: 1, quantidade: 1 }, { rotulo: "M", idBling: 2, preco: 1, quantidade: 1 }])).toBeNull();
    expect(eixosDasOpcoes([opcoes[0]])).toBeNull();
    expect(eixosDasOpcoes([opcoes[0], { rotulo: "x", idBling: 9, preco: 1, quantidade: 0, atributos: { estampa: "x" } }])).toBeNull();
  });

  it("acha a variação só com os dois escolhidos", () => {
    const eixos = eixosDasOpcoes(opcoes)!;
    expect(acharOpcao(opcoes, eixos, { estampa: "Mosaico Colorido" })).toBeNull();
    expect(acharOpcao(opcoes, eixos, { estampa: "Mosaico Colorido", suporte: "Sem suporte" })?.idBling).toBe(3);
  });

  it("combinação inexistente aparece como indisponível e é corrigida ao escolher", () => {
    const eixos = eixosDasOpcoes(opcoes)!;
    expect(valorExiste(opcoes, eixos, { estampa: "Leque Bordado" }, "suporte", "Sem suporte")).toBe(false);
    expect(valorExiste(opcoes, eixos, {}, "suporte", "Sem suporte")).toBe(true);
    // Estava em "Sem suporte" e escolheu Leque (só existe com): o suporte vai para "Com".
    expect(escolher(opcoes, eixos, { suporte: "Sem suporte" }, "estampa", "Leque Bordado")).toEqual({ estampa: "Leque Bordado", suporte: "Com suporte" });
    // Escolha compatível é mantida.
    expect(escolher(opcoes, eixos, { suporte: "Com suporte" }, "estampa", "Mosaico Colorido")).toEqual({ estampa: "Mosaico Colorido", suporte: "Com suporte" });
  });

  it("a foto troca assim que a estampa é escolhida", () => {
    const eixos = eixosDasOpcoes(opcoes)!;
    expect(opcaoParaFoto(opcoes, eixos, { estampa: "Mosaico Colorido" })?.idBling).toBe(2);
    expect(opcaoParaFoto(opcoes, eixos, {})).toBeNull();
    expect(opcaoParaFoto(opcoes, eixos, { suporte: "Sem suporte" })).toBeNull(); // só o suporte não troca a foto
    expect(opcaoParaFoto(opcoes, eixos, { estampa: "Mosaico Colorido", suporte: "Sem suporte" })?.idBling).toBe(3);
  });

  it("preço no botão do suporte, quando o suporte decide o preço", () => {
    const eixos = eixosDasOpcoes(opcoes)!;
    expect(precoDoValor(opcoes, "suporte", "Com suporte")).toBe(190);
    expect(eixoMudaPreco(opcoes, eixos[1])).toBe(true);
    expect(eixoMudaPreco(opcoes, eixos[0])).toBe(false); // Mosaico tem dois preços
  });

  it("'Com' do Bling vira 'Com suporte' para o cliente", () => {
    expect(rotuloDoValor("suporte", "Com")).toBe("Com suporte");
    expect(rotuloDoValor("suporte", "Com suporte")).toBe("Com suporte");
    expect(rotuloDoValor("estampa", "Com")).toBe("Com");
  });
});
