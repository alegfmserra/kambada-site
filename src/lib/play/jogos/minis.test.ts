import { describe, expect, it } from "vitest";
import { concluirMini, iniciarMini, MINIS } from "./minis";
import { aplicarEvento, perfilNovo, publico, XP } from "./perfil";

const DIA = "2026-11-03";

describe("Mini-atividades", () => {
  it("sorteia sequência do tamanho certo e recusa atividade desconhecida", () => {
    for (const m of MINIS) {
      const r = iniciarMini(m.id);
      expect("sequencia" in r && r.sequencia.length).toBe(m.tamanho);
    }
    expect("erro" in iniciarMini("xadrez")).toBe(true);
  });

  it("confere a resposta no servidor e conta acertos", () => {
    const t0 = 1_000_000;
    const r = iniciarMini("quadrilha", t0);
    if (!("estado" in r)) throw new Error("sem estado");
    const certa = concluirMini(r.estado, r.sequencia, t0 + 20_000);
    expect("perfeito" in certa && certa.perfeito).toBe(true);
    const errada = r.sequencia.map((n) => (n + 1) % 5);
    const ruim = concluirMini(r.estado, errada, t0 + 20_000);
    expect("acertos" in ruim && ruim.acertos).toBe(0);
  });

  it("recusa estado falso, resposta fora do tamanho, símbolo inválido e partida vencida", () => {
    const t0 = 1_000_000;
    const r = iniciarMini("fogueira", t0);
    if (!("estado" in r)) throw new Error("sem estado");
    expect("erro" in concluirMini("lixo", r.sequencia, t0 + 9000)).toBe(true);
    expect("erro" in concluirMini(r.estado, [0, 1], t0 + 9000)).toBe(true);
    expect("erro" in concluirMini(r.estado, [0, 0, 0, 0, 0, 9], t0 + 9000)).toBe(true);
    expect("erro" in concluirMini(r.estado, r.sequencia, t0 + 11 * 60_000)).toBe(true);
  });

  it("perfeito só vale se não foi rápido demais", () => {
    const t0 = 1_000_000;
    const r = iniciarMini("fogueira", t0);
    if (!("estado" in r)) throw new Error("sem estado");
    const rapido = concluirMini(r.estado, r.sequencia, t0 + 100);
    expect("perfeito" in rapido && rapido.perfeito).toBe(false);
  });

  it("paga XP uma vez por dia por atividade", () => {
    const a = aplicarEvento(perfilNovo(), { tipo: "mini", mini: "fogueira", perfeito: true }, DIA);
    expect(a.ganho.xp).toBeGreaterThanOrEqual(XP.miniPerfeita);
    expect(publico(a.perfil, DIA).minisHoje).toEqual(["fogueira"]);
    const b = aplicarEvento(a.perfil, { tipo: "mini", mini: "fogueira", perfeito: true }, DIA);
    expect(b.ganho.xp).toBe(0);
    const c = aplicarEvento(a.perfil, { tipo: "mini", mini: "quadrilha", perfeito: false }, DIA);
    expect(c.ganho.xp).toBe(XP.miniTentada);
    const amanha = aplicarEvento(a.perfil, { tipo: "mini", mini: "fogueira", perfeito: true }, "2026-11-04");
    expect(amanha.ganho.xp).toBeGreaterThanOrEqual(XP.miniPerfeita);
  });
});
