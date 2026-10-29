import { describe, expect, it } from "vitest";
import { assinar } from "./seguranca";
import { avaliar, BANCO, iniciarDoDia, normalizar, numeroDaEdicao, palavraDoDia, palpitar, TAMANHO, TENTATIVAS } from "./palavra";

describe("Palavra do dia — antes do lançamento", () => {
  it("a palavra muda todo dia mesmo antes do dia 1 (pré-visualização), e a edição mostrada fica em 1", () => {
    const dias = ["2026-10-27", "2026-10-28", "2026-10-29", "2026-10-30", "2026-10-31"];
    const palavras = dias.map((d) => palavraDoDia(d)?.palavra);
    for (let i = 1; i < palavras.length; i++) expect(palavras[i]).not.toBe(palavras[i - 1]);
    expect(numeroDaEdicao("2026-10-29")).toBe(1);
  });
});

describe("Palavra do dia — banco", () => {
  it("toda palavra tem 5 letras, significado e exemplo, e nenhuma se repete", () => {
    const vistas = new Set<string>();
    for (const p of BANCO) {
      const n = normalizar(p.palavra);
      expect(n).toHaveLength(TAMANHO);
      expect(p.significado.length).toBeGreaterThan(20);
      expect(p.exemplo.length).toBeGreaterThan(10);
      expect(vistas.has(n)).toBe(false);
      vistas.add(n);
    }
  });
});

describe("Palavra do dia — cores", () => {
  it("tira acentos e ignora o que não é letra", () => {
    expect(normalizar("éguas")).toBe("EGUAS");
    expect(normalizar("fuzuê!")).toBe("FUZUE");
    expect(normalizar("pirão")).toBe("PIRAO");
  });

  it("acerto total", () => {
    expect(avaliar("punga", "PUNGA")).toEqual(["certa", "certa", "certa", "certa", "certa"]);
  });

  it("letra existente em outro lugar e letra ausente", () => {
    expect(avaliar("apung", "PUNGA")).toEqual(["lugar", "lugar", "lugar", "lugar", "lugar"]);
    expect(avaliar("zzzzz", "PUNGA")).toEqual(["nao", "nao", "nao", "nao", "nao"]);
  });

  it("letra repetida no palpite só vale tantas vezes quantas existe na resposta", () => {
    // TOADA tem dois A: o palpite AAAAA marca os dois e nega os outros três.
    expect(avaliar("aaaaa", "TOADA")).toEqual(["nao", "nao", "certa", "nao", "certa"]);
    // CANOA x palpite "ARARA": A em 0 existe (lugar), em 2 e 4... só há 2 As na resposta (posições 1 e 4).
    expect(avaliar("arara", "CANOA")).toEqual(["lugar", "nao", "nao", "nao", "certa"]);
  });
});

describe("Palavra do dia — rotação", () => {
  it("o dia 1 é a primeira do rodízio, a data fixa vale no seu dia e o ciclo não repete até acabar a lista", () => {
    const lista = BANCO;
    const vistas = new Set<string>();
    for (let i = 0; i <= lista.length; i++) {
      const dia = new Date(Date.parse("2026-11-01T00:00:00Z") + i * 86_400_000).toISOString().slice(0, 10);
      vistas.add(palavraDoDia(dia, lista)!.palavra);
    }
    expect(vistas.size).toBe(lista.length);
    expect(numeroDaEdicao("2026-11-01")).toBe(1);
    expect(palavraDoDia("2026-11-01", lista)).toBe(lista.find((p) => !p.dia));
    expect(palavraDoDia("2026-11-20", lista)?.palavra).toBe("PUNGA");
  });

  it("o dia da palavra fixa não pula ninguém do rodízio", () => {
    expect(palavraDoDia("2026-11-19", BANCO)?.palavra).toBe("RITMO");
    expect(palavraDoDia("2026-11-21", BANCO)?.palavra).toBe("TERNO");
    expect(palavraDoDia("2026-11-30", BANCO)?.palavra).toBe("MANGA");
  });

  it("antes do dia 1 não quebra", () => {
    expect(palavraDoDia("2026-10-20", BANCO)).not.toBeNull();
  });
});

describe("Palavra do dia — partida", () => {
  const agora = new Date("2026-11-03T15:00:00Z");
  const alvo = palavraDoDia("2026-11-03")!;

  it("a partida nova não revela a palavra", () => {
    const r = iniciarDoDia(agora);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.situacao).toBe("jogando");
    expect(JSON.stringify(r)).not.toContain(normalizar(alvo.palavra));
    expect(r.revelacao).toBeUndefined();
  });

  it("palpite errado volta só as cores; acertar revela a palavra", () => {
    const ini = iniciarDoDia(agora);
    if (!ini.ok) throw new Error("não iniciou");
    const errado = palpitar(ini.estado, "zzzzz", agora);
    if (!errado.ok) throw new Error(errado.mensagem);
    expect(errado.situacao).toBe("jogando");
    expect(errado.revelacao).toBeUndefined();
    const certo = palpitar(errado.estado, alvo.palavra, agora);
    if (!certo.ok) throw new Error(certo.mensagem);
    expect(certo.situacao).toBe("ganhou");
    expect(certo.revelacao?.palavra).toBe(alvo.palavra);
  });

  it("seis erros encerram a partida e revelam a palavra", () => {
    let r = iniciarDoDia(agora);
    for (let i = 0; i < TENTATIVAS; i++) {
      if (!r.ok) throw new Error(r.mensagem);
      r = palpitar(r.estado, "zzzzz", agora);
    }
    if (!r.ok) throw new Error(r.mensagem);
    expect(r.situacao).toBe("perdeu");
    expect(r.revelacao?.palavra).toBe(alvo.palavra);
    expect(palpitar(r.estado, "punga", agora).ok).toBe(false);
  });

  it("recusa palpite curto, estado adulterado e partida de outro dia", () => {
    const ini = iniciarDoDia(agora);
    if (!ini.ok) throw new Error("não iniciou");
    expect(palpitar(ini.estado, "abc", agora).ok).toBe(false);
    expect(palpitar(ini.estado + "x", "punga", agora).ok).toBe(false);
    expect(palpitar(ini.estado, "punga", new Date("2026-11-04T15:00:00Z")).ok).toBe(false);
    const forjado = assinar({ v: 1, jogo: "quiz", dia: "2026-11-03", palpites: [] });
    expect(palpitar(forjado, "punga", agora).ok).toBe(false);
  });
});
