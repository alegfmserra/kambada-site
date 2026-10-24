import { describe, expect, it } from "vitest";
import { respostasParaCsv, resumir, validarResposta } from "./pesquisa";

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
