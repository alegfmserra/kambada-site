import { describe, expect, it } from "vitest";
import {
  anotarPista,
  BONUS_PISTAS,
  iniciarDesafio,
  iniciarMissao,
  leituraMinimaMs,
  missoesAtivas,
  PERGUNTAS_DO_DESAFIO,
  pontosDaResposta,
  responderDesafio,
  type ProvaArraial,
} from "./arraial";
import { MISSOES, ORDEM_NPCS, type Missao } from "./missoesArraial";
import { permutacaoSecreta, verificar } from "./seguranca";

/** Joga uma partida inteira respondendo sempre a 1ª opção mostrada. */
function jogar(comPistas: boolean) {
  const t0 = Date.now();
  let { estado } = iniciarMissao(t0);
  if (comPistas) {
    for (const npc of ORDEM_NPCS) {
      const r = anotarPista(estado, npc, t0 + 1000);
      if ("erro" in r) throw new Error(r.erro);
      estado = r.estado;
    }
  }
  const d = iniciarDesafio(estado, t0 + 60_000);
  if ("erro" in d) throw new Error(d.erro);
  estado = d.estado;
  let ultima;
  for (let i = 0; i < PERGUNTAS_DO_DESAFIO; i++) {
    const r = responderDesafio(estado, 0, t0 + 61_000 + i * 2000);
    if ("erro" in r) throw new Error(r.erro);
    ultima = r;
    if (r.estado) estado = r.estado;
  }
  return ultima!;
}

describe("arraial — missões", () => {
  it("todas as missões têm as 5 conversas e perguntas com 3 opções", () => {
    for (const m of MISSOES) {
      for (const npc of ORDEM_NPCS) expect(m.conversas[npc].falas.length).toBeGreaterThan(0);
      expect(m.perguntas.length).toBeGreaterThanOrEqual(PERGUNTAS_DO_DESAFIO);
      for (const p of m.perguntas) expect(new Set(p.opcoes).size).toBe(3);
    }
  });

  it("a missão pública não leva o gabarito", () => {
    const { missao } = iniciarMissao();
    expect(JSON.stringify(missao)).not.toContain("vocesabia");
    expect(JSON.stringify(missao)).not.toContain("perguntas");
  });

  it("sem missão revisada, roda a mais recente como prévia", () => {
    const m = { ...MISSOES[0], revisado: false, temporadas: ["2026-11"] } as Missao;
    expect(missoesAtivas(new Date("2026-11-10T12:00:00Z"), [m])).toEqual([m]);
    const r = { ...m, id: "revisada", revisado: true };
    expect(missoesAtivas(new Date("2026-11-10T12:00:00Z"), [m, r])).toEqual([r]);
  });

  it("bônus de pistas só com as 5 conversas", () => {
    const com = jogar(true);
    const sem = jogar(false);
    expect(com.bonusPistas).toBe(BONUS_PISTAS);
    expect(sem.bonusPistas).toBe(0);
    const prova = verificar<ProvaArraial>(com.prova)!;
    expect(prova.jogo).toBe("arraial");
    expect(prova.pistas).toBe(5);
    expect(prova.pontos).toBeLessThanOrEqual(1000);
  });

  it("não deixa repetir o desafio na mesma partida nem anotar pista depois", () => {
    const { estado } = iniciarMissao();
    const d = iniciarDesafio(estado);
    if ("erro" in d) throw new Error(d.erro);
    expect("erro" in iniciarDesafio(d.estado)).toBe(true);
    expect("erro" in anotarPista(d.estado, "boi")).toBe(true);
  });

  it("rapidez: até 150 por acerto, 100 no mínimo, 0 no erro", () => {
    expect(pontosDaResposta(true, 0)).toBe(148);
    expect(pontosDaResposta(true, 60_000)).toBe(100);
    expect(pontosDaResposta(false, 1000)).toBe(0);
  });

  it("recusa estado adulterado e personagem desconhecido", () => {
    const { estado } = iniciarMissao();
    expect("erro" in anotarPista(estado.slice(0, -2) + "xx", "boi")).toBe(true);
    expect("erro" in anotarPista(estado, "cazumba")).toBe(true);
  });
});

describe("arraial — gabarito fora do estado", () => {
  it("o estado do desafio não traz a ordem das opções", () => {
    const { estado } = iniciarMissao();
    const d = iniciarDesafio(estado);
    if ("erro" in d) throw new Error(d.erro);
    const carga = JSON.parse(Buffer.from(d.estado.split(".")[0], "base64url").toString("utf8"));
    expect(carga.desafio.opcoes).toBeUndefined();
  });
});

/** Lê a carga (sem conferir) de um estado assinado. */
function carga(estado: string) {
  return JSON.parse(Buffer.from(estado.split(".")[0], "base64url").toString("utf8"));
}

/**
 * Partida com relógio controlado: lê as 5 conversas (calmo = no tempo de
 * leitura; senão, tudo de uma vez), abre o desafio e acerta tudo em 1 s.
 * `pulou` é o que o cliente diz em cada resposta.
 */
function partidaCronometrada({ calmo, pulou }: { calmo: boolean; pulou: (i: number) => unknown }) {
  const t0 = 1_800_000_000_000;
  const inicio = iniciarMissao(t0);
  const missao = MISSOES.find((m) => m.id === inicio.missao.id)!;
  let estado = inicio.estado;
  let t = t0;
  for (const npc of ORDEM_NPCS) {
    t += calmo ? leituraMinimaMs(missao.conversas[npc].falas) + 3000 : 100;
    const r = anotarPista(estado, npc, t);
    if ("erro" in r) throw new Error(r.erro);
    estado = r.estado;
  }
  t += calmo ? leituraMinimaMs(missao.falasDoDesafio) + 3000 : 100;
  const d = iniciarDesafio(estado, t);
  if ("erro" in d) throw new Error(d.erro);
  estado = d.estado;
  const partida = carga(estado).id as string;
  const ganhos: number[] = [];
  let ultima;
  for (let i = 0; i < PERGUNTAS_DO_DESAFIO; i++) {
    t += 1000;
    const certa = permutacaoSecreta(partida, i, 3).indexOf(0);
    const r = responderDesafio(estado, certa, t, pulou(i));
    if ("erro" in r) throw new Error(r.erro);
    expect(r.certa).toBe(true);
    ganhos.push(r.pontosDaPergunta);
    ultima = r;
    if (r.estado) estado = r.estado;
  }
  return { ultima: ultima!, ganhos };
}

describe("arraial — bônus de rapidez só para quem ouviu as falas", () => {
  it("quem lê no tempo ganha a rapidez (até 1000)", () => {
    const { ultima, ganhos } = partidaCronometrada({ calmo: true, pulou: () => false });
    expect(ultima.bonusRapidez).toBe(true);
    for (const g of ganhos) expect(g).toBeGreaterThan(100);
    expect(ultima.pontos).toBe(ganhos.reduce((a, b) => a + b, 0) + BONUS_PISTAS);
    expect(ultima.pontos).toBeLessThanOrEqual(1000);
  });

  it("cliente avisou que pulou: só 100 por acerto", () => {
    const { ultima, ganhos } = partidaCronometrada({ calmo: true, pulou: () => true });
    expect(ultima.bonusRapidez).toBe(false);
    expect(ganhos).toEqual(Array(PERGUNTAS_DO_DESAFIO).fill(100));
    expect(ultima.pontos).toBe(PERGUNTAS_DO_DESAFIO * 100 + BONUS_PISTAS);
    expect(verificar<ProvaArraial>(ultima.prova)!.pontos).toBe(ultima.pontos);
  });

  it("o aviso de pulo é pegajoso: dizer 'não pulei' depois não devolve a rapidez", () => {
    const { ultima, ganhos } = partidaCronometrada({ calmo: true, pulou: (i) => i === 0 });
    expect(ultima.bonusRapidez).toBe(false);
    expect(ganhos).toEqual(Array(PERGUNTAS_DO_DESAFIO).fill(100));
  });

  it("o servidor mede: conversas rápidas demais perdem a rapidez mesmo se o cliente negar", () => {
    for (const pulou of [false, "false", 0, undefined]) {
      const { ultima, ganhos } = partidaCronometrada({ calmo: false, pulou: () => pulou });
      expect(ultima.bonusRapidez).toBe(false);
      expect(ganhos).toEqual(Array(PERGUNTAS_DO_DESAFIO).fill(100));
    }
  });

  it("pular as falas do anfitrião antes do desafio também conta", () => {
    const t0 = 1_800_000_000_000;
    const inicio = iniciarMissao(t0);
    const missao = MISSOES.find((m) => m.id === inicio.missao.id)!;
    let estado = inicio.estado;
    let t = t0;
    for (const npc of ORDEM_NPCS) {
      t += leituraMinimaMs(missao.conversas[npc].falas) + 3000;
      const r = anotarPista(estado, npc, t);
      if ("erro" in r) throw new Error(r.erro);
      estado = r.estado;
    }
    expect(carga(estado).curta).toBe(false);
    const d = iniciarDesafio(estado, t + 50);
    if ("erro" in d) throw new Error(d.erro);
    expect(carga(d.estado).desafio.semRapidez).toBe(true);
  });

  it("reler uma conversa (pista repetida) não reinicia o relógio de leitura", () => {
    const t0 = 1_800_000_000_000;
    const { estado } = iniciarMissao(t0);
    const a = anotarPista(estado, "noivos", t0 + 60_000);
    if ("erro" in a) throw new Error(a.erro);
    const b = anotarPista(a.estado, "noivos", t0 + 120_000);
    if ("erro" in b) throw new Error(b.erro);
    expect(carga(b.estado).tu).toBe(t0 + 60_000);
  });

  it("sem rapidez, acerto vale 100 cravado", () => {
    expect(pontosDaResposta(true, 0, false)).toBe(100);
    expect(pontosDaResposta(false, 0, false)).toBe(0);
  });

  it("tempo mínimo de leitura cresce com o texto", () => {
    expect(leituraMinimaMs([])).toBe(0);
    expect(leituraMinimaMs(["a".repeat(150)])).toBe(1600);
  });
});
