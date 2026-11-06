/**
 * Cultura do Maranhão na área do aluno (02/11/2026): jogos, quadrinhos e
 * animações que CONTAM a cultura (o Arraial em modo festa, a história do
 * Boi, os sotaques), e não só reforçam conteúdo. Vale no servidor e no
 * navegador: aqui não há gabarito que precise ficar escondido (é brincadeira
 * de leitura; o que conta para o relatório é ter feito e quanto acertou).
 *
 * As HQs e a animação são as mesmas do Kambada Play (arquivos em
 * public/kambadaplay/…); este arquivo só acrescenta a camada didática.
 *
 * Conteúdo de protótipo: `REVISADO = false` até a coordenação pedagógica e os
 * mestres da cultura conferirem (mesma regra de `desafios.ts`).
 */
export const REVISADO = false;

export type TipoCultura = "jogo" | "hq" | "animacao" | "artigo" | "quiz";

export type PerguntaCultura = {
  pergunta: string;
  opcoes: string[];
  correta: number;
  /** Mostrada depois de responder (certo ou errado). */
  explica: string;
};

export type AtividadeCultural = {
  id: string;
  tipo: TipoCultura;
  titulo: string;
  emoji: string;
  resumo: string;
  /** Caminho dentro do portal (passar por `rotaEscola`). */
  caminho: string;
  /** Pasta da HQ ou nome do vídeo no Play (public/kambadaplay/…). */
  slug?: string;
  paginas?: number;
};

export const ATIVIDADES: AtividadeCultural[] = [
  {
    id: "arraial-festa",
    tipo: "jogo",
    titulo: "Arraial da Kambada",
    emoji: "🎉",
    resumo: "Anda pela festa de São João e conversa com o povo: cada um conta uma tradição e te dá uma fitinha.",
    caminho: "/aluno/arraial?trilha=festa",
  },
  {
    id: "jogo-auto-do-boi",
    tipo: "jogo",
    titulo: "A história do Boi",
    emoji: "🐂",
    resumo: "Põe as cenas do auto do Bumba-meu-boi na ordem e descobre quem é quem na brincadeira.",
    caminho: "/aluno/cultura/auto-do-boi",
  },
  {
    id: "jogo-sotaques",
    tipo: "jogo",
    titulo: "Sotaques do Boi",
    emoji: "🥁",
    resumo: "Monta o batalhão de cada sotaque com os instrumentos certos e escuta o toque.",
    caminho: "/aluno/cultura/sotaques",
  },
  {
    id: "hq-guaras",
    tipo: "hq",
    titulo: "A Hora dos Guarás",
    emoji: "🦩",
    resumo: "No mangue, o Kambadinha anima um guará com medo de voar.",
    caminho: "/aluno/cultura/hq/kambadinha-a-hora-dos-guaras",
    slug: "kambadinha-a-hora-dos-guaras",
    paginas: 5,
  },
  {
    id: "hq-tambor",
    tipo: "hq",
    titulo: "Na Batida do Tambor",
    emoji: "🪘",
    resumo: "O Kambadinha encontra o Cazumbá e descobre o tambor de crioula.",
    caminho: "/aluno/cultura/hq/kambadinha-na-batida-do-tambor",
    slug: "kambadinha-na-batida-do-tambor",
    paginas: 4,
  },
  {
    id: "video-guaras",
    tipo: "animacao",
    titulo: "A Hora dos Guarás (animação)",
    emoji: "🎬",
    resumo: "O filhote de guará abre as asas e o céu de São Luís fica vermelho.",
    caminho: "/aluno/cultura/video/kambadinha-a-hora-dos-guaras",
    slug: "kambadinha-a-hora-dos-guaras",
  },
  {
    id: "conto-boi",
    tipo: "animacao",
    titulo: "O Auto do Boi (cordel animado)",
    emoji: "📜",
    resumo: "Role a tela e veja a lenda do boi em xilogravura animada, verso por verso.",
    caminho: "/aluno/cultura/conto",
  },
  // No fim da lista de propósito: o histórico fictício sorteia na ordem desta lista.
  {
    id: "jogo-fofao",
    tipo: "jogo",
    titulo: "Monte o Fofão",
    emoji: "👺",
    resumo: "Temporada de Carnaval: vista o personagem mais popular do carnaval de rua de São Luís.",
    caminho: "/aluno/cultura/fofao",
  },
  {
    id: "quebra-agua",
    tipo: "jogo",
    titulo: "Quebra-cabeça do mangue",
    emoji: "🧩",
    resumo: "Temporada do Manguezal: monte a capa de “A Hora dos Guarás”.",
    caminho: "/aluno/cultura/quebra/quebra-agua",
  },
  {
    id: "quebra-saojoao",
    tipo: "jogo",
    titulo: "Quebra-cabeça do arraial",
    emoji: "🧩",
    resumo: "Temporada de São João: monte a praça do Arraial da Kambada.",
    caminho: "/aluno/cultura/quebra/quebra-saojoao",
  },
  {
    id: "quebra-tambor",
    tipo: "jogo",
    titulo: "Quebra-cabeça do tambor",
    emoji: "🧩",
    resumo: "Temporada da Consciência Negra: monte a capa de “Na Batida do Tambor”.",
    caminho: "/aluno/cultura/quebra/quebra-tambor",
  },
  {
    id: "artigo-carnaval",
    tipo: "artigo",
    titulo: "O Fofão e o carnaval de rua",
    emoji: "📰",
    resumo: "Temporada de Carnaval: quem é o Fofão, por que a máscara é feia de propósito e de onde ele veio.",
    caminho: "/aluno/temporada/carnaval/artigo",
  },
  {
    id: "quiz-carnaval",
    tipo: "quiz",
    titulo: "Quiz do Carnaval",
    emoji: "❓",
    resumo: "Temporada de Carnaval: 8 perguntas sobre o Fofão e o carnaval de rua de São Luís.",
    caminho: "/aluno/temporada/carnaval/quiz",
  },
];

// ---------------------------------------------------------------------------
// Quebra-cabeças das temporadas (imagens que já estão no Play)
// ---------------------------------------------------------------------------

export type Quebra = {
  id: string;
  titulo: string;
  imagem: string;
  largura: number;
  altura: number;
  /** Frase mostrada ao montar. */
  legenda: string;
  depois?: { rotulo: string; caminho: string };
};

/**
 * No Carnaval, o quebra-cabeça entra com a capa da revistinha "Kambadinha
 * em: O Fofão" (quando o Ricardo entregar): é só acrescentar aqui e na trilha.
 */
export const QUEBRAS: Quebra[] = [
  {
    id: "quebra-agua",
    titulo: "A Hora dos Guarás",
    imagem: "/kambadaplay/hq/kambadinha-a-hora-dos-guaras/01.webp",
    largura: 1200,
    altura: 1697,
    legenda: "O mangue é a casa do Kambadinha e o lugar onde os guarás dormem.",
    depois: { rotulo: "Ler a revistinha", caminho: "/aluno/cultura/hq/kambadinha-a-hora-dos-guaras" },
  },
  {
    id: "quebra-saojoao",
    titulo: "Arraial da Kambada",
    imagem: "/kambadaplay/images/arraial/poster.webp",
    largura: 1600,
    altura: 1000,
    legenda: "Fogueira, capela, coreto e barracas: a praça do São João.",
    depois: { rotulo: "Entrar no Arraial", caminho: "/aluno/arraial?trilha=festa" },
  },
  {
    id: "quebra-tambor",
    titulo: "Na Batida do Tambor",
    imagem: "/kambadaplay/hq/kambadinha-na-batida-do-tambor/01.webp",
    largura: 1094,
    altura: 1547,
    legenda: "No dia 18 de junho, o Kambadinha descobriu o tambor de crioula.",
    depois: { rotulo: "Ler a revistinha", caminho: "/aluno/cultura/hq/kambadinha-na-batida-do-tambor" },
  },
];

export const quebraPorId = (id: string) => QUEBRAS.find((q) => q.id === id);

export const atividadePorId = (id: unknown) => (typeof id === "string" ? ATIVIDADES.find((a) => a.id === id) : undefined);
export const atividadePorSlug = (tipo: TipoCultura, slug: string) => ATIVIDADES.find((a) => a.tipo === tipo && a.slug === slug);

export const NOME_TIPO: Record<TipoCultura, string> = { jogo: "Jogo", hq: "Quadrinhos", animacao: "Animação", artigo: "Artigo", quiz: "Quiz" };

/** Verbo do relatório do professor ("8 de 9 leram"). */
export const VERBO_TIPO: Record<TipoCultura, string> = { jogo: "jogaram", hq: "leram", animacao: "assistiram", artigo: "leram", quiz: "responderam" };

// ---------------------------------------------------------------------------
// Camada didática das HQs e da animação
// ---------------------------------------------------------------------------

export type Didatica = {
  /** "Você sabia?": fatos curtos para depois da leitura. */
  vocesabia: string[];
  glossario: { termo: string; explica: string }[];
  perguntas: PerguntaCultura[];
};

export const DIDATICA: Record<string, Didatica> = {
  "hq-guaras": {
    vocesabia: [
      "O guará nasce com as penas escuras e vai ficando vermelho com o tempo: a cor vem dos pequenos crustáceos que ele come no mangue.",
      "No fim da tarde, os guarás voltam em bando para dormir no mangue. É a revoada que deixa o céu vermelho.",
      "As raízes do mangue parecem pernas: elas seguram a árvore firme na lama, onde vivem caranguejos como o Kambadinha.",
    ],
    glossario: [
      { termo: "Mangue", explica: "Floresta à beira do mar e dos rios, com água salgada e lama. É berçário de peixes, caranguejos e aves." },
      { termo: "Guará", explica: "Ave vermelha de bico comprido e curvo, que vive nos mangues do Maranhão." },
      { termo: "Revoada", explica: "Muitas aves voando juntas, em bando." },
      { termo: "Éguas!", explica: "Jeito maranhense (e paraense) de mostrar espanto ou alegria." },
    ],
    perguntas: [
      {
        pergunta: "Por que o guará estava com medo no começo da história?",
        opcoes: ["Tinha medo de voar e cair", "Estava com fome", "Tinha perdido o caminho de casa"],
        correta: 0,
        explica: "Ele perguntou: “E se eu cair? Será que minhas penas são fracas?”",
      },
      {
        pergunta: "Que conselho o Kambadinha deu ao guará?",
        opcoes: ["Ficar quietinho no galho", "Respirar fundo, abrir as asas e deixar o vento levar", "Correr pela lama do mangue"],
        correta: 1,
        explica: "“É só respirar fundo, abrir as asas e deixar o vento te levar.”",
      },
      {
        pergunta: "Por que o Kambadinha resolveu ficar no mangue?",
        opcoes: ["Porque caranguejo não voa", "Porque estava cansado", "Porque não gosta de festa"],
        correta: 0,
        explica: "“Vou ficando por aqui, pois caranguejo não voa!” Cada bicho tem o seu jeito de viver.",
      },
      {
        pergunta: "O que acontece todo fim de tarde no mangue?",
        opcoes: ["Chove forte", "Os guarás voltam em bando para dormir", "Os caranguejos saem para o mar"],
        correta: 1,
        explica: "É a revoada: o guará voltou para dormir e o céu se encheu de vermelho.",
      },
    ],
  },
  "hq-tambor": {
    vocesabia: [
      "O tambor de crioula é uma dança de roda de origem afro-brasileira: os homens tocam e cantam, as mulheres (as coreiras) dançam.",
      "São três tambores, cada um com seu nome: o grande, o meião e o crivador.",
      "Na dança, a punga (um toque de barriga, a umbigada) é o convite para a próxima coreira entrar na roda.",
      "O tambor de crioula do Maranhão é Patrimônio Cultural Imaterial do Brasil.",
    ],
    glossario: [
      { termo: "Cazumbá", explica: "Personagem mascarado do Bumba-meu-boi, misterioso e brincalhão, muito presente nos bois da Baixada." },
      { termo: "Coreira", explica: "Mulher que dança na roda do tambor de crioula, com saia rodada e colorida." },
      { termo: "Punga", explica: "A umbigada: o toque que passa a vez na roda." },
      { termo: "Patrimônio imaterial", explica: "Tradição (festa, dança, saber) que o país reconhece e protege por ser parte da história do povo." },
    ],
    perguntas: [
      {
        pergunta: "Em que dia se passa a história?",
        opcoes: ["24 de junho", "18 de junho", "7 de setembro"],
        correta: 1,
        explica: "O Kambadinha diz: “Hoje é dia 18 de junho”, o Dia Nacional do Tambor de Crioula na HQ.",
      },
      {
        pergunta: "Como é o tambor de crioula, segundo o Cazumbá?",
        opcoes: ["Uma corrida de barcos", "As pessoas dançam em roda, cantam e tocam tambores", "Um desfile de carros alegóricos"],
        correta: 1,
        explica: "“Onde as pessoas dançam em roda, cantam e tocam tambores.”",
      },
      {
        pergunta: "O tambor de crioula é reconhecido como…",
        opcoes: ["Patrimônio imaterial do Brasil", "Esporte olímpico", "Feriado só de São Luís"],
        correta: 0,
        explica: "É Patrimônio Cultural Imaterial do Brasil: uma tradição protegida por ser parte da nossa história.",
      },
      {
        pergunta: "Para onde o Cazumbá estava indo com pressa no fim?",
        opcoes: ["Para a escola", "Para a praia", "Para o boi"],
        correta: 2,
        explica: "“Estou atrasado pro boi!” O Cazumbá é personagem do Bumba-meu-boi.",
      },
    ],
  },
  "conto-boi": {
    vocesabia: [
      "Cordel é poesia popular impressa em folhetos. Nas feiras, os folhetos ficavam pendurados num cordão: daí o nome.",
      "As ilustrações do cordel são xilogravuras: o desenho é entalhado na madeira e carimbado no papel.",
      "Os versos do cordel têm rima e ritmo, para serem lidos em voz alta, quase cantados.",
    ],
    glossario: [
      { termo: "Auto", explica: "História encenada, como um teatro de rua. O auto do boi é a história que os grupos apresentam." },
      { termo: "Toada", explica: "A música do Bumba-meu-boi, que conta e canta a brincadeira." },
      { termo: "Pajé", explica: "Curandeiro indígena. No auto, a reza e a cura ajudam o boi a renascer." },
    ],
    perguntas: [
      {
        pergunta: "No cordel, o que Catirina desejou?",
        opcoes: ["Um vestido novo", "Comer a língua do boi mais bonito", "Ir à festa de São João"],
        correta: 1,
        explica: "Grávida, ela sentiu o desejo de comer a língua do boi mais bonito do sertão.",
      },
      {
        pergunta: "Quem foi chamado para ajudar o boi caído?",
        opcoes: ["Pajé e curandeiros", "Os bombeiros", "O padre da capela"],
        correta: 0,
        explica: "“Chamaram pajé e curandeiro”: com reza, fé e tambor, o boi renasce.",
      },
      {
        pergunta: "Por que a festa do boi recomeça todo junho?",
        opcoes: ["Porque o boi renasce na história, todo ano", "Porque é férias", "Porque o boi foi vendido"],
        correta: 0,
        explica: "O boi morre e renasce: a história é contada de novo a cada São João.",
      },
    ],
  },
  "video-guaras": {
    vocesabia: [
      "O Kambadinha é um caranguejo: mora em tocas na lama do mangue e anda de lado.",
      "O guará fica vermelho por causa do que come: pequenos crustáceos cheios de pigmento.",
      "Ver a revoada dos guarás no fim da tarde é um dos passeios mais bonitos do litoral do Maranhão.",
    ],
    glossario: [
      { termo: "Filhote", explica: "Bicho recém-nascido ou bem novinho." },
      { termo: "Mangue", explica: "Floresta de água salgada e lama, onde vivem caranguejos e guarás." },
      { termo: "Desbravar", explica: "Ir conhecer lugares novos." },
    ],
    perguntas: [
      {
        pergunta: "Que bicho é o Kambadinha?",
        opcoes: ["Um peixe", "Um caranguejo", "Um sapo"],
        correta: 1,
        explica: "O Kambadinha é um caranguejo do mangue de São Luís.",
      },
      {
        pergunta: "O que o filhote de guará aprende a fazer?",
        opcoes: ["Nadar", "Voar", "Cantar"],
        correta: 1,
        explica: "Ele abre as asas pela primeira vez e vai desbravar o mundo.",
      },
      {
        pergunta: "De que cor fica o céu no fim da tarde?",
        opcoes: ["Vermelho, com a revoada dos guarás", "Verde, com as folhas", "Branco, com as nuvens"],
        correta: 0,
        explica: "Os guarás voltam em bando e o céu de São Luís se enche de vermelho.",
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Jogo: A história do Boi (pôr as cenas do auto na ordem)
// ---------------------------------------------------------------------------

export type CenaAuto = { id: string; emoji: string; titulo: string; texto: string };

/** Na ordem certa. O jogo embaralha. */
export const CENAS_AUTO: CenaAuto[] = [
  { id: "fazenda", emoji: "🐂", titulo: "O boi mais bonito", texto: "Na fazenda do Amo vive o boi mais querido de todos, bordado de fita e estrela." },
  { id: "desejo", emoji: "🤰🏾", titulo: "O desejo de Catirina", texto: "Catirina, grávida, sente um desejo forte: comer a língua do boi mais bonito." },
  { id: "roubo", emoji: "🌙", titulo: "Pai Francisco leva o boi", texto: "Para atender a esposa, Pai Francisco leva o boi escondido, e o boi morre." },
  { id: "busca", emoji: "🔎", titulo: "O Amo descobre", texto: "O Amo dá falta do boi e manda vaqueiros e caboclos procurarem Pai Francisco." },
  { id: "cura", emoji: "🌿", titulo: "O boi renasce", texto: "Com a reza do pajé, o boi se levanta e urra de novo!" },
  { id: "festa", emoji: "🎉", titulo: "A festa", texto: "Todo mundo perdoa, canta e dança em volta do boi: é o Bumba-meu-boi." },
];

export const PERSONAGENS_AUTO = [
  { nome: "Catirina", texto: "A esposa de Pai Francisco. O desejo dela começa a história." },
  { nome: "Pai Francisco", texto: "O vaqueiro que leva o boi. Também chamado de Nego Chico." },
  { nome: "Amo", texto: "O dono da fazenda. No grupo, é quem puxa as toadas e apita o batalhão." },
  { nome: "Pajé", texto: "Com a reza e a cura, faz o boi renascer." },
  { nome: "Cazumbá", texto: "Mascarado e brincalhão, assusta e diverte o público (o do quadrinho!)." },
];

export const VOCESABIA_AUTO = [
  "O Bumba-meu-boi do Maranhão é Patrimônio Cultural Imaterial da Humanidade, reconhecido pela UNESCO em 2019.",
  "O auto é a história teatral que o grupo encena; as toadas são as músicas que contam e cantam o boi.",
  "O boi morre e renasce todo ano: por isso a festa recomeça a cada junho.",
];

// ---------------------------------------------------------------------------
// Jogo: Sotaques do Boi (montar o batalhão)
// ---------------------------------------------------------------------------

export type Instrumento = { id: string; nome: string; emoji: string };

export const INSTRUMENTOS: Instrumento[] = [
  { id: "matraca", nome: "Matracas", emoji: "🪵" },
  { id: "pandeirao", nome: "Pandeirões", emoji: "🥁" },
  { id: "zabumba", nome: "Zabumba", emoji: "🪘" },
  { id: "sax", nome: "Saxofone", emoji: "🎷" },
  { id: "banjo", nome: "Banjo", emoji: "🪕" },
  { id: "pandeiro-mao", nome: "Pandeiro (tocado com as costas da mão)", emoji: "✋" },
];

export type Sotaque = {
  id: string;
  nome: string;
  onde: string;
  /** Instrumentos que identificam o sotaque (o jogador tem que marcar todos e só eles). */
  certos: string[];
  explica: string;
  /** Padrão do toque sintetizado (ver o jogo). */
  toque: "matraca" | "zabumba" | "orquestra" | "costa";
};

export const SOTAQUES: Sotaque[] = [
  {
    id: "ilha",
    nome: "Sotaque da Ilha (de matraca)",
    onde: "Ilha de São Luís",
    certos: ["matraca", "pandeirao"],
    explica: "Na Ilha, centenas de matracas batem juntas com os pandeirões. É o estalo seco que a gente ouve no arraial (e a matraca que a Kambada faz!).",
    toque: "matraca",
  },
  {
    id: "zabumba",
    nome: "Sotaque de Zabumba",
    onde: "Guimarães e região",
    certos: ["zabumba"],
    explica: "A zabumba é um tambor grande, de som grave e forte. É um dos sotaques mais antigos do Maranhão.",
    toque: "zabumba",
  },
  {
    id: "orquestra",
    nome: "Sotaque de Orquestra",
    onde: "Região do rio Munim (Rosário, Axixá, Morros)",
    certos: ["sax", "banjo"],
    explica: "Aqui o boi dança com instrumentos de sopro e de corda, como saxofone, clarinete e banjo. É o sotaque mais melodioso.",
    toque: "orquestra",
  },
  {
    id: "costa",
    nome: "Sotaque de Costa-de-mão",
    onde: "Cururupu e litoral ocidental",
    certos: ["pandeiro-mao"],
    explica: "O nome vem do jeito de tocar: os brincantes batem no pandeiro com as costas da mão.",
    toque: "costa",
  },
];

export const PERGUNTA_FINAL_SOTAQUES: PerguntaCultura = {
  pergunta: "O Cazumbá, aquele da HQ “Na Batida do Tambor”, é personagem muito presente em qual sotaque?",
  opcoes: ["Sotaque da Baixada", "Sotaque de Orquestra", "Sotaque da Ilha"],
  correta: 0,
  explica: "O Cazumbá, com máscara e bata colorida, é marca dos bois da Baixada maranhense. São cinco sotaques: Ilha (matraca), Zabumba, Orquestra, Baixada e Costa-de-mão.",
};
