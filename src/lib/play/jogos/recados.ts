import type { MiniId } from "./minis";
import type { NpcId } from "./missoesArraial";
import { permutacaoSecreta } from "./seguranca";

/**
 * Recados do Arraial: missões em que um personagem manda o jogador a outro e
 * o jogador volta com a informação (plano de 29/10/2026). Lógica pura; o
 * estado de cada conta mora no perfil (`Perfil.recados`).
 *
 *  - "falar":     conversa, anota uma informação no diário e passa ao próximo;
 *  - "responder": o personagem pergunta algo que a informação colhida responde;
 *  - "prova":     mini-atividade (precisa sair perfeita) para convencer alguém;
 *  - "entregar":  dar uma lembrança do baú do dia (não é gasta).
 * `semSeta`: o personagem desse passo NÃO ganha o "!" na cena; só a dica do diário.
 *
 * Todo texto aqui é novo e `revisado: false` (revisão cultural com mestres e
 * brincantes; ver `RECADOS_REVISADOS`).
 */

export const RECADOS_REVISADOS = false;

export type Passo = {
  npc: NpcId;
  tipo: "falar" | "responder" | "prova" | "entregar";
  falas: string[];
  /** Linha do diário enquanto este for o passo atual. */
  dica: string;
  /** Informação que o jogador guarda ao concluir o passo. */
  info?: string;
  semSeta?: boolean;
  /** "falar": respostas do jogador (só mudam a fala de retorno). */
  escolhas?: { texto: string; resposta: string }[];
  /** "responder": quantas informações o jogador precisa já ter. */
  exigeInfos?: number;
  semInfo?: string[];
  pergunta?: { enunciado: string; opcoes: [string, string, string] };
  acerto?: string[];
  erro?: string[];
  /** "prova". */
  mini?: MiniId;
  /** "entregar". */
  semItem?: string[];
};

export type Categoria = "povo" | "semanal";

export type Recado = {
  id: string;
  titulo: string;
  categoria: Categoria;
  xp: number;
  resumo: string;
  passos: Passo[];
};

export const RECADOS: Recado[] = [
  // ---------------------------------------------------------------- do povo
  {
    id: "recado-do-ze",
    titulo: "O recado do Zé",
    categoria: "povo",
    xp: 50,
    resumo: "Zé esqueceu o que a Francisca explicou sobre a matraca.",
    passos: [
      { npc: "noivos", tipo: "falar", dica: "Zé quer saber como é feita uma matraca. Pergunte na Barraca da Kambada.", falas: ["Ô de casa! Que bom te ver. Preciso de um favor: a Francisca quer dar uma matraca de presente pro padrinho, mas eu esqueci tudo que ela me explicou.", "Vai lá na barraca da Kambada e pergunta como é feita uma matraca. Depois volta aqui e me conta, que eu não quero passar vergonha!"] },
      { npc: "barraca", tipo: "falar", dica: "Pergunte à Barraca da Kambada como é feita a matraca.", info: "A matraca é feita de duas peças de madeira, pintadas à mão.", falas: ["Uma matraca? Venha ver! É feita de duas peças de madeira, pintadas à mão uma por uma.", "Quando uma bate na outra, faz aquele estalo seco que conduz o boi. Pode contar pro Zé!"] },
      { npc: "noivos", tipo: "responder", dica: "Volte ao Zé e conte o que a barraca explicou.", exigeInfos: 1, semInfo: ["Já falou com a barraca? Eu só penso em matraca! Vai lá e volta."], falas: ["Voltou! E aí, o que a barraca disse? Responde rápido, que a Francisca tá olhando."], pergunta: { enunciado: "Do que é feita a matraca?", opcoes: ["De duas peças de madeira", "De uma lata cheia de pedrinhas", "De couro esticado num aro"] }, acerto: ["Isso mesmo! Duas peças de madeira. A Francisca vai ficar toda orgulhosa de mim. Obrigado, amigo!"], erro: ["Hmm, não era isso que a barraca disse... Volta lá e escuta direitinho!"] },
    ],
  },
  {
    id: "compadre-de-fogueira",
    titulo: "Compadre de fogueira",
    categoria: "povo",
    xp: 60,
    resumo: "Seu Chico quer escolher a madrinha da fogueira com o Zé.",
    passos: [
      { npc: "fogueira", tipo: "falar", dica: "Seu Chico quer saber do Zé quem será a madrinha da fogueira.", falas: ["Chega, meu filho! Preciso de ajuda numa questão de honra.", "Eu quero ser compadre de fogueira do Zé. Na noite de São João, quem pula a fogueira junto e promete amizade vira compadre pra vida toda.", "Mas falta combinar quem vai ser a madrinha da fogueira. Vai perguntar ao Zé e volta aqui."] },
      { npc: "noivos", tipo: "falar", dica: "Leve a pergunta de Seu Chico ao Zé.", info: "O Zé quer a Francisca como madrinha da fogueira.", falas: ["Seu Chico quer ser meu compadre? Mas que honra! Eu só aceito se a madrinha for a minha Francisca.", "Pode correr lá e contar pra ele. A fogueira que espere!"], escolhas: [{ texto: "Levo o recado com respeito", resposta: "Assim se faz! Compadre é coisa séria." }, { texto: "Vou correndo e rindo", resposta: "Hahaha, anda logo, que alegria também vale!" }] },
      { npc: "fogueira", tipo: "responder", dica: "Volte a Seu Chico e conte a resposta do Zé.", exigeInfos: 1, semInfo: ["Ainda não falou com o Zé! Vai lá e volta."], falas: ["E aí, o que o Zé disse? Fala logo, que o fogo não espera."], pergunta: { enunciado: "Quem o Zé quer como madrinha da fogueira?", opcoes: ["A Francisca", "A Dona Ritinha", "O Boi Estrela"] }, acerto: ["Francisca! Boa escolha. Na noite certa a gente pula a fogueira. Obrigado, compadre!"], erro: ["Não, não foi isso que o Zé falou. Vai lá perguntar de novo."] },
    ],
  },
  {
    id: "fogo-no-ritmo",
    titulo: "Fogo no ritmo",
    categoria: "povo",
    xp: 60,
    resumo: "Seu Chico só ensina o segredo da lenha a quem acende no ritmo.",
    passos: [
      { npc: "fogueira", tipo: "falar", dica: "Seu Chico quer ver você acender a fogueira no ritmo.", falas: ["Quer aprender o segredo da fogueira boa? Primeiro tem que mostrar que sabe seguir o ritmo.", "Eu bato os toques e tu repete igualzinho. Bora?"] },
      { npc: "fogueira", tipo: "prova", mini: "fogueira", dica: "Acenda a fogueira no ritmo, sem errar nenhum toque (aba Atividades ou falando com Seu Chico).", falas: ["Presta atenção nos toques e repete na mesma ordem. Sem errar nenhum!"] },
    ],
  },
  {
    id: "passo-da-quadrilha",
    titulo: "O marcador sumiu",
    categoria: "povo",
    xp: 60,
    resumo: "A quadrilha vai começar e falta quem marque os passos.",
    passos: [
      { npc: "noivos", tipo: "falar", dica: "O Zé quer que você marque a quadrilha.", falas: ["A quadrilha vai começar e o marcador sumiu! Tá todo mundo parado esperando.", "Tu que anda por aí, marca os passos pra mim? Eu falo e tu repete na ordem certa."] },
      { npc: "noivos", tipo: "prova", mini: "quadrilha", dica: "Marque a quadrilha sem errar nenhum comando.", falas: ["Vai! Escuta os comandos e repete na mesma ordem, sem errar nenhum."] },
    ],
  },
  {
    id: "fita-da-ritinha",
    titulo: "A fita da Ritinha",
    categoria: "povo",
    xp: 70,
    resumo: "Dona Ritinha perdeu a fita do chapéu e ninguém avisou onde está.",
    passos: [
      { npc: "brincante", tipo: "falar", dica: "Dona Ritinha perdeu a fita do chapéu. O Boi Estrela vê tudo da festa.", falas: ["Ai, perdi a fita do meu chapéu de brincante! Era a mais bonita.", "Tenho certeza que o Boi Estrela viu. Ele enxerga tudo da festa lá do curral."] },
      { npc: "boi", tipo: "falar", dica: "Pergunte ao Boi Estrela se viu a fita.", info: "O Boi viu a fita voar na direção de quem cuida do fogo.", falas: ["Muuu! A fita da Ritinha? Vi sim! O vento levou ela pro lado de quem cuida do fogo.", "Procura por lá. Mas eu não digo o nome, quero ver se tu adivinha!"] },
      { npc: "fogueira", tipo: "falar", semSeta: true, dica: "Quem cuida do fogo da praça? Ninguém vai te apontar: procure por conta própria.", info: "Seu Chico guardou a fita para a Ritinha.", falas: ["A fita? Caiu aqui do lado da fogueira e eu guardei pra ela! Achei que ia aparecer alguém procurando.", "Leva pra Dona Ritinha, e diz que é de Seu Chico, com carinho."] },
      { npc: "brincante", tipo: "falar", dica: "Devolva a fita à Dona Ritinha.", falas: ["Minha fita! Que alegria! Obrigada, meu filho, tu é brincante de verdade.", "Uma coisa eu digo: quem procura e devolve, o boi abençoa."] },
    ],
  },
  // ------------------------------------------------------------- semanais
  {
    id: "o-batizado-do-boi",
    titulo: "O batizado do boi",
    categoria: "semanal",
    xp: 150,
    resumo: "Descubra em que noite o boi é batizado, passando por três personagens.",
    passos: [
      { npc: "brincante", tipo: "falar", dica: "Dona Ritinha quer saber em que noite o boi é batizado. Comece ouvindo o Boi Estrela.", falas: ["Meu filho, tenho uma pergunta que me vem todo ano: em que noite o nosso boi é batizado?", "Eu sei, mas quero ver se tu aprende. Vai ouvir o Boi Estrela e depois me responde."] },
      { npc: "boi", tipo: "falar", dica: "Ouça o Boi Estrela sobre o batizado.", info: "O Boi diz que Seu Chico, que acende o fogo da noite, sabe o dia do batizado.", falas: ["Muuu! O batizado é a noite mais bonita do meu ano. Mas quem sabe contar o dia direitinho é Seu Chico, que acende o fogo daquela noite.", "Fala com ele, mas ele só ensina quem sabe acompanhar o ritmo."] },
      { npc: "fogueira", tipo: "prova", mini: "fogueira", dica: "Seu Chico só conta a data se você acender a fogueira no ritmo, sem errar.", falas: ["O boi te mandou aqui? Então mostra que acompanha o ritmo.", "Se acertar, eu te conto o dia do batizado."] },
      { npc: "fogueira", tipo: "falar", dica: "Acendeu no ritmo! Fale de novo com Seu Chico para ouvir a data.", info: "Em muitos grupos, o boi é batizado na noite de 23 de junho, véspera de São João.", falas: ["Acendeu no ritmo! Então escuta: em muitos grupos, o boi é batizado na noite de 23 de junho, véspera de São João.", "Agora vai contar pra Dona Ritinha."] },
      { npc: "brincante", tipo: "responder", dica: "Volte à Dona Ritinha e responda em que noite o boi é batizado.", exigeInfos: 2, semInfo: ["Já ouviu o Boi e Seu Chico? Eu quero a resposta completinha!"], falas: ["Então, meu filho, em que noite se batiza o boi?"], pergunta: { enunciado: "Em que noite o boi é batizado, em muitos grupos?", opcoes: ["Na noite de 23 de junho, véspera de São João", "Na noite de Natal", "No dia 7 de setembro"] }, acerto: ["Isso mesmo! Tu aprendeu. Agora o boi vai ser batizado com tua bênção também."], erro: ["Hum, não foi isso que Seu Chico contou. Volta lá e ouve de novo!"] },
    ],
  },
  {
    id: "a-matraca-que-sumiu",
    titulo: "A matraca que sumiu",
    categoria: "semanal",
    xp: 150,
    resumo: "A barraca perdeu uma matraca. Só quem procura sem seta descobre quem a levou.",
    passos: [
      { npc: "barraca", tipo: "falar", dica: "A matraca da barraca sumiu. Procure quem toca de verdade: ninguém vai te avisar.", falas: ["Ai, ai, ai! Minha matraca mais bonita sumiu do balcão.", "Eu só lembro que ela estava com os instrumentos de festa. Quem toca matraca de verdade, o ano inteiro? Procura essa pessoa."] },
      { npc: "brincante", tipo: "falar", semSeta: true, dica: "Quem toca matraca desde menina? Procure por conta própria (sem seta).", info: "Dona Ritinha viu o Zé passar com algo de madeira na mão.", falas: ["Matraca sumida? Eu não peguei! Mas vi o Zé passar com algo de madeira na mão, todo faceiro.", "Pergunta pra ele."] },
      { npc: "noivos", tipo: "entregar", semSeta: true, dica: "O Zé pega uma lembrança do baú do dia em troca. Abra o baú em Meu brincante e volte.", falas: ["Eu? Peguei emprestada! A Francisca queria mostrar pra todo mundo... Mas já devolvi.", "Olha, antes de eu falar com a barraca, quero deixar uma lembrança. Tu tem algum item do baú do dia pra me emprestar? Eu devolvo depois, juro."], acerto: ["Que lembrança bonita! Agora vou lá na barraca confessar tudo. Tu é gente boa, hein?"], semItem: ["Tu ainda não abriu o baú do dia. Abre lá em Meu brincante e volta aqui!"] },
      { npc: "barraca", tipo: "falar", dica: "Volte à Barraca da Kambada para contar que a matraca voltou.", falas: ["A matraca voltou! O Zé veio todo envergonhado devolver. Obrigado de coração!", "Foi a melhor semana de vendas só de alegria!"] },
    ],
  },
  {
    id: "o-casamento-na-roca",
    titulo: "O casamento na roça",
    categoria: "semanal",
    xp: 180,
    resumo: "Convide cada personagem e conte quantos confirmaram.",
    passos: [
      { npc: "noivos", tipo: "falar", dica: "O Zé quer contar os convidados. Convide primeiro o Boi Estrela.", falas: ["O casamento é daqui a pouco e eu preciso contar os convidados! A Francisca é exigente.", "Passa em cada um, convida pra festa e anota quem confirma. Quando voltar, eu pergunto quantos vêm."] },
      { npc: "boi", tipo: "falar", dica: "Convide o Boi Estrela para o casamento.", info: "O Boi Estrela confirmou.", falas: ["Muuu! Convite pra casamento? Eu danço no cortejo!"], escolhas: [{ texto: "Convidar com uma reverência", resposta: "Muuu, que educação! Pode contar comigo." }, { texto: "Chamar na toada", resposta: "Hahaha, chamou na toada! Vou animar o cortejo." }] },
      { npc: "fogueira", tipo: "falar", dica: "Convide Seu Chico da Fogueira.", info: "Seu Chico confirmou.", falas: ["Casamento? Eu vou, sim! Acendo a fogueira do cortejo, só não me deixem ficar sem quentão."] },
      { npc: "brincante", tipo: "falar", dica: "Convide Dona Ritinha.", info: "Dona Ritinha confirmou.", falas: ["Eu vou! Levo minha matraca pra animar o cortejo. Diz pra Francisca que eu chego cedo."] },
      { npc: "barraca", tipo: "falar", dica: "Convide a Barraca da Kambada.", info: "A Barraca da Kambada mandou presente.", falas: ["Eu não posso fechar a barraca... mas mando um presente! Pode dizer que a Kambada confirma de coração."] },
      { npc: "noivos", tipo: "responder", dica: "Volte ao Zé e conte quantos convidados você anotou.", exigeInfos: 4, semInfo: ["Ainda faltam convidados pra contar! Passa em todo mundo e volta."], falas: ["Voltou! Agora me diz, quantos convidados confirmaram?"], pergunta: { enunciado: "Quantos convidados confirmaram o casamento?", opcoes: ["Quatro", "Dois", "Seis"] }, acerto: ["Quatro! Perfeito! Vai ser o casamento mais animado do arraial."], erro: ["Hum, conta de novo: veja no diário quantas confirmações você anotou."] },
    ],
  },
];

export const POVO = RECADOS.filter((r) => r.categoria === "povo");
export const SEMANAIS = RECADOS.filter((r) => r.categoria === "semanal");
const POR_ID = new Map(RECADOS.map((r) => [r.id, r]));
export const recado = (id: string) => POR_ID.get(id);

// --- Rodízio ------------------------------------------------------------------

function numeroDoDia(dia: string): number {
  return Math.floor(Date.parse(`${dia}T00:00:00Z`) / 86_400_000);
}

/** Semana de segunda a domingo (1/1/1970 foi quinta). */
export function semanaDe(dia: string): number {
  return Math.floor((numeroDoDia(dia) + 3) / 7);
}

export const PERIODO_NOME = { povo: "dia", semanal: "semana" } as const;

export function periodoDe(r: Recado, dia: string): string {
  return r.categoria === "povo" ? `d${dia}` : `s${semanaDe(dia)}`;
}

/** 3 recados do povo por dia e 2 semanais por semana, em rodízio. */
export function recadosDoDia(dia: string): Recado[] {
  const n = numeroDoDia(dia);
  const w = semanaDe(dia);
  const povo = [0, 1, 2].map((k) => POVO[(n + k) % POVO.length]);
  const semanais = [0, 1].map((k) => SEMANAIS[(w + k) % SEMANAIS.length]);
  return [...povo, ...semanais];
}

// --- Estado por conta -----------------------------------------------------------

export type Andamento = { passo: number; infos: string[]; periodo: string };
export type EstadoRecados = { ativas: Record<string, Andamento>; feitas: Record<string, string> };

export const recadosNovo = (): EstadoRecados => ({ ativas: {}, feitas: {} });

export const NOME_DO_NPC: Record<NpcId, string> = {
  noivos: "Zé e Francisca",
  boi: "Boi Estrela",
  fogueira: "Seu Chico da Fogueira",
  brincante: "Dona Ritinha",
  barraca: "Barraca da Kambada",
};

export type Dialogo = {
  recado: string;
  titulo: string;
  categoria: Categoria;
  passo: number;
  /** "avisar" = só fala (falta informação ou item): não avança. */
  tipo: "falar" | "responder" | "prova" | "entregar" | "avisar";
  falas: string[];
  nova: boolean;
  pergunta?: { enunciado: string; opcoes: string[] };
  escolhas?: string[];
  mini?: MiniId;
};

type Alvo = { r: Recado; passo: number; andamento: Andamento | null };

/** O que o personagem tem para este jogador agora: passos ativos primeiro, depois ofertas. */
function alvosDe(estado: EstadoRecados, npc: NpcId, dia: string): Alvo[] {
  const alvos: Alvo[] = [];
  for (const [id, a] of Object.entries(estado.ativas)) {
    const r = recado(id);
    if (r && a.periodo === periodoDe(r, dia) && r.passos[a.passo]?.npc === npc) alvos.push({ r, passo: a.passo, andamento: a });
  }
  for (const r of recadosDoDia(dia)) {
    if (estado.ativas[r.id] || estado.feitas[r.id] === periodoDe(r, dia)) continue;
    if (r.passos[0].npc === npc) alvos.push({ r, passo: 0, andamento: null });
  }
  return alvos;
}

function montar(alvo: Alvo, contaId: string, temItemDoBau: boolean): Dialogo {
  const { r, passo, andamento } = alvo;
  const p = r.passos[passo];
  const base = { recado: r.id, titulo: r.titulo, categoria: r.categoria, passo, nova: !andamento };
  if (p.tipo === "responder" && (andamento?.infos.length ?? 0) < (p.exigeInfos ?? 0)) {
    return { ...base, tipo: "avisar", falas: p.semInfo ?? ["Ainda falta você descobrir uma coisa. Volte depois!"] };
  }
  if (p.tipo === "entregar" && !temItemDoBau) {
    return { ...base, tipo: "avisar", falas: [...p.falas, ...(p.semItem ?? ["Você ainda não tem o que ele pediu."])] };
  }
  if (p.tipo === "responder" && p.pergunta) {
    const ordem = permutacaoSecreta(`${contaId}|${r.id}`, passo, 3);
    return { ...base, tipo: "responder", falas: p.falas, pergunta: { enunciado: p.pergunta.enunciado, opcoes: ordem.map((o) => p.pergunta!.opcoes[o]) } };
  }
  return { ...base, tipo: p.tipo, falas: p.falas, escolhas: p.escolhas?.map((e) => e.texto), mini: p.mini };
}

export function falarCom(estado: EstadoRecados, npc: NpcId, dia: string, contaId: string, temItemDoBau: boolean): Dialogo | null {
  const alvo = alvosDe(estado, npc, dia)[0];
  return alvo ? montar(alvo, contaId, temItemDoBau) : null;
}

function avancar(estado: EstadoRecados, alvo: Alvo, dia: string): { concluida?: Recado } {
  const { r, passo } = alvo;
  const p = r.passos[passo];
  const infos = [...(alvo.andamento?.infos ?? []), ...(p.info ? [p.info] : [])];
  const proximo = passo + 1;
  if (proximo >= r.passos.length) {
    delete estado.ativas[r.id];
    estado.feitas[r.id] = periodoDe(r, dia);
    return { concluida: r };
  }
  estado.ativas[r.id] = { passo: proximo, infos, periodo: periodoDe(r, dia) };
  return {};
}

export type Retorno = {
  estado: EstadoRecados;
  falas: string[];
  certa?: boolean;
  avancou: boolean;
  concluida?: { titulo: string; xp: number };
};

/** Fecha a conversa de um passo (falar, responder ou entregar). */
export function concluirPasso(
  antes: EstadoRecados,
  npc: NpcId,
  recadoId: string,
  resposta: unknown,
  dia: string,
  contaId: string,
  temItemDoBau: boolean,
): Retorno | { erro: string } {
  const estado: EstadoRecados = JSON.parse(JSON.stringify(antes));
  const alvo = alvosDe(estado, npc, dia).find((a) => a.r.id === recadoId);
  if (!alvo) return { erro: "Esse recado não está mais com este personagem." };
  const p = alvo.r.passos[alvo.passo];
  const d = montar(alvo, contaId, temItemDoBau);
  if (d.tipo === "avisar" || d.tipo === "prova") return { erro: d.tipo === "prova" ? "Esta prova é feita na atividade." : "Ainda falta algo para seguir." };

  let falas: string[] = [];
  let certa: boolean | undefined;
  if (p.tipo === "falar" && p.escolhas) {
    if (typeof resposta !== "number" || !Number.isInteger(resposta) || resposta < 0 || resposta >= p.escolhas.length) return { erro: "Escolha inválida." };
    falas = [p.escolhas[resposta].resposta];
  } else if (p.tipo === "responder") {
    if (typeof resposta !== "number" || !Number.isInteger(resposta) || resposta < 0 || resposta > 2) return { erro: "Resposta inválida." };
    const ordem = permutacaoSecreta(`${contaId}|${alvo.r.id}`, alvo.passo, 3);
    certa = ordem[resposta] === 0;
    if (!certa) return { estado: antes, falas: p.erro ?? [], certa: false, avancou: false };
    falas = p.acerto ?? [];
  } else if (p.tipo === "entregar") {
    falas = p.acerto ?? [];
  }
  const { concluida } = avancar(estado, alvo, dia);
  return { estado, falas, certa, avancou: true, concluida: concluida ? { titulo: concluida.titulo, xp: concluida.xp } : undefined };
}

/** Uma mini-atividade perfeita avança o passo "prova" do recado, se for o atual. */
export function concluirProva(antes: EstadoRecados, recadoId: string, mini: MiniId, perfeito: boolean, dia: string): Retorno | null {
  if (!perfeito) return null;
  const r = recado(recadoId);
  const a = antes.ativas[recadoId];
  if (!r || !a || a.periodo !== periodoDe(r, dia)) return null;
  const p = r.passos[a.passo];
  if (p?.tipo !== "prova" || p.mini !== mini) return null;
  const estado: EstadoRecados = JSON.parse(JSON.stringify(antes));
  const { concluida } = avancar(estado, { r, passo: a.passo, andamento: a }, dia);
  return { estado, falas: [], avancou: true, concluida: concluida ? { titulo: concluida.titulo, xp: concluida.xp } : undefined };
}

// --- Visão pública (diário e marcadores) -----------------------------------------

export type DiarioRecados = {
  ativas: { id: string; titulo: string; categoria: Categoria; passo: number; total: number; dica: string; infos: string[]; xp: number; periodo: string }[];
  disponiveis: { id: string; titulo: string; categoria: Categoria; xp: number; resumo: string; onde: string }[];
  /** Personagens que ganham "!" por causa de um recado (nunca os passos sem seta). */
  marcados: NpcId[];
  feitasNoPeriodo: number;
};

export function diarioDe(estado: EstadoRecados, dia: string): DiarioRecados {
  const hoje = recadosDoDia(dia);
  const ativas: DiarioRecados["ativas"] = [];
  const marcados = new Set<NpcId>();
  for (const [id, a] of Object.entries(estado.ativas)) {
    const r = recado(id);
    if (!r || a.periodo !== periodoDe(r, dia)) continue;
    const p = r.passos[a.passo];
    ativas.push({ id, titulo: r.titulo, categoria: r.categoria, passo: a.passo + 1, total: r.passos.length, dica: p.dica, infos: a.infos, xp: r.xp, periodo: PERIODO_NOME[r.categoria] });
    if (!p.semSeta) marcados.add(p.npc);
  }
  const disponiveis: DiarioRecados["disponiveis"] = [];
  for (const r of hoje) {
    if (estado.ativas[r.id] || estado.feitas[r.id] === periodoDe(r, dia)) continue;
    disponiveis.push({ id: r.id, titulo: r.titulo, categoria: r.categoria, xp: r.xp, resumo: r.resumo, onde: NOME_DO_NPC[r.passos[0].npc] });
    marcados.add(r.passos[0].npc);
  }
  return { ativas, disponiveis, marcados: [...marcados], feitasNoPeriodo: hoje.filter((r) => estado.feitas[r.id] === periodoDe(r, dia)).length };
}
