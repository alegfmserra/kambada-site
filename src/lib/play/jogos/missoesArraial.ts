/**
 * Missões do Arraial da Kambada — conteúdo (servidor).
 *
 * Cada missão é uma conversa encadeada: o anfitrião dá a missão, cada
 * personagem conta uma parte e indica o próximo, e cada conversa completa vira
 * uma pista. O desafio final sorteia perguntas do banco da missão — o gabarito
 * (`correta`, sempre a primeira opção aqui) nunca sai do servidor.
 *
 * Roteiro e revisão: site-novo/PLAY_arraial-missao-NN_*.md. Missão só entra no
 * rodízio com `revisado: true`, a não ser que não haja nenhuma revisada (aí a
 * mais recente roda como prévia, para o jogo não ficar vazio).
 */

export type NpcId = "noivos" | "boi" | "fogueira" | "brincante" | "barraca";

export const ORDEM_NPCS: NpcId[] = ["noivos", "boi", "fogueira", "brincante", "barraca"];

export type Conversa = {
  falas: string[];
  /** O que vai para o caderninho quando a conversa termina. */
  pista: string;
  /** Personagem que este indica (sugestão; a ordem é livre). */
  proximo?: NpcId;
};

export type PerguntaMissao = {
  enunciado: string;
  /** A primeira é a certa; o servidor embaralha antes de mostrar. */
  opcoes: [string, string, string];
  vocesabia: string;
};

export type Missao = {
  id: string;
  titulo: string;
  /** "AAAA-MM" em que a missão está ativa, ou "sempre". */
  temporadas: string[] | "sempre";
  revisado: boolean;
  /** Quem dá a missão e aplica o desafio. */
  anfitriao: NpcId;
  conversas: Record<NpcId, Conversa>;
  /** Depois do desafio, quando o anfitrião é procurado de novo. */
  falasDoDesafio: string[];
  perguntas: PerguntaMissao[];
};

export const MISSOES: Missao[] = [
  {
    id: "o-boi-que-renasce",
    titulo: "O boi que renasce",
    temporadas: "sempre",
    revisado: false,
    anfitriao: "noivos",
    conversas: {
      noivos: {
        falas: [
          "Bem-vindo ao nosso casamento, visitante! Hoje é noite de festa grande: daqui a pouco o boi vai renascer aqui no arraial.",
          "Renascer? É, renascer! Pra isso, ele precisa morrer antes. Mas por que um boi tão bonito morre? Essa história todo maranhense conhece.",
          "Vai perguntar ao próprio Boi Estrela, lá perto do curral. Ele conta melhor que ninguém.",
          "Junta as pistas e volta aqui pra gente. Quando tu estiver pronto, a gente te faz o desafio da noite.",
        ],
        pista: "Missão: descobrir por que o boi morre e como ele renasce.",
        proximo: "boi",
      },
      boi: {
        falas: [
          "Muuu! Eu sou o boi mais bonito da fazenda do amo, o dono das terras. Tão bonito que virei desejo.",
          "Catirina, mulher do vaqueiro Pai Francisco, estava grávida e cismou: queria comer a língua do boi mais bonito. A língua... a minha!",
          "Pai Francisco, com medo de o filho nascer com cara de desejo não cumprido, me levou pro mato e... muuu... foi aí que eu morri.",
          "O que aconteceu com ele depois? Pergunta ao Seu Chico da Fogueira: ele viu tudo.",
        ],
        pista: "Catirina, grávida, desejou a língua do boi. Pai Francisco matou o boi para atender o desejo.",
        proximo: "fogueira",
      },
      fogueira: {
        falas: [
          "Chega perto do fogo que eu te conto. Quando o amo deu falta do boi, ficou uma fera!",
          "Mandou os vaqueiros e os índios, os caboclos, atrás de Pai Francisco, que tinha fugido pro mato. Acharam o coitado e trouxeram de volta.",
          "Mas boi morto não volta só com bronca, né? Chamaram pajé e curadores, gente de reza e de cura. E não é que o boi levantou? Renasceu no meio da festa!",
          "Quer saber como esse renascimento se brinca no Maranhão? Vai na Dona Ritinha: ela brinca boi desde menina.",
        ],
        pista: "O amo mandou vaqueiros e índios prenderem Pai Francisco. Pajé e curadores fizeram o boi renascer, e tudo virou festa.",
        proximo: "brincante",
      },
      brincante: {
        falas: [
          "Escuta esse estalo seco! É matraca, meu filho. Aqui na Ilha de São Luís a gente brinca o sotaque de matraca, com matracas e pandeirões.",
          "Mas o Maranhão tem vários jeitos de brincar o boi, que a gente chama de sotaques: matraca, zabumba, orquestra, baixada, costa de mão. Cada um tem seu som e sua vestimenta.",
          "No sotaque da baixada aparece o Cazumbá: mascarado, de careta e chocalho, nem bicho nem gente. Ele brinca e assusta ao mesmo tempo!",
          "E os vaqueiros de fita usam o capelo, um chapéu enfeitado de fitas compridas que voam quando o brincante gira.",
          "Agora vai na barraca da Kambada: lá eles te mostram o couro do boi de pertinho.",
        ],
        pista: "O jeito de brincar o boi se chama sotaque. Na Ilha é o de matraca. O Cazumbá é da baixada. O capelo é o chapéu de fitas.",
        proximo: "barraca",
      },
      barraca: {
        falas: [
          "Ei, visitante! Olha esse bordado: o couro do boi é uma veste de veludo bordada à mão com miçangas e canutilhos. Um couro pode levar meses de trabalho!",
          "E o boi tem calendário. Na véspera de São João, dia 23 de junho, ele é batizado pra poder brincar. Depois do ciclo das festas, vem a morte do boi, a despedida, e no ano seguinte tudo recomeça.",
          "Tanta beleza que o Bumba Meu Boi do Maranhão é patrimônio cultural do Brasil e da humanidade.",
          "Pronto: tu já sabe a história toda. Volta lá em Zé e Francisca e encara o desafio!",
        ],
        pista: "O couro é bordado com miçangas e canutilhos. O boi é batizado em 23 de junho e, no fim do ciclo, tem a morte do boi. O Bumba Meu Boi do Maranhão é patrimônio do Brasil e da humanidade.",
        proximo: "noivos",
      },
    },
    falasDoDesafio: [
      "Voltou! E aí, juntou as pistas? Então senta aqui que a gente vai ver se tu aprendeu a história do boi.",
    ],
    perguntas: [
      { enunciado: "Quem desejou comer a língua do boi?", opcoes: ["Catirina", "Dona Ritinha", "Francisca"], vocesabia: "Catirina estava grávida, e o desejo dela começa toda a história do auto." },
      { enunciado: "Quem matou o boi para atender o desejo?", opcoes: ["Pai Francisco", "O amo", "O pajé"], vocesabia: "Pai Francisco era vaqueiro da fazenda e marido de Catirina." },
      { enunciado: "Quem é o amo na história do boi?", opcoes: ["O dono da fazenda e do boi", "O padre da festa", "O chefe dos índios"], vocesabia: "O amo é o fazendeiro, e é ele que manda procurar Pai Francisco." },
      { enunciado: "Quem saiu atrás de Pai Francisco?", opcoes: ["Vaqueiros e índios", "Os noivos", "Os curadores"], vocesabia: "No auto, os índios (caboclos) e os vaqueiros prendem Pai Francisco." },
      { enunciado: "Quem fez o boi renascer?", opcoes: ["Pajé e curadores", "O amo", "Catirina"], vocesabia: "Com reza e cura, o boi levanta, e a tristeza vira festa." },
      { enunciado: "Como se chamam os diferentes jeitos de brincar o boi no Maranhão?", opcoes: ["Sotaques", "Toadas", "Arraiais"], vocesabia: "Matraca, zabumba, orquestra, baixada e costa de mão são alguns sotaques." },
      { enunciado: "Qual é o sotaque da Ilha de São Luís?", opcoes: ["Matraca", "Zabumba", "Orquestra"], vocesabia: "No sotaque de matraca, o ritmo vem das matracas e dos pandeirões." },
      { enunciado: "O Cazumbá, mascarado de careta e chocalho, é típico de qual sotaque?", opcoes: ["Baixada", "Matraca", "Costa de mão"], vocesabia: "O Cazumbá brinca e assusta: nem bicho nem gente." },
      { enunciado: "Com o que é bordado o couro do boi?", opcoes: ["Miçangas e canutilhos", "Palha e cipó", "Tinta e papel"], vocesabia: "Um couro bordado pode levar meses de trabalho de artesãos e artesãs." },
      { enunciado: "Em que dia o boi é batizado?", opcoes: ["23 de junho, véspera de São João", "30 de junho", "1º de janeiro"], vocesabia: "Depois do batizado, o boi pode brincar. No fim do ciclo vem a morte do boi." },
    ],
  },
];
