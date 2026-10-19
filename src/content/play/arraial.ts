export type Quiz = {
  pergunta: string;
  opcoes: string[];
  correta: number;
  acerto: string;
  erro: string;
};

export type Npc = {
  id: string;
  nome: string;
  /** Cor do nome na caixa de diálogo. */
  cor: string;
  falas: string[];
  quiz: Quiz;
  /** Botão extra mostrado depois do quiz (usado na barraca da Kambada). */
  cta?: { label: string; href: string };
};

export const npcs: Npc[] = [
  {
    id: "noivos",
    nome: "Zé e Francisca",
    cor: "#D9A441",
    falas: [
      "Bem-vindo ao nosso casamento, visitante! Hoje a gente casa aqui no arraial, do jeito que manda a tradição.",
      "No casamento junino tem noiva fugida, sogro bravo e padre apressado. É teatro, é riso, é festa!",
      "Mas me diz uma coisa, tu que anda por aí...",
    ],
    quiz: {
      pergunta: "A quadrilha junina, essa dança de pares com comandos gritados, veio de onde?",
      opcoes: ["Dos salões da França", "Do interior do Texas", "Dos castelos de Portugal"],
      correta: 0,
      acerto: "Isso! A quadrille francesa chegou nos salões do Brasil e o povo transformou ela na nossa quadrilha, com anarriê, alavantu e tudo mais. Toma tua fitinha!",
      erro: "Quase! Veio da quadrille dos salões da França. O povo brasileiro pegou a dança fina e transformou em festa de arraial. Volta depois pra tentar de novo!",
    },
  },
  {
    id: "fogueira",
    nome: "Seu Chico da Fogueira",
    cor: "#E0574F",
    falas: [
      "Chega perto, mas respeita o fogo! Essa fogueira eu acendo todo ano, desde menino.",
      "Fogueira de São João tem história antiga, sabia? Vem lá do tempo das promessas.",
    ],
    quiz: {
      pergunta: "Segundo a tradição, pra que serviu a primeira fogueira de São João?",
      opcoes: [
        "Pra espantar a friagem de junho",
        "Pra avisar o nascimento de João Batista",
        "Pra assar o milho da colheita",
      ],
      correta: 1,
      acerto: "É isso mesmo! Conta a tradição que Isabel acendeu uma fogueira pra avisar Maria que João Batista tinha nascido. Por isso todo São João tem fogueira acesa. Leva tua fitinha!",
      erro: "Boa tentativa, mas a tradição conta que a fogueira foi acesa por Isabel pra avisar Maria do nascimento de João Batista. Passa aqui depois de novo!",
    },
  },
  {
    id: "boi",
    nome: "O Boi Estrela",
    cor: "#3E8FC9",
    falas: [
      "Muuu! Eu sou o boi mais bonito desse arraial, bordado de estrela e fita.",
      "Minha história o Maranhão inteiro conta: eu morro e renasço todo ano, na toada dos brincantes.",
    ],
    quiz: {
      pergunta: "No auto do Bumba Meu Boi, o que acontece com o boi no fim da história?",
      opcoes: ["Ele foge pro mato e some", "Ele é vendido na feira", "Ele renasce, e a festa recomeça"],
      correta: 2,
      acerto: "Muuu, é isso! O boi morre e ressuscita, num ciclo de morte e renascimento que atravessa gerações de famílias maranhenses. Tua fitinha, com todo orgulho!",
      erro: "Muuu, ainda não! O bonito da história é o renascimento: o boi ressuscita e a vida da comunidade continua. Volta pra me contar direito!",
    },
  },
  {
    id: "brincante",
    nome: "Dona Ritinha",
    cor: "#3E8E5A",
    falas: [
      "Tu ouviu esse estalo seco ecoando na praça? É matraca, meu filho!",
      "Eu brinco boi de matraca desde os oito anos. Na Ilha de São Luís, é a matraca que manda no ritmo.",
    ],
    quiz: {
      pergunta: "Como se toca a matraca no sotaque da Ilha de São Luís?",
      opcoes: [
        "Batendo as duas metades de madeira, uma em cada mão",
        "Esfregando ela num reco-reco",
        "Sacudindo ela como um chocalho",
      ],
      correta: 0,
      acerto: "Aí sim! Uma metade em cada mão, batendo em par, num som seco e cadenciado que conduz o boi pelas ruas. Tu mereceu essa fitinha!",
      erro: "Ainda não é assim, não! A matraca se toca batendo as duas metades, uma em cada mão. Escuta o arraial e volta aqui!",
    },
  },
  {
    id: "barraca",
    nome: "Barraca da Kambada",
    cor: "#F5EDE0",
    falas: [
      "Ei, visitante! Aqui na barraca da Kambada a tradição vira presente.",
      "A gente faz matracas de verdade, entalhadas e pintadas à mão, do jeito que o boi merece.",
    ],
    quiz: {
      pergunta: "A Kambada é uma marca nascida em qual cantinho do Brasil?",
      opcoes: ["No sertão da Bahia", "No Maranhão, na Ilha do Amor", "No litoral do Ceará"],
      correta: 1,
      acerto: "Exato! Direto do Maranhão, celebrando o Bumba Meu Boi e a Ilha do Amor. Tua última fitinha te espera!",
      erro: "Opa, ainda não! A Kambada nasce no Maranhão, a Ilha do Amor. Dá uma volta na festa e volta aqui!",
    },
    cta: { label: "Conhecer a matraca", href: "/kambadaplay/matraca" },
  },
];

export type Lugar = {
  id: string;
  nome: string;
  /** Uma linha pro mapa da festa (lista acessível). */
  resumo: string;
  /** Texto do cartão que abre ao chegar no lugar. */
  descricao: string;
  /** Tipo do alvo: conversa com NPC, brincadeira ou lugar de contemplação. */
  tipo: "conversa" | "brincadeira" | "lugar";
  /** Chamada opcional pra outra página do site. */
  cta?: { label: string; href: string };
  /** Lugar que responde ao toque na cena mas não entra na lista do mapa (ex.: barracas de comida). */
  foraDoMapa?: boolean;
};

/**
 * Pontos do arraial em ordem de percurso (entrada -> praça -> fundo), usados
 * pelo mapa da festa (equivalente DOM dos alvos clicáveis da cena 3D) e
 * pelos cartões dos lugares sem NPC.
 */
export const lugares: Lugar[] = [
  {
    id: "fogueira",
    nome: "Fogueira",
    resumo: "O coração da praça. Seu Chico cuida do fogo.",
    descricao: "Toda festa de São João começa na fogueira acesa. Seu Chico da Fogueira conta a origem dela e testa o que você sabe.",
    tipo: "conversa",
  },
  {
    id: "barraca",
    nome: "Barraca da Kambada",
    resumo: "Matracas entalhadas e pintadas à mão.",
    descricao: "A barraca da Kambada expõe a matraca de verdade, feita no Maranhão pro Bumba Meu Boi.",
    tipo: "conversa",
    cta: { label: "Conhecer a matraca", href: "/kambadaplay/matraca" },
  },
  {
    id: "coreto",
    nome: "Coreto do forró",
    resumo: "Sanfona, zabumba e triângulo tocando a noite inteira.",
    descricao: "No coreto, o trio de forró toca sem parar: sanfona, zabumba e triângulo marcando o ritmo da quadrilha que roda na praça.",
    tipo: "lugar",
  },
  {
    id: "brincante",
    nome: "Dona Ritinha",
    resumo: "Brincante de boi de matraca desde os oito anos.",
    descricao: "Dona Ritinha explica como se toca a matraca no sotaque da Ilha de São Luís.",
    tipo: "conversa",
  },
  {
    id: "pescaria",
    nome: "Barraca de pescaria",
    resumo: "Mire, espere a onda e fisgue o peixe.",
    descricao: "Minigame de mira e timing: fisgue um peixe e ganhe o selo de Pescador do Arraial.",
    tipo: "brincadeira",
  },
  {
    id: "boi",
    nome: "O Boi Estrela",
    resumo: "O boi mais bonito do arraial, bordado de estrela e fita.",
    descricao: "O Boi Estrela conta o ciclo de morte e renascimento do Bumba Meu Boi.",
    tipo: "conversa",
  },
  {
    id: "noivos",
    nome: "Casamento na capela",
    resumo: "Zé e Francisca casam do jeito que manda a tradição.",
    descricao: "Na porta da capela, os noivos contam de onde veio a quadrilha e o casamento junino.",
    tipo: "conversa",
  },
  {
    id: "capela",
    nome: "Capela",
    resumo: "Sino, cruz e a história do boi que renasce.",
    descricao: "A capelinha branca guarda a história que a Kambada conta em cordel: o boi que morre e renasce todo ano.",
    tipo: "lugar",
    cta: { label: "Ler o conto do boi", href: "/kambadaplay/conto" },
  },
  {
    id: "canjica",
    nome: "Barraca de canjica",
    resumo: "Canjica quentinha com canela.",
    descricao: "Canjica de milho branco com leite, coco e canela, servida fumegando na cuia. Comida de São João que aquece a noite.",
    tipo: "lugar",
    foraDoMapa: true,
  },
  {
    id: "milho",
    nome: "Barraca de milho",
    resumo: "Milho assado na brasa e pamonha.",
    descricao: "Milho verde assado na brasa, pamonha e bolo de milho: a colheita de junho vira comida de festa.",
    tipo: "lugar",
    foraDoMapa: true,
  },
  {
    id: "maca",
    nome: "Barraca de maçã do amor",
    resumo: "A maçã vermelha e brilhante da festa.",
    descricao: "Maçã do amor coberta de calda vermelha e brilhante, o doce mais fotogênico do arraial.",
    tipo: "lugar",
    foraDoMapa: true,
  },
];

export const textos = {
  titulo: "Arraial da Kambada",
  instrucaoDesktop: "Use W A S D ou as setas pra andar. Chegue perto do povo da festa e converse.",
  instrucaoMobile: "Use o direcional pra andar. Chegue perto do povo da festa e converse.",
  falar: "Falar",
  avancar: "▾",
  celebracaoTitulo: "Viva São João!",
  celebracaoTexto:
    "Você desvendou a missão do arraial e agora conhece a história que cada matraca carrega. Que tal levar uma de verdade pra casa?",
  celebracaoCta: "Conhecer a matraca",
  celebracaoVoltar: "Continuar na festa",
  entrar: "Entrar na festa",
  carregaLento: "A praça está demorando mais que o normal pra carregar. Confira a conexão e tente de novo.",
  carregaErro: "Não deu pra carregar a praça em 3D agora. Tente de novo em alguns segundos.",
  tentarDeNovo: "Tentar de novo",
  entrarNota: "A praça em 3D carrega quando você entrar.",
  mapaBotao: "Mapa da festa",
  mapaTitulo: "Mapa da festa",
  mapaInstrucao: "Escolha um lugar pra ir até ele. Você também pode tocar nas barracas, no coreto e na capela.",
  mapaIr: "Ir até",
  mapaFechar: "Fechar mapa",
  lugarFechar: "Voltar pra festa",
  tipoConversa: "Conversa",
  tipoBrincadeira: "Brincadeira",
  tipoLugar: "Lugar",
};
