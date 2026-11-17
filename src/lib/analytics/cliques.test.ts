import { describe, expect, it } from "vitest";
import { alvoDoTexto, cliqueDoElemento, semMedicaoDeCliques, tipoDaPagina } from "./cliques";

describe("mapa de cliques", () => {
  it("reconhece o tipo da página sem guardar o endereço", () => {
    expect(tipoDaPagina("/")).toBe("home");
    expect(tipoDaPagina("/loja")).toBe("loja");
    expect(tipoDaPagina("/loja/")).toBe("loja");
    expect(tipoDaPagina("/loja/busca")).toBe("busca");
    expect(tipoDaPagina("/loja/camisas")).toBe("categoria");
    expect(tipoDaPagina("/loja/camisas/camisa-tradicao-16698802616")).toBe("produto");
    expect(tipoDaPagina("/cultura")).toBe("cultura");
    expect(tipoDaPagina("/cultura/historia-da-matraca")).toBe("artigo");
    expect(tipoDaPagina("/checkout/sucesso")).toBe("checkout-retorno");
    expect(tipoDaPagina("/pedido/KMB-123456")).toBe("pedido");
    expect(tipoDaPagina("/pedido/atendimento")).toBe("atendimento");
    expect(tipoDaPagina("/trocas-e-devolucoes")).toBe("juridico");
    expect(tipoDaPagina("/qualquer-coisa")).toBe("outra");
  });

  it("transforma o texto do botão em nome de alvo, sem acento e sem número longo", () => {
    expect(alvoDoTexto("Ver a loja →")).toBe("ver-a-loja");
    expect(alvoDoTexto("  Conheça a nossa história ")).toBe("conheca-a-nossa-historia");
    expect(alvoDoTexto("Pedido 20261117 de Maria")).toBe("pedido-de-maria");
    expect(alvoDoTexto("3x de R$ 30")).toBe("3x-de-r-30");
    expect(alvoDoTexto("x".repeat(80))).toHaveLength(40);
    expect(alvoDoTexto("→")).toBe("");
  });

  it("usa a marcação à mão quando existe e o texto quando não existe", () => {
    expect(cliqueDoElemento({ alvo: "ver-a-loja", area: "home-abertura", texto: "Ver a loja" }, "/")).toEqual({ area: "home-abertura", alvo: "ver-a-loja", pagina: "home" });
    expect(cliqueDoElemento({ texto: "Sobre", marco: "cabecalho" }, "/loja/camisas")).toEqual({ area: "cabecalho", alvo: "sobre", pagina: "categoria" });
    expect(cliqueDoElemento({ texto: "Ler o artigo" }, "/cultura")).toEqual({ area: "conteudo", alvo: "ler-o-artigo", pagina: "cultura" });
  });

  it("não duplica quem já tem evento próprio e não inventa nome para elemento mudo", () => {
    expect(cliqueDoElemento({ evento: "generate_lead", texto: "Falar no WhatsApp" }, "/")).toBeNull();
    expect(cliqueDoElemento({ evento: "select_item", texto: "Camisa Tradição" }, "/loja")).toBeNull();
    expect(cliqueDoElemento({ texto: "" }, "/")).toBeNull();
  });

  it("em página com dado de cliente só mede o que foi marcado à mão (ou está no cabeçalho e no rodapé)", () => {
    expect(cliqueDoElemento({ texto: "Maria da Silva, pedido de ontem" }, "/conta")).toBeNull();
    expect(cliqueDoElemento({ texto: "Remover" }, "/carrinho")).toBeNull();
    expect(cliqueDoElemento({ alvo: "continuar-comprando", area: "carrinho" }, "/carrinho")).toEqual({ area: "carrinho", alvo: "continuar-comprando", pagina: "carrinho" });
    expect(cliqueDoElemento({ texto: "Loja", marco: "cabecalho" }, "/checkout")).toEqual({ area: "cabecalho", alvo: "loja", pagina: "checkout" });
  });

  it("nada é medido no Play, no painel nem nas rotas de API", () => {
    for (const p of ["/kambadaplay", "/kambadaplay/experimente", "/admin", "/admin/pedidos", "/api/frete"]) {
      expect(semMedicaoDeCliques(p)).toBe(true);
      expect(cliqueDoElemento({ alvo: "x", texto: "Jogar" }, p)).toBeNull();
    }
    expect(semMedicaoDeCliques("/kambadaplayground")).toBe(false);
  });
});
