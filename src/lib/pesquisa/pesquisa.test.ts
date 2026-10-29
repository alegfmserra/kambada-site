import { describe, expect, it } from "vitest";
import { filtrarPeriodo, notaDoSite, respostasParaCsv, respostasParaCsvIctg, resumir, testeDePreco, usouPlayDe, validarResposta } from "./pesquisa";

describe("pesquisa de satisfação", () => {
  it("aceita só opções conhecidas e corta texto longo", () => {
    const r = validarResposta({
      nota: 5,
      funcionou: "com-problemas",
      problema: "x".repeat(900),
      curtiu: ["loja", "play", "invasor", "loja"],
      valorPlay: "muito",
      assinaria: "hackeado",
      pagina: "/loja?utm=1",
      largura: 390,
    });
    expect(r?.nota).toBe(5);
    expect(r?.problema).toHaveLength(500);
    expect(r?.curtiu).toEqual(["loja", "play"]);
    expect(r?.assinaria).toBeUndefined();
    expect(r?.pagina).toBe("/loja");
  });

  it("guarda só o primeiro nome, idade válida e o e-mail da conta", () => {
    const r = validarResposta({ nota: 5, nome: "  Maria José da Silva ", idade: "34" }, new Date(), "maria@exemplo.com")!;
    expect(r.nome).toBe("Maria");
    expect(r.idade).toBe(34);
    expect(r.email).toBe("maria@exemplo.com");
    expect(validarResposta({ nota: 5, idade: 300 })?.idade).toBeUndefined();
    expect(validarResposta({ nota: 5 })?.email).toBeUndefined();
    expect(validarResposta({ nome: "Ana", idade: 30 })).toBeNull();
    const s = resumir([r, validarResposta({ nota: 4, idade: 16 })!]);
    expect(s.idadeMedia).toBe(25);
    expect(s.idades["13–17"]).toBe(1);
  });

  it("bloco MIT: valida opções, NPS 0–10 e só guarda dados da instituição de quem dirige uma", () => {
    const gestor = validarResposta({
      cargoDirecao: "sim", tipoInstituicao: "ies", instituicao: "UFMA", alcance: "mais-1000", interessePiloto: "sim",
      topaTeste: "sim", contato: "ana@exemplo.com", confirmaDor: "sim", recomendaria: 10, frequenciaBusca: "mensal", conseguiu: "sim", aprendeu: "sim",
    })!;
    const naoGestor = validarResposta({ cargoDirecao: "nao", tipoInstituicao: "ies", instituicao: "X", interessePiloto: "sim", confirmaDor: "em-parte", recomendaria: "6" })!;
    expect(gestor.tipoInstituicao).toBe("ies");
    expect(naoGestor.tipoInstituicao).toBeUndefined();
    expect(naoGestor.instituicao).toBeUndefined();
    expect(naoGestor.interessePiloto).toBeUndefined();
    expect(naoGestor.recomendaria).toBe(6);
    expect(validarResposta({ recomendaria: 11 })).toBeNull();
    expect(validarResposta({ recomendaria: 0 })?.recomendaria).toBe(0);
    expect(validarResposta({ confirmaDor: "hackeado" })).toBeNull();

    const extra = validarResposta({ recomendaria: 3, confirmaDor: "nao", cargoDirecao: "sim", tipoInstituicao: "ong", instituicao: "ufma " })!;
    const m = resumir([gestor, naoGestor, extra]).mit;
    expect(m.F1_2_confirmaDor).toMatchObject({ n: 3, sim: 1, pct: 33.3 });
    expect(m.F2_3_nps).toMatchObject({ n: 3, promotores: 1, neutros: 0, detratores: 2, nps: -33 });
    expect(m.F3_2_F3_7_instituicoes).toMatchObject({ respondeuCargoDirecao: 3, comCargoDirecao: 2, comContato: 1, distintas: 1 });
    expect(m.I6_tipoInstituicao["Universidade / instituto / pesquisa"]).toBe(1);
    expect(respostasParaCsv([gestor])).toContain("ana@exemplo.com");
  });

  it("recusa resposta vazia e nota fora de 1–5", () => {
    expect(validarResposta({})).toBeNull();
    expect(validarResposta({ nota: 9 })).toBeNull();
    expect(validarResposta({ pagina: "/" })).toBeNull();
  });

  it("CSV neutraliza fórmula e resume a nota média", () => {
    const a = validarResposta({ nota: 4, comentario: "=HYPERLINK(1)" })!;
    const b = validarResposta({ nota: 5, assinaria: "familia" })!;
    expect(respostasParaCsv([a])).toContain(`"'=HYPERLINK(1)"`);
    const s = resumir([a, b]);
    expect(s.notaMedia).toBe(4.5);
    expect(s.assinaria["Sim — Família (R$ 9,90/mês)"]).toBe(1);
  });
});

describe("pesquisa: loja, usuários do Play e exportação para o ICTG", () => {
  it("valida as perguntas da loja e ignora opção inventada", () => {
    const r = validarResposta({ achou: "achou-sim", comprou: "nunca-comprou", levariaHoje: ["frete", "fotos", "frete", "hack"], compraPara: "presente", canalPreferido: "whatsapp", pecaDesejada: "caneca" })!;
    expect(r.levariaHoje).toEqual(["frete", "fotos"]);
    expect(r.comprou).toBe("nunca-comprou");
    expect(validarResposta({ levariaHoje: ["hack"], comprou: "x" })).toBeNull();
    const s = resumir([r]);
    expect(s.loja.levariaHoje.n).toBe(1);
    expect(s.loja.levariaHoje.distribuicao["Frete mais barato ou grátis"]).toBe(1);
  });

  it("marca quem usou o Play (conta ligada ou gatilho de jogo/HQ) e separa os indicadores", () => {
    const comConta = validarResposta({ nota: 5, recomendaria: 10 }, new Date(), "a@b.com")!;
    const jogo = validarResposta({ nota: 4, recomendaria: 9, gatilho: "arraial" })!;
    const hq = validarResposta({ nota: 4, gatilho: "hq" })!;
    const loja = validarResposta({ nota: 3, recomendaria: 0, gatilho: "rodape" })!;
    expect([comConta, jogo, hq, loja].map((r) => r.usouPlay)).toEqual([true, true, true, false]);
    const s = resumir([comConta, jogo, hq, loja]);
    expect(s.usuariosPlay).toBe(3);
    expect(s.mit.F2_3_nps.n).toBe(3);
    expect(s.mitPlay.F2_3_nps.n).toBe(2);
    expect(s.mitPlay.F2_3_nps.nps).toBe(100);
    // resposta antiga, sem o marcador
    expect(usouPlayDe({ em: "2026-10-20T10:00:00Z", curtiu: [], gatilho: "quiz" })).toBe(true);
    expect(usouPlayDe({ em: "2026-10-20T10:00:00Z", curtiu: [] })).toBe(false);
  });

  it("exportação do ICTG não leva nome, e-mail, contato nem instituição", () => {
    const r = validarResposta({ nota: 5, nome: "Maria", idade: 30, cargoDirecao: "sim", instituicao: "Escola X", contato: "m@x.com", gatilho: "quiz" }, new Date(), "m@x.com")!;
    const csv = respostasParaCsvIctg([r]);
    const cab = csv.split("\r\n")[0];
    for (const c of ["nome", "email", "contato", "instituicao"]) expect(cab.split(";")).not.toContain(c);
    expect(cab).toContain("usouPlay");
    expect(csv).not.toContain("Maria");
    expect(csv).not.toContain("m@x.com");
    expect(csv).not.toContain("Escola X");
    expect(respostasParaCsv([r])).toContain("Maria");
  });

  it("filtra por período em dias inclusivos (fuso de São Luís)", () => {
    const a = { em: "2026-10-20T12:00:00.000Z", curtiu: [] as never[] };
    const b = { em: "2026-10-25T01:00:00.000Z", curtiu: [] as never[] }; // 24/10 22h em São Luís
    expect(filtrarPeriodo([a, b], "2026-10-21", null)).toEqual([b]);
    expect(filtrarPeriodo([a, b], null, "2026-10-24")).toEqual([a, b]);
    expect(filtrarPeriodo([a, b], "2026-10-25", null)).toEqual([]);
    expect(filtrarPeriodo([a, b])).toHaveLength(2);
  });
});

describe("pesquisa: teste de preço", () => {
  it("só aceita valor da lista com resposta válida, e conta por preço", () => {
    const a = validarResposta({ nota: 5, precoTeste: 9.9, aceitaPreco: "sim" })!;
    const b = validarResposta({ nota: 5, precoTeste: 9.9, aceitaPreco: "nao" })!;
    const c = validarResposta({ nota: 5, precoTeste: 19.9, aceitaPreco: "talvez", gatilho: "quiz" })!;
    const invalida = validarResposta({ nota: 5, precoTeste: 1, aceitaPreco: "sim" })!;
    const semResposta = validarResposta({ nota: 5, precoTeste: 9.9 })!;
    expect(invalida.precoTeste).toBeUndefined();
    expect(semResposta.precoTeste).toBeUndefined();
    const t = testeDePreco([a, b, c, invalida, semResposta]);
    const p990 = t.find((l) => l.preco === 9.9)!;
    expect(p990).toMatchObject({ n: 2, sim: 1, nao: 1, pctSim: 50, pctSimTalvez: 50 });
    expect(t.find((l) => l.preco === 19.9)).toMatchObject({ n: 1, talvez: 1, pctSimTalvez: 100 });
    expect(t.find((l) => l.preco === 6.9)).toMatchObject({ n: 0, pctSim: null });
    expect(resumir([a, b, c]).testePrecoPlay.find((l) => l.preco === 19.9)?.n).toBe(1);
    expect(validarResposta({ gatilho: "video", nota: 4 })!.usouPlay).toBe(true);
  });

  it("selo da nota do site só aparece com 10 notas ou mais", () => {
    const r = (nota: number) => validarResposta({ nota })!;
    expect(notaDoSite(Array.from({ length: 9 }, () => r(5)))).toBeNull();
    expect(notaDoSite([...Array.from({ length: 9 }, () => r(5)), r(4), validarResposta({ comentario: "sem nota" })!])).toEqual({ media: 4.9, notas: 10 });
  });
});
