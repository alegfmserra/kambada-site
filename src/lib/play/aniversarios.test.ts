import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { aniversariantes, enviarAniversarios, fazAniversarioEm } from "./aniversarios";
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
