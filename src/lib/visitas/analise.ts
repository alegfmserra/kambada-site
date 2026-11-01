import { canalDaOrigem } from "./canal";
import { diaSaoLuis, type Aparelho, type EventoVisita, type NomeVital, type PedidoParaMedir } from "./visitas";

/**
 * Análises mais finas das visitas (01/11/2026): funil por visita, qualidade da
 * visita, receita e abandono por canal, campanhas, aparelho, horário, velocidade
 * real (Core Web Vitals) e páginas que deram 404. Só funções puras: recebem os
 * eventos já filtrados por período e os pedidos pagos.
 */

const pct = (parte: number, todo: number) => (todo ? Math.round((parte / todo) * 1000) / 10 : null);
const p75 = (v: number[]) => {
  if (!v.length) return null;
  const o = [...v].sort((a, b) => a - b);
  return o[Math.max(0, Math.ceil(o.length * 0.75) - 1)];
};
const horaSaoLuis = (iso: string) => (new Date(iso).getUTCHours() + 21) % 24;
const diaDaSemana = (iso: string) => new Date(new Date(iso).getTime() - 3 * 3600_000).getUTCDay();

/** Limites do Google (Core Web Vitals): bom / precisa melhorar / ruim. */
export const LIMITES_VITAIS: Record<NomeVital, [number, number]> = {
  LCP: [2500, 4000],
  INP: [200, 500],
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  TTFB: [800, 1800],
};
export function avaliarVital(nome: NomeVital, valor: number | null): "bom" | "melhorar" | "ruim" | null {
  if (valor === null) return null;
  const [bom, ruim] = LIMITES_VITAIS[nome];
  return valor <= bom ? "bom" : valor <= ruim ? "melhorar" : "ruim";
}

export type Analise = {
  funil: { sessoes: number; produto: number; carrinho: number; checkout: number; compra: number };
  qualidade: { sessoesComId: number; rejeicao: number | null; paginasPorSessao: number | null; segPorSessao: number | null };
  canais: { canal: string; sessoes: number; pedidos: number; receita: number; ticket: number | null; conversao: number | null; comCarrinho: number; semCompra: number; abandono: number | null }[];
  campanhas: { canal: string; campanha: string; sessoes: number }[];
  aparelhos: { aparelho: Aparelho | "sem registro"; sessoes: number; pct: number | null }[];
  horas: { hora: number; sessoes: number }[];
  semana: { dia: number; sessoes: number }[];
  velocidade: { caminho: string; amostras: number; lcp: number | null; inp: number | null; cls: number | null }[];
  velocidadePorAparelho: { aparelho: Aparelho | "sem registro"; lcp: number | null; inp: number | null; cls: number | null; amostras: number }[];
  erros404: { caminho: string; vezes: number }[];
};

export function analisarVisitas(es: EventoVisita[], pedidos: PedidoParaMedir[]): Analise {
  const inicio = es.length ? es[0].em : null;
  const validos = pedidos.filter((p) => !p.cancelado && inicio && p.criadoEm >= inicio);

  // Visitas com número (s): o que cada uma fez.
  type V = { canal?: string; paginas: number; seg: number; produto: boolean; carrinho: boolean; checkout: boolean; compra: boolean };
  const visitas = new Map<string, V>();
  const v = (s: string) => {
    const x = visitas.get(s) ?? { paginas: 0, seg: 0, produto: false, carrinho: false, checkout: false, compra: false };
    visitas.set(s, x);
    return x;
  };

  const sessoesCanal = new Map<string, number>();
  const campanhas = new Map<string, { canal: string; campanha: string; sessoes: number }>();
  const aparelhos = new Map<string, number>();
  const horas = new Array<number>(24).fill(0);
  const semana = new Array<number>(7).fill(0);
  const vitaisPagina = new Map<string, Record<string, number[]>>();
  const vitaisAparelho = new Map<string, Record<string, number[]>>();
  const erros = new Map<string, number>();

  for (const e of es) {
    if (e.s) {
      const x = v(e.s);
      if (e.tipo === "pagina") {
        x.paginas += 1;
        if (e.canal) x.canal = e.canal;
      } else if (e.tipo === "tempo") x.seg += e.seg ?? 0;
      else if (e.tipo === "produto") x.produto = true;
      else if (e.tipo === "carrinho") x.carrinho = true;
      else if (e.tipo === "checkout") x.checkout = true;
      else if (e.tipo === "compra") x.compra = true;
    }
    if (e.tipo === "pagina" && e.canal) {
      sessoesCanal.set(e.canal, (sessoesCanal.get(e.canal) ?? 0) + 1);
      aparelhos.set(e.aparelho ?? "sem registro", (aparelhos.get(e.aparelho ?? "sem registro") ?? 0) + 1);
      horas[horaSaoLuis(e.em)] += 1;
      semana[diaDaSemana(e.em)] += 1;
      if (e.campanha) {
        const k = `${e.canal}|${e.campanha}`;
        const c = campanhas.get(k) ?? { canal: e.canal, campanha: e.campanha, sessoes: 0 };
        c.sessoes += 1;
        campanhas.set(k, c);
      }
    } else if (e.tipo === "vital" && e.caminho && e.nome && e.valor !== undefined) {
      const reg = (m: Map<string, Record<string, number[]>>, k: string) => {
        const r = m.get(k) ?? {};
        (r[e.nome!] ??= []).push(e.valor!);
        m.set(k, r);
      };
      reg(vitaisPagina, e.caminho);
      reg(vitaisAparelho, e.aparelho ?? "sem registro");
    } else if (e.tipo === "erro404" && e.caminho) erros.set(e.caminho, (erros.get(e.caminho) ?? 0) + 1);
  }

  const todas = [...visitas.values()];
  const comPagina = todas.filter((x) => x.paginas > 0);
  const totalSessoes = [...sessoesCanal.values()].reduce((a, b) => a + b, 0);

  // Receita e ticket por canal vêm dos pedidos (canal da atribuição guardada no pedido).
  const pedidosCanal = new Map<string, { pedidos: number; receita: number }>();
  for (const p of validos) {
    const c = canalDaOrigem(p.fonte, p.meio);
    const x = pedidosCanal.get(c) ?? { pedidos: 0, receita: 0 };
    x.pedidos += 1;
    x.receita += p.total ?? 0;
    pedidosCanal.set(c, x);
  }
  const carrinhoCanal = new Map<string, { com: number; sem: number }>();
  for (const x of todas) {
    if (!x.carrinho) continue;
    const c = x.canal ?? "Sem registro";
    const y = carrinhoCanal.get(c) ?? { com: 0, sem: 0 };
    y.com += 1;
    if (!x.compra) y.sem += 1;
    carrinhoCanal.set(c, y);
  }
  const nomes = new Set([...sessoesCanal.keys(), ...pedidosCanal.keys(), ...carrinhoCanal.keys()]);

  const resumoVitais = (r: Record<string, number[]> | undefined) => ({
    lcp: p75(r?.LCP ?? []),
    inp: p75(r?.INP ?? []),
    cls: p75(r?.CLS ?? []),
    amostras: Math.max(r?.LCP?.length ?? 0, r?.INP?.length ?? 0, r?.CLS?.length ?? 0),
  });

  return {
    funil: {
      sessoes: comPagina.length,
      produto: comPagina.filter((x) => x.produto).length,
      carrinho: comPagina.filter((x) => x.carrinho).length,
      checkout: comPagina.filter((x) => x.checkout).length,
      compra: comPagina.filter((x) => x.compra).length,
    },
    qualidade: {
      sessoesComId: comPagina.length,
      rejeicao: pct(comPagina.filter((x) => x.paginas <= 1).length, comPagina.length),
      paginasPorSessao: comPagina.length ? Math.round((comPagina.reduce((a, x) => a + x.paginas, 0) / comPagina.length) * 10) / 10 : null,
      segPorSessao: comPagina.length ? Math.round(comPagina.reduce((a, x) => a + x.seg, 0) / comPagina.length) : null,
    },
    canais: [...nomes]
      .map((canal) => {
        const s = sessoesCanal.get(canal) ?? 0;
        const p = pedidosCanal.get(canal) ?? { pedidos: 0, receita: 0 };
        const c = carrinhoCanal.get(canal) ?? { com: 0, sem: 0 };
        return {
          canal,
          sessoes: s,
          pedidos: p.pedidos,
          receita: Math.round(p.receita * 100) / 100,
          ticket: p.pedidos ? Math.round((p.receita / p.pedidos) * 100) / 100 : null,
          conversao: pct(p.pedidos, s),
          comCarrinho: c.com,
          semCompra: c.sem,
          abandono: pct(c.sem, c.com),
        };
      })
      .sort((a, b) => b.sessoes - a.sessoes || b.receita - a.receita),
    campanhas: [...campanhas.values()].sort((a, b) => b.sessoes - a.sessoes),
    aparelhos: [...aparelhos.entries()]
      .map(([aparelho, sessoes]) => ({ aparelho: aparelho as Aparelho | "sem registro", sessoes, pct: pct(sessoes, totalSessoes) }))
      .sort((a, b) => b.sessoes - a.sessoes),
    horas: horas.map((sessoes, hora) => ({ hora, sessoes })),
    semana: semana.map((sessoes, dia) => ({ dia, sessoes })),
    velocidade: [...vitaisPagina.entries()]
      .map(([caminho, r]) => ({ caminho, ...resumoVitais(r) }))
      .sort((a, b) => b.amostras - a.amostras),
    velocidadePorAparelho: [...vitaisAparelho.entries()]
      .map(([aparelho, r]) => ({ aparelho: aparelho as Aparelho | "sem registro", ...resumoVitais(r) }))
      .sort((a, b) => b.amostras - a.amostras),
    erros404: [...erros.entries()].map(([caminho, vezes]) => ({ caminho, vezes })).sort((a, b) => b.vezes - a.vezes),
  };
}

/** Variação percentual entre o período atual e o anterior (null se não há base). */
export function variacao(atual: number, anterior: number): number | null {
  if (!anterior) return null;
  return Math.round(((atual - anterior) / anterior) * 1000) / 10;
}

export { diaSaoLuis };
