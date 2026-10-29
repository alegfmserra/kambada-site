import { describe, expect, it } from "vitest";
import { ORDEM_PERSONAGENS } from "./missoesArraial";
import { aplicarEvento, completar, perfilNovo, publico } from "./perfil";
import { concluirPasso, concluirProva, diarioDe, falarCom, POVO, recado, RECADOS, recadosDoDia, recadosNovo, SEMANAIS, semanaDe } from "./recados";

const DIA = "2026-11-03";
const CONTA = "conta-1";

function dia(i: number) {
  return new Date(Date.parse("2026-11-01T00:00:00Z") + i * 86_400_000).toISOString().slice(0, 10);
}

/** Primeiro dia a partir de DIA em que o recado está no rodízio. */
function diaDoRecado(id: string): string {
  for (let i = 0; i < 60; i++) if (recadosDoDia(dia(2 + i)).some((r) => r.id === id)) return dia(2 + i);
  throw new Error(`recado ${id} nunca entra no rodízio`);
}

describe("Recados — banco", () => {
  it("ids únicos; todo passo usa personagem real, tem dica e falas", () => {
    expect(new Set(RECADOS.map((r) => r.id)).size).toBe(RECADOS.length);
    for (const r of RECADOS) {
      expect(r.passos.length).toBeGreaterThanOrEqual(2);
      for (const p of r.passos) {
        expect(ORDEM_PERSONAGENS).toContain(p.npc);
        expect(p.dica.length).toBeGreaterThan(10);
        expect(p.falas.length).toBeGreaterThan(0);
        if (p.tipo === "responder") {
          expect(new Set(p.pergunta!.opcoes).size).toBe(3);
          expect(p.acerto?.length).toBeGreaterThan(0);
          expect(p.erro?.length).toBeGreaterThan(0);
        }
        if (p.tipo === "prova") expect(p.mini).toBeTruthy();
      }
    }
  });

  it("todo passo que exige informações só exige o que os passos anteriores dão", () => {
    for (const r of RECADOS) {
      r.passos.forEach((p, i) => {
        if (p.tipo !== "responder") return;
        const dadas = r.passos.slice(0, i).filter((q) => q.info).length;
        expect(p.exigeInfos ?? 0).toBeLessThanOrEqual(dadas);
      });
    }
  });

  it("rodízio: 3 do povo por dia e 2 semanais por semana, variando", () => {
    const hoje = recadosDoDia(DIA);
    expect(hoje.filter((r) => r.categoria === "povo")).toHaveLength(3);
    expect(hoje.filter((r) => r.categoria === "semanal")).toHaveLength(2);
    const povoVisto = new Set<string>();
    for (let i = 0; i < 6; i++) recadosDoDia(dia(i)).filter((r) => r.categoria === "povo").forEach((r) => povoVisto.add(r.id));
    expect(povoVisto.size).toBe(POVO.length);
    expect(SEMANAIS.length).toBeGreaterThanOrEqual(3);
    expect(semanaDe("2026-11-02")).toBe(semanaDe("2026-11-08"));
    expect(semanaDe("2026-11-09")).toBe(semanaDe("2026-11-02") + 1);
  });
});

describe("Recados — jogada", () => {
  it("recado do Zé: barraca dá a informação, o Zé confere e paga o XP uma vez", () => {
    const d = diaDoRecado("recado-do-ze");
    let e = recadosNovo();

    const oferta = falarCom(e, "noivos", d, CONTA, false);
    expect(oferta?.recado).toBe("recado-do-ze");
    expect(oferta?.nova).toBe(true);
    const a = concluirPasso(e, "noivos", "recado-do-ze", undefined, d, CONTA, false);
    if ("erro" in a) throw new Error(a.erro);
    e = a.estado;
    expect(diarioDe(e, d).ativas[0].dica).toMatch(/matraca/i);

    // O Zé ainda não tem nada a dizer: falta ouvir a barraca.
    expect(falarCom(e, "noivos", d, CONTA, false)?.recado).not.toBe("recado-do-ze");
    const b = concluirPasso(e, "barraca", "recado-do-ze", undefined, d, CONTA, false);
    if ("erro" in b) throw new Error(b.erro);
    e = b.estado;
    expect(diarioDe(e, d).ativas[0].infos).toHaveLength(1);

    const pergunta = falarCom(e, "noivos", d, CONTA, false);
    expect(pergunta?.tipo).toBe("responder");
    expect(pergunta?.pergunta?.opcoes).toHaveLength(3);
    const certa = pergunta!.pergunta!.opcoes.indexOf("De duas peças de madeira");
    const errada = certa === 0 ? 1 : 0;
    const erro = concluirPasso(e, "noivos", "recado-do-ze", errada, d, CONTA, false);
    if ("erro" in erro) throw new Error(erro.erro);
    expect(erro.avancou).toBe(false);
    const ok = concluirPasso(e, "noivos", "recado-do-ze", certa, d, CONTA, false);
    if ("erro" in ok) throw new Error(ok.erro);
    expect(ok.concluida?.xp).toBe(50);
    expect(diarioDe(ok.estado, d).ativas).toHaveLength(0);
    expect(falarCom(ok.estado, "noivos", d, CONTA, false)?.recado).not.toBe("recado-do-ze");
  });

  it("não deixa fechar o passo de outro personagem nem pular etapa", () => {
    const d = diaDoRecado("recado-do-ze");
    const e = recadosNovo();
    const a = concluirPasso(e, "noivos", "recado-do-ze", undefined, d, CONTA, false);
    if ("erro" in a) throw new Error(a.erro);
    // Passo 2 (Zé responde) ainda não chegou; passo 1 só vale na barraca.
    expect("erro" in concluirPasso(a.estado, "noivos", "recado-do-ze", 0, d, CONTA, false)).toBe(true);
    expect("erro" in concluirPasso(e, "barraca", "recado-do-ze", undefined, d, CONTA, false)).toBe(true);
  });

  it("passo sem seta não vira marcador, mas a dica aparece no diário", () => {
    const r = recado("a-matraca-que-sumiu")!;
    const e = recadosNovo();
    e.ativas[r.id] = { passo: 1, infos: [], periodo: `s${semanaDe(DIA)}` };
    // Só este recado em jogo: os outros do dia já foram feitos (não ofertam "!").
    for (const o of recadosDoDia(DIA)) if (o.id !== r.id) e.feitas[o.id] = o.categoria === "povo" ? `d${DIA}` : `s${semanaDe(DIA)}`;
    const di = diarioDe(e, DIA);
    expect(di.ativas[0].dica).toMatch(/sem seta/i);
    expect(di.marcados).not.toContain("brincante");
  });

  it("prova: só a mini perfeita certa avança, e fecha o recado se for o último passo", () => {
    const d = diaDoRecado("fogo-no-ritmo");
    let e = recadosNovo();
    const a = concluirPasso(e, "fogueira", "fogo-no-ritmo", undefined, d, CONTA, false);
    if ("erro" in a) throw new Error(a.erro);
    e = a.estado;
    expect(falarCom(e, "fogueira", d, CONTA, false)?.tipo).toBe("prova");
    expect(concluirProva(e, "fogo-no-ritmo", "fogueira", false, d)).toBeNull();
    expect(concluirProva(e, "fogo-no-ritmo", "quadrilha", true, d)).toBeNull();
    const fim = concluirProva(e, "fogo-no-ritmo", "fogueira", true, d);
    expect(fim?.concluida?.xp).toBe(60);
  });

  it("entregar exige item do baú", () => {
    const r = recado("a-matraca-que-sumiu")!;
    const e = recadosNovo();
    e.ativas[r.id] = { passo: 2, infos: ["x"], periodo: `s${semanaDe(DIA)}` };
    expect(falarCom(e, "noivos", DIA, CONTA, false)?.tipo).toBe("avisar");
    expect(falarCom(e, "noivos", DIA, CONTA, true)?.tipo).toBe("entregar");
  });

  it("recado concluído paga XP por fora do teto e avisa o título", () => {
    const r = aplicarEvento(perfilNovo(), { tipo: "recado", titulo: "O recado do Zé", xp: 50 }, DIA);
    expect(r.ganho.xp).toBeGreaterThanOrEqual(50);
    expect(r.ganho.recado).toBe("O recado do Zé");
    expect(r.perfil.xpDoDia.valor).toBe(0);
    expect(publico(completar(perfilNovo()), DIA).recados.disponiveis.length).toBeGreaterThan(0);
  });
});
