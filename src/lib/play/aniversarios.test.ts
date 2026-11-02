import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { aniversariantes, enviarAniversarios, fazAniversarioEm, paraAvisar, paraLembrar, proximoAniversario } from "./aniversarios";
import { aniversarioValido, type Conta } from "./contas";

const conta = (id: string, extra: Partial<Conta> = {}): Conta => ({
  id,
  nome: `Pessoa ${id} Silva`,
  email: `${id}@exemplo.com`,
  senhaHash: "x",
  novidades: true,
  confirmadoEm: "2026-10-01T10:00:00Z",
  criadoEm: "2026-10-01T10:00:00Z",
  aniversario: "11-02",
  ...extra,
});

// 02/11/2026 às 10h em São Luís (13h UTC).
const HOJE = new Date("2026-11-02T13:00:00Z");

describe("aniversarioValido", () => {
  it("aceita dia e mês reais, inclusive 29/02, e normaliza para MM-DD", () => {
    expect(aniversarioValido(2, 11)).toBe("11-02");
    expect(aniversarioValido("29", "2")).toBe("02-29");
    expect(aniversarioValido(31, 12)).toBe("12-31");
  });
  it("recusa data que não existe ou lixo, e vazio apaga", () => {
    expect(aniversarioValido(31, 4)).toBeNull();
    expect(aniversarioValido(30, 2)).toBeNull();
    expect(aniversarioValido(0, 5)).toBeNull();
    expect(aniversarioValido(5, 13)).toBeNull();
    expect(aniversarioValido("abc", 5)).toBeNull();
    expect(aniversarioValido("", "")).toBe("");
    expect(aniversarioValido(null, undefined)).toBe("");
  });
});

describe("fazAniversarioEm", () => {
  it("compara dia e mês; 29/02 comemora em 28/02 nos anos comuns", () => {
    expect(fazAniversarioEm("11-02", "2026-11-02")).toBe(true);
    expect(fazAniversarioEm("11-02", "2026-11-03")).toBe(false);
    expect(fazAniversarioEm("02-29", "2027-02-28")).toBe(true); // 2027 não é bissexto
    expect(fazAniversarioEm("02-29", "2028-02-28")).toBe(false); // 2028 é: espera o 29
    expect(fazAniversarioEm("02-29", "2028-02-29")).toBe(true);
    expect(fazAniversarioEm(undefined, "2026-11-02")).toBe(false);
  });
});

describe("proximoAniversario", () => {
  it("conta os dias até a próxima data, virando o ano quando já passou", () => {
    expect(proximoAniversario("11-24", "2026-11-17")).toEqual({ dias: 7, ano: 2026 });
    expect(proximoAniversario("11-24", "2026-11-24")).toEqual({ dias: 0, ano: 2026 });
    expect(proximoAniversario("11-24", "2026-11-25")).toEqual({ dias: 364, ano: 2027 });
    expect(proximoAniversario("02-29", "2027-02-21")).toEqual({ dias: 7, ano: 2027 }); // vira 28/02 em 2027
    expect(proximoAniversario("02-29", "2028-02-22")).toEqual({ dias: 7, ano: 2028 }); // 2028 é bissexto
  });
});

describe("aviso de uma semana antes", () => {
  const dia = (iso: string) => new Date(`${iso}T13:00:00Z`);
  it("avisa 7 dias antes (ou 6, se a rotina falhou), uma vez só, e só quem pode receber", () => {
    const a = conta("a", { aniversario: "11-24" });
    expect(paraAvisar([a], dia("2026-11-17")).map((c) => c.id)).toEqual(["a"]);
    expect(paraAvisar([a], dia("2026-11-18")).map((c) => c.id)).toEqual(["a"]); // catch-up
    expect(paraAvisar([a], dia("2026-11-16"))).toEqual([]); // 8 dias: cedo
    expect(paraAvisar([a], dia("2026-11-19"))).toEqual([]); // 5 dias: tarde
    expect(paraAvisar([conta("b", { aniversario: "11-24", aniversarioAvisoAno: 2026 })], dia("2026-11-17"))).toEqual([]);
    expect(paraAvisar([conta("c", { aniversario: "11-24", novidades: false })], dia("2026-11-17"))).toEqual([]);
    expect(paraAvisar([conta("d", { aniversario: "11-24", usuario: "x" })], dia("2026-11-17"))).toEqual([]);
  });
  it("vale na virada do ano: 24/01 é avisado em 17/01", () => {
    expect(paraAvisar([conta("e", { aniversario: "01-24" })], dia("2027-01-17")).map((c) => c.id)).toEqual(["e"]);
  });
});

describe("lembrete de validade do cupom", () => {
  const dia = (iso: string) => new Date(`${iso}T13:00:00Z`);
  const cupom = { codigo: "ANIV-ABC234", emitidoEm: "2026-11-24", validoAte: "2026-12-24" };
  const c = conta("f", { aniversarioCupom: cupom });
  it("lembra nos últimos 7 dias de validade, se o cupom não foi usado e ainda não lembrou", () => {
    expect(paraLembrar([c], new Set(), dia("2026-12-16"))).toEqual([]); // cedo
    expect(paraLembrar([c], new Set(), dia("2026-12-17")).map((x) => x.id)).toEqual(["f"]);
    expect(paraLembrar([c], new Set(), dia("2026-12-24")).map((x) => x.id)).toEqual(["f"]); // último dia
    expect(paraLembrar([c], new Set(), dia("2026-12-25"))).toEqual([]); // venceu
    expect(paraLembrar([c], new Set(["ANIV-ABC234"]), dia("2026-12-20"))).toEqual([]); // já usou
    expect(paraLembrar([conta("g", { aniversarioCupom: { ...cupom, lembreteEnviado: true } })], new Set(), dia("2026-12-20"))).toEqual([]);
  });
});

describe("aniversariantes", () => {
  it("só entra quem confirmou, aceitou novidades, não saiu e ainda não recebeu neste ano", () => {
    const lista = [
      conta("ok"),
      conta("ontem", { aniversario: "11-01" }), // rotina de ontem falhou: recupera hoje
      conta("semConfirmar", { confirmadoEm: undefined }),
      conta("semNovidades", { novidades: false }),
      conta("saiu", { descadastradoEm: "2026-10-20T00:00:00Z" }),
      conta("usuario", { usuario: "fulano" }),
      conta("demo", { demo: true }),
      conta("jaRecebeu", { aniversarioCupomAno: 2026 }),
      conta("outroDia", { aniversario: "05-10" }),
      conta("semData", { aniversario: undefined }),
      conta("anoPassado", { aniversarioCupomAno: 2025 }),
    ];
    expect(aniversariantes(lista, HOJE).map((c) => c.id).sort()).toEqual(["anoPassado", "ok", "ontem"]);
  });
});

describe("enviarAniversarios", () => {
  let dir = "";
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), "kambada-aniv-"));
    process.env.PLAY_CONTAS_ARQUIVO = join(dir, "contas.json");
    process.env.CUPONS_ARQUIVO = join(dir, "cupons.json");
    await writeFile(process.env.PLAY_CONTAS_ARQUIVO, JSON.stringify({ versao: 1, contas: [conta("a"), conta("b", { aniversario: "07-07" })] }));
  });

  it("cria um cupom de 15 % de uso único para o aniversariante, uma vez só", async () => {
    const r = await enviarAniversarios("https://exemplo.test", HOJE);
    expect(r.dia).toBe("2026-11-02");
    expect(r.enviados).toHaveLength(1);
    expect(r.enviados[0].codigo).toMatch(/^ANIV-[A-Z0-9]{6}$/);
    const cupons = JSON.parse(await readFile(process.env.CUPONS_ARQUIVO!, "utf8")) as { codigo: string; percentual: number; validoAte: string; limite: { usos: number } }[];
    const c = cupons.find((x) => x.codigo === r.enviados[0].codigo);
    expect(c).toMatchObject({ percentual: 15, validoAte: "2026-12-02", limite: { usos: 1 } });
    // Roda de novo (cron a cada 6 h): não repete.
    const de2 = await enviarAniversarios("https://exemplo.test", new Date("2026-11-02T19:00:00Z"));
    expect(de2.enviados).toEqual([]);
    const contas = JSON.parse(await readFile(process.env.PLAY_CONTAS_ARQUIVO!, "utf8")) as { contas: Conta[] };
    expect(contas.contas.find((x) => x.id === "a")?.aniversarioCupomAno).toBe(2026);
    expect(contas.contas.find((x) => x.id === "b")?.aniversarioCupomAno).toBeUndefined();
  });
});
