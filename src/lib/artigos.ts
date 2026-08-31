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
      "Duas tábuas de madeira, uma batida só e um arraial inteiro no mesmo compasso. Entenda por que a matraca é o coração do nosso Bumba Meu Boi — e como ela virou o símbolo da Kambada.",
    categoria: "Tradição",
    data: "2026-08-30",
    tempoLeitura: "4 min",
    blocos: [
      {
        tipo: "paragrafo",
        texto:
          "Se você nunca ouviu uma matraca ao vivo, é difícil explicar. É madeira batendo em madeira, um som seco, curto, que não pede licença. Uma sozinha até passa despercebida. Cem juntas, no meio de um arraial, e o chão treme.",
      },
      {
        tipo: "paragrafo",
        texto:
          "No Bumba Meu Boi do Maranhão existem vários sotaques — jeitos diferentes de brincar, cada um com seus instrumentos, suas roupas e seu andamento. O sotaque de matraca é um deles, e é o que muita gente de fora aprende a reconhecer primeiro, justamente por causa desse barulho que não deixa ninguém parado.",
      },
      { tipo: "subtitulo", texto: "Por que a matraca funciona tão bem" },
      {
        tipo: "paragrafo",
        texto:
          "Porque é democrática. Um tambor grande exige técnica, exige braço, exige anos. A matraca você pega e bate. A criança bate. A avó bate. O turista desengonçado bate — e erra, e alguém do lado ri, e ele acerta na segunda. Em poucos minutos todo mundo está no mesmo compasso sem nunca ter ensaiado junto.",
      },
      {
        tipo: "destaque",
        texto:
          "A matraca não é o instrumento mais bonito nem o mais difícil. É o mais generoso: ela deixa qualquer um entrar na brincadeira.",
      },
      { tipo: "subtitulo", texto: "De brinde de arraial a marca" },
      {
        tipo: "paragrafo",
        texto:
          "A Kambada nasceu de um arraial de família. Numa das edições, veio a ideia de dar matraquinhas de lembrança para quem aparecesse. Era só um agrado. Só que as pessoas levaram para casa, penduraram na parede, usaram no ano seguinte, mostraram para os amigos. O brinde durou mais que a festa.",
      },
      {
        tipo: "paragrafo",
        texto:
          "Foi ali que caiu a ficha: aquilo não era um souvenir, era um pedaço de identidade que cabia na mão. Hoje a matraca é o que a gente mais faz — pintada à mão, uma por uma, cada uma com a marca de quem pintou.",
      },
      { tipo: "subtitulo", texto: "Como cuidar da sua" },
      {
        tipo: "lista",
        itens: [
          "Guarde em lugar seco — madeira e umidade nunca se deram bem.",
          "Limpe com pano seco. Água encharca e estufa a pintura.",
          "Se ela ficar um pouco marcada depois do São João, deixe. É prova de que foi usada.",
        ],
      },
      {
        tipo: "paragrafo",
        texto:
          "Matraca guardada em caixa não faz barulho. E matraca que não faz barulho não é matraca — é enfeite.",
      },
    ],
  },
  {
    slug: "sao-luis-em-tres-sensacoes",
    titulo: "São Luís em três sensações: azulejo, reggae e Guaraná Jesus",
    resumo:
      "Tem cidade que se conhece pelos pontos turísticos. São Luís se conhece pelos sentidos: o que você vê na parede, o que você ouve na esquina e o que você bebe gelado num copo pequeno.",
    categoria: "Ilha do Amor",
    data: "2026-08-30",
    tempoLeitura: "5 min",
    blocos: [
      {
        tipo: "paragrafo",
        texto:
          "Todo lugar tem cartão-postal. O nosso tem, mas não é por ali que a cidade entra na memória de quem visita. São Luís entra pelos sentidos, e quase sempre por estes três.",
      },
      { tipo: "subtitulo", texto: "O azulejo: a cidade que se olha de perto" },
      {
        tipo: "paragrafo",
        texto:
          "O Centro Histórico é reconhecido como patrimônio mundial, e boa parte disso está nas paredes. Os azulejos portugueses cobrem fachadas inteiras — azul, branco, amarelo, padrões que se repetem e nunca se repetem exatamente igual.",
      },
      {
        tipo: "paragrafo",
        texto:
          "O detalhe que quase ninguém conta: eles não estavam ali por beleza. Azulejo protege a parede da chuva e do sol, que aqui não são poucos. A elegância veio de brinde. É bem a nossa cara — resolver um problema prático e sair bonito no fim.",
      },
      { tipo: "subtitulo", texto: "O reggae: por que aqui e não em outro lugar" },
      {
        tipo: "paragrafo",
        texto:
          "São Luís é chamada de Jamaica brasileira, e não é força de expressão. O reggae aqui não é gênero importado que toca em festa temática: é música de bairro, de rádio, de radiola nas praças, com dança própria, agarradinha, que ninguém precisa aprender em aula.",
      },
      {
        tipo: "destaque",
        texto:
          "Em quase todo lugar o reggae é uma referência estrangeira. Em São Luís ele foi adotado, criou sotaque e virou coisa nossa.",
      },
      { tipo: "subtitulo", texto: "O Guaraná Jesus: rosa, doce e inegociável" },
      {
        tipo: "paragrafo",
        texto:
          "É rosa. É muito doce. Tem gosto que não se parece com nenhum outro refrigerante do Brasil. Quem é de fora costuma fazer careta no primeiro gole e pedir o segundo dez minutos depois.",
      },
      {
        tipo: "paragrafo",
        texto:
          "O que interessa não é o sabor — é que ele é inegociável. Não tem versão parecida, não tem substituto, não adianta oferecer outra coisa. Ou é Jesus, ou não é.",
      },
      { tipo: "subtitulo", texto: "O que os três têm em comum" },
      {
        tipo: "paragrafo",
        texto:
          "Nenhum deles nasceu aqui. Azulejo veio de Portugal, reggae veio da Jamaica, guaraná é fruta da Amazônia. Os três chegaram de fora, ficaram, mudaram de jeito e viraram maranhenses de carteirinha.",
      },
      {
        tipo: "paragrafo",
        texto:
          "Talvez seja essa a definição mais honesta da nossa cultura: a gente não guarda o que recebe intacto. A gente mexe até virar nosso.",
      },
    ],
  },
  {
    slug: "o-que-vestir-no-arraial",
    titulo: "O que vestir no arraial: guia sem erro para o São João maranhense",
    resumo:
      "Não precisa de fantasia. Precisa de roupa que aguente calor, poeira, chuva de repente e cinco horas em pé — e que ainda deixe claro de onde você é.",
    categoria: "Guia",
    data: "2026-08-30",
    tempoLeitura: "4 min",
    blocos: [
      {
        tipo: "paragrafo",
        texto:
          "Junho chega e vem a mesma dúvida de quem nunca foi: precisa de roupa xadrez? Chapéu de palha? Bigode pintado? Não. Nada disso. O São João maranhense não é festa a fantasia — quem se fantasia é quem está brincando o Boi, e isso é outra conversa, com traje próprio e função própria.",
      },
      {
        tipo: "paragrafo",
        texto:
          "Para quem vai assistir e dançar, a regra é mais simples: vista o que aguenta a noite inteira.",
      },
      { tipo: "subtitulo", texto: "As quatro coisas que importam" },
      {
        tipo: "lista",
        itens: [
          "Tecido leve. Vai fazer calor mesmo à noite, e você vai suar. Algodão resolve; poliéster grosso vira castigo.",
          "Cor que não se entrega. Vai ter poeira, vai ter bebida derramada, vai ter alguém esbarrando. Branco impecável é otimismo.",
          "Sapato fechado e sem salto. Chão de terra, gente demais, cinco horas em pé. Não é vaidade que decide, é o pé.",
          "Algo na cabeça. Boné, chapéu, o que for. No fim da noite você vai agradecer — pelo sol do dia seguinte, se a festa esticar.",
        ],
      },
      { tipo: "subtitulo", texto: "O que realmente marca" },
      {
        tipo: "paragrafo",
        texto:
          "Roupa de arraial não precisa gritar. Uma camiseta com uma estampa que diz de onde você é vale mais que fantasia completa, porque você vai usar de novo em julho, em setembro, no ano que vem.",
      },
      {
        tipo: "destaque",
        texto:
          "Fantasia serve uma noite. Identidade serve o ano inteiro — e é o que a gente faz.",
      },
      { tipo: "subtitulo", texto: "E a matraca?" },
      {
        tipo: "paragrafo",
        texto:
          "Leve. Sério. Não é enfeite de turista, é ingresso para a brincadeira. Você chega sem conhecer ninguém e sai batendo no mesmo compasso que a fila inteira. É o jeito mais rápido de deixar de ser visitante.",
      },
      {
        tipo: "paragrafo",
        texto:
          "E se errar a batida, ri e continua. Ninguém aqui nunca foi expulso de arraial por falta de ritmo.",
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
