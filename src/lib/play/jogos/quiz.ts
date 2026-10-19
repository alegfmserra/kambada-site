import { assinar, idAleatorio, permutacaoSecreta, verificar } from "./seguranca";
import {
  QUIZ_NIVEL,
  QUIZ_PERGUNTAS_POR_PARTIDA,
  nivelValido,
  type Nivel,
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
  /** Dificuldade da pergunta: fácil só usa "facil"; médio mistura; difícil puxa as difíceis. */
  nivel: Nivel;
  enunciado: string;
  /** A primeira opção é a certa; a ordem mostrada é embaralhada a cada partida. */
  opcoes: [string, string, string, string];
  explicacao: string;
};

export const BANCO: Pergunta[] = [
  {
    id: "matraca-instrumento",
    nivel: "facil",
    enunciado: "Qual instrumento dá nome ao sotaque do Bumba Meu Boi típico da Ilha de São Luís?",
    opcoes: ["Matraca", "Pandeirão", "Zabumba", "Saxofone"],
    explicacao:
      "O sotaque de Matraca leva esse nome por causa das duas peças de madeira que os brincantes batem uma na outra, uma em cada mão.",
  },
  {
    id: "mes-do-boi",
    nivel: "facil",
    enunciado: "Em qual mês o Bumba Meu Boi do Maranhão tem o auge da festa, junto com os arraiais de São João?",
    opcoes: ["Junho", "Fevereiro", "Setembro", "Dezembro"],
    explicacao: "É no ciclo junino, em junho, que os bois saem às ruas e aos arraiais de toda a Ilha.",
  },
  {
    id: "lingua-do-boi",
    nivel: "medio",
    enunciado: "Na lenda do boi, o que a Mãe Catirina, grávida, deseja comer?",
    opcoes: ["A língua do boi", "Um pedaço de bolo", "Um peixe frito", "Uma fruta do mato"],
    explicacao:
      "O desejo da Catirina é o que movimenta a lenda: Pai Francisco, para realizá-lo, acaba enfrentando o dono do boi.",
  },
  {
    id: "quem-ressuscita",
    nivel: "medio",
    enunciado: "Na lenda, quem consegue fazer o boi levantar de novo para a festa?",
    opcoes: ["O pajé, também chamado de curandeiro", "O padre", "O fazendeiro", "O cobrador do imposto"],
    explicacao:
      "Cada grupo conta a lenda do seu jeito, mas o boi que renasce é a razão da festa: ele sempre volta no ano seguinte.",
  },
  {
    id: "cazumba",
    nivel: "facil",
    enunciado: "Qual personagem do boi usa máscara e é conhecido por traquinagens e brincadeiras?",
    opcoes: ["Cazumbá", "Pai Francisco", "O vaqueiro", "A cantadeira"],
    explicacao:
      "O Cazumbá chega sem avisar, mexe nas coisas e sai correndo. Na Kambada, ele é o que provoca, nunca o vilão.",
  },
  {
    id: "unesco",
    nivel: "dificil",
    enunciado: "Em 2019, a UNESCO reconheceu como Patrimônio Cultural Imaterial da Humanidade o complexo cultural do…",
    opcoes: ["Bumba Meu Boi do Maranhão", "Reggae do Maranhão", "Carnaval de Rua de São Luís", "Cacuriá"],
    explicacao: "O reconhecimento veio em 2019 e abrange as várias expressões e sotaques do Bumba Meu Boi maranhense.",
  },
  {
    id: "iphan-tambor",
    nivel: "dificil",
    enunciado: "O Tambor de Crioula do Maranhão foi reconhecido como Patrimônio Cultural do Brasil em…",
    opcoes: ["2007", "1985", "1999", "2015"],
    explicacao: "O registro do Iphan é de 2007. É dança de roda, de origem afro-brasileira, com tambores, canto e dança.",
  },
  {
    id: "punga",
    nivel: "dificil",
    enunciado: "No Tambor de Crioula, como se chama o gesto em que a coreira convida a outra encostando o umbigo?",
    opcoes: ["Punga", "Anarriê", "Alavantu", "Capoeira"],
    explicacao: "A punga é o convite para a próxima dançar: o gesto passa a vez na roda.",
  },
  {
    id: "tres-tambores",
    nivel: "medio",
    enunciado: "Quantos tambores formam o conjunto do Tambor de Crioula?",
    opcoes: ["Três", "Um", "Cinco", "Dez"],
    explicacao: "São três tambores: o grande, o meião e o crivador. Antes de tocar, os couros são esquentados no fogo.",
  },
  {
    id: "cidade-azulejos",
    nivel: "facil",
    enunciado: "São Luís é famosa pelas fachadas cobertas de…",
    opcoes: ["Azulejos", "Madeira pintada", "Pedras de rio", "Conchas"],
    explicacao: "Os azulejos portugueses cobrem sobrados do Centro Histórico, que é Patrimônio Mundial da UNESCO.",
  },
  {
    id: "fundacao",
    nivel: "medio",
    enunciado: "São Luís é a única capital brasileira fundada por…",
    opcoes: ["Franceses", "Holandeses", "Espanhóis", "Ingleses"],
    explicacao: "Os franceses chegaram em 1612 e deram à cidade o nome de Luís IX, rei da França.",
  },
  {
    id: "reggae",
    nivel: "facil",
    enunciado: "Qual cidade brasileira é conhecida como a “Jamaica Brasileira” por causa do reggae?",
    opcoes: ["São Luís", "Salvador", "Recife", "Belém"],
    explicacao: "O reggae é parte da identidade de São Luís, com radiolas, festas e o dia a dia da cidade.",
  },
  {
    id: "guara",
    nivel: "medio",
    enunciado: "O guará, ave dos manguezais do Maranhão, fica de qual cor quando adulto?",
    opcoes: ["Vermelha", "Azul", "Preta", "Amarela"],
    explicacao: "A cor vem da alimentação, principalmente de crustáceos, como os caranguejos do mangue.",
  },
  {
    id: "lencois",
    nivel: "facil",
    enunciado: "O que forma as lagoas azuis dos Lençóis Maranhenses?",
    opcoes: ["A água da chuva entre as dunas", "Rios que descem da serra", "A água do mar", "Poços cavados"],
    explicacao: "No período de chuvas, a água fica retida entre as dunas e forma lagoas de cores incríveis.",
  },
  {
    id: "cuxa",
    nivel: "medio",
    enunciado: "O arroz de cuxá, prato típico do Maranhão, leva qual folha?",
    opcoes: ["Vinagreira", "Couve", "Alface", "Hortelã"],
    explicacao: "A vinagreira dá o tom azedinho do cuxá, que também leva camarão seco e gergelim.",
  },
  {
    id: "duas-matracas",
    nivel: "facil",
    enunciado: "Quantas matracas cada brincante toca ao mesmo tempo?",
    opcoes: ["Duas, uma em cada mão", "Uma só", "Quatro", "Seis"],
    explicacao: "O som seco vem de uma matraca batendo na outra. Duas peças, um ritmo.",
  },
  {
    id: "serpente",
    nivel: "medio",
    enunciado: "Qual lenda de São Luís fala de uma serpente enorme que dorme debaixo da cidade?",
    opcoes: ["A lenda da Serpente da Ilha", "A lenda do Boto", "A lenda do Curupira", "A lenda da Mula sem Cabeça"],
    explicacao: "É uma das versões da tradição oral da ilha: a Serpente dorme, e é melhor que ela continue assim.",
  },
  {
    id: "bandeira",
    nivel: "facil",
    enunciado: "Na bandeira do Maranhão, a estrela branca fica sobre qual cor?",
    opcoes: ["Azul", "Verde", "Amarelo", "Vermelho"],
    explicacao: "O campo azul com a estrela branca fica ao lado das listras vermelhas, brancas e pretas.",
  },
  {
    id: "listras",
    nivel: "medio",
    enunciado: "Quais cores formam as listras da bandeira do Maranhão?",
    opcoes: ["Vermelho, branco e preto", "Verde e amarelo", "Azul e branco", "Roxo e dourado"],
    explicacao: "São as cores que também aparecem nas nossas placas pintadas à mão e no couro dos bois.",
  },
  {
    id: "catirina",
    nivel: "facil",
    enunciado: "Como se chama a mulher de Pai Francisco, que fica grávida na lenda do boi?",
    opcoes: ["Mãe Catirina","Dona Chica","Sinhá Maria","Nhá Rita"],
    explicacao: "Catirina (ou Catarina) é a personagem cujo desejo move toda a história do Bumba Meu Boi.",
  },
  {
    id: "pai-francisco",
    nivel: "facil",
    enunciado: "Quem é o vaqueiro que mata o boi para atender o desejo da esposa?",
    opcoes: ["Pai Francisco","Mestre Chico","Seu Zé do Boi","O Amo"],
    explicacao: "Pai Francisco (Nego Chico) é o vaqueiro da lenda; depois ele é perseguido e precisa trazer o boi de volta.",
  },
  {
    id: "amo-do-boi",
    nivel: "medio",
    enunciado: "No Bumba Meu Boi, como é chamado o dono da fazenda e do boi?",
    opcoes: ["Amo","Capataz","Coronel","Patrão"],
    explicacao: "O Amo é o dono do boi e quem puxa as toadas; é um dos personagens centrais do auto.",
  },
  {
    id: "toada",
    nivel: "medio",
    enunciado: "Como se chama a cantiga do Bumba Meu Boi, puxada pelo Amo e respondida pelo grupo?",
    opcoes: ["Toada","Moda de viola","Ladainha","Baião"],
    explicacao: "As toadas são as canções do boi; cada grupo compõe as suas a cada ano.",
  },
  {
    id: "sotaques",
    nivel: "dificil",
    enunciado: "Qual destes NÃO é um dos sotaques tradicionais do Bumba Meu Boi do Maranhão?",
    opcoes: ["Sotaque de Sanfona","Sotaque de Zabumba","Sotaque da Baixada","Sotaque de Orquestra"],
    explicacao: "Os sotaques mais conhecidos são Matraca (Ilha), Zabumba (Guimarães), Baixada (Pindaré), Orquestra e Costa de Mão (Cururupu).",
  },
  {
    id: "zabumba-origem",
    nivel: "dificil",
    enunciado: "O sotaque de Zabumba, considerado o mais antigo, é associado a qual município maranhense?",
    opcoes: ["Guimarães","Pindaré-Mirim","Cururupu","Caxias"],
    explicacao: "O sotaque de Zabumba tem forte raiz africana e é identificado com Guimarães.",
  },
  {
    id: "costa-de-mao",
    nivel: "dificil",
    enunciado: "No sotaque de Costa de Mão, como o pandeiro é tocado?",
    opcoes: ["Com as costas da mão","Com baqueta","Com os dois polegares","Apoiado no chão"],
    explicacao: "Daí o nome: o pandeiro pequeno é percutido com as costas da mão. É o sotaque de Cururupu.",
  },
  {
    id: "batizado",
    nivel: "medio",
    enunciado: "Que momento do ciclo do boi acontece tradicionalmente na véspera de São João?",
    opcoes: ["O batizado do boi","A morte do boi","A venda do couro","O leilão"],
    explicacao: "O boi é batizado para poder brincar; depois vêm as apresentações e, no fim do ciclo, a morte.",
  },
  {
    id: "morte-do-boi",
    nivel: "dificil",
    enunciado: "Como se chama o ritual que encerra o ciclo do Bumba Meu Boi, geralmente entre o fim de junho e setembro?",
    opcoes: ["Morte do boi","Despedida de couro","Queima do capelo","Arremate"],
    explicacao: "A morte do boi encerra a temporada do grupo; o boi renasce no ano seguinte, com o novo batizado.",
  },
  {
    id: "capelo",
    nivel: "medio",
    enunciado: "Como se chama o chapéu enfeitado de fitas e penas usado pelos brincantes do sotaque de Matraca?",
    opcoes: ["Capelo","Cocar","Boina","Barrete"],
    explicacao: "O capelo é o chapéu de fitas longas; as fitas voam quando o brincante gira.",
  },
  {
    id: "couro-bordado",
    nivel: "medio",
    enunciado: "O que é o “couro” do boi de Bumba Meu Boi?",
    opcoes: ["A roupa de veludo bordada que cobre a armação","O chão do arraial","O tambor grande","O couro de verdade do animal"],
    explicacao: "O couro é a veste bordada com miçangas e canutilhos; o bordado é um dos ofícios mais valorizados da festa.",
  },
  {
    id: "coreira",
    nivel: "medio",
    enunciado: "Como se chamam as mulheres que dançam na roda do Tambor de Crioula?",
    opcoes: ["Coreiras","Baianas","Pastoras","Cirandeiras"],
    explicacao: "As coreiras dançam de saia rodada e passam a vez com a punga.",
  },
  {
    id: "esquentar-couro",
    nivel: "dificil",
    enunciado: "Por que os tambores do Tambor de Crioula são aproximados do fogo antes de tocar?",
    opcoes: ["Para esticar o couro e afinar o som","Para espantar insetos","Por tradição religiosa apenas","Para secar a madeira molhada"],
    explicacao: "O calor estica o couro e afina o tambor; é um gesto marcante da brincadeira.",
  },
  {
    id: "sao-benedito",
    nivel: "dificil",
    enunciado: "O Tambor de Crioula é tradicionalmente oferecido em louvor a qual santo?",
    opcoes: ["São Benedito","São João","São Pedro","São Marçal"],
    explicacao: "A devoção a São Benedito acompanha o Tambor de Crioula, embora ele seja tocado o ano inteiro.",
  },
  {
    id: "sao-marcal",
    nivel: "dificil",
    enunciado: "Em 30 de junho, o encontro dos bois de Matraca na Avenida São Marçal acontece em qual bairro de São Luís?",
    opcoes: ["João Paulo","Cohab","Centro","Anil"],
    explicacao: "O encontro do dia de São Marçal, no João Paulo, reúne dezenas de bois de Matraca.",
  },
  {
    id: "patrimonio-mundial",
    nivel: "medio",
    enunciado: "Em que ano o Centro Histórico de São Luís foi declarado Patrimônio Mundial pela UNESCO?",
    opcoes: ["1997","1985","2005","1972"],
    explicacao: "O reconhecimento de 1997 destaca o conjunto de sobrados coloniais e azulejos.",
  },
];

// ---------------------------------------------------------------------------

type EstadoPartida = {
  v: 3;
  id: string;
  nivel: Nivel;
  /** Ordem das perguntas (índices no BANCO). */
  ordem: number[];
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
  nivel: Nivel;
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
    opcoes: permutacaoSecreta(estado.id, estado.i, p.opcoes.length).map((k) => p.opcoes[k]),
  };
}

/**
 * Sorteio por nível: fácil = só perguntas fáceis (completa com médias se
 * faltar); médio = mistura de tudo; difícil = as difíceis primeiro.
 */
export function sortearPerguntas(nivel: Nivel, sorteio: () => number = aleatorio): number[] {
  const idx = (n: Nivel) => BANCO.map((p, i) => (p.nivel === n ? i : -1)).filter((i) => i >= 0);
  let fila: number[];
  if (nivel === "facil") fila = [...embaralhar(idx("facil"), sorteio), ...embaralhar(idx("medio"), sorteio)];
  else if (nivel === "dificil") fila = [...embaralhar(idx("dificil"), sorteio), ...embaralhar(idx("medio"), sorteio)];
  else fila = embaralhar(BANCO.map((_, i) => i), sorteio);
  return fila.slice(0, QUIZ_PERGUNTAS_POR_PARTIDA);
}

export function iniciarPartida(
  nivelBruto: unknown,
  agora = Date.now(),
): { estado: string; pergunta: PerguntaPublica; nivel: Nivel } {
  const nivel = nivelValido(nivelBruto);
  const ordem = sortearPerguntas(nivel);
  const estado: EstadoPartida = {
    v: 3,
    id: idAleatorio(),
    nivel,
    ordem,
    i: 0,
    pontos: 0,
    acertos: 0,
    tq: agora,
    t0: agora,
  };
  return { estado: assinar(estado), pergunta: publica(estado), nivel };
}

/** Acerto: (100 + bônus de velocidade) × multiplicador do nível. Erro: 0, ou desconto no difícil. */
export function pontosDaResposta(nivel: Nivel, certa: boolean, tempoMs: number): number {
  const { tempoBonusS, multiplicador, penalidadeErro } = QUIZ_NIVEL[nivel];
  if (!certa) return penalidadeErro ? -penalidadeErro : 0;
  const s = Math.max(TEMPO_MINIMO_MS, tempoMs) / 1000;
  const bonus = Math.round(BONUS_MAX * Math.max(0, 1 - s / tempoBonusS));
  return Math.round((PONTOS_ACERTO + bonus) * multiplicador);
}

/** Nível de uma partida em andamento (sem validar a resposta). Serve ao porteiro do quiz de visitante. */
export function nivelDaPartida(tokenEstado: unknown): Nivel | null {
  const estado = verificar<EstadoPartida>(tokenEstado);
  if (!estado || estado.v !== 3) return null;
  return nivelValido(estado.nivel);
}

export function responder(
  tokenEstado: unknown,
  escolha: unknown,
  agora = Date.now(),
): RespostaQuiz | { erro: string } {
  const estado = verificar<EstadoPartida>(tokenEstado);
  if (!estado || estado.v !== 3) return { erro: "Partida inválida. Comece outra." };
  const nivel = nivelValido(estado.nivel);
  if (agora - estado.t0 > 30 * 60 * 1000) return { erro: "Partida expirada. Comece outra." };
  if (typeof escolha !== "number" || !Number.isInteger(escolha) || escolha < 0 || escolha > 3) {
    return { erro: "Resposta inválida." };
  }
  if (estado.i < 0 || estado.i >= estado.ordem.length) return { erro: "Partida já terminou." };

  const p = BANCO[estado.ordem[estado.i]];
  const ordem = permutacaoSecreta(estado.id, estado.i, p.opcoes.length); // posição mostrada -> índice original
  const certa = ordem[escolha] === 0;
  const correta = ordem.indexOf(0);
  const ganho = pontosDaResposta(nivel, certa, agora - estado.tq);

  const proximoEstado: EstadoPartida = {
    ...estado,
    i: estado.i + 1,
    pontos: Math.max(0, estado.pontos + ganho),
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
      nivel,
      pontos: proximoEstado.pontos,
      acertos: proximoEstado.acertos,
      duracaoMs: agora - estado.t0,
      emitidaEm: agora,
    };
    return { ...base, acertos: proximoEstado.acertos, prova: assinar(prova) };
  }
  return { ...base, proxima: publica(proximoEstado), estado: assinar(proximoEstado) };
}
