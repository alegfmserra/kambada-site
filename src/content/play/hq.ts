/**
 * Histórias em quadrinhos do Kambada Play. As páginas ficam em
 * public/kambadaplay/hq/<slug>/NN.webp (NN com dois dígitos).
 */
export type HQ = {
  slug: string;
  titulo: string;
  resumo: string;
  autoria: string;
  paginas: number;
  /**
   * Texto de cada página, na ordem (uma entrada por página): é o que o leitor de tela lê e o que
   * aparece em "Ler o texto desta página". As falas seguem a arte ao pé da letra (só as maiúsculas
   * foram normalizadas); não corrigir aqui o que os autores escreveram.
   */
  transcricao: PaginaHQ[];
};

export type FalaHQ = {
  /** Quem fala, ou o tipo do texto: "Título", "Letreiro", "Onomatopeia". */
  quem: string;
  texto: string;
};

export type QuadroHQ = {
  /** Uma frase com o que o quadro mostra, para quem não vê o desenho. */
  cena: string;
  falas: FalaHQ[];
};

export type PaginaHQ = {
  /** Resumo curto da página (vira o `alt` da imagem). */
  alt: string;
  quadros: QuadroHQ[];
};

const K = "Kambadinha";
const G = "Guará";
const C = "Cazumbá";

export const HQS: HQ[] = [
  // A primeira da lista é a que aparece em destaque no hub.
  {
    slug: "kambadinha-a-hora-dos-guaras",
    titulo: "Kambadinha em: A Hora dos Guarás",
    resumo:
      "No mangue, o Kambadinha anima um guará com medo de voar. O amigo ganha o céu de São Luís e, no fim da tarde, descobre a revoada dos guarás.",
    autoria: "Roteiro: Alexandre Serra · Ilustrações: Ricardo Pontes",
    paginas: 5,
    transcricao: [
      {
        alt: "Capa e primeira cena: no mangue, o caranguejo Kambadinha conversa com um filhote de guará que está com medo de voar.",
        quadros: [
          {
            cena: "Sob o título da história, o caranguejo amarelo Kambadinha sorri na lama do mangue, de garras para cima; um filhote de guará, vermelho, está pousado numa raiz.",
            falas: [
              { quem: "Título", texto: "Kambadinha em: A Hora dos Guarás. Roteiro: Alexandre Serra. Ilustrações: Ricardo Pontes." },
              { quem: K, texto: "E aí, pequeno! Tomando coragem pra voar?" },
              { quem: G, texto: "Sim. Estou com medo. E se eu cair? Será que minhas penas são fracas?" },
              { quem: K, texto: "Relaxa amigo. É só respira fundo, abrir as asas e deixar o vento te levar." },
            ],
          },
        ],
      },
      {
        alt: "O guará consegue voar e parte para conhecer o mundo; o Kambadinha fica no mangue, emburrado.",
        quadros: [
          {
            cena: "O guará voa acima das árvores do mangue; lá embaixo, o Kambadinha comemora.",
            falas: [
              { quem: K, texto: "Éguas! Você conseguiu voar." },
              { quem: G, texto: "Sim! E agora vou desbravar o mundo" },
            ],
          },
          {
            cena: "De perto, o Kambadinha fica de boca aberta, espantado.",
            falas: [{ quem: K, texto: "Como assim desbravar o mundo?" }],
          },
          {
            cena: "O guará voa de asas abertas no céu azul, entre as nuvens.",
            falas: [{ quem: G, texto: "O mundo é grande demais pra dormir sempre no mesmo galho." }],
          },
          {
            cena: "Sozinho na lama do mangue, o Kambadinha fecha a cara.",
            falas: [{ quem: K, texto: "Vou ficando por aqui, pois caranguejo não voa!" }],
          },
        ],
      },
      {
        alt: "O guará voa sobre São Luís: os casarões coloridos, um barco no mar e uma festa com bandeirinhas e bumba-meu-boi.",
        quadros: [
          {
            cena: "Em três faixas lado a lado, o guará sobrevoa os casarões coloridos de São Luís, um barco de velas vermelha e amarela no mar e uma festa com bandeirinhas, o boi preto de estrelas e o Cazumbá.",
            falas: [{ quem: G, texto: "Rapaz! A vista daqui de cima é muito massa!" }],
          },
        ],
      },
      {
        alt: "O Kambadinha imagina o que o amigo está vendo; no fim da tarde, o guará encontra uma revoada de guarás diante do sol.",
        quadros: [
          {
            cena: "O Kambadinha aparece numa fresta da lama e olha para o alto, sorrindo.",
            falas: [{ quem: K, texto: "Deve ser bonito lá de cima." }],
          },
          {
            cena: "Fim de tarde: o Kambadinha na beira do mangue, com o sol grande por trás das árvores.",
            falas: [{ quem: K, texto: "O que será que ele tá descobrindo por aì?" }],
          },
          {
            cena: "No céu do entardecer, o guará voa em direção ao sol e vê um bando de guarás passando.",
            falas: [{ quem: G, texto: "Pra onde todo mundo vai?" }],
          },
          {
            cena: "A revoada de guarás cruza o sol, em três fileiras. Não há falas.",
            falas: [],
          },
        ],
      },
      {
        alt: "O guará volta ao mangue para dormir e conversa com o Kambadinha, que convida o leitor a olhar o céu no fim da tarde.",
        quadros: [
          {
            cena: "O guará pousou na beira da água, ao lado do Kambadinha; os dois conversam.",
            falas: [
              { quem: K, texto: "Pensei que tu não ia voltar." },
              { quem: G, texto: "Eu não voltei, eu só vim dormir." },
              { quem: K, texto: "Voar é bom?" },
              { quem: G, texto: "Muito. Amanhã eu vou de novo." },
            ],
          },
          {
            cena: "De perto, o Kambadinha pergunta, sorrindo.",
            falas: [{ quem: K, texto: "E de noite, vai dormir onde?" }],
          },
          {
            cena: "De perto, o guará fecha o olho e adormece entre as raízes do mangue.",
            falas: [
              { quem: G, texto: "Aqui..." },
              { quem: "Onomatopeia", texto: "ZZZZZZ!!!" },
            ],
          },
          {
            cena: "O Kambadinha sorri e fala olhando para o leitor. No canto, a palavra “fim”.",
            falas: [
              { quem: K, texto: "Todo fim de tarde eles fazem isso." },
              { quem: K, texto: "Olha pro céu hoje e depois me conta se viu." },
              { quem: "Letreiro", texto: "Fim" },
            ],
          },
        ],
      },
    ],
  },
  {
    slug: "kambadinha-na-batida-do-tambor",
    titulo: "Kambadinha em: Na Batida do Tambor",
    resumo:
      "Em São Luís, o caranguejinho Kambadinha encontra o Cazumbá e descobre o que é o tambor de crioula.",
    autoria: "Roteiro: Will Batista · Ilustrações: Ricardo Pontes",
    paginas: 4,
    transcricao: [
      {
        alt: "Capa e primeira cena: numa praça de São Luís, o caranguejo Kambadinha lembra que é dia 18 de junho.",
        quadros: [
          {
            cena: "Sob o título da história, o Kambadinha sorri de garras para cima numa praça de pedra, com casarões coloridos e postes antigos ao fundo.",
            falas: [
              { quem: "Título", texto: "Kambadinha em: Na Batida do Tambor. Roteiro: Will Batista. Ilustrações: Ricardo Pontes." },
              { quem: "Letreiro", texto: "Em São Luís..." },
              { quem: K, texto: "Éguas! Hoje é dia 18 de junho." },
            ],
          },
        ],
      },
      {
        alt: "O Kambadinha e o Cazumbá conversam sobre o tambor de crioula; um desenho mostra uma coreira dançando e um tocador de tambor.",
        quadros: [
          {
            cena: "Diante dos casarões, o Kambadinha conversa com o Cazumbá, de careta laranja, cabelo amarelo e bata vermelha de bolinhas.",
            falas: [
              { quem: K, texto: "E aí, Cazumbá tu sabia que hoje é dia nacional do tambor de crioula?" },
              { quem: C, texto: "É verdade, meu chegado! Tambor de crioula é muito massa!" },
            ],
          },
          {
            cena: "Entre os dois, um círculo mostra as silhuetas de uma coreira de saia rodada e de um tocador de tambor.",
            falas: [
              { quem: K, texto: "Tambor de criuola é uma manifestação cultural afrobrasileira típica aqui do Maranhão" },
              { quem: C, texto: "Sim! Onde as pessoas dançam em roda, cantam e tocam tambores." },
              { quem: C, texto: "E o mais legal é que o nosso tambor de crioula é reconhecido como patrimônio imaterial do Brasil." },
            ],
          },
        ],
      },
      {
        alt: "Na praça, o Kambadinha combina de ver o tambor de crioula de perto e o Cazumbá se despede, atrasado para o boi.",
        quadros: [
          {
            cena: "Na praça, sob um céu azul de nuvens grandes, o Kambadinha e o Cazumbá se despedem sorrindo, de braços abertos.",
            falas: [
              { quem: K, texto: "Rapaz, tu é sabido mesmo! Bora combinar pra qualquer dia desses a gente ver de pertinho essa dança" },
              { quem: C, texto: "Beleza! Lá na praça da Faustina. E por falar em dança, agora eu tenho que ir, pois estou atrasado pro boi. Até mais!" },
              { quem: "Letreiro", texto: "Fim" },
            ],
          },
        ],
      },
      {
        alt: "Os personagens da história, sem cenário: o caranguejo Kambadinha e o Cazumbá.",
        quadros: [
          {
            cena: "Sobre fundo branco, os dois personagens da história: o Kambadinha, caranguejo amarelo sorridente, e o Cazumbá, de bata vermelha de bolinhas e braços abertos. Não há texto.",
            falas: [],
          },
        ],
      },
    ],
  },
];

export function hqPorSlug(slug: string): HQ | undefined {
  return HQS.find((h) => h.slug === slug);
}

/** Texto da página `n` (começa em 1). */
export const textoDaPagina = (h: HQ, n: number): PaginaHQ | undefined => h.transcricao[n - 1];

export const paginaDaHQ = (h: HQ, n: number) =>
  `/kambadaplay/hq/${h.slug}/${String(n).padStart(2, "0")}.webp`;
