export type MatracaSotaque = { nome: string; descricao: string };

export const copy = {
  hero: {
    kicker: "Bumba Meu Boi do Maranhão",
    title: "A matraca que carrega o Maranhão",
    subtitle: "O som seco que conduz o boi pelas ruas da Ilha.",
  },
  manifesto: {
    linha1: "Cada miçanga guarda",
    linha2: "uma noite de São João.",
    apoio: "O suporte bordado à mão traz a estrela guia dos brincantes da Ilha.",
  },
  origem: {
    title: "A origem do Bumba Meu Boi de Matraca",
    paragrafos: [
      "O Bumba Meu Boi é a maior manifestação cultural do Maranhão: música, dança, teatro de rua e devoção, sobretudo em junho e julho. A história é sempre a do boi mais precioso da fazenda, que morre e precisa ressuscitar para a comunidade seguir.",
      "Cada região tem seu jeito de brincar: o sotaque. O de Matraca, da Ilha de São Luís, é marcado pela matraca — duas peças de madeira que o brincante bate uma na outra.",
      "Na mão de quem brinca, a matraca guarda o compasso de uma tradição centenária.",
    ],
  },
  tiposDeMatraca: {
    title: "Os sotaques da matraca",
    intro: "Cada sotaque tem seu jeito de tocar, vestir e brincar o boi.",
    sotaques: [
      {
        nome: "Sotaque de Matraca",
        descricao: "Da Ilha de São Luís. O ritmo vem do som seco das matracas — cada uma, duas peças de madeira batidas uma na outra —, que conduzem a brincadeira.",
      },
      {
        nome: "Sotaque de Zabumba",
        descricao: "Da Baixada Maranhense. O zabumba, tambor grave, sustenta o ritmo, com pandeirões e canto mais arrastado.",
      },
      {
        nome: "Sotaque de Orquestra",
        descricao: "Nascido em Pindaré-Mirim, traz sopros e cordas de orquestra popular: som mais melódico.",
      },
      {
        nome: "Sotaque de Costa de Mão",
        descricao: "Também da Baixada, com pandeirões tocados com a costa da mão, num ritmo mais lento.",
      },
    ] as MatracaSotaque[],
  },
  vitrine: {
    kicker: "Toque na peça",
    title: "Gire a matraca",
    apoio: "Arraste para girar.",
  },
  artesanato: {
    title: "A peça, o artesanato",
    body: "Peças em madeira pintadas à mão, com o suporte de miçangas e o boi nas cores da bandeira do Maranhão. Cada peça sai única.",
    detalhes: ["Pintura à mão", "Madeira maciça", "Miçangas contadas uma a uma"],
  },
  precoEntrega: {
    title: "Leve a sua",
    price: "[PREÇO A DEFINIR]",
    delivery: "[CONDIÇÕES DE ENTREGA A DEFINIR]",
    ctaLabel: "Quero a minha",
    // WhatsApp oficial da Kambada (o mesmo do site).
    whatsappUrl: "https://wa.me/5598984435295?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20quero%20uma%20matraca%20Kambada!",
  },
  footer: {
    instagramHandle: "@somos.kambada",
    instagramUrl: "https://www.instagram.com/somos.kambada/",
    assinatura: "Feito no Maranhão",
  },
} as const;
