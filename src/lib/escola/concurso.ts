import type { Etapa } from "./tipos";

/**
 * Concurso de redação da temporada (ideia de uma pedagoga, 05/11/2026): no
 * fim de uma temporada (aqui, o Carnaval de São Luís), cada aluno escreve
 * sobre o que aprendeu. O professor avalia com a mesma grade para todos e
 * escolhe até 3 finalistas da turma; a coordenação escolhe a redação que
 * representa a escola em cada etapa; a gestão Kambada premia, entre as
 * escolas parceiras, as três melhores de cada etapa (a etapa "da rede").
 *
 * Alinhamento (a confirmar com a coordenação pedagógica de cada escola):
 * produção de texto e repertório cultural (BNCC, competência geral 3 e
 * Língua Portuguesa), a maranhensidade do DCTMA e a escrita que o
 * Compromisso Nacional Criança Alfabetizada acompanha.
 *
 * Vale no servidor e no navegador (não há gabarito aqui). Conteúdo de
 * protótipo: `REVISADO = false` até a conferência pedagógica e cultural.
 */
export const REVISADO = false;

export type Criterio = { id: string; nome: string; explica: string };

/** Grade de avaliação: cada critério vale de 1 a 5 (total 20). */
export const CRITERIOS: Criterio[] = [
  { id: "tema", nome: "Tema e proposta", explica: "Escreveu sobre o que a proposta pediu, no gênero pedido." },
  { id: "repertorio", nome: "Repertório cultural", explica: "Usa o que aprendeu na temporada (personagens, histórias, palavras do carnaval) com sentido." },
  { id: "organizacao", nome: "Organização das ideias", explica: "Começo, meio e fim; as ideias se ligam umas às outras." },
  { id: "lingua", nome: "Escrita", explica: "Ortografia, pontuação e concordância esperadas para a série." },
];
export const NOTA_MAXIMA = 5;

export type Proposta = { genero: string; enunciado: string; dicas: string[]; minPalavras: number; maxPalavras: number };

export type Concurso = {
  id: string;
  titulo: string;
  temporada: string;
  emoji: string;
  /** Texto do cartaz do concurso. */
  chamada: string;
  prazo: string;
  propostas: Record<Etapa, Proposta>;
  /** Para inspirar: o que a temporada ensinou. */
  inspiracao: { titulo: string; texto: string }[];
  /** Quantos finalistas o professor pode escolher por turma. */
  finalistasPorTurma: number;
};

export const CONCURSO: Concurso = {
  id: "carnaval-sao-luis",
  titulo: "Concurso de Redação · Carnaval de São Luís",
  temporada: "Carnaval",
  emoji: "🎭",
  chamada: "Tu aprendeu sobre o Fofão e o carnaval de rua da nossa cidade. Agora é a tua vez de contar!",
  prazo: "até o fim da temporada de Carnaval",
  propostas: {
    f1: {
      genero: "História (narrativa)",
      enunciado: "Imagine que tu está no carnaval de rua de São Luís e encontra um Fofão. Conte essa história: onde foi, o que o Fofão fez e como tu te sentiu.",
      dicas: ["Comece dizendo onde e quando aconteceu.", "Descreva o Fofão: a máscara, a roupa, a boneca.", "Conte o que aconteceu e como terminou."],
      minPalavras: 40,
      maxPalavras: 250,
    },
    f2: {
      genero: "Texto de opinião",
      enunciado: "O Fofão é o personagem mais popular do carnaval de rua de São Luís, mas personagens tradicionais podem ser esquecidos. Na tua opinião, por que é importante manter vivos os personagens do carnaval maranhense? Defenda o teu ponto de vista.",
      dicas: ["Diga a tua opinião logo no começo.", "Dê pelo menos dois motivos, com exemplos do que aprendeu.", "Termine com uma proposta: o que a escola ou a cidade pode fazer?"],
      minPalavras: 120,
      maxPalavras: 450,
    },
  },
  inspiracao: [
    { titulo: "Quem é o Fofão?", texto: "É o personagem mais popular do carnaval de rua de São Luís: máscara de nariz comprido, macacão largo e colorido de chita, uma boneca numa mão e uma varinha na outra." },
    { titulo: "A máscara “feia” de propósito", texto: "A máscara é feita à mão, de papel machê. Ela é feia de propósito: o Fofão assusta e diverte ao mesmo tempo." },
    { titulo: "A boneca", texto: "O Fofão oferece a boneca às crianças: é o jeito dele de fazer amizade com quem tem medo da máscara." },
    { titulo: "De onde ele veio?", texto: "Os registros mais antigos são do fim do século 19. A origem ainda é discutida: há quem veja influência das comédias de rua da Europa, e há quem aponte raízes africanas." },
  ],
  finalistasPorTurma: 3,
};

/**
 * As redações do ano letivo, na ordem: é a linha do tempo da escrita de cada
 * aluno. As anteriores ao Carnaval existem na demonstração (notas fictícias)
 * para mostrar a evolução; numa escola de verdade, cada temporada com
 * redação entra aqui.
 */
export const HISTORICO: { id: string; temporada: string; mes: string }[] = [
  { id: "saojoao-2026", temporada: "São João", mes: "jun" },
  { id: "tambor-2026", temporada: "Consciência Negra", mes: "nov" },
  { id: CONCURSO.id, temporada: "Carnaval", mes: "fev" },
];

export function contarPalavras(texto: string): number {
  return texto.trim() ? texto.trim().split(/\s+/).length : 0;
}

