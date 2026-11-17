import { beforeEach, describe, expect, it } from "vitest";
import { iniciarMemoria, pontosDaMemoria, virarCarta, type ProvaMemoria, type ViradaMemoria } from "./memoria";
import { cifrar, decifrar, verificar } from "./seguranca";
import { reiniciarUsoUnico } from "./usoUnico";

const T0 = Date.parse("2026-11-17T15:00:00Z");

/** Só o teste abre o estado (tem o segredo do servidor): o navegador não consegue. */
const mesaDe = (estado: string) => decifrar<{ mesa: number[] }>(estado)!.mesa;

function ok(r: ViradaMemoria | { erro: string }): ViradaMemoria {
  if ("erro" in r) throw new Error(r.erro);
  return r;
}

/** Posições das duas cartas de cada par, na ordem das cartas. */
function paresDa(mesa: number[]): [number, number][] {
  const pares = new Map<number, number[]>();
  mesa.forEach((c, pos) => pares.set(c, [...(pares.get(c) ?? []), pos]));
  return [...pares.values()].map((p) => [p[0], p[1]] as [number, number]);
}

/** Duas posições livres (não achadas) com cartas diferentes. */
function erroCerto(mesa: number[], achadas: number[] = []): [number, number] {
  const livres = mesa.map((c, i) => (achadas.includes(c) ? -1 : i)).filter((i) => i >= 0);
  const a = livres[0];
  const b = livres.find((i) => mesa[i] !== mesa[a])!;
  return [a, b];
}

describe("memória: a mesa fica no servidor", () => {
  beforeEach(() => reiniciarUsoUnico());

  it("sorteia a mesa com dois de cada carta e não a mostra ao navegador", () => {
    const { estado, pares, nivel } = iniciarMemoria("medio", T0);
    expect(pares).toBe(8);
    expect(nivel).toBe("medio");
    expect([...mesaDe(estado)].sort((a, b) => a - b)).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7]);
    // O estado não é legível: nem como carga assinada, nem em base64.
    expect(verificar(estado)).toBeNull();
    for (const parte of estado.split(".")) {
      expect(Buffer.from(parte, "base64url").toString("utf8")).not.toContain("mesa");
    }
    expect(iniciarMemoria("facil", T0).pares).toBe(6);
    expect(iniciarMemoria("dificil", T0).pares).toBe(12);
    expect(iniciarMemoria("xyz", T0).nivel).toBe("medio");
  });

  it("partida perfeita: pontos, jogadas e tempo calculados aqui, e a prova leva a conta", () => {
    const inicio = iniciarMemoria("facil", T0, "conta-da-ana");
    let estado = inicio.estado;
    const pares = paresDa(mesaDe(estado));
    let ultima: ViradaMemoria | null = null;
    pares.forEach(([a, b], i) => {
      const t = T0 + (i + 1) * 1500;
      const primeira = ok(virarCarta(estado, a, t));
      expect(primeira.par).toBeUndefined();
      expect(primeira.jogadas).toBe(i); // a primeira carta ainda não conta jogada
      ultima = ok(virarCarta(primeira.estado, b, t + 400));
      expect(ultima.par).toBe(true);
      expect(ultima.carta).toBe(primeira.carta);
      if (ultima.estado) estado = ultima.estado;
    });
    const fim = ultima!.fim!;
    expect(ultima!.estado).toBeUndefined();
    expect(fim).toMatchObject({ jogadas: 6, pontos: pontosDaMemoria("facil", 6, 9.4), nivel: "facil", segundos: 9 });
    expect(fim.pontos).toBe(1000);
    expect(verificar<ProvaMemoria>(fim.prova)).toMatchObject({ jogo: "memoria", conta: "conta-da-ana", jogadas: 6, pontos: 1000 });
  });

  it("errar conta jogada, não acha o par e deixa as cartas onde estavam", () => {
    const { estado } = iniciarMemoria("medio", T0);
    const mesa = mesaDe(estado);
    const [a, b] = erroCerto(mesa);
    const r1 = ok(virarCarta(estado, a, T0 + 1000));
    const r2 = ok(virarCarta(r1.estado, b, T0 + 2000));
    expect(r2).toMatchObject({ par: false, jogadas: 1, achadas: 0 });
    expect(r2.embaralhou).toBeUndefined();
    expect(mesaDe(r2.estado!)).toEqual(mesa);
  });

  it("não deixa virar, olhar e voltar atrás: cada passo vale uma vez", () => {
    const { estado } = iniciarMemoria("medio", T0);
    const r1 = ok(virarCarta(estado, 0, T0 + 1000));
    // Reenviar o estado anterior com OUTRA carta seria espiar de graça.
    expect(virarCarta(estado, 1, T0 + 1500)).toHaveProperty("erro");
    expect(virarCarta(estado, 5, T0 + 1500)).toHaveProperty("erro");
    // O mesmo pedido repetido (resposta que se perdeu na rede) devolve a mesma carta.
    expect(ok(virarCarta(estado, 0, T0 + 1600)).carta).toBe(r1.carta);
    // E a partida segue do estado novo.
    expect(virarCarta(r1.estado, 1, T0 + 2000)).not.toHaveProperty("erro");
    expect(virarCarta(r1.estado, 2, T0 + 2100)).toHaveProperty("erro");
  });

  it("no difícil, três erros seguidos embaralham só as cartas que ainda não foram achadas", () => {
    let estado = iniciarMemoria("dificil", T0).estado;
    // Acha um par primeiro, para conferir que ele não sai do lugar.
    const [p0] = paresDa(mesaDe(estado));
    estado = ok(virarCarta(ok(virarCarta(estado, p0[0], T0 + 1000)).estado, p0[1], T0 + 2000)).estado!;
    const achada = mesaDe(estado)[p0[0]];
    let ultima: ViradaMemoria | null = null;
    for (let i = 0; i < 3; i++) {
      const [a, b] = erroCerto(mesaDe(estado), [achada]);
      ultima = ok(virarCarta(ok(virarCarta(estado, a, T0 + 3000 + i * 2000)).estado, b, T0 + 4000 + i * 2000));
      expect(ultima.par).toBe(false);
      expect(Boolean(ultima.embaralhou)).toBe(i === 2);
      estado = ultima.estado!;
    }
    const mesa = mesaDe(estado);
    expect(mesa[p0[0]]).toBe(achada);
    expect(mesa[p0[1]]).toBe(achada);
    expect([...mesa].sort((a, b) => a - b)).toEqual(Array.from({ length: 24 }, (_, i) => Math.floor(i / 2)));
    // No fácil e no médio não embaralha nunca.
    let medio = iniciarMemoria("medio", T0).estado;
    for (let i = 0; i < 5; i++) {
      const [a, b] = erroCerto(mesaDe(medio));
      const r = ok(virarCarta(ok(virarCarta(medio, a, T0 + i * 2000)).estado, b, T0 + i * 2000 + 500));
      expect(r.embaralhou).toBeUndefined();
      medio = r.estado!;
    }
  });

  it("recusa partida rápida demais, carta já virada, posição que não existe, estado adulterado e partida vencida", () => {
    // 6 pares em 2 segundos: máquina.
    let estado = iniciarMemoria("facil", T0).estado;
    let resposta: ViradaMemoria | { erro: string } = { erro: "" };
    for (const [a, b] of paresDa(mesaDe(estado))) {
      resposta = virarCarta(ok(virarCarta(estado, a, T0 + 1000)).estado, b, T0 + 2000);
      if (!("erro" in resposta) && resposta.estado) estado = resposta.estado;
    }
    expect(resposta).toEqual({ erro: "Resultado inválido." });

    const outra = iniciarMemoria("facil", T0).estado;
    const [par] = paresDa(mesaDe(outra));
    const r1 = ok(virarCarta(outra, par[0], T0 + 1000));
    expect(virarCarta(r1.estado, par[0], T0 + 2000)).toHaveProperty("erro"); // a mesma carta duas vezes
    const r2 = ok(virarCarta(r1.estado, par[1], T0 + 2000));
    expect(virarCarta(r2.estado, par[0], T0 + 3000)).toHaveProperty("erro"); // carta de par já achado
    expect(virarCarta(r2.estado, 99, T0 + 3000)).toHaveProperty("erro");
    expect(virarCarta(r2.estado, -1, T0 + 3000)).toHaveProperty("erro");
    expect(virarCarta(r2.estado, "3", T0 + 3000)).toHaveProperty("erro");
    expect(virarCarta(r2.estado + "x", 3, T0 + 3000)).toHaveProperty("erro");
    expect(virarCarta("lixo", 3, T0 + 3000)).toHaveProperty("erro");
    // Estado inventado, mesmo cifrado com outro formato, não vale.
    expect(virarCarta(cifrar({ v: 2, id: "x", mesa: [0, 0] }), 0, T0 + 3000)).toHaveProperty("erro");
    expect(virarCarta(r2.estado, 3, T0 + 61 * 60_000)).toEqual({ erro: "Partida expirada. Comece outra." });
  });

  it("a pontuação continua a mesma de antes", () => {
    expect(pontosDaMemoria("medio", 8, 20)).toBe(1500);
    expect(pontosDaMemoria("medio", 12, 20)).toBe(1350);
    expect(pontosDaMemoria("medio", 80, 600)).toBe(150);
    expect(pontosDaMemoria("dificil", 14, 60)).toBe(1750);
  });
});
