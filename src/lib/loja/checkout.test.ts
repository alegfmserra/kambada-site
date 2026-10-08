import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import type { Catalogo } from "../bling/produtos";
import { opcoesDoProduto } from "../bling/produtos";
import { dataLocal, montarContato, montarPedido, numeroLojaDe } from "../bling/pedidos";
import type { ProdutoBling } from "../bling/tipos";
import {
  adicionar,
  alterarQuantidade,
  lerCarrinhoSalvo,
  MAXIMO_POR_ITEM,
  mensagemWhatsApp,
  subtotalEmCentavos,
  type ItemCarrinho,
} from "../carrinho/logica";
import { lerPedidoDoCliente, validarCarrinho } from "../carrinho/validar";
import type { Produto } from "../catalogo";
import { cpfValido, lerDadosCliente, type DadosCliente } from "../checkout/cliente";
import { lerRetrato, novaReferencia, type RetratoPedido } from "../checkout/pedido";
import { valorConfere } from "../checkout/processar";
import { aplicarRegraDaLoja } from "../frete/cotar";
import { compravelOnline, embalagemDe } from "../frete/embalagens";
import { interpretarCotacao, montarCorpoCotacao } from "../frete/melhorEnvio";
import { faltaParaFreteGratis, normalizarCep, temFreteGratis } from "../frete/regras";
import { assinaturaValida, lerCabecalhoAssinatura, montarManifest } from "../mercadopago/assinatura";
import { montarPreferencia, totalDoRetratoEmCentavos } from "../mercadopago/cliente";
import { emCentavos } from "./dinheiro";

/*
 * Fixtures da CONTA REAL. IDs e nomes lidos no Bling: "Camisa Alusiva São
 * Luís" (16698811377) e seus filhos PP (16698811627) e GG (16698811628), na
 * amostra de 2026-09-03 e de novo ao vivo em 2026-10-07; matraca 16698775382
 * e boné 16701478057 na vitrine de produção em 2026-10-08. Preços de venda
 * conferidos em produção em 2026-10-06 (camisa adulta R$ 89,90, matraca
 * grande com suporte R$ 185,00, boné R$ 55,00).
 */

const camisaPai: ProdutoBling = { id: 16698811377, nome: "Camisa Alusiva São Luís", formato: "V", preco: 89.9 };
const camisaPP: ProdutoBling = { id: 16698811627, nome: "Camisa Alusiva São Luís Tamanho:PP", formato: "S", preco: 89.9 };
const camisaGG: ProdutoBling = { id: 16698811628, nome: "Camisa Alusiva São Luís Tamanho:GG", formato: "S" };

function catalogoReal(): Catalogo {
  const camisa: Produto = {
    slug: "camisa-alusiva-sao-luis-16698811377",
    nome: "Camisa Alusiva São Luís",
    categoria: "camisas",
    preco: 89.9,
    variacoes: ["PP", "GG"],
    quantidade: 2,
    idBling: 16698811377,
    opcoes: [
      { rotulo: "PP", idBling: 16698811627, preco: 89.9, quantidade: 1 },
      { rotulo: "GG", idBling: 16698811628, preco: 89.9, quantidade: 1 },
    ],
  };
  const matraca: Produto = {
    slug: "matraca-kambada-grande-com-suporte-16698775382",
    nome: "Matraca Kambada Grande com Suporte",
    categoria: "matracas",
    preco: 185,
    variacoes: ["Único"],
    quantidade: 8,
    idBling: 16698775382,
    opcoes: [{ rotulo: "Único", idBling: 16698775382, preco: 185, quantidade: 8 }],
  };
  const mandala: Produto = {
    slug: "mandala-modelos-diversos-1",
    nome: "Mandala Modelos Diversos",
    categoria: "decoracao",
    preco: 250,
    variacoes: ["Único"],
    quantidade: 2,
    idBling: 1,
    opcoes: [{ rotulo: "Único", idBling: 1, preco: 250, quantidade: 2 }],
  };
  return { categorias: [], produtos: [camisa, matraca, mandala], origem: "bling" };
}

const clienteValido: DadosCliente = {
  nome: "Maria da Silva",
  email: "maria@exemplo.com.br",
  telefone: "98987654321",
  cpf: "52998224725", // CPF de teste com dígitos verificadores válidos
  cep: "01310100",
  logradouro: "Avenida Paulista",
  numero: "1000",
  complemento: "",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
};

function retratoExemplo(gratis = false): RetratoPedido {
  return {
    v: 1,
    ref: "KMB-20261008-ABC123",
    itens: [
      { id: 16698811628, q: 2, p: 89.9, n: "Camisa Alusiva São Luís (GG)" },
      { id: 16698775382, q: 1, p: 185, n: "Matraca Kambada Grande com Suporte" },
    ],
    frete: { servico: "Correios PAC", valor: gratis ? 0 : 24.37, prazo: 9, gratis },
    cliente: clienteValido,
  };
}

describe("dinheiro em centavos", () => {
  it("três camisas somam R$ 269,70 exato, sem resíduo de ponto flutuante", () => {
    expect(3 * 89.9).not.toBe(269.7); // o problema que o módulo existe para resolver
    expect(emCentavos(89.9) * 3).toBe(26970);
  });
});

describe("regras de frete da loja", () => {
  it("frete grátis começa em R$ 199,99, não antes", () => {
    expect(temFreteGratis(199.98)).toBe(false);
    expect(temFreteGratis(199.99)).toBe(true);
    expect(temFreteGratis(364.8)).toBe(true);
  });

  it("calcula quanto falta para o frete grátis", () => {
    expect(faltaParaFreteGratis(89.9)).toBeCloseTo(110.09, 2);
    expect(faltaParaFreteGratis(250)).toBe(0);
  });

  it("aceita CEP com ou sem hífen e recusa o incompleto", () => {
    expect(normalizarCep("65065-060")).toBe("65065060");
    expect(normalizarCep("650650")).toBeNull();
  });
});

describe("embalagens (ficha do Will, 18/08/2026)", () => {
  const cat = catalogoReal();

  it("camisa usa a caixa de 20×20×5 e 245 g", () => {
    expect(embalagemDe(cat.produtos[0])).toMatchObject({ comprimento: 20, largura: 20, altura: 5, peso: 0.245 });
  });

  it("matraca grande com suporte usa a caixa longa da ficha", () => {
    expect(embalagemDe(cat.produtos[1])).toMatchObject({ comprimento: 35, peso: 0.89 });
  });

  it("ecobag decide o tamanho pela opção e, sem rótulo, pelo preço", () => {
    const ecobag: Produto = { slug: "e", nome: "Ecobag Caboclo de Pena", categoria: "ecobags", preco: 40, variacoes: [], quantidade: 1 };
    expect(embalagemDe(ecobag, { rotulo: "Grande", idBling: 1, preco: 55, quantidade: 1 })?.peso).toBe(0.08);
    expect(embalagemDe(ecobag, { rotulo: "Pequena", idBling: 2, preco: 40, quantidade: 1 })?.peso).toBe(0.048);
    expect(embalagemDe({ ...ecobag, nome: "Ecobag Carcará", preco: 55 })?.peso).toBe(0.08);
  });

  it("mandala não tem embalagem conhecida e fica fora do site", () => {
    expect(embalagemDe(cat.produtos[2])).toBeNull();
    expect(compravelOnline(cat.produtos[2])).toBe(false);
  });

  it("produto do catálogo local, sem ID do Bling, não é comprável online", () => {
    const semBling: Produto = { ...cat.produtos[1], idBling: undefined, opcoes: undefined };
    expect(compravelOnline(semBling)).toBe(false);
  });
});

describe("opções do produto vindas do Bling", () => {
  it("cada tamanho vira uma opção com o ID do FILHO, não do pai", () => {
    const saldos = new Map([[16698811627, 1], [16698811628, 3]]);
    const opcoes = opcoesDoProduto(camisaPai, [camisaPP, camisaGG], saldos);
    expect(opcoes.map((o) => [o.rotulo, o.idBling, o.quantidade])).toEqual([
      ["PP", 16698811627, 1],
      ["GG", 16698811628, 3],
    ]);
  });

  it("filho sem preço próprio herda o preço do pai", () => {
    const opcoes = opcoesDoProduto(camisaPai, [camisaGG], new Map());
    expect(opcoes[0].preco).toBe(89.9);
  });

  it("produto sem variação vira a opção 'Único' com o próprio ID", () => {
    const matraca: ProdutoBling = { id: 16698775382, nome: "Matraca Kambada Grande com Suporte", formato: "S", preco: 185 };
    expect(opcoesDoProduto(matraca, [], new Map([[16698775382, 8]]))).toEqual([
      { rotulo: "Único", idBling: 16698775382, preco: 185, quantidade: 8 },
    ]);
  });
});

describe("carrinho no navegador", () => {
  const item = (q: number, estoque = 5): ItemCarrinho => ({
    idBling: 16698811628, slug: "s", categoria: "camisas", nome: "Camisa Alusiva São Luís",
    rotulo: "GG", preco: 89.9, quantidade: q, estoque,
  });

  it("a mesma opção adicionada duas vezes soma na mesma linha", () => {
    const c = adicionar(adicionar([], item(1)), item(2));
    expect(c).toHaveLength(1);
    expect(c[0].quantidade).toBe(3);
  });

  it("não passa do estoque nem do teto por item", () => {
    expect(adicionar([], item(4, 2))[0].quantidade).toBe(2);
    expect(adicionar([], item(50, 99))[0].quantidade).toBe(MAXIMO_POR_ITEM);
  });

  it("quantidade zero remove a linha", () => {
    expect(alterarQuantidade([item(2)], 16698811628, 0)).toEqual([]);
  });

  it("subtotal em centavos, sem resíduo", () => {
    expect(subtotalEmCentavos([item(3)])).toBe(26970);
  });

  it("lixo no localStorage não derruba a página", () => {
    expect(lerCarrinhoSalvo("texto")).toEqual([]);
    expect(lerCarrinhoSalvo([{ idBling: "x" }, null, item(1)])).toHaveLength(1);
  });

  it("monta a mensagem de WhatsApp com cada peça e tamanho", () => {
    expect(mensagemWhatsApp([item(2)])).toContain("2× Camisa Alusiva São Luís (GG)");
  });
});

describe("validação no servidor", () => {
  const cat = catalogoReal();

  it("o preço vem do catálogo — o navegador nem consegue enviar preço", () => {
    const pedido = lerPedidoDoCliente([{ idBling: 16698811628, quantidade: 1, preco: 0.01 }]);
    const r = validarCarrinho(pedido!, cat);
    expect(r.problemas).toEqual([]);
    expect(r.itens[0].precoUnitario).toBe(89.9);
    expect(r.subtotalCentavos).toBe(8990);
  });

  it("recusa peça inexistente, estoque estourado e peça só de WhatsApp", () => {
    expect(validarCarrinho([{ idBling: 999, quantidade: 1 }], cat).problemas[0]).toMatch(/não está mais à venda/);
    expect(validarCarrinho([{ idBling: 16698811628, quantidade: 2 }], cat).problemas[0]).toMatch(/só temos 1/);
    expect(validarCarrinho([{ idBling: 1, quantidade: 1 }], cat).problemas[0]).toMatch(/WhatsApp/);
  });

  it("recusa carrinho malformado", () => {
    expect(lerPedidoDoCliente([])).toBeNull();
    expect(lerPedidoDoCliente([{ idBling: 1, quantidade: 0 }])).toBeNull();
    expect(lerPedidoDoCliente([{ idBling: -5, quantidade: 1 }])).toBeNull();
    expect(lerPedidoDoCliente("tudo")).toBeNull();
  });
});

describe("dados do cliente", () => {
  it("confere os dígitos verificadores do CPF", () => {
    expect(cpfValido("529.982.247-25")).toBe(true);
    expect(cpfValido("529.982.247-26")).toBe(false);
    expect(cpfValido("111.111.111-11")).toBe(false);
  });

  it("aponta cada campo errado", () => {
    const { erros } = lerDadosCliente({ nome: "Maria", email: "x", cpf: "123", uf: "XX" });
    expect(Object.keys(erros)).toEqual(
      expect.arrayContaining(["nome", "email", "telefone", "cpf", "cep", "logradouro", "numero", "bairro", "cidade", "uf"]),
    );
  });

  it("aceita os dados completos e normaliza", () => {
    const { dados, erros } = lerDadosCliente({ ...clienteValido, cpf: "529.982.247-25", cep: "01310-100", uf: "sp" });
    expect(erros).toEqual({});
    expect(dados.cpf).toBe("52998224725");
    expect(dados.uf).toBe("SP");
  });
});

describe("Melhor Envio", () => {
  it("monta o corpo com origem fixa em São Luís e medidas inteiras", () => {
    const corpo = montarCorpoCotacao("01310100", [
      { id: "16698775382", embalagem: embalagemDe(catalogoReal().produtos[1])!, valorUnitario: 185, quantidade: 1 },
    ]);
    expect(corpo.from.postal_code).toBe("65065060");
    expect(corpo.products[0]).toMatchObject({ width: 14, height: 5, length: 35, weight: 0.89, insurance_value: 185, quantity: 1 });
  });

  it("descarta serviço indisponível, lê preço em texto e ordena do mais barato", () => {
    const opcoes = interpretarCotacao([
      { id: 2, name: "SEDEX", custom_price: "41.10", custom_delivery_time: 4, company: { name: "Correios" } },
      { id: 3, name: ".Package", error: "Serviço indisponível para o trecho." },
      { id: 1, name: "PAC", custom_price: "24.37", custom_delivery_time: 9, company: { name: "Correios" } },
    ]);
    expect(opcoes.map((o) => [o.servico, o.preco])).toEqual([["PAC", 24.37], ["SEDEX", 41.1]]);
  });

  it("frete grátis zera só a opção mais barata", () => {
    const base = interpretarCotacao([
      { id: 1, name: "PAC", custom_price: "24.37", custom_delivery_time: 9 },
      { id: 2, name: "SEDEX", custom_price: "41.10", custom_delivery_time: 4 },
    ]);
    const acima = aplicarRegraDaLoja(base, emCentavos(364.8));
    expect(acima.map((o) => [o.precoCobrado, o.gratis])).toEqual([[0, true], [41.1, false]]);
    const abaixo = aplicarRegraDaLoja(base, emCentavos(89.9));
    expect(abaixo.every((o) => !o.gratis && o.precoCobrado === o.preco)).toBe(true);
  });
});

describe("assinatura do Mercado Pago", () => {
  const segredo = "segredo-de-teste";

  it("monta o manifest exatamente no formato da documentação", () => {
    expect(montarManifest("123456", "abc-123", "1704908010")).toBe("id:123456;request-id:abc-123;ts:1704908010;");
    expect(montarManifest("ABC123def", null, "1")).toBe("id:abc123def;ts:1;");
  });

  it("aceita a assinatura certa e recusa a adulterada", () => {
    const v1 = createHmac("sha256", segredo).update("id:123456;request-id:abc-123;ts:1704908010;").digest("hex");
    const ok = { cabecalho: `ts=1704908010,v1=${v1}`, requestId: "abc-123", dataId: "123456", segredo };
    expect(assinaturaValida(ok)).toBe(true);
    expect(assinaturaValida({ ...ok, dataId: "999999" })).toBe(false);
    expect(assinaturaValida({ ...ok, cabecalho: "ts=1704908010" })).toBe(false);
    expect(lerCabecalhoAssinatura("ts=1, v1=ab").v1).toBe("ab");
  });
});

describe("retrato do pedido e preferência", () => {
  it("a referência é legível e o retrato atravessa como texto", () => {
    expect(novaReferencia(new Date("2026-10-08T12:00:00Z"), () => 0.5)).toBe("KMB-20261008-7FFFFF");
    const r = retratoExemplo();
    expect(lerRetrato(JSON.stringify(r))).toEqual(r);
    expect(lerRetrato("{lixo")).toBeNull();
    expect(lerRetrato({ v: 1 })).toBeNull();
  });

  it("a preferência leva itens, frete, até 3x e o retrato em texto", () => {
    const pref = montarPreferencia(retratoExemplo(), "https://somoskambada.com.br", new Date("2026-10-08T12:00:00Z"));
    expect(pref.items).toHaveLength(2);
    expect(pref.shipments.cost).toBe(24.37);
    expect(pref.payment_methods.installments).toBe(3);
    expect(pref.notification_url).toBe("https://somoskambada.com.br/api/webhooks/mercadopago");
    expect(pref.external_reference).toBe("KMB-20261008-ABC123");
    expect(lerRetrato(pref.metadata.pedido)?.ref).toBe("KMB-20261008-ABC123");
    expect(pref.expiration_date_to).toBe("2026-10-09T12:00:00.000Z");
  });

  it("o total do pedido soma itens e frete em centavos", () => {
    expect(totalDoRetratoEmCentavos(retratoExemplo())).toBe(17980 + 18500 + 2437);
  });
});

describe("conferência do valor pago", () => {
  it("aceita total com frete embutido ou frete à parte, e barra o resto", () => {
    expect(valorConfere(38917, 2437, 389.17)).toBe(true);
    expect(valorConfere(38917, 2437, 364.8, 24.37)).toBe(true);
    expect(valorConfere(38917, 2437, 300)).toBe(false);
    expect(valorConfere(38917, 2437, undefined)).toBe(false);
  });
});

describe("pedido no Bling", () => {
  const pagamento = {
    id: 1234567890,
    status: "approved",
    date_approved: "2026-10-08T15:20:00.000-03:00",
    payment_type_id: "credit_card",
    installments: 3,
    fee_details: [{ type: "mercadopago_fee", amount: 19.38 }],
  };

  it("o número da loja amarra o pedido ao pagamento — é a chave da idempotência", () => {
    expect(numeroLojaDe(1234567890)).toBe("MP-1234567890");
  });

  it("a data sai no fuso de São Luís, não em UTC", () => {
    // 01h30 UTC do dia 9 ainda é dia 8 no Maranhão (UTC−3).
    expect(dataLocal(new Date("2026-10-09T01:30:00Z"))).toBe("2026-10-08");
  });

  it("itens apontam para o ID da variação e a parcela fecha com itens + frete", () => {
    const p = montarPedido({
      retrato: retratoExemplo(),
      pagamento,
      idContato: 77,
      idForma: 88,
      agora: new Date("2026-10-08T15:00:00Z"),
    });
    expect(p.numeroLoja).toBe("MP-1234567890");
    expect(p.contato).toEqual({ id: 77 });
    expect(p.itens.map((i) => [i.produto.id, i.quantidade, i.valor])).toEqual([
      [16698811628, 2, 89.9],
      [16698775382, 1, 185],
    ]);
    expect(p.parcelas[0]).toMatchObject({ valor: 389.17, formaPagamento: { id: 88 } });
    expect(p.transporte).toMatchObject({ fretePorConta: 0, frete: 24.37 });
    expect(p.dataPrevista).toBe("2026-10-17");
    expect(p.observacoesInternas).toContain("Taxa Mercado Pago: R$ 19.38");
  });

  it("observação interna não carrega CPF nem telefone do cliente", () => {
    const p = montarPedido({ retrato: retratoExemplo(), pagamento, idContato: 1, idForma: 1 });
    expect(p.observacoes + p.observacoesInternas).not.toContain(clienteValido.cpf);
    expect(p.observacoes + p.observacoesInternas).not.toContain(clienteValido.telefone);
  });

  it("frete grátis fica registrado como custo da loja", () => {
    const p = montarPedido({ retrato: retratoExemplo(true), pagamento, idContato: 1, idForma: 1 });
    expect(p.transporte.frete).toBe(0);
    expect(p.observacoesInternas).toContain("FRETE GRÁTIS");
  });

  it("o contato vai como pessoa física não contribuinte", () => {
    expect(montarContato(clienteValido)).toMatchObject({ tipo: "F", situacao: "A", indicadorIe: 9, numeroDocumento: "52998224725" });
    expect(montarContato(clienteValido).endereco.geral.cep).toBe("01310-100");
  });
});
