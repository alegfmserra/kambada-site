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
    apoio: "O capelo bordado à mão traz a estrela guia dos brincantes da Ilha.",
  },
  origem: {
    title: "A origem do Bumba Meu Boi de Matraca",
    paragrafos: [
      "O Bumba Meu Boi é a maior manifestação cultural do Maranhão, uma festa popular que mistura música, dança, teatro de rua e devoção, celebrada com mais força nos festejos juninos de junho e julho. A história contada nos brincantes é sempre a mesma, em suas variações: o boi mais precioso da fazenda morre e precisa ressuscitar para que a vida da comunidade continue, num ciclo de morte e renascimento que atravessa gerações de famílias maranhenses.",
      "Dentro do Bumba Meu Boi, cada região do estado desenvolveu seu próprio jeito de tocar e brincar, chamado de sotaque. O sotaque de Matraca, nascido na Ilha de São Luís, é reconhecido pelo som seco e cadenciado das matracas de madeira batendo em par, uma em cada mão dos brincantes, marcando o ritmo que conduz o boi e os personagens da brincadeira pelas ruas.",
      "Na mão de quem brinca, a matraca guarda o compasso de uma tradição centenária.",
    ],
  },
  tiposDeMatraca: {
    title: "Os sotaques da matraca",
    intro: "O Bumba Meu Boi maranhense se divide em sotaques, jeitos distintos de tocar, vestir e brincar o boi, cada um com sua identidade sonora e visual.",
    sotaques: [
      {
        nome: "Sotaque de Matraca",
        descricao: "Da Ilha de São Luís. Ritmo marcado pelo som seco das matracas de madeira batendo em par, sem tambores. O instrumento que dá nome ao sotaque conduz toda a brincadeira.",
      },
      {
        nome: "Sotaque de Zabumba",
        descricao: "Da Baixada Maranhense. Marcado pelo zabumba, tambor grave que sustenta o ritmo, acompanhado de pandeirões e um canto mais arrastado.",
      },
      {
        nome: "Sotaque de Orquestra",
        descricao: "Nascido em Pindaré-Mirim, incorpora instrumentos de sopro e corda em formato de orquestra popular, som mais melódico e orquestrado.",
      },
      {
        nome: "Sotaque de Costa de Mão",
        descricao: "Também da Baixada, tocado com pandeirões percutidos com a palma da mão (a 'costa da mão'), ritmo envolvente e mais lento.",
      },
    ] as MatracaSotaque[],
  },
  vitrine: {
    kicker: "Toque na peça",
    title: "Gire a matraca",
    apoio: "Arraste para girar. Madeira maciça, entalhada para durar gerações.",
  },
  artesanato: {
    title: "A peça, o artesanato",
    body: "Essa matraca é entalhada e pintada à mão, com a estrela guia e os detalhes em miçanga que remetem ao capelo dos brincantes do Bumba Meu Boi. O boi pintado no corpo carrega as cores da bandeira do Maranhão. Cada peça sai única, feita para durar e para contar essa história pra quem nunca pisou na Ilha do Amor.",
    detalhes: ["Pintura à mão", "Madeira maciça", "Miçangas contadas uma a uma"],
  },
  precoEntrega: {
    title: "Leve a sua",
    price: "[PREÇO A DEFINIR]",
    delivery: "[CONDIÇÕES DE ENTREGA A DEFINIR]",
    ctaLabel: "Quero a minha",
    // PLACEHOLDER: número de WhatsApp fictício (55XXXXXXXXXXX). Substituir pelo número
    // real da Kambada antes de colocar o QR code nas matracas físicas.
    whatsappUrl: "https://wa.me/55XXXXXXXXXXX?text=Ol%C3%A1%2C%20vim%20pelo%20site%20e%20quero%20uma%20matraca%20Kambada!",
  },
  footer: {
    instagramHandle: "@somos.kambada",
    instagramUrl: "https://www.instagram.com/somos.kambada/",
    assinatura: "Feito no Maranhão",
  },
} as const;
