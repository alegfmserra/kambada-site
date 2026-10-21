/* eslint-disable @typescript-eslint/no-explicit-any -- corpos JSON do Bling inspecionados campo a campo */
import { describe, expect, it } from "vitest";
import type { Opcao, Produto } from "../catalogo";
import { embalagemDe } from "../frete/embalagens";
import { fotoDaOpcao, fotoDoItem, fotoDoProduto, galeriaDoProduto } from "../fotoDoProduto";
import { FOTOS_ESTAMPAS } from "../fotosEstampas";
import { ehPintadaAMao } from "../loja/prazos";
import { destinoDoEnderecoAntigo } from "../loja/redirecionamentos";
import {
  DE_PARA,
  DTF,
  GRANDE,
  MINI,
  PAIS_ANTIGOS,
  PASSOS,
  PLAY,
  REDIRECIONAMENTOS,
  atributosDe,
  corpoComPrecosCorrigidos,
  corpoFilhoNovo,
  corpoPaiNovo,
  corpoPlay,
  corposFigurasNovasDoPlay,
  decisaoDeInativar,
  diferencas,
  planoDoPlay,
  mesmaVariacao,
  movimentos,
  paraSlug,
  pendenteNaAntiga,
  planoDeSaldos,
  problemasDoPlano,
  variacoesPlanejadas,
} from "./migracao-matracas-2026-10-21";
import { atributosDaVariacao, ehSobEncomenda, opcoesDoProduto, paraSlug as paraSlugDoCatalogo, pareceFilhoOrfao, rotuloDaVariacao } from "./produtos";

describe("plano de migração das matracas (21/10/2026)", () => {
  it("é coerente: contagem fecha com o saldo, destinos confirmados, sem destino duplicado", () => {
    expect(problemasDoPlano()).toEqual([]);
  });

  it("preços aprovados: Mini 110/145, Grande 145 / 190 reto / 195 Leque e Topo, DTF 85, Play 220", () => {
    const preco = (pai: typeof MINI, suporte: string) => variacoesPlanejadas(pai).find((v) => v.suporte === suporte)?.preco;
    expect([preco(MINI, "Sem suporte"), preco(MINI, "Com suporte")]).toEqual([110, 145]);
    expect([preco(GRANDE, "Sem suporte"), preco(GRANDE, "Com suporte"), preco(GRANDE, "Leque Bordado"), preco(GRANDE, "Topo Boi Preto")]).toEqual([145, 190, 195, 195]);
    expect(variacoesPlanejadas(DTF).every((v) => v.preco === 85)).toBe(true);
    expect(PLAY.preco).toBe(220);
  });

  it("grafia Cazumbá (com C) em todo nome de estampa", () => {
    const nomes = [MINI, GRANDE, DTF].flatMap((p) => p.estampas.map((e) => e.nome));
    expect(nomes.filter((n) => /kazumb/i.test(n))).toEqual([]);
  });

  it("Leque Bordado e Topo Boi Preto são SUPORTES, só da Grande — não estampas", () => {
    expect(GRANDE.suportes).toEqual(["Sem suporte", "Com suporte", "Leque Bordado", "Topo Boi Preto"]);
    expect(MINI.suportes).toEqual(["Sem suporte", "Com suporte"]);
    const estampas = [MINI, GRANDE, DTF].flatMap((p) => p.estampas.map((e) => e.nome));
    expect(estampas).not.toContain("Leque Bordado");
    expect(estampas).not.toContain("Topo Boi Preto");
    // Cada estampa confirmada da Grande nos 4 suportes.
    expect(variacoesPlanejadas(GRANDE).filter((v) => v.estampa === "Mosaico Colorido").map((v) => v.suporte)).toEqual(GRANDE.suportes);
    expect(variacoesPlanejadas(MINI).some((v) => /leque|topo/i.test(v.suporte))).toBe(false);
  });

  it("as 16 estampas das fotos de 18/10 entram todas, sem fundir parecidas (7 Mini + 9 Grande)", () => {
    const da1810 = (p: typeof MINI) => p.estampas.filter((e) => e.origem.startsWith("fotos da Kambada de 18/10"));
    expect(da1810(MINI)).toHaveLength(7);
    expect(da1810(GRANDE)).toHaveLength(9);
    expect([...da1810(MINI), ...da1810(GRANDE)].every((e) => e.status === "confirmada")).toBe(true);
    // "Bandeira do Maranhão" com o mesmo nome na Mini e na Grande; "Boi do Maranhão" é outro desenho.
    expect(MINI.estampas.map((e) => e.nome)).toEqual(expect.arrayContaining(["Boi do Maranhão", "Bandeira do Maranhão"]));
    expect(GRANDE.estampas.map((e) => e.nome)).toContain("Bandeira do Maranhão");
    expect([MINI, GRANDE].flatMap((p) => p.estampas.map((e) => e.nome))).not.toContain("Boi Bandeira do Maranhão");
    // Nenhuma estampa leva nome de cliente (a foto personalizada é só ilustração).
    const nomes = [MINI, GRANDE].flatMap((p) => p.estampas.map((e) => e.nome)).join(" | ");
    expect(nomes).not.toMatch(/priscilla|rocha|ver[oô]nica|tavares|c[eé]sar|z[eé] maria/i);
  });

  it("Caboclo de Pena e Boi Blackout entram só na Grande, com todos os suportes; nada fica a confirmar", () => {
    for (const nome of ["Caboclo de Pena", "Boi Blackout"]) {
      expect(variacoesPlanejadas(GRANDE).filter((v) => v.estampa === nome).map((v) => v.suporte)).toEqual(GRANDE.suportes);
      expect(MINI.estampas.some((e) => e.nome === nome)).toBe(false);
    }
    expect([MINI, GRANDE, DTF].flatMap((p) => p.estampas).filter((e) => e.status !== "confirmada")).toEqual([]);
  });

  it("inativar com pendentes=manter não bloqueia; sem ele, bloqueia; sem pai novo, erro", () => {
    const base = { jaInativo: false, destinoAtivo: true, parado: 17, pendentesManter: true, aplicar: false };
    expect(decisaoDeInativar(base)).toBe("inativar");
    expect(decisaoDeInativar({ ...base, aplicar: true })).toBe("aplicar");
    expect(decisaoDeInativar({ ...base, pendentesManter: false })).toBe("bloqueado");
    expect(decisaoDeInativar({ ...base, pendentesManter: false, parado: 0, aplicar: true })).toBe("aplicar");
    expect(decisaoDeInativar({ ...base, destinoAtivo: false })).toBe("erro");
    expect(decisaoDeInativar({ ...base, jaInativo: true })).toBe("pular");
  });

  it("monta os atributos no formato do Bling", () => {
    expect(atributosDe(MINI, "Boizinho Miolo", "Com suporte")).toBe("Estampa:Boizinho Miolo;Suporte:Com suporte");
    expect(atributosDe(DTF, "Boi Preto", "Sem suporte")).toBe("Estampa:Boi Preto");
  });

  it("corpo do pai: formato V, preço do pai = o menor, filhos com cloneInfo e nome completo", () => {
    const c = corpoPaiNovo(GRANDE) as Record<string, any>;
    expect(c).toMatchObject({ nome: "Matraca Kambada Grande", formato: "V", situacao: "A", preco: 145 });
    const leque = c.variacoes.find((v: any) => v.variacao.nome === "Estampa:Mosaico Colorido;Suporte:Leque Bordado");
    expect(leque).toMatchObject({ nome: "Matraca Kambada Grande Estampa:Mosaico Colorido;Suporte:Leque Bordado", preco: 195, formato: "S" });
    expect(c.variacoes).toHaveLength(56); // 14 estampas × 4 suportes
    expect((corpoPaiNovo(MINI) as any).variacoes).toHaveLength(18); // 9 × 2
    expect((corpoPaiNovo(DTF) as any).variacoes).toHaveLength(5);
    expect(leque.variacao.produtoPai).toEqual({ cloneInfo: true });
  });

  it("filho novo num pai existente aponta para o ID do pai (nunca cloneInfo)", () => {
    const v = variacoesPlanejadas(MINI)[0];
    expect((corpoFilhoNovo(MINI, 123, v) as any).variacao.produtoPai).toEqual({ id: 123 });
  });

  it("acha falta e preço herdado do pai (o bug do cloneInfo) e corrige só o preço", () => {
    const planejadas = variacoesPlanejadas(MINI);
    const lidos = planejadas.slice(1).map((v, i) => ({ id: i + 10, preco: 110, atributos: v.atributos })); // todos a 110
    const d = diferencas(MINI, lidos);
    expect(d.faltam.map((v) => v.atributos)).toEqual([planejadas[0].atributos]);
    expect(d.precoErrado.every((p) => p.para === 145)).toBe(true);
    const atual = { id: 1, nome: MINI.nome, variacoes: lidos.map((l) => ({ id: l.id, preco: l.preco, variacao: { nome: l.atributos } })) };
    const corpo = corpoComPrecosCorrigidos(atual, MINI) as any;
    for (const v of corpo.variacoes) expect(v.preco).toBe(/Com suporte/.test(v.variacao.nome) ? 145 : 110);
  });

  it("compara atributos sem ligar para ordem, espaço, caixa ou acento", () => {
    expect(mesmaVariacao("Estampa:Cazumbá Preto", "estampa: cazumba preto")).toBe(true);
    expect(mesmaVariacao("Suporte:Com suporte;Estampa:X", "Estampa:X;Suporte:Com suporte")).toBe(true);
    expect(mesmaVariacao("Estampa:X;Suporte:Sem suporte", "Estampa:X;Suporte:Com suporte")).toBe(false);
    expect(mesmaVariacao("", "")).toBe(false);
  });

  it("de→para respondido hoje: só os 5 DTF (2+1+2); o resto fica A CONFIRMAR", () => {
    expect(movimentos()).toEqual([
      { pai: "dtf", atributos: "Estampa:Cazumbá Preto", de: 16698777992, quantidade: 2 },
      { pai: "dtf", atributos: "Estampa:Cazumbá Colorido", de: 16698777992, quantidade: 1 },
      { pai: "dtf", atributos: "Estampa:Boi Preto", de: 16698777992, quantidade: 2 },
    ]);
    expect(pendenteNaAntiga(16698777992)).toBe(17);
    expect(pendenteNaAntiga(16698775698)).toBe(8);
    expect(DE_PARA.filter((d) => !d.para).reduce((s, d) => s + d.quantidade, 0)).toBe(41);
  });

  it("folhas → suporte Leque Bordado e boi preto → suporte Topo Boi Preto; a estampa segue A CONFIRMAR", () => {
    const daGrandeCom = DE_PARA.filter((d) => d.de === 16698775698);
    expect(daGrandeCom.find((d) => d.contagem === "Boi colorido suporte folhas")).toMatchObject({ quantidade: 4, para: null, destinoParcial: { pai: "grande", suporte: "Leque Bordado" } });
    expect(daGrandeCom.find((d) => d.contagem === "Boi preto")).toMatchObject({ quantidade: 3, para: null, destinoParcial: { pai: "grande", suporte: "Topo Boi Preto" } });
  });

  it("saldos: primeira rodada move, segunda reconhece feito, venda no meio é recusada", () => {
    const novas = (a: number, b: number, c: number) =>
      new Map([["dtf|Estampa:Cazumbá Preto", a], ["dtf|Estampa:Cazumbá Colorido", b], ["dtf|Estampa:Boi Preto", c]]);
    const antes = planoDeSaldos(16698777992, 22, novas(0, 0, 0));
    expect(antes.ok).toBe(true);
    expect(antes.alvoAntiga).toBe(17);
    expect(antes.novas.map((n) => n.alvo)).toEqual([2, 1, 2]);
    const depois = planoDeSaldos(16698777992, 17, novas(2, 1, 2));
    expect(depois.ok && depois.alvoAntiga === 17 && depois.novas.every((n) => n.agora === n.alvo)).toBe(true);
    const vendeu = planoDeSaldos(16698777992, 21, novas(0, 0, 0));
    expect(vendeu.ok).toBe(false);
    expect(vendeu.motivo).toMatch(/saldo mudou/);
  });

  it("Play: a herdada vira Boi de Frente; o resto do cadastro volta como veio", () => {
    const atual = { id: PLAY.id, nome: PLAY.nome, preco: 220, variacoes: [{ id: PLAY.variacao, nome: `${PLAY.nome} Estampa:Caboclo de Pena`, variacao: { nome: "Estampa:Caboclo de Pena", ordem: 1 } }] };
    const c = corpoPlay(atual) as any;
    expect(c.preco).toBe(220);
    expect(c.variacoes[0]).toMatchObject({ id: PLAY.variacao, nome: "Matraca Kambada Play Modelo:Boi de Frente", variacao: { nome: "Modelo:Boi de Frente", ordem: 1 } });
    expect(() => corpoPlay({ variacoes: [] })).toThrow();
  });

  it("Play: cria Boi de Lado no pai que existe, a R$ 220", () => {
    expect(corposFigurasNovasDoPlay()).toEqual([
      expect.objectContaining({ nome: "Matraca Kambada Play Modelo:Boi de Lado", preco: 220, variacao: { nome: "Modelo:Boi de Lado", ordem: 2, produtoPai: { id: PLAY.id } } }),
    ]);
  });

  it("Play: 4 → Boi de Frente 3 + Boi de Lado 1; venda no meio é recusada", () => {
    const antes = planoDoPlay(new Map([["Modelo:Boi de Frente", 4]]));
    expect(antes.ok).toBe(true);
    expect(antes.alvos).toEqual([
      { atributos: "Modelo:Boi de Frente", agora: 4, alvo: 3 },
      { atributos: "Modelo:Boi de Lado", agora: 0, alvo: 1 },
    ]);
    expect(planoDoPlay(new Map([["Modelo:Boi de Frente", 3], ["Modelo:Boi de Lado", 1]])).alvos.every((a) => a.agora === a.alvo)).toBe(true);
    expect(planoDoPlay(new Map([["Modelo:Boi de Frente", 3]])).ok).toBe(false);
  });

  it("um passo de inativação por pai antigo, depois de criar e mover", () => {
    const chaves = PASSOS.map((p) => p.chave);
    expect(chaves.slice(0, 5)).toEqual(["criar-mini", "criar-grande", "criar-dtf", "play", "saldos"]);
    expect(chaves.filter((c) => c.startsWith("inativar-"))).toHaveLength(4);
  });

  it("o slug local é igual ao do catálogo", () => {
    for (const t of ["Matraca Kambada Mini", "Cazumbá Colorido", "Chapéu de Fita Bandeira do Maranhão"]) expect(paraSlug(t)).toBe(paraSlugDoCatalogo(t));
  });
});

describe("variação com dois atributos (Estampa × Suporte)", () => {
  const pai = { id: 1, nome: "Matraca Kambada Mini", preco: 110, formato: "V" } as never;
  const filhos = [
    { id: 2, nome: "Matraca Kambada Mini Estampa:Boizinho Miolo;Suporte:Sem suporte", preco: 110, formato: "S" },
    { id: 3, nome: "Matraca Kambada Mini Estampa:Boizinho Miolo;Suporte:Com suporte", preco: 145, formato: "S" },
  ] as never[];

  it("lê os atributos do nome do filho", () => {
    expect(atributosDaVariacao("Matraca Kambada Mini Estampa:Boizinho Miolo;Suporte:Com", "Matraca Kambada Mini")).toEqual({ estampa: "Boizinho Miolo", suporte: "Com" });
    expect(atributosDaVariacao("Boné Cor/Estampa:Guarás Bege", "Boné")).toEqual({ "cor-estampa": "Guarás Bege" });
    expect(rotuloDaVariacao("Matraca Kambada Mini Estampa:Boizinho Miolo;Suporte:Com suporte", "Matraca Kambada Mini")).toBe("Boizinho Miolo · Com suporte");
  });

  it("a opção leva os atributos só quando há dois ou mais", () => {
    const opcoes = opcoesDoProduto(pai, filhos, new Map());
    expect(opcoes.find((o) => o.idBling === 3)).toMatchObject({ rotulo: "Boizinho Miolo · Com suporte", preco: 145, atributos: { estampa: "Boizinho Miolo", suporte: "Com suporte" } });
    const camisa = opcoesDoProduto({ id: 9, nome: "Camisa X", preco: 89.9, formato: "V" } as never, [{ id: 10, nome: "Camisa X Tamanho:G", preco: 89.9, formato: "S" } as never], new Map());
    expect(camisa[0]).not.toHaveProperty("atributos");
  });

  it("filho órfão (pai inativado) não vira card avulso", () => {
    expect(pareceFilhoOrfao("Matraca Kambada Pequena sem Suporte Estampa:Caboclo de Pena")).toBe(true);
    expect(pareceFilhoOrfao("Matraca Kambada Mini")).toBe(false);
    expect(pareceFilhoOrfao("Placa de Madeira - Parafuso e Puxador")).toBe(false);
  });
});

const produto = (nome: string, id: number, opcoes: Opcao[] = []): Produto => ({
  slug: `${paraSlug(nome)}-${id}`,
  nome,
  categoria: "matracas",
  preco: 110,
  variacoes: [],
  quantidade: 0,
  idBling: id,
  opcoes,
  sobEncomenda: true,
});

describe("frete das matracas novas: o suporte vem da variação", () => {
  const op = (suporte?: string): Opcao => ({ rotulo: "x", idBling: 1, preco: 1, quantidade: 0, ...(suporte ? { atributos: { estampa: "x", suporte } } : {}) });
  it("Mini e Grande × com/sem", () => {
    expect(embalagemDe(produto("Matraca Kambada Mini", 1), op("Sem suporte"))?.origem).toMatch(/Pequena s\/ Suporte/);
    expect(embalagemDe(produto("Matraca Kambada Mini", 1), op("Com suporte"))?.origem).toMatch(/Pequena c\/ Suporte/);
    expect(embalagemDe(produto("Matraca Kambada Grande", 1), op("Sem suporte"))?.origem).toMatch(/Grande s\/ Suporte/);
    expect(embalagemDe(produto("Matraca Kambada Grande", 1), op("Com"))?.origem).toMatch(/Grande c\/ Suporte/);
  });
  it("Leque Bordado e Topo Boi Preto usam a embalagem da Grande com suporte", () => {
    expect(embalagemDe(produto("Matraca Kambada Grande", 1), op("Leque Bordado"))?.origem).toMatch(/Grande c\/ Suporte/);
    expect(embalagemDe(produto("Matraca Kambada Grande", 1), op("Topo Boi Preto"))?.origem).toMatch(/Grande c\/ Suporte/);
  });
  it("DTF = mini sem suporte; Play continua Play; sem suporte conhecido = WhatsApp", () => {
    expect(embalagemDe(produto("Matraca Kambada Mini DTF", 1), op())?.origem).toMatch(/Pequena s\/ Suporte/);
    expect(embalagemDe(produto("Matraca Kambada Play", 1), op())?.origem).toMatch(/Play/);
    expect(embalagemDe(produto("Matraca Kambada Grande", 1), op())).toBeNull();
  });
  it("os cadastros antigos seguem iguais", () => {
    expect(embalagemDe(produto("Matraca Kambada Grande com Suporte", 1), op())?.origem).toMatch(/Grande c\/ Suporte/);
    expect(embalagemDe(produto("Matraca Kambada Pequena sem Suporte", 1), op())?.origem).toMatch(/Pequena s\/ Suporte/);
  });
});

describe("Mini DTF", () => {
  it("não ganha o aviso de pintura à mão; a Mini ganha", () => {
    expect(ehPintadaAMao({ categoria: "matracas", nome: "Matraca Kambada Mini DTF" })).toBe(false);
    expect(ehPintadaAMao({ categoria: "matracas", nome: "Matraca Kambada Mini" })).toBe(true);
  });
  it("é feita por encomenda: vende com saldo zero (Alexandre, 21/10)", () => {
    expect(ehSobEncomenda("matracas", "Matraca Kambada Mini DTF")).toBe(true);
    expect(ehSobEncomenda("matracas", "Matraca Kambada Grande")).toBe(true);
    expect(ehSobEncomenda("ecobags", "Ecobag Carcará")).toBe(false);
  });
});

describe("fotos das matracas novas (antes de terem foto por ID)", () => {
  const opcao = (id: number, estampa: string, suporte: string): Opcao => ({ rotulo: `${estampa} · ${suporte}`, idBling: id, preco: 145, quantidade: 0, atributos: { estampa, suporte } });

  it("o pai herda a foto e a galeria dos antigos", () => {
    const mini = produto("Matraca Kambada Mini", 99999999901);
    expect(fotoDoProduto(mini)?.src).toBe("/fotos/produtos/16698777979.jpg");
    const galeria = galeriaDoProduto(mini).map((f) => f.src);
    expect(galeria).toContain("/fotos/produtos/16698777669.jpg");
    expect(new Set(galeria).size).toBe(galeria.length);
    expect(fotoDoItem(99999999902, mini.slug)?.src).toBe("/fotos/produtos/16698777979.jpg"); // carrinho
  });

  it("a opção mostra a foto da estampa; com suporte, a do suporte quando existe", () => {
    const grande = produto("Matraca Kambada Grande", 99999999903);
    expect(fotoDaOpcao(grande, opcao(1, "Mosaico Colorido", "Com suporte"))?.src).toMatch(/mosaico-colorido--com-suporte\.jpg$/);
    expect(fotoDaOpcao(grande, opcao(2, "Mosaico Colorido", "Sem suporte"))?.src).toMatch(/mosaico-colorido--sem-suporte\.jpg$/);
    expect(fotoDaOpcao(grande, opcao(3, "Serpente e Rei da Ilha", "Sem suporte"))?.src).toMatch(/serpente-e-rei-da-ilha\.jpg$/);
    expect(fotoDaOpcao(grande, opcao(4, "Caboclo de Pena", "Sem suporte"))).toBeNull();
  });

  it("DTF (um atributo só): a estampa é o rótulo; o card usa a foto da primeira estampa", () => {
    const op: Opcao = { rotulo: "Cazumbá Preto", idBling: 5, preco: 85, quantidade: 2 };
    const dtf = produto("Matraca Kambada Mini DTF", 99999999904, [op]);
    expect(fotoDaOpcao(dtf, op)?.src).toMatch(/mini-dtf--cazumba-preto\.jpg$/);
    expect(fotoDoProduto(dtf)?.src).toMatch(/mini-dtf--cazumba-preto\.jpg$/);
  });

  it("toda estampa confirmada tem foto — exceto as conhecidas sem foto", () => {
    const semFoto: string[] = [];
    for (const pai of [MINI, GRANDE, DTF]) {
      const p = produto(pai.nome, 99999999990);
      for (const v of variacoesPlanejadas(pai)) {
        const op: Opcao = pai.temSuporte
          ? { rotulo: "x", idBling: 1, preco: v.preco, quantidade: 0, atributos: { estampa: v.estampa, suporte: v.suporte } }
          : { rotulo: v.estampa, idBling: 1, preco: v.preco, quantidade: 0 };
        if (!fotoDaOpcao(p, op)) semFoto.push(`${pai.nome} · ${v.estampa} · ${v.suporte}`);
      }
    }
    // Caboclo de Pena: sem foto no acervo — mostra a foto do produto (Alexandre, 21/10).
    expect(semFoto).toEqual(GRANDE.suportes.map((s) => `Matraca Kambada Grande · Caboclo de Pena · ${s}`));
    expect(Object.keys(FOTOS_ESTAMPAS).length).toBeGreaterThanOrEqual(36);
  });

  it("Leque Bordado / Topo Boi Preto usam a foto da estampa com suporte", () => {
    const grande = produto("Matraca Kambada Grande", 99999999906);
    expect(fotoDaOpcao(grande, opcao(7, "Mosaico Colorido", "Leque Bordado"))?.src).toMatch(/mosaico-colorido--com-suporte\.jpg$/);
    expect(fotoDaOpcao(grande, opcao(8, "Bandeira do Maranhão", "Topo Boi Preto"))?.src).toMatch(/bandeira-do-maranhao\.jpg$/);
  });

  it("Play: Boi de Lado mostra a foto dele; Boi de Frente fica com a foto do produto", () => {
    const frente: Opcao = { rotulo: "Boi de Frente", idBling: PLAY.variacao, preco: 220, quantidade: 3 };
    const lado: Opcao = { rotulo: "Boi de Lado", idBling: 99999999905, preco: 220, quantidade: 1 };
    const play = { ...produto("Matraca Kambada Play", PLAY.id, [frente, lado]) };
    expect(fotoDaOpcao(play, lado)?.src).toMatch(/matraca-kambada-play--boi-de-lado\.jpg$/);
    expect(fotoDaOpcao(play, frente)).toBeNull();
    expect(fotoDoProduto(play)?.src).toBe(`/fotos/produtos/${PLAY.id}.jpg`);
  });
});

describe("endereços antigos das matracas", () => {
  const novos = [
    { idBling: 16722270001, nome: "Matraca Kambada Mini", slug: "matraca-kambada-mini-16722270001", categoria: "matracas" },
    { idBling: 16722270002, nome: "Matraca Kambada Grande", slug: "matraca-kambada-grande-16722270002", categoria: "matracas" },
  ];
  it("os 4 antigos (inativos) levam à página nova certa", () => {
    expect(destinoDoEnderecoAntigo("matraca-kambada-grande-com-suporte-16698775382", novos)).toBe("/loja/matracas/matraca-kambada-grande-16722270002");
    expect(destinoDoEnderecoAntigo("matraca-kambada-grande-sem-suporte-16698776080", novos)).toBe("/loja/matracas/matraca-kambada-grande-16722270002");
    expect(destinoDoEnderecoAntigo("matraca-kambada-pequena-com-suporte-16698777669", novos)).toBe("/loja/matracas/matraca-kambada-mini-16722270001");
    expect(destinoDoEnderecoAntigo("matraca-kambada-pequena-sem-suporte-16698777979", novos)).toBe("/loja/matracas/matraca-kambada-mini-16722270001");
    expect(Object.keys(REDIRECIONAMENTOS).map(Number).sort()).toEqual(PAIS_ANTIGOS.map((p) => p.id).sort());
  });
  it("nome mudou no Bling (mesmo ID) continua indo para o produto; desconhecido dá null", () => {
    expect(destinoDoEnderecoAntigo("nome-velho-16722270001", novos)).toBe("/loja/matracas/matraca-kambada-mini-16722270001");
    expect(destinoDoEnderecoAntigo("matraca-kambada-mini-16722270001", novos)).toBeNull(); // é o próprio
    expect(destinoDoEnderecoAntigo("qualquer-coisa-12345678901", novos)).toBeNull();
    expect(destinoDoEnderecoAntigo("sem-id", novos)).toBeNull();
  });
  it("antes de o pai novo existir, o antigo sem destino dá null (404), nunca loop", () => {
    expect(destinoDoEnderecoAntigo("matraca-kambada-grande-com-suporte-16698775382", [])).toBeNull();
  });
});
