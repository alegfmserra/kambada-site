import { assinar, idAleatorio, verificar } from "./seguranca";
import {
  QUIZ_PERGUNTAS_POR_PARTIDA,
  QUIZ_TEMPO_BONUS_S,
  type PerguntaPublica,
  type RespostaQuiz,
} from "./tipos";

/**
 * Éguas! Quem é quem? — banco de perguntas e regras (somente servidor).
 *
 * Por que no servidor: a resposta certa não vai para o navegador antes de a
 * pessoa responder. Com cupom em jogo, o ranking não pode depender de quem abre
 * o código da página.
 *
 * ⚠️ CONTEÚDO A REVISAR com mestres e brincantes antes de divulgar. Regras
 * editoriais do Play: nada de outra região do país, nenhuma pessoa ou grupo
 * identificável, no máximo um fato por pergunta.
 */

type Pergunta = {
  id: string;
  enunciado: string;
  /** A primeira opção é a certa; a ordem mostrada é embaralhada a cada partida. */
  opcoes: [string, string, string, string];
  explicacao: string;
};

export const BANCO: Pergunta[] = [
  {
    id: "matraca-instrumento",
    enunciado: "Qual instrumento dá nome ao sotaque do Bumba Meu Boi típico da Ilha de São Luís?",
    opcoes: ["Matraca", "Pandeirão", "Zabumba", "Saxofone"],
    explicacao:
      "O sotaque de Matraca leva esse nome por causa das duas peças de madeira que os brincantes batem uma na outra, uma em cada mão.",
  },
  {
    id: "mes-do-boi",
    enunciado: "Em qual mês o Bumba Meu Boi do Maranhão tem o auge da festa, junto com os arraiais de São João?",
    opcoes: ["Junho", "Fevereiro", "Setembro", "Dezembro"],
    explicacao: "É no ciclo junino, em junho, que os bois saem às ruas e aos arraiais de toda a Ilha.",
  },
  {
    id: "lingua-do-boi",
    enunciado: "Na lenda do boi, o que a Mãe Catirina, grávida, deseja comer?",
    opcoes: ["A língua do boi", "Um pedaço de bolo", "Um peixe frito", "Uma fruta do mato"],
    explicacao:
      "O desejo da Catirina é o que movimenta a lenda: Pai Francisco, para realizá-lo, acaba enfrentando o dono do boi.",
  },
  {
    id: "quem-ressuscita",
    enunciado: "Na lenda, quem consegue fazer o boi levantar de novo para a festa?",
    opcoes: ["O pajé, também chamado de curandeiro", "O padre", "O fazendeiro", "O cobrador do imposto"],
    explicacao:
      "Cada grupo conta a lenda do seu jeito, mas o boi que renasce é a razão da festa: ele sempre volta no ano seguinte.",
  },
  {
    id: "cazumba",
    enunciado: "Qual personagem do boi usa máscara e é conhecido por traquinagens e brincadeiras?",
    opcoes: ["Cazumbá", "Pai Francisco", "O vaqueiro", "A cantadeira"],
    explicacao:
      "O Cazumbá chega sem avisar, mexe nas coisas e sai correndo. Na Kambada, ele é o que provoca, nunca o vilão.",
  },
  {
    id: "unesco",
    enunciado: "Em 2019, a UNESCO reconheceu como Patrimônio Cultural Imaterial da Humanidade o complexo cultural do…",
    opcoes: ["Bumba Meu Boi do Maranhão", "Reggae do Maranhão", "Carnaval de Rua de São Luís", "Cacuriá"],
    explicacao: "O reconhecimento veio em 2019 e abrange as várias expressões e sotaques do Bumba Meu Boi maranhense.",
  },
  {
    id: "iphan-tambor",
    enunciado: "O Tambor de Crioula do Maranhão foi reconhecido como Patrimônio Cultural do Brasil em…",
    opcoes: ["2007", "1985", "1999", "2015"],
    explicacao: "O registro do Iphan é de 2007. É dança de roda, de origem afro-brasileira, com tambores, canto e dança.",
  },
  {
    id: "punga",
    enunciado: "No Tambor de Crioula, como se chama o gesto em que a coreira convida a outra encostando o umbigo?",
    opcoes: ["Punga", "Anarriê", "Alavantu", "Capoeira"],
    explicacao: "A punga é o convite para a próxima dançar: o gesto passa a vez na roda.",
  },
  {
    id: "tres-tambores",
    enunciado: "Quantos tambores formam o conjunto do Tambor de Crioula?",
    opcoes: ["Três", "Um", "Cinco", "Dez"],
    explicacao: "São três tambores: o grande, o meião e o crivador. Antes de tocar, os couros são esquentados no fogo.",
  },
  {
    id: "cidade-azulejos",
    enunciado: "São Luís é famosa pelas fachadas cobertas de…",
    opcoes: ["Azulejos", "Madeira pintada", "Pedras de rio", "Conchas"],
    explicacao: "Os azulejos portugueses cobrem sobrados do Centro Histórico, que é Patrimônio Mundial da UNESCO.",
  },
  {
    id: "fundacao",
    enunciado: "São Luís é a única capital brasileira fundada por…",
    opcoes: ["Franceses", "Holandeses", "Espanhóis", "Ingleses"],
    explicacao: "Os franceses chegaram em 1612 e deram à cidade o nome de Luís IX, rei da França.",
  },
  {
    id: "reggae",
    enunciado: "Qual cidade brasileira é conhecida como a “Jamaica Brasileira” por causa do reggae?",
    opcoes: ["São Luís", "Salvador", "Recife", "Belém"],
    explicacao: "O reggae é parte da identidade de São Luís, com radiolas, festas e o dia a dia da cidade.",
  },
  {
    id: "guara",
    enunciado: "O guará, ave dos manguezais do Maranhão, fica de qual cor quando adulto?",
    opcoes: ["Vermelha", "Azul", "Preta", "Amarela"],
    explicacao: "A cor vem da alimentação, principalmente de crustáceos, como os caranguejos do mangue.",
  },
  {
    id: "lencois",
    enunciado: "O que forma as lagoas azuis dos Lençóis Maranhenses?",
    opcoes: ["A água da chuva entre as dunas", "Rios que descem da serra", "A água do mar", "Poços cavados"],
    explicacao: "No período de chuvas, a água fica retida entre as dunas e forma lagoas de cores incríveis.",
  },
  {
    id: "cuxa",
    enunciado: "O arroz de cuxá, prato típico do Maranhão, leva qual folha?",
    opcoes: ["Vinagreira", "Couve", "Alface", "Hortelã"],
    explicacao: "A vinagreira dá o tom azedinho do cuxá, que também leva camarão seco e gergelim.",
  },
  {
    id: "duas-matracas",
    enunciado: "Quantas matracas cada brincante toca ao mesmo tempo?",
    opcoes: ["Duas, uma em cada mão", "Uma só", "Quatro", "Seis"],
    explicacao: "O som seco vem de uma matraca batendo na outra. Duas peças, um ritmo.",
  },
  {
    id: "serpente",
    enunciado: "Qual lenda de São Luís fala de uma serpente enorme que dorme debaixo da cidade?",
    opcoes: ["A lenda da Serpente da Ilha", "A lenda do Boto", "A lenda do Curupira", "A lenda da Mula sem Cabeça"],
    explicacao: "É uma das versões da tradição oral da ilha: a Serpente dorme, e é melhor que ela continue assim.",
  },
  {
    id: "bandeira",
    enunciado: "Na bandeira do Maranhão, a estrela branca fica sobre qual cor?",
    opcoes: ["Azul", "Verde", "Amarelo", "Vermelho"],
    explicacao: "O campo azul com a estrela branca fica ao lado das listras vermelhas, brancas e pretas.",
  },
  {
    id: "listras",
    enunciado: "Quais cores formam as listras da bandeira do Maranhão?",
    opcoes: ["Vermelho, branco e preto", "Verde e amarelo", "Azul e branco", "Roxo e dourado"],
    explicacao: "São as cores que também aparecem nas nossas placas pintadas à mão e no couro dos bois.",
  },
];

// ---------------------------------------------------------------------------

type EstadoPartida = {
  v: 1;
  id: string;
  /** Ordem das perguntas (índices no BANCO). */
  ordem: number[];
  /** Ordem embaralhada das opções de cada pergunta (índices das opções originais). */
  opcoes: number[][];
  i: number; // pergunta atual (0 a N-1)
  pontos: number;
  acertos: number;
  /** Quando a pergunta atual foi mostrada (ms, relógio do servidor). */
  tq: number;
  /** Quando a partida começou. */
  t0: number;
};

export type ProvaQuiz = {
  v: 1;
  jogo: "quiz";
  partida: string;
  pontos: number;
  acertos: number;
  duracaoMs: number;
  emitidaEm: number;
};

const PONTOS_ACERTO = 100;
const BONUS_MAX = 50;
/** Ninguém lê e responde em menos que isto: abaixo, tratamos como este tempo. */
const TEMPO_MINIMO_MS = 700;

function embaralhar<T>(lista: T[], sorteio: () => number): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(sorteio() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function aleatorio(): number {
  // Math.random basta: não é segredo, só a ordem das perguntas.
  return Math.random();
}

function publica(estado: EstadoPartida): PerguntaPublica {
  const p = BANCO[estado.ordem[estado.i]];
  return {
    indice: estado.i,
    total: estado.ordem.length,
    enunciado: p.enunciado,
    opcoes: estado.opcoes[estado.i].map((k) => p.opcoes[k]),
  };
}

export function iniciarPartida(agora = Date.now()): { estado: string; pergunta: PerguntaPublica } {
  const ordem = embaralhar(
    BANCO.map((_, i) => i),
    aleatorio,
  ).slice(0, QUIZ_PERGUNTAS_POR_PARTIDA);
  const estado: EstadoPartida = {
    v: 1,
    id: idAleatorio(),
    ordem,
    opcoes: ordem.map(() => embaralhar([0, 1, 2, 3], aleatorio)),
    i: 0,
    pontos: 0,
    acertos: 0,
    tq: agora,
    t0: agora,
  };
  return { estado: assinar(estado), pergunta: publica(estado) };
}

export function pontosDaResposta(certa: boolean, tempoMs: number): number {
  if (!certa) return 0;
  const s = Math.max(TEMPO_MINIMO_MS, tempoMs) / 1000;
  const bonus = Math.round(BONUS_MAX * Math.max(0, 1 - s / QUIZ_TEMPO_BONUS_S));
  return PONTOS_ACERTO + bonus;
}

export function responder(
  tokenEstado: unknown,
  escolha: unknown,
  agora = Date.now(),
): RespostaQuiz | { erro: string } {
  const estado = verificar<EstadoPartida>(tokenEstado);
  if (!estado || estado.v !== 1) return { erro: "Partida inválida. Comece outra." };
  if (agora - estado.t0 > 30 * 60 * 1000) return { erro: "Partida expirada. Comece outra." };
  if (typeof escolha !== "number" || !Number.isInteger(escolha) || escolha < 0 || escolha > 3) {
    return { erro: "Resposta inválida." };
  }
  if (estado.i < 0 || estado.i >= estado.ordem.length) return { erro: "Partida já terminou." };

  const p = BANCO[estado.ordem[estado.i]];
  const ordem = estado.opcoes[estado.i]; // posição mostrada -> índice original
  const certa = ordem[escolha] === 0;
  const correta = ordem.indexOf(0);
  const ganho = pontosDaResposta(certa, agora - estado.tq);

  const proximoEstado: EstadoPartida = {
    ...estado,
    i: estado.i + 1,
    pontos: estado.pontos + ganho,
    acertos: estado.acertos + (certa ? 1 : 0),
    tq: agora,
  };

  const base = {
    certa,
    correta,
    pontosDaPergunta: ganho,
    pontos: proximoEstado.pontos,
    explicacao: p.explicacao,
  };

  if (proximoEstado.i >= proximoEstado.ordem.length) {
    const prova: ProvaQuiz = {
      v: 1,
      jogo: "quiz",
      partida: estado.id,
      pontos: proximoEstado.pontos,
      acertos: proximoEstado.acertos,
      duracaoMs: agora - estado.t0,
      emitidaEm: agora,
    };
    return { ...base, acertos: proximoEstado.acertos, prova: assinar(prova) };
  }
  return { ...base, proxima: publica(proximoEstado), estado: assinar(proximoEstado) };
}
