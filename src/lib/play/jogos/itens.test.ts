import { describe, expect, it } from "vitest";
import { abrirBau, aplicarEvento, completar, equipar, perfilNovo, publico, XP_BAU_REPETIDO } from "./perfil";
import { idsDisponiveis, ITENS, item, opcoesDoVisual, sortearDoBau, visualInicial, visualValido } from "./itens";

const DIA = "2026-11-03";

describe("Itens — catálogo", () => {
  it("ids únicos e ficha em todo item", () => {
    expect(new Set(ITENS.map((i) => i.id)).size).toBe(ITENS.length);
    for (const i of ITENS) expect(i.ficha.length).toBeGreaterThan(20);
  });

  it("todo slot tem um item inicial e o visual inicial é válido", () => {
    const v = visualInicial();
    for (const slot of ["chapeu", "camisa", "fita"] as const) expect(item(v[slot])?.slot).toBe(slot);
    expect(opcoesDoVisual(v).chapeu).toBe("palha");
  });

  it("nível, sequência e baú abrem itens diferentes", () => {
    const base = { nivel: 1, sequenciaMelhor: 0, inventario: [] as string[] };
    expect(idsDisponiveis(base)).not.toContain("chapeu-couro");
    expect(idsDisponiveis({ ...base, nivel: 3 })).toContain("chapeu-couro");
    expect(idsDisponiveis({ ...base, sequenciaMelhor: 3 })).toContain("camisa-verde");
    expect(idsDisponiveis({ ...base, inventario: ["matraca"] })).toContain("matraca");
  });

  it("visual com item que a conta não tem volta ao inicial", () => {
    const ctx = { nivel: 1, sequenciaMelhor: 0, inventario: [] };
    const v = visualValido({ chapeu: "chapeu-fitas", camisa: "chapeu-palha", fita: "fita-couro" }, ctx);
    expect(v).toEqual(visualInicial());
  });
});

describe("Perfil — vestir", () => {
  it("só veste o que tem e no slot certo", () => {
    const p = perfilNovo();
    expect("erro" in equipar(p, "chapeu", "chapeu-fitas")).toBe(true);
    expect("erro" in equipar(p, "camisa", "chapeu-palha")).toBe(true);
    expect("erro" in equipar(p, "chapeu", "nao-existe")).toBe(true);
    p.xp = 250; // nível 3
    const r = equipar(p, "chapeu", "chapeu-couro");
    expect("perfil" in r && r.perfil.visual.chapeu).toBe("chapeu-couro");
  });

  it("subir de nível avisa os itens novos", () => {
    const p = perfilNovo();
    p.xp = 90;
    const r = aplicarEvento(p, { tipo: "conversa", npc: "boi" }, DIA);
    expect(r.ganho.subiuPara?.nivel).toBe(2);
    expect(r.ganho.itensNovos).toEqual(expect.arrayContaining(["Camisa xadrez azul", "Fita vermelha"]));
  });

  it("perfil antigo, sem os campos novos, é completado", () => {
    const velho = { ...perfilNovo() } as Partial<ReturnType<typeof perfilNovo>>;
    delete velho.inventario;
    delete velho.visual;
    delete velho.bauDia;
    const p = completar(velho);
    expect(p.inventario).toEqual([]);
    expect(p.visual).toEqual(visualInicial());
    expect(publico(p, DIA).bauPronto).toBe(true);
  });
});

describe("Baú do dia", () => {
  it("abre uma vez por dia e dá um item que ainda falta", () => {
    const a = abrirBau(perfilNovo(), "conta-1", DIA);
    expect("perfil" in a && a.item).toBeTruthy();
    if (!("perfil" in a)) return;
    expect(a.perfil.inventario).toHaveLength(1);
    expect(publico(a.perfil, DIA).bauPronto).toBe(false);
    expect("erro" in abrirBau(a.perfil, "conta-1", DIA)).toBe(true);
    const amanha = abrirBau(a.perfil, "conta-1", "2026-11-04");
    expect("perfil" in amanha && amanha.perfil.inventario).toHaveLength(2);
  });

  it("o sorteio é fixo para a mesma conta e dia (sem reabrir para trocar)", () => {
    expect(sortearDoBau("c", DIA, [])?.id).toBe(sortearDoBau("c", DIA, [])?.id);
  });

  it("sem item faltando, paga XP", () => {
    const p = perfilNovo();
    p.inventario = ITENS.filter((i) => i.requisito.tipo === "bau").map((i) => i.id);
    const r = abrirBau(p, "conta-1", DIA);
    expect("perfil" in r && r.xp).toBe(XP_BAU_REPETIDO);
    expect("perfil" in r && r.perfil.xp).toBe(XP_BAU_REPETIDO);
  });
});
