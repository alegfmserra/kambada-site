export type CenaConto = {
  id: string;
  titulo: string;
  estrofes: string[];
  legenda?: string;
};

export const conto = {
  capa: {
    kicker: "Folheto de cordel digital",
    titulo: "O Auto do Boi",
    subtitulo: "Role a tela e leia a toada que atravessa o Maranhão.",
    colofao: "Kambada · São Luís do Maranhão · 2026",
  },
  cenas: [
    {
      id: "sertao",
      titulo: "Noite de São João",
      estrofes: [
        "Era uma noite de junho,\nfoguete rasgando o céu,\nno sertão do Maranhão\nnasceu este mesmo véu:\numa história contada\nde avô pra neto e neto pra avô.",
        "Fazenda grande e fartura,\nboiada pastando em paz,\nmas nem toda madrugada\ntraz o sossego que traz,\nquando o desejo de alguém\nmuda o rumo que a sorte faz.",
      ],
      legenda: "Ao longe, matracas ensaiam o compasso da festa.",
    },
    {
      id: "desejo",
      titulo: "O desejo de Catirina",
      estrofes: [
        "Catirina esperava um filho,\no ventre já redondo e são,\nmas veio um gosto tão forte\nque não cabia na mão:\ncomer a língua do boi\nmais bonito do sertão.",
        "Pai Francisco olhou pra ela,\nviu o brilho e viu o medo,\nnegar o desejo à esposa\nera correr grande degredo,\nmas roubar o boi do patrão\nera abrir outro enredo.",
      ],
      legenda: "A lua testemunha o dilema de Pai Francisco.",
    },
    {
      id: "boi",
      titulo: "O boi estrela",
      estrofes: [
        "Havia um boi na fazenda,\no mais querido de todos,\nbordado de fita e miçanga,\nenfeitado nos seus modos,\norgulho do fazendeiro\ne encanto dos seus rodeios.",
        "De noite, sem luz nem canto,\nPai Francisco o levou,\npelas trilhas mais caladas\no boi manso caminhou,\nsem saber que aquele passo\nseu destino selou.",
      ],
      legenda: "O boi mais precioso da fazenda segue trilha adentro.",
    },
    {
      id: "morte",
      titulo: "A morte do boi",
      estrofes: [
        "Pai Francisco tirou a faca,\ncumpriu o pedido feito,\na língua levou a Catirina,\nmatou a fome e o jeito,\nmas deixou pelo caminho\num rastro de arrependimento.",
        "O fazendeiro acordou cedo,\nsentiu falta do seu boi,\nprocurou em toda parte,\nsó achou o rastro e a dor:\no sertão se cobriu de luto,\ne Pai Francisco fugiu de pavor.",
      ],
      legenda: "O sertão emudece diante da perda.",
    },
    {
      id: "milagre",
      titulo: "O milagre da reza",
      estrofes: [
        "Chamaram pajé e curandeiro,\nvieram de toda redondeza,\ncada um trouxe seu remédio,\ncada um trouxe sua reza,\ne o povo cercou o boi caído\ncom fé, tambor e certeza.",
        "No toque seco da matraca,\nno sopro forte da oração,\no corpo do boi estremece,\nrenasce ali no chão,\ne o sertão que chorava a perda\nvê a vida voltar em canção.",
      ],
      legenda: "O compasso das matracas devolve o fôlego ao boi.",
    },
    {
      id: "festa",
      titulo: "A festa que nasce da morte",
      estrofes: [
        "O boi se levanta e dança,\nrebola no meio da rua,\nPai Francisco é perdoado,\na culpa se desfaz e flutua,\ne o que era choro de esposa\nvira festa que continua.",
        "Matraca, fogueira e bandeira,\nsanfona, zabumba e cantoria,\no povo inteiro na roda\ncelebra a boiada e a alegria,\ne todo junho renasce\nesta mesma toada e magia.",
      ],
      legenda: "O arraial inteiro brinca ao som das matracas.",
    },
  ] as CenaConto[],
  fecho: {
    titulo: "A história que você carrega",
    texto: "O boi morreu e renasceu tantas vezes quantas o Maranhão precisou contar essa história. Você segurou uma matraca de verdade nas mãos, entalhada por quem guarda essa tradição.\nLeve o som dessa festa com você.",
    ctaMatraca: "Conhecer a matraca",
    ctaArraial: "Ver o arraial",
  },
} as const;
