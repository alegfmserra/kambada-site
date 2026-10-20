/**
 * Artigos do blog Kambada.
 *
 * Escritos como demonstração editorial para esta primeira versão, no tom de
 * voz da marca. Tratam de temas culturais amplamente conhecidos do Maranhão —
 * não trazem datas, números ou nomes de pessoas, justamente para não afirmar
 * nada que precisasse de conferência. Antes de qualquer divulgação, passam
 * pela revisão do Alexandre.
 *
 * Na Fase 4 isto migra para arquivos MDX; o formato dos dados foi pensado
 * para essa migração ser direta.
 */

export type Bloco =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "destaque"; texto: string };

export type Artigo = {
  slug: string;
  titulo: string;
  resumo: string;
  categoria: string;
  data: string; // ISO
  tempoLeitura: string;
  blocos: Bloco[];
};

export const ARTIGOS: Artigo[] = [
  {
    slug: "matraca-o-instrumento-que-dita-o-ritmo",
    titulo: "A matraca: o instrumento que dita o ritmo do Boi",
    resumo:
      "Duas peças de madeira, batidas uma na outra, e um arraial inteiro no mesmo compasso. Por que a matraca é o coração do Boi — e virou o símbolo da Kambada.",
    categoria: "Tradição",
    data: "2026-08-30",
    tempoLeitura: "3 min",
    blocos: [
      {
        tipo: "paragrafo",
        texto:
          "A matraca são duas peças de madeira que o brincante bate uma na outra: um som seco, curto, que não pede licença. Uma sozinha passa despercebida. Cem juntas, no meio do arraial, e o chão treme.",
      },
      {
        tipo: "paragrafo",
        texto:
          "O Bumba Meu Boi do Maranhão tem vários sotaques — jeitos de brincar, cada um com seus instrumentos, vestimentas e andamento. O de matraca é o que quem vem de fora reconhece primeiro.",
      },
      { tipo: "subtitulo", texto: "Por que a matraca funciona" },
      {
        tipo: "paragrafo",
        texto:
          "Porque é democrática. Tambor grande exige técnica e anos de braço. A matraca você pega e bate: a criança, a avó, o turista desengonçado — que erra, alguém ri, e ele acerta na segunda. Em minutos, todo mundo está no mesmo compasso.",
      },
      {
        tipo: "destaque",
        texto: "A matraca não é o instrumento mais difícil. É o mais generoso: deixa qualquer um entrar na brincadeira.",
      },
      { tipo: "subtitulo", texto: "De brinde de arraial a marca" },
      {
        tipo: "paragrafo",
        texto:
          "A Kambada nasceu de um arraial de família, onde demos matraquinhas de lembrança. As pessoas penduraram na parede, usaram no ano seguinte, mostraram aos amigos. O brinde durou mais que a festa — e virou o que a gente mais faz: matraca pintada à mão, uma por uma.",
      },
      { tipo: "subtitulo", texto: "Como cuidar da sua" },
      {
        tipo: "lista",
        itens: [
          "Guarde em lugar seco — madeira e umidade não se dão.",
          "Limpe com pano seco. Água estufa a pintura.",
          "Ficou marcada depois do São João? Deixe. É prova de uso.",
        ],
      },
      {
        tipo: "paragrafo",
        texto: "Matraca guardada em caixa não faz barulho. E matraca sem barulho é enfeite.",
      },
    ],
  },
  {
    slug: "sao-luis-em-tres-sensacoes",
    titulo: "São Luís em três sensações: azulejos, reggae e Guaraná Jesus",
    resumo:
      "São Luís se conhece pelos sentidos: o que você vê na parede, ouve na esquina e bebe gelado num copo pequeno.",
    categoria: "Ilha do Amor",
    data: "2026-08-30",
    tempoLeitura: "3 min",
    blocos: [
      { tipo: "subtitulo", texto: "Os azulejos: a cidade que se olha de perto" },
      {
        tipo: "paragrafo",
        texto:
          "O Centro Histórico é patrimônio mundial, e boa parte disso está nas paredes: azulejos portugueses cobrindo fachadas inteiras, em padrões que se repetem e nunca exatamente iguais.",
      },
      {
        tipo: "paragrafo",
        texto:
          "E eles não estavam ali por beleza: protegem a parede da chuva e do sol. A elegância veio de brinde — bem a nossa cara.",
      },
      { tipo: "subtitulo", texto: "O reggae: por que aqui" },
      {
        tipo: "paragrafo",
        texto:
          "São Luís é a Jamaica brasileira. Aqui o reggae não é festa temática: é música de bairro, de rádio, de radiola na praça, com dança própria, agarradinha.",
      },
      {
        tipo: "destaque",
        texto: "Em quase todo lugar o reggae é estrangeiro. Em São Luís ele foi adotado, criou sotaque e virou nosso.",
      },
      { tipo: "subtitulo", texto: "O Guaraná Jesus: rosa, doce e inegociável" },
      {
        tipo: "paragrafo",
        texto:
          "É rosa, muito doce e não se parece com nenhum outro refrigerante. Quem é de fora faz careta no primeiro gole e pede o segundo dez minutos depois. Não tem substituto: ou é Jesus, ou não é.",
      },
      { tipo: "subtitulo", texto: "Os três viraram nossos" },
      {
        tipo: "paragrafo",
        texto:
          "Azulejo veio de Portugal, reggae veio da Jamaica: chegaram, ficaram, mudaram de jeito e viraram maranhenses de carteirinha. E o Jesus, ninguém troca. A gente não guarda intacto o que recebe: mexe até virar nosso.",
      },
    ],
  },
  {
    slug: "o-que-vestir-no-arraial",
    titulo: "O que vestir no arraial: guia sem erro para o São João maranhense",
    resumo:
      "Não precisa de fantasia. Precisa de roupa que aguente calor, poeira, chuva e cinco horas em pé — e que diga de onde você é.",
    categoria: "Guia",
    data: "2026-08-30",
    tempoLeitura: "3 min",
    blocos: [
      {
        tipo: "paragrafo",
        texto:
          "Roupa xadrez? Chapéu de palha? Bigode pintado? Não. O São João maranhense não é festa a fantasia — quem brinca o Boi usa vestimenta própria, e isso é outra conversa. Para quem vai assistir e dançar, a regra é simples: vista o que aguenta a noite inteira.",
      },
      { tipo: "subtitulo", texto: "As quatro coisas que importam" },
      {
        tipo: "lista",
        itens: [
          "Tecido leve. Faz calor mesmo à noite: algodão resolve; poliéster grosso vira castigo.",
          "Cor que não se entrega. Poeira, bebida derramada, esbarrão. Branco impecável é otimismo.",
          "Sapato fechado e sem salto. Chão de terra e cinco horas em pé: quem decide é o pé.",
          "Algo na cabeça. Boné ou chapéu — você agradece se a festa esticar até o sol.",
        ],
      },
      { tipo: "subtitulo", texto: "O que realmente marca" },
      {
        tipo: "paragrafo",
        texto:
          "Uma camiseta com estampa que diz de onde você é vale mais que fantasia completa — e você usa de novo em julho, em setembro, no ano que vem.",
      },
      {
        tipo: "destaque",
        texto: "Fantasia serve uma noite. Identidade serve o ano inteiro — e é o que a gente faz.",
      },
      { tipo: "subtitulo", texto: "E a matraca?" },
      {
        tipo: "paragrafo",
        texto:
          "Leve. Não é enfeite de turista, é ingresso para a brincadeira: você chega sem conhecer ninguém e sai no mesmo compasso da fila inteira. Errou a batida? Ri e continua.",
      },
    ],
  },
];


export function artigoPorSlug(slug: string): Artigo | undefined {
  return ARTIGOS.find((a) => a.slug === slug);
}

export function dataPorExtenso(iso: string): string {
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
