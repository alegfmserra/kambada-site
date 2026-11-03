import { extras, npcs, type Falante, type Quiz } from "@/content/play/arraial";

/**
 * Arraial da escola: a mesma praça 3D do Kambada Play. Quem tem o "!" em
 * cima primeiro CONTA uma tradição (as falas do Play: a quadrilha que veio da
 * França, a fogueira de Isabel, o boi que renasce, a matraca da Ilha) e faz a
 * pergunta da tradição; depois, nos desafios, faz as perguntas da turma. O
 * trio do auto do boi (Catirina, Pai Francisco e o Amo) conta a história do
 * Bumba-meu-boi em três partes. O Play público não usa este arquivo.
 */

/** Quem pergunta, na ordem do percurso da praça (é a ordem das fitinhas ao retomar). */
export const ORDEM = ["fogueira", "barraca", "brincante", "boi", "noivos"] as const;

/** Modo festa (`?trilha=festa`): só cultura, sem perguntas da turma. */
export const FESTA = "festa";

/** Abertura curta para quem já contou a tradição e agora traz a pergunta da turma. */
const ABERTURA: Record<string, string[]> = {
  fogueira: ["Voltou pra perto do fogo! No arraial da escola, quem quer fitinha mostra o que aprendeu na sala. Vamos ver!"],
  barraca: ["Barraqueiro bom faz conta e lê direitinho. Me ajuda nessa?"],
  brincante: ["No boi, quem erra o ritmo tenta de novo. Aqui também: errou, ganha dica e mais uma chance."],
  boi: ["Muuu! Eu renasço todo ano... e tu cresce a cada pergunta! Bora?"],
  noivos: ["Antes da quadrilha começar, responde essa pra gente!"],
};

/** O auto do Bumba-meu-boi contado pelo trio, em três partes. */
const AUTO: Record<string, string[]> = {
  catirina: [
    "Ai, meu filho, eu sou a Mãe Catirina! Foi meu desejo que começou a história do boi.",
    "Grávida, me deu vontade de comer a língua do boi mais bonito da fazenda. E o Pai Francisco, coitado, foi buscar...",
    "Pergunta pro Pai Francisco o que aconteceu depois!",
  ],
  "pai-francisco": [
    "Psiu! Eu sou o Pai Francisco, vaqueiro da fazenda.",
    "Pra atender o desejo da Catirina, levei escondido o boi do Amo... e o boi morreu. Fugi com medo!",
    "Mas o pajé rezou, o boi se levantou e urrou de novo. Vai lá falar com o Amo!",
  ],
  amo: [
    "Eu sou o Amo, o dono da fazenda e do boi. No grupo, sou eu que puxo a toada e apito o batalhão.",
    "Quando o boi renasceu, perdoei o Pai Francisco e mandei fazer festa. É por isso que todo São João tem Bumba-meu-boi!",
    "Quer pôr essa história em ordem? Tem o jogo “A história do Boi” na área de Cultura.",
  ],
};

/**
 * Na escola, a barraca da Kambada conta a comida da festa (no Play, a
 * pergunta dela é sobre a marca, o que não cabe numa aula).
 */
const TRADICAO_DA_ESCOLA: Record<string, { falas: string[]; quiz: Quiz }> = {
  barraca: {
    falas: [
      "Ei, visitante! Na barraca da Kambada tem matraca pintada à mão e comida de São João.",
      "Canjica, pamonha, milho assado, bolo de milho... Já reparou quanta comida de milho tem na festa?",
    ],
    quiz: {
      pergunta: "Por que a festa de São João tem tanta comida de milho?",
      opcoes: ["Porque junho é tempo de colheita do milho", "Porque o boi só come milho", "Porque milho só pode ser comido em junho"],
      correta: 0,
      acerto: "Isso! As festas juninas celebram a colheita: o milho verde vira pamonha, canjica, cuscuz e bolo. Toma tua fitinha!",
      erro: "Quase! É que junho é tempo de colheita do milho, e a festa celebra a fartura. Volta aqui depois pra tentar de novo!",
    },
  },
};

export type Pessoa = Falante & {
  /** Dá fitinha (tem tradição e, nos desafios, perguntas da turma). */
  pergunta: boolean;
  /** Falas que contam a tradição (do Play) e a pergunta dela. */
  tradicao?: { falas: string[]; quiz: Quiz };
};

/** Todo mundo da praça: os cinco que contam e perguntam, e o trio do auto do boi. */
export const PESSOAS: Pessoa[] = [
  ...npcs.map((n) => ({
    id: n.id,
    nome: n.nome,
    cor: n.cor,
    falas: ABERTURA[n.id] ?? n.falas.slice(-1),
    pergunta: true,
    tradicao: TRADICAO_DA_ESCOLA[n.id] ?? { falas: n.falas, quiz: n.quiz },
  })),
  ...extras.map((n) => ({ ...n, falas: AUTO[n.id] ?? n.falas, pergunta: false })),
];

export const pessoa = (id: string | null) => PESSOAS.find((p) => p.id === id) ?? null;

export const JA_DEU_FITINHA = "Já te dei a minha fitinha! Procura quem ainda tem o ❗ em cima.";
export const FITINHA = "Muito bem! Toma a tua fitinha.";

/**
 * Quantas fitinhas valem `respondidas` perguntas de `total`: a trilha é
 * repartida entre os cinco (10 perguntas = 2 por pessoa; 8 = 2, 1, 2, 1, 2).
 */
export function fitinhasPor(respondidas: number, total: number): number {
  if (respondidas >= total) return ORDEM.length;
  let n = 0;
  for (let k = 1; k <= ORDEM.length; k++) if (Math.round((total * k) / ORDEM.length) <= respondidas) n = k;
  return n;
}
