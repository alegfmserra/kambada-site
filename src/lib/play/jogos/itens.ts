/**
 * Coleção do brincante (Fase 2 do plano de 28/10/2026): itens para vestir o
 * personagem e itens de coleção com uma ficha de uma linha. Lógica pura, só
 * servidor/dados; o desenho do boneco usa `opcoesDoVisual` no cliente.
 *
 * As fichas são texto cultural NOVO e ainda não passaram pela revisão dos
 * mestres e brincantes (`FICHAS_REVISADAS`). Enquanto for false, o painel
 * mostra o item e a ficha como "em revisão".
 */

export const FICHAS_REVISADAS = false;

export type Slot = "chapeu" | "camisa" | "fita";
export const SLOTS: Slot[] = ["chapeu", "camisa", "fita"];

export type Requisito =
  | { tipo: "inicial" }
  | { tipo: "nivel"; n: number }
  | { tipo: "sequencia"; n: number }
  | { tipo: "bau" };

export type Item = {
  id: string;
  nome: string;
  /** Sem slot = item de coleção (não veste o personagem). */
  slot?: Slot;
  /** Uma linha: o que é e de onde vem. */
  ficha: string;
  requisito: Requisito;
  /** Camisa: [base, listra]. Fita: [cor]. Chapéu: [modelo]. */
  visual?: string[];
};

export const ITENS: Item[] = [
  // Chapéus
  { id: "chapeu-palha", nome: "Chapéu de palha", slot: "chapeu", requisito: { tipo: "inicial" }, visual: ["palha"], ficha: "O chapéu de palha vai de quem trabalha ao sol a quem dança nas festas juninas do Maranhão." },
  { id: "chapeu-couro", nome: "Chapéu de couro", slot: "chapeu", requisito: { tipo: "nivel", n: 3 }, visual: ["couro"], ficha: "O chapéu de couro lembra o vaqueiro, personagem que aparece nas toadas e nos folguedos do Nordeste." },
  { id: "chapeu-fitas", nome: "Chapéu de fitas", slot: "chapeu", requisito: { tipo: "nivel", n: 5 }, visual: ["fitas"], ficha: "No bumba-meu-boi, os chapéus dos brincantes se enchem de fitas e bordados coloridos." },
  // Camisas
  { id: "camisa-vermelha", nome: "Camisa xadrez vermelha", slot: "camisa", requisito: { tipo: "inicial" }, visual: ["#C73E2C", "#F5F1E6"], ficha: "A camisa xadrez é a roupa clássica de quem vai ao arraial nas festas juninas." },
  { id: "camisa-azul", nome: "Camisa xadrez azul", slot: "camisa", requisito: { tipo: "nivel", n: 2 }, visual: ["#3E5C8A", "#F5F1E6"], ficha: "O xadrez azul é uma das cores mais vistas nas camisas da quadrilha junina." },
  { id: "camisa-verde", nome: "Camisa xadrez verde", slot: "camisa", requisito: { tipo: "sequencia", n: 3 }, visual: ["#5BAE6B", "#F5F1E6"], ficha: "Prêmio de quem volta ao arraial três dias seguidos: o xadrez verde, cor de mato e de milho verde." },
  { id: "camisa-amarela", nome: "Camisa xadrez amarela", slot: "camisa", requisito: { tipo: "nivel", n: 7 }, visual: ["#F5D142", "#C73E2C"], ficha: "Amarelo de espiga de milho, o ingrediente que não falta em nenhum arraial." },
  // Fitas do chapéu
  { id: "fita-couro", nome: "Fita de couro", slot: "fita", requisito: { tipo: "inicial" }, visual: ["#5A3A24"], ficha: "A fita de couro é o jeito simples de prender o chapéu na cabeça." },
  { id: "fita-vermelha", nome: "Fita vermelha", slot: "fita", requisito: { tipo: "nivel", n: 2 }, visual: ["#C73E2C"], ficha: "Fitas coloridas enfeitam chapéus, bois e mastros da festa." },
  { id: "fita-verde", nome: "Fita verde", slot: "fita", requisito: { tipo: "nivel", n: 4 }, visual: ["#5BAE6B"], ficha: "Fitas coloridas enfeitam chapéus, bois e mastros da festa." },
  { id: "fita-amarela", nome: "Fita amarela", slot: "fita", requisito: { tipo: "sequencia", n: 7 }, visual: ["#F5D142"], ficha: "Prêmio de quem volta ao arraial sete dias seguidos." },
  { id: "fita-azul", nome: "Fita azul", slot: "fita", requisito: { tipo: "bau" }, visual: ["#8FC8E8"], ficha: "Fitas coloridas enfeitam chapéus, bois e mastros da festa." },
  // Coleção (vêm do baú do dia)
  { id: "matraca", nome: "Matraca", requisito: { tipo: "bau" }, ficha: "Duas tábuas de madeira batidas uma na outra: é o som do bumba-meu-boi de sotaque de matraca, na Ilha de São Luís." },
  { id: "apito-do-amo", nome: "Apito do amo", requisito: { tipo: "bau" }, ficha: "O amo é quem comanda o grupo de bumba-meu-boi, e o apito dele marca o começo e a mudança da toada." },
  { id: "maraca", nome: "Maracá", requisito: { tipo: "bau" }, ficha: "Chocalho de mão usado, em alguns sotaques do bumba-meu-boi, para marcar o ritmo." },
  { id: "saia-da-coreira", nome: "Saia da coreira", requisito: { tipo: "bau" }, ficha: "A coreira é a dançarina do tambor de crioula, e a saia rodada e colorida faz parte do traje." },
  { id: "chita", nome: "Tecido de chita", requisito: { tipo: "bau" }, ficha: "Tecido de algodão estampado e colorido, muito ligado às festas juninas." },
];

const POR_ID = new Map(ITENS.map((i) => [i.id, i]));
export const item = (id: string): Item | undefined => POR_ID.get(id);

export type Visual = Record<Slot, string>;

export function visualInicial(): Visual {
  const pega = (slot: Slot) => ITENS.find((i) => i.slot === slot && i.requisito.tipo === "inicial")!.id;
  return { chapeu: pega("chapeu"), camisa: pega("camisa"), fita: pega("fita") };
}

export type ContextoDeItens = { nivel: number; sequenciaMelhor: number; inventario: string[] };

export function temItem(i: Item, ctx: ContextoDeItens): boolean {
  const r = i.requisito;
  switch (r.tipo) {
    case "inicial":
      return true;
    case "nivel":
      return ctx.nivel >= r.n;
    case "sequencia":
      return ctx.sequenciaMelhor >= r.n;
    case "bau":
      return ctx.inventario.includes(i.id);
  }
}

export function idsDisponiveis(ctx: ContextoDeItens): string[] {
  return ITENS.filter((i) => temItem(i, ctx)).map((i) => i.id);
}

export function textoDoRequisito(r: Requisito): string {
  switch (r.tipo) {
    case "inicial":
      return "";
    case "nivel":
      return `Nível ${r.n}`;
    case "sequencia":
      return `${r.n} dias seguidos`;
    case "bau":
      return "Baú do dia";
  }
}

/** Visual válido: escolha que a conta não tem, ou que não é do slot, volta para o item inicial. */
export function visualValido(v: Partial<Visual> | undefined, ctx: ContextoDeItens): Visual {
  const base = visualInicial();
  const tem = new Set(idsDisponiveis(ctx));
  for (const slot of SLOTS) {
    const escolhido = v?.[slot];
    const i = escolhido ? item(escolhido) : undefined;
    if (i && i.slot === slot && tem.has(i.id)) base[slot] = i.id;
  }
  return base;
}

/** Opções que o desenho do boneco entende. */
export function opcoesDoVisual(v: Visual): { camisa: [string, string]; chapeu: "palha" | "couro" | "fitas"; fita: string } {
  const camisa = item(v.camisa)?.visual ?? ["#C73E2C", "#F5F1E6"];
  const chapeu = (item(v.chapeu)?.visual?.[0] ?? "palha") as "palha" | "couro" | "fitas";
  const fita = item(v.fita)?.visual?.[0] ?? "#5A3A24";
  return { camisa: [camisa[0], camisa[1]], chapeu, fita };
}

/** Texto curto para hash determinístico (qual item o baú do dia entrega). */
function hashTexto(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Item do baú do dia: sorteio fixo por conta e dia entre o que ainda falta; null se já tem todos. */
export function sortearDoBau(contaId: string, dia: string, inventario: string[]): Item | null {
  const faltam = ITENS.filter((i) => i.requisito.tipo === "bau" && !inventario.includes(i.id));
  if (!faltam.length) return null;
  return faltam[hashTexto(`${contaId}|${dia}`) % faltam.length];
}
