import type { NpcId } from "./missoesArraial";

/**
 * Amizade com os personagens do Arraial (Fase 3 do plano de 28/10/2026).
 * Cada conversa nova com um personagem soma um ponto; os corações (até 5)
 * abrem histórias extras dele, lidas na janela "Meu brincante".
 *
 * Os textos são NOVOS e ainda não passaram pela revisão dos mestres e
 * brincantes (`HISTORIAS_REVISADAS`).
 */

export const HISTORIAS_REVISADAS = false;

/** Conversas acumuladas para ter 1, 2, 3, 4 e 5 corações. */
export const CONVERSAS_POR_CORACAO = [1, 3, 6, 10, 15] as const;
export const MAX_CORACOES = CONVERSAS_POR_CORACAO.length;

export function coracoesDe(conversas: number): number {
  return CONVERSAS_POR_CORACAO.filter((n) => conversas >= n).length;
}

export type Historia = { coracoes: number; titulo: string; texto: string };

export const AMIGOS: { id: NpcId; nome: string; historias: Historia[] }[] = [
  {
    id: "noivos",
    nome: "Zé e Francisca",
    historias: [
      { coracoes: 2, titulo: "O casamento da roça", texto: "Todo ano a gente casa de novo! O casamento na roça é encenado na festa junina: o noivo aparece de roupa remendada, a noiva de buquê, e a plateia é quem faz a festa." },
      { coracoes: 4, titulo: "Padrinho e madrinha", texto: "Quem vai ao casamento da festa vira parente de brincadeira. Tem padrinho, tem madrinha, e todo mundo ajuda a pagar o 'dote' com muita risada." },
    ],
  },
  {
    id: "boi",
    nome: "Boi Estrela",
    historias: [
      { coracoes: 2, titulo: "Pai Francisco e Catirina", texto: "A história do boi começa com Catirina, grávida, desejando comer a língua do boi mais bonito da fazenda. Pai Francisco, para agradar, acaba tirando o boi do patrão. Daí nasce toda a brincadeira." },
      { coracoes: 4, titulo: "O boi que morre e ressuscita", texto: "No fim da história o boi cai, mas o povo canta, chama o pajé e o boi levanta dançando. Por isso o boi é festa de alegria, não de tristeza." },
    ],
  },
  {
    id: "fogueira",
    nome: "Seu Chico da Fogueira",
    historias: [
      { coracoes: 2, titulo: "Compadres de fogueira", texto: "Na noite de São João, duas pessoas que pulam a fogueira juntas e prometem amizade viram compadre e comadre de fogueira. É um laço de respeito que dura a vida inteira." },
      { coracoes: 4, titulo: "O segredo da lenha boa", texto: "Fogueira boa se arma com calma: lenha grossa embaixo, galho fino em cima e muita roda de gente em volta. O que vale é a conversa ao redor do fogo." },
    ],
  },
  {
    id: "brincante",
    nome: "Dona Ritinha",
    historias: [
      { coracoes: 2, titulo: "Os sotaques do boi", texto: "Os grupos de bumba-meu-boi do Maranhão têm sotaques, que são jeitos de tocar, cantar e vestir. Os mais conhecidos são o de matraca, o de zabumba, o da baixada, o de orquestra e o de costa de mão." },
      { coracoes: 4, titulo: "O boi tem dono", texto: "Cada grupo tem um amo, que puxa as toadas e comanda a brincadeira. A turma toda aprende com os mais velhos, e é assim que o boi passa de geração em geração." },
    ],
  },
  {
    id: "barraca",
    nome: "Barraca da Kambada",
    historias: [
      { coracoes: 2, titulo: "Cada estampa conta uma festa", texto: "Aqui na barraca, as estampas e as matracas vêm da cultura maranhense: o couro bordado do boi, as fitas e os instrumentos que fazem barulho na festa." },
      { coracoes: 4, titulo: "Feito à mão", texto: "Cada peça da Kambada é feita com cuidado por quem conhece a festa de perto. Quando você leva uma, leva um pedacinho do arraial para casa." },
    ],
  },
];
