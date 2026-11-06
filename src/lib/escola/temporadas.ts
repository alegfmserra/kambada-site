import type { PerguntaCultura } from "./cultura";

/**
 * Temporadas (05/11/2026, pedido do Alexandre): cada data do calendário vira
 * uma TRILHA com o mesmo caminho, para o aluno brincar, aprender e depois
 * apresentar o que aprendeu:
 *
 *   1. Assistir (animação)  2. Ler (revistinha)  3. Entender (artigo)
 *   4. Brincar (jogo)       5. Mostrar o que sabe (quiz)  6. Escrever (redação)
 *
 * A animação e a revistinha são "cultura vivida" (a historinha do Kambadinha,
 * sem moral explicada, como manda a bíblia de personagens); o artigo e o
 * quiz são a camada didática da escola; a redação fecha a temporada.
 *
 * Um passo sem conteúdo pronto fica "em produção" (com o que falta), para a
 * escola ver o plano do ano. Os passos apontam para as atividades de
 * `cultura.ts` (é o que marca "feito" e vai para o relatório do professor).
 *
 * Conteúdo de protótipo: `REVISADO = false` até a conferência pedagógica e
 * dos mestres da cultura. Fatos do Fofão: O Imparcial (2019, 2024, 2025),
 * Jornal de Brasília e CBIC; a origem é tratada como discutida.
 */
export const REVISADO = false;

export type TipoPasso = "animacao" | "revistinha" | "artigo" | "jogo" | "quiz" | "redacao";

export const PASSO: Record<TipoPasso, { verbo: string; nome: string; emoji: string }> = {
  animacao: { verbo: "Assistir", nome: "Animação", emoji: "🎬" },
  revistinha: { verbo: "Ler", nome: "Revistinha", emoji: "📚" },
  artigo: { verbo: "Entender", nome: "Artigo", emoji: "📰" },
  jogo: { verbo: "Brincar", nome: "Jogo", emoji: "🎮" },
  quiz: { verbo: "Mostrar o que sabe", nome: "Quiz", emoji: "❓" },
  redacao: { verbo: "Escrever", nome: "Redação", emoji: "✍️" },
};

export type Passo = {
  tipo: TipoPasso;
  titulo: string;
  /** Atividade de cultura que marca o passo como feito (ver cultura.ts). */
  atividade?: string;
  /** Caminho dentro do portal. Sem caminho = em produção. */
  caminho?: string;
  /** O que falta para o passo existir. */
  emProducao?: string;
};

export type SecaoArtigo = { titulo: string; texto: string };

export type Temporada = {
  id: string;
  mes: string;
  emoji: string;
  titulo: string;
  tema: string;
  passos: Passo[];
  artigo?: { titulo: string; linhaFina: string; secoes: SecaoArtigo[]; paraPensar: string[] };
  quiz?: PerguntaCultura[];
};

const CARNAVAL: Temporada = {
  id: "carnaval",
  mes: "Fevereiro",
  emoji: "🎭",
  titulo: "Carnaval de São Luís",
  tema: "O Fofão e o carnaval de rua da cidade",
  passos: [
    { tipo: "animacao", titulo: "Kambadinha em: O Fofão", emProducao: "Roteiro pronto (a mesma historinha da revistinha); falta animar e gravar as vozes." },
    { tipo: "revistinha", titulo: "Kambadinha em: O Fofão", emProducao: "Roteiro pronto, quadro a quadro; falta o desenho do Ricardo e o Fofão no traço da casa." },
    { tipo: "artigo", titulo: "O Fofão e o carnaval de rua", atividade: "artigo-carnaval", caminho: "/aluno/temporada/carnaval/artigo" },
    { tipo: "jogo", titulo: "Monte o Fofão", atividade: "jogo-fofao", caminho: "/aluno/cultura/fofao" },
    { tipo: "quiz", titulo: "Quiz do Carnaval", atividade: "quiz-carnaval", caminho: "/aluno/temporada/carnaval/quiz" },
    { tipo: "redacao", titulo: "Concurso de Redação", caminho: "/aluno/concurso" },
  ],
  artigo: {
    titulo: "O Fofão e o carnaval de rua de São Luís",
    linhaFina: "Quem é o personagem de máscara de nariz comprido que assusta, brinca e oferece uma boneca às crianças.",
    secoes: [
      {
        titulo: "Uma festa que acontece na rua",
        texto:
          "Em São Luís, o carnaval não fica só nos clubes e palcos: ele anda pelas ruas e pelos bairros. Blocos saem cantando e dançando juntos, gente fantasiada aparece nas esquinas e a cidade inteira vira festa. No meio dessa multidão, há um personagem que todo mundo reconhece de longe.",
      },
      {
        titulo: "Quem é o Fofão",
        texto:
          "O Fofão é o personagem mais popular do carnaval de rua de São Luís. Ele usa um macacão bem largo e colorido, de chita, que deixa o corpo parecendo inflado. No rosto, uma máscara de nariz comprido. Numa mão, uma varinha; na outra, uma boneca. Ninguém vê quem está debaixo da fantasia: esse é o mistério.",
      },
      {
        titulo: "Feio de propósito",
        texto:
          "A máscara tradicional é feita à mão, de papel machê, por artesãos da cidade, e é feia de propósito. O Fofão chega assustando, principalmente as crianças. Mas aí vem a boneca: ele oferece a boneca para fazer amizade com quem ficou com medo. Primeiro o susto, depois a brincadeira.",
      },
      {
        titulo: "De onde ele veio?",
        texto:
          "Os registros mais antigos do Fofão nas ruas de São Luís são do fim do século 19 e do começo do século 20. De onde ele veio ainda é discutido: há estudiosos que veem nele a influência das comédias de rua e dos carnavais da Europa, e há quem aponte raízes africanas. Quando uma origem é discutida, quer dizer que quem estuda ainda não chegou a um acordo, e tudo bem: a história continua sendo pesquisada.",
      },
      {
        titulo: "Uma tradição que precisa de gente",
        texto:
          "Para o Fofão continuar existindo, alguém precisa fazer as máscaras, costurar a chita e sair na rua. Por isso há grupos que trabalham para manter o personagem vivo, como o Blocão do Fofão, e em 2025 o Museu Histórico e Artístico do Maranhão fez uma exposição só sobre ele. Uma tradição continua quando passa de uma geração para outra.",
      },
    ],
    paraPensar: [
      "Tu já viu um Fofão na rua ou numa foto? O que tu sentiu?",
      "Pergunta em casa: como era o carnaval quando teus avós eram crianças?",
      "Por que será que o Fofão esconde o rosto?",
    ],
  },
  quiz: [
    {
      pergunta: "Qual é o personagem mais popular do carnaval de rua de São Luís?",
      opcoes: ["O Saci", "O Fofão", "O Boi"],
      correta: 1,
      explica: "O Fofão, com máscara de nariz comprido e macacão largo de chita.",
    },
    {
      pergunta: "Do que é feita a máscara tradicional do Fofão?",
      opcoes: ["De plástico, em fábrica", "De papel machê, à mão", "De metal"],
      correta: 1,
      explica: "É feita à mão, de papel machê, por artesãos da cidade.",
    },
    {
      pergunta: "Por que a máscara do Fofão é feia?",
      opcoes: ["Porque é velha", "Porque ninguém sabe fazer bonita", "De propósito: ele assusta e depois brinca"],
      correta: 2,
      explica: "É feia de propósito. Primeiro o susto, depois a brincadeira.",
    },
    {
      pergunta: "O que o Fofão oferece às crianças para fazer amizade?",
      opcoes: ["Uma boneca", "Uma matraca", "Um balão"],
      correta: 0,
      explica: "A boneca é o jeito do Fofão de conquistar quem ficou com medo da máscara.",
    },
    {
      pergunta: "Qual tecido faz o macacão largo e colorido do Fofão?",
      opcoes: ["Couro", "Chita", "Jeans"],
      correta: 1,
      explica: "A chita, tecido de flores coloridas, deixa o Fofão parecendo inflado.",
    },
    {
      pergunta: "De quando são os registros mais antigos do Fofão em São Luís?",
      opcoes: ["Do fim do século 19", "Do ano 2000", "De 1500, quando os portugueses chegaram"],
      correta: 0,
      explica: "Os primeiros registros são do fim do século 19 e do começo do século 20.",
    },
    {
      pergunta: "O artigo diz que a origem do Fofão “ainda é discutida”. O que isso quer dizer?",
      opcoes: ["Que o Fofão foi inventado ano passado", "Que quem estuda ainda não chegou a um acordo sobre de onde ele veio", "Que é proibido falar do Fofão"],
      correta: 1,
      explica: "Há quem veja influência europeia e há quem aponte raízes africanas. A pesquisa continua.",
    },
    {
      pergunta: "Segundo o artigo, o que faz uma tradição continuar existindo?",
      opcoes: ["Passar de uma geração para outra", "Ficar guardada num museu, sem ninguém usar", "Ser igual em todas as cidades"],
      correta: 0,
      explica: "Alguém precisa fazer a máscara, costurar a chita e sair na rua: a tradição passa de geração em geração.",
    },
  ],
};

/** O calendário do ano (o mesmo da apresentação pedagógica). */
export const TEMPORADAS: Temporada[] = [
  CARNAVAL,
  {
    id: "agua",
    mes: "Março",
    emoji: "🦀",
    titulo: "Manguezal e água",
    tema: "22 de março: o mangue, o caranguejo e o guará",
    passos: [
      { tipo: "animacao", titulo: "A Hora dos Guarás", atividade: "video-guaras", caminho: "/aluno/cultura/video/kambadinha-a-hora-dos-guaras" },
      { tipo: "revistinha", titulo: "A Hora dos Guarás", atividade: "hq-guaras", caminho: "/aluno/cultura/hq/kambadinha-a-hora-dos-guaras" },
      { tipo: "artigo", titulo: "O mangue, berçário da Ilha", emProducao: "Artigo a escrever (mangue, guará, caranguejo)." },
      { tipo: "jogo", titulo: "Jogo do mangue", emProducao: "Jogo a criar." },
      { tipo: "quiz", titulo: "Quiz do mangue", emProducao: "Quiz a montar a partir do artigo." },
      { tipo: "redacao", titulo: "Redação do mangue", emProducao: "Proposta a definir com a pedagoga." },
    ],
  },
  {
    id: "saojoao",
    mes: "Junho",
    emoji: "🐂",
    titulo: "São João",
    tema: "Bumba-meu-boi e os sotaques do Maranhão",
    passos: [
      { tipo: "animacao", titulo: "O Auto do Boi (cordel animado)", atividade: "conto-boi", caminho: "/aluno/cultura/conto" },
      { tipo: "revistinha", titulo: "Kambadinha e os cinco bois", emProducao: "Roteiro longo pronto (L3); pede consulta a mestres e brincantes antes do traço." },
      { tipo: "artigo", titulo: "O Bumba-meu-boi e seus sotaques", emProducao: "Artigo a escrever." },
      { tipo: "jogo", titulo: "Arraial da Kambada", atividade: "arraial-festa", caminho: "/aluno/arraial?trilha=festa" },
      { tipo: "jogo", titulo: "A história do Boi", atividade: "jogo-auto-do-boi", caminho: "/aluno/cultura/auto-do-boi" },
      { tipo: "jogo", titulo: "Sotaques do Boi", atividade: "jogo-sotaques", caminho: "/aluno/cultura/sotaques" },
      { tipo: "quiz", titulo: "Quiz do São João", emProducao: "Quiz a montar a partir do artigo." },
      { tipo: "redacao", titulo: "Redação do São João", emProducao: "Proposta a definir com a pedagoga." },
    ],
  },
  {
    id: "tambor",
    mes: "Novembro",
    emoji: "🥁",
    titulo: "Consciência Negra",
    tema: "Tambor de Crioula e a herança afro-maranhense",
    passos: [
      { tipo: "animacao", titulo: "Na Batida do Tambor", emProducao: "Animação refeita (a primeira saiu do ar pelo áudio)." },
      { tipo: "revistinha", titulo: "Na Batida do Tambor", atividade: "hq-tambor", caminho: "/aluno/cultura/hq/kambadinha-na-batida-do-tambor" },
      { tipo: "artigo", titulo: "O tambor de crioula", emProducao: "Artigo a escrever." },
      { tipo: "jogo", titulo: "Jogo do tambor", emProducao: "Jogo a criar (os três tambores, a punga)." },
      { tipo: "quiz", titulo: "Quiz do tambor", emProducao: "Quiz a montar a partir do artigo." },
      { tipo: "redacao", titulo: "Redação da Consciência Negra", emProducao: "Proposta a definir com a pedagoga." },
    ],
  },
  { id: "adesao", mes: "Julho", emoji: "🏛️", titulo: "Adesão do Maranhão", tema: "28 de julho: a história do estado", passos: [] },
  { id: "folclore", mes: "Agosto", emoji: "🌙", titulo: "Folclore", tema: "22 de agosto: lendas contadas como “uma versão”", passos: [] },
  { id: "saoluis", mes: "Setembro", emoji: "🏘️", titulo: "Aniversário de São Luís", tema: "8 de setembro: azulejos, sobrados e praças", passos: [] },
  { id: "crianca", mes: "Outubro", emoji: "🎈", titulo: "Semana da Criança", tema: "Brincadeiras de rua e jogos de antigamente", passos: [] },
];

export const temporadaPorId = (id: string) => TEMPORADAS.find((t) => t.id === id);

/** Pronta = todos os passos com conteúdo; em montagem = parte; em breve = nada ainda. */
export function situacaoDa(t: Temporada): "pronta" | "montagem" | "breve" {
  if (!t.passos.length) return "breve";
  return t.passos.every((p) => p.caminho) ? "pronta" : "montagem";
}

/** Temporada em destaque no portal de demonstração (a que tem a trilha mais completa e o concurso). */
export const TEMPORADA_DESTAQUE = "carnaval";
