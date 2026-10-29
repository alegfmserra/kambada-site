import {
  idsDisponiveis,
  item,
  ITENS,
  sortearDoBau,
  textoDoRequisito,
  visualInicial,
  visualValido,
  type Slot,
  type Visual,
} from "./itens";
import { AMIGOS, CONVERSAS_POR_CORACAO, coracoesDe, MAX_CORACOES } from "./amizades";
import type { NpcId } from "./missoesArraial";

/**
 * Carreira de brincante do Arraial (somente servidor, lógica pura).
 *
 * Fase 1 do plano de 28/10/2026: XP, nível, título, sequência de dias e 3
 * missões diárias, guardados por conta. O ranking NÃO usa nada daqui: ele
 * continua só pelo desafio (acerto + rapidez + pistas).
 */

// --- Níveis e títulos --------------------------------------------------------

/** XP acumulado para ENTRAR em cada nível (índice 0 = nível 1). */
export const LIMITES_DE_NIVEL = [0, 100, 250, 450, 700, 1000, 1400, 1900, 2500, 3200] as const;
export const NIVEL_MAXIMO = LIMITES_DE_NIVEL.length;

export function nivelDoXp(xp: number): number {
  let nivel = 1;
  for (let i = 0; i < LIMITES_DE_NIVEL.length; i++) if (xp >= LIMITES_DE_NIVEL[i]) nivel = i + 1;
  return nivel;
}

export function tituloDoNivel(nivel: number): string {
  if (nivel <= 2) return "Visitante";
  if (nivel <= 5) return "Aprendiz de brincante";
  if (nivel <= 8) return "Brincante";
  return "Mestre do arraial";
}

// --- XP ---------------------------------------------------------------------

export const XP = {
  /** Conversa ouvida até o fim (10) + pista/fitinha ganha (20). */
  pista: 30,
  acerto: 15,
  desafioConcluido: 100,
  diaria: 30,
  /** Mini-atividade: tudo certo / só tentou (uma vez por dia por atividade). */
  miniPerfeita: 40,
  miniTentada: 10,
} as const;

/** XP do baú quando a coleção do baú já está completa. */
export const XP_BAU_REPETIDO = 20;

/** Teto do que se ganha por ação num dia; diárias e bônus de sequência ficam de fora. */
export const TETO_DIARIO_XP = 400;

/** Bônus único ao completar a sequência de N dias seguidos. */
export const BONUS_SEQUENCIA: Record<number, number> = { 3: 50, 7: 100, 14: 200 };

// --- Missões diárias ---------------------------------------------------------

export type Evento =
  | { tipo: "conversa"; npc: NpcId }
  | { tipo: "acerto" }
  | { tipo: "desafio"; acertos: number; pistasCompletas: boolean }
  | { tipo: "mini"; mini: string; perfeito: boolean };

type ModeloDiaria = {
  id: string;
  texto: string;
  meta: number;
  conta: (e: Evento) => boolean;
};

const conversaCom = (npc: NpcId, nome: string): ModeloDiaria => ({
  id: `conversa-${npc}`,
  texto: `Converse com ${nome}`,
  meta: 1,
  conta: (e) => e.tipo === "conversa" && e.npc === npc,
});

/** Primeiro slot: um personagem para visitar. */
const DE_PERSONAGEM: ModeloDiaria[] = [
  conversaCom("noivos", "Zé e Francisca"),
  conversaCom("boi", "o Boi Estrela"),
  conversaCom("fogueira", "Seu Chico da Fogueira"),
  conversaCom("brincante", "Dona Ritinha"),
  conversaCom("barraca", "a Barraca da Kambada"),
];

/** Segundo slot: explorar. */
const DE_EXPLORAR: ModeloDiaria[] = [
  { id: "ouvir-3", texto: "Ouça 3 conversas do arraial", meta: 3, conta: (e) => e.tipo === "conversa" },
  { id: "pistas-5", texto: "Junte as 5 pistas de uma missão", meta: 1, conta: (e) => e.tipo === "desafio" && e.pistasCompletas },
];

/** Terceiro slot: provar o que aprendeu. */
const DE_PROVAR: ModeloDiaria[] = [
  { id: "acertar-4", texto: "Acerte 4 perguntas do desafio", meta: 4, conta: (e) => e.tipo === "acerto" },
  { id: "desafio-1", texto: "Conclua 1 desafio", meta: 1, conta: (e) => e.tipo === "desafio" },
];

const MODELOS = new Map([...DE_PERSONAGEM, ...DE_EXPLORAR, ...DE_PROVAR].map((m) => [m.id, m]));

function numeroDoDia(dia: string): number {
  return Math.floor(Date.parse(`${dia}T00:00:00Z`) / 86_400_000);
}

/** As 3 diárias do dia (AAAA-MM-DD, São Luís): iguais para todo mundo e giram sozinhas. */
export function diariasDoDia(dia: string): string[] {
  const n = numeroDoDia(dia);
  return [DE_PERSONAGEM[n % DE_PERSONAGEM.length].id, DE_EXPLORAR[n % DE_EXPLORAR.length].id, DE_PROVAR[Math.floor(n / 2) % DE_PROVAR.length].id];
}

// --- Perfil ------------------------------------------------------------------

export type Perfil = {
  xp: number;
  conversas: number;
  acertos: number;
  desafios: number;
  /** XP de ação (sem diárias e bônus) ganho em `dia`, para o teto diário. */
  xpDoDia: { dia: string; valor: number };
  diarias: { dia: string; progresso: Record<string, number>; feitas: string[] };
  sequencia: { ultimoDia: string; atual: number; melhor: number };
  /** Itens que só vêm do baú do dia (os de nível e sequência são deduzidos). */
  inventario: string[];
  /** Item vestido em cada slot. */
  visual: Visual;
  /** Último dia em que o baú foi aberto. */
  bauDia: string;
  /** Conversas novas com cada personagem (vira corações de amizade). */
  amizade: Record<string, number>;
  /** Mini-atividades já feitas no dia (cada uma paga XP uma vez por dia). */
  minis: { dia: string; feitas: string[] };
};

export function perfilNovo(): Perfil {
  return {
    xp: 0,
    conversas: 0,
    acertos: 0,
    desafios: 0,
    xpDoDia: { dia: "", valor: 0 },
    diarias: { dia: "", progresso: {}, feitas: [] },
    sequencia: { ultimoDia: "", atual: 0, melhor: 0 },
    inventario: [],
    visual: visualInicial(),
    bauDia: "",
    amizade: {},
    minis: { dia: "", feitas: [] },
  };
}

/** Perfil gravado antes da Fase 2 não tem os campos novos: completa com o padrão. */
export function completar(p: Partial<Perfil>): Perfil {
  const novo = perfilNovo();
  return {
    ...novo,
    ...p,
    inventario: Array.isArray(p.inventario) ? p.inventario : [],
    visual: { ...novo.visual, ...(p.visual ?? {}) },
    bauDia: typeof p.bauDia === "string" ? p.bauDia : "",
    amizade: p.amizade && typeof p.amizade === "object" ? p.amizade : {},
    minis: p.minis && Array.isArray(p.minis.feitas) ? p.minis : { dia: "", feitas: [] },
  };
}

function contextoDe(p: Perfil) {
  return { nivel: nivelDoXp(p.xp), sequenciaMelhor: p.sequencia.melhor, inventario: p.inventario };
}

export type PerfilPublico = {
  xp: number;
  nivel: number;
  titulo: string;
  /** XP já feito dentro do nível atual e o que o nível pede (null no último). */
  xpNoNivel: number;
  xpDoNivel: number | null;
  proximoTitulo: string | null;
  sequencia: { atual: number; melhor: number };
  diarias: { id: string; texto: string; meta: number; progresso: number; feita: boolean }[];
  /** Hoje já bateu o teto de XP por ação. */
  tetoAtingido: boolean;
  visual: Visual;
  colecao: ItemPublico[];
  /** O baú de hoje ainda não foi aberto. */
  bauPronto: boolean;
  amigos: AmigoPublico[];
  /** Mini-atividades que já pagaram XP hoje. */
  minisHoje: string[];
};

export type AmigoPublico = {
  id: string;
  nome: string;
  coracoes: number;
  conversas: number;
  /** Conversas que faltam para o próximo coração (null com 5). */
  faltam: number | null;
  /** Só as histórias já abertas; `fechadas` conta as que ainda faltam. */
  historias: { titulo: string; texto: string }[];
  fechadas: number;
};

export type ItemPublico = {
  id: string;
  nome: string;
  slot?: Slot;
  ficha: string;
  tem: boolean;
  /** O que falta para ganhar (vazio se já tem ou é inicial). */
  requisito: string;
};

export type Ganho = {
  xp: number;
  subiuPara?: { nivel: number; titulo: string };
  diariasConcluidas: string[];
  bonusSequencia?: number;
  /** Nomes dos itens que passaram a valer neste evento (nível ou sequência). */
  itensNovos?: string[];
  /** Nome do personagem que ganhou um coração de amizade neste evento. */
  amizade?: string;
};

function diaAnterior(dia: string): string {
  return new Date(Date.parse(`${dia}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
}

export function publico(p: Perfil, dia: string): PerfilPublico {
  const nivel = nivelDoXp(p.xp);
  const piso = LIMITES_DE_NIVEL[nivel - 1];
  const teto = nivel < NIVEL_MAXIMO ? LIMITES_DE_NIVEL[nivel] : null;
  const hoje = p.diarias.dia === dia ? p.diarias : { dia, progresso: {}, feitas: [] as string[] };
  // A sequência só vale se foi hoje ou ontem; senão, já quebrou.
  const viva = p.sequencia.ultimoDia === dia || p.sequencia.ultimoDia === diaAnterior(dia);
  const disponiveis = new Set(idsDisponiveis(contextoDe(p)));
  return {
    xp: p.xp,
    nivel,
    titulo: tituloDoNivel(nivel),
    xpNoNivel: p.xp - piso,
    xpDoNivel: teto === null ? null : teto - piso,
    proximoTitulo: nivel < NIVEL_MAXIMO ? tituloDoNivel(nivel + 1) : null,
    sequencia: { atual: viva ? p.sequencia.atual : 0, melhor: p.sequencia.melhor },
    diarias: diariasDoDia(dia).map((id) => {
      const m = MODELOS.get(id)!;
      return { id, texto: m.texto, meta: m.meta, progresso: Math.min(m.meta, hoje.progresso[id] ?? 0), feita: hoje.feitas.includes(id) };
    }),
    tetoAtingido: p.xpDoDia.dia === dia && p.xpDoDia.valor >= TETO_DIARIO_XP,
    visual: visualValido(p.visual, contextoDe(p)),
    colecao: ITENS.map((i) => {
      const tem = disponiveis.has(i.id);
      return { id: i.id, nome: i.nome, slot: i.slot, ficha: i.ficha, tem, requisito: tem ? "" : textoDoRequisito(i.requisito) };
    }),
    bauPronto: p.bauDia !== dia,
    minisHoje: p.minis.dia === dia ? p.minis.feitas : [],
    amigos: AMIGOS.map((a) => {
      const conversas = p.amizade[a.id] ?? 0;
      const coracoes = coracoesDe(conversas);
      const abertas = a.historias.filter((h) => coracoes >= h.coracoes);
      return {
        id: a.id,
        nome: a.nome,
        coracoes,
        conversas,
        faltam: coracoes < MAX_CORACOES ? CONVERSAS_POR_CORACAO[coracoes] - conversas : null,
        historias: abertas.map((h) => ({ titulo: h.titulo, texto: h.texto })),
        fechadas: a.historias.length - abertas.length,
      };
    }),
  };
}

/** Veste um item do slot, se a conta já o tem. */
export function equipar(antes: Perfil, slot: unknown, id: unknown): { perfil: Perfil } | { erro: string } {
  const i = typeof id === "string" ? item(id) : undefined;
  if (!i || !i.slot || i.slot !== slot) return { erro: "Esse item não serve nesse lugar." };
  if (!idsDisponiveis(contextoDe(antes)).includes(i.id)) return { erro: "Você ainda não ganhou esse item." };
  return { perfil: { ...antes, visual: { ...antes.visual, [i.slot]: i.id } } };
}

/** Abre o baú do dia (uma vez por dia): um item que falta, ou 20 de XP quando a coleção do baú está completa. */
export function abrirBau(
  antes: Perfil,
  contaId: string,
  dia: string,
): { perfil: Perfil; item?: { id: string; nome: string; ficha: string }; xp: number } | { erro: string } {
  if (antes.bauDia === dia) return { erro: "O baú de hoje já foi aberto. Volte amanhã!" };
  const p = completar(JSON.parse(JSON.stringify(antes)));
  p.bauDia = dia;
  const sorteado = sortearDoBau(contaId, dia, p.inventario);
  if (sorteado) {
    p.inventario.push(sorteado.id);
    return { perfil: p, item: { id: sorteado.id, nome: sorteado.nome, ficha: sorteado.ficha }, xp: 0 };
  }
  p.xp += XP_BAU_REPETIDO;
  return { perfil: p, xp: XP_BAU_REPETIDO };
}

/** Aplica um evento ao perfil (devolve um perfil novo e o que foi ganho). */
export function aplicarEvento(antes: Perfil, evento: Evento, dia: string): { perfil: Perfil; ganho: Ganho } {
  const p: Perfil = completar(JSON.parse(JSON.stringify(antes)));
  const nivelAntes = nivelDoXp(p.xp);
  const itensAntes = new Set(idsDisponiveis(contextoDe(p)));
  const ganho: Ganho = { xp: 0, diariasConcluidas: [] };

  if (p.xpDoDia.dia !== dia) p.xpDoDia = { dia, valor: 0 };
  if (p.diarias.dia !== dia) p.diarias = { dia, progresso: {}, feitas: [] };

  // XP por ação, respeitando o teto do dia.
  let base = 0;
  if (evento.tipo === "conversa") {
    p.conversas += 1;
    base = XP.pista;
    const antesC = coracoesDe(p.amizade[evento.npc] ?? 0);
    p.amizade[evento.npc] = (p.amizade[evento.npc] ?? 0) + 1;
    if (coracoesDe(p.amizade[evento.npc]) > antesC) {
      ganho.amizade = AMIGOS.find((a) => a.id === evento.npc)?.nome;
    }
  } else if (evento.tipo === "acerto") {
    p.acertos += 1;
    base = XP.acerto;
  } else if (evento.tipo === "mini") {
    // Mini-atividade: XP próprio, uma vez por dia por atividade, fora do teto de ação.
    if (p.minis.dia !== dia) p.minis = { dia, feitas: [] };
    if (!p.minis.feitas.includes(evento.mini)) {
      p.minis.feitas.push(evento.mini);
      const xpMini = evento.perfeito ? XP.miniPerfeita : XP.miniTentada;
      p.xp += xpMini;
      ganho.xp += xpMini;
    }
  } else {
    p.desafios += 1;
    base = XP.desafioConcluido;
  }
  const cabe = Math.max(0, TETO_DIARIO_XP - p.xpDoDia.valor);
  const dado = Math.min(base, cabe);
  p.xpDoDia.valor += dado;
  p.xp += dado;
  ganho.xp += dado;

  // Diárias: contam mesmo com o teto batido (são o motivo de voltar).
  for (const id of diariasDoDia(dia)) {
    const m = MODELOS.get(id)!;
    if (p.diarias.feitas.includes(id) || !m.conta(evento)) continue;
    p.diarias.progresso[id] = (p.diarias.progresso[id] ?? 0) + 1;
    if (p.diarias.progresso[id] >= m.meta) {
      p.diarias.feitas.push(id);
      p.xp += XP.diaria;
      ganho.xp += XP.diaria;
      ganho.diariasConcluidas.push(m.texto);
    }
  }

  // Sequência de dias: conta no primeiro evento de cada dia.
  if (p.sequencia.ultimoDia !== dia) {
    p.sequencia.atual = p.sequencia.ultimoDia === diaAnterior(dia) ? p.sequencia.atual + 1 : 1;
    p.sequencia.ultimoDia = dia;
    p.sequencia.melhor = Math.max(p.sequencia.melhor, p.sequencia.atual);
    const bonus = BONUS_SEQUENCIA[p.sequencia.atual];
    if (bonus) {
      p.xp += bonus;
      ganho.xp += bonus;
      ganho.bonusSequencia = bonus;
    }
  }

  const nivelDepois = nivelDoXp(p.xp);
  if (nivelDepois > nivelAntes) ganho.subiuPara = { nivel: nivelDepois, titulo: tituloDoNivel(nivelDepois) };
  const novos = idsDisponiveis(contextoDe(p)).filter((id) => !itensAntes.has(id));
  if (novos.length) ganho.itensNovos = novos.map((id) => item(id)!.nome);
  return { perfil: p, ganho };
}
