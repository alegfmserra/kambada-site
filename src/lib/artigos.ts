/**
 * Artigos do blog Kambada.
 *
 * Os três primeiros (agosto/2026) foram escritos como demonstração editorial,
 * sem datas nem nomes. Os de novembro/2026 trazem fatos datados: cada um fecha
 * com as fontes consultadas, e o que não tinha confirmação recente sai como
 * "confirme antes de ir". Fotos do Wikimedia Commons, sempre com crédito e
 * licença ao lado (CC BY/BY-SA exigem). Mais novo primeiro: a home mostra os
 * três primeiros da lista.
 *
 * Na Fase 4 isto migra para arquivos MDX; o formato dos dados foi pensado
 * para essa migração ser direta.
 */

/**
 * Foto de banco aberto (Wikimedia Commons). CC BY / BY-SA obrigam a creditar
 * autor e licença junto da imagem; domínio público fica sem `licenca`.
 */
export type Imagem = {
  src: string;
  alt: string;
  largura: number;
  altura: number;
  legenda?: string;
  credito: string;
  licenca?: { nome: string; url: string };
  fonte: string;
};

/** Link interno ("/cultura/…") abre na mesma aba; externo abre em aba nova. */
export type Link = { texto: string; href: string };

export type Bloco =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  | { tipo: "lista"; itens: string[] }
  | { tipo: "destaque"; texto: string }
  | { tipo: "imagem"; imagem: Imagem }
  | { tipo: "links"; titulo: string; itens: Link[] };

export type Artigo = {
  slug: string;
  titulo: string;
  /** Título para o Google quando o da página passa de ~60 caracteres. */
  tituloSeo?: string;
  resumo: string;
  categoria: string;
  data: string; // ISO
  tempoLeitura: string;
  capa?: Imagem;
  palavrasChave?: string[];
  /** Texto próprio no convite do Kambada Play; sem ele, vale o texto padrão. */
  chamadaPlay?: string;
  blocos: Bloco[];
};

const CC_BY_SA_4 = { nome: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/deed.pt-br" };
const CC_BY_4 = { nome: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/deed.pt-br" };

const IMG = {
  coreiras: {
    src: "/cultura/tambor-de-crioula-coreiras.webp",
    alt: "Coreiras de saias floridas, blusas brancas rendadas e colares de contas numa roda de Tambor de Crioula no Maranhão",
    largura: 1200,
    altura: 900,
    legenda: "Coreiras na roda: saia rodada, blusa rendada e colares de contas.",
    credito: "Maria Eugenia Tita",
    licenca: CC_BY_4,
    fonte: "https://commons.wikimedia.org/wiki/File:Tambor_de_Crioula_do_Maranh%C3%A3o_-_0136.jpg",
  },
  tambores: {
    src: "/cultura/tambor-de-crioula-tambores.webp",
    alt: "Coreiro tocando tambor de madeira apoiado no chão enquanto a saia estampada de uma coreira gira à frente, com um menino sentado ao lado",
    largura: 1200,
    altura: 801,
    legenda: "Tambor de Crioula no São João de São Luís: a saia gira na frente do tambor.",
    credito: "Weber Ferreira Santana",
    licenca: CC_BY_SA_4,
    fonte: "https://commons.wikimedia.org/wiki/File:Tambor_de_crioula.jpg",
  },
  casaDoTambor: {
    src: "/cultura/casa-do-tambor-de-crioula.webp",
    alt: "Fachada amarela de casarão com portas azuis e o letreiro Casa do Tambor de Crioula, na Rua da Estrela, Centro Histórico de São Luís",
    largura: 1200,
    altura: 900,
    legenda: "Casa do Tambor de Crioula, na Rua da Estrela (Praia Grande).",
    credito: "Ajmcbarreto",
    licenca: CC_BY_SA_4,
    fonte: "https://commons.wikimedia.org/wiki/File:Casa_do_Tambor_de_Crioula_-_01.jpg",
  },
  capoeiraEarle: {
    src: "/cultura/capoeira-augustus-earle-1824.webp",
    alt: "Aquarela antiga mostrando dois homens negros jogando capoeira ao ar livre, observados por outras pessoas e por um soldado",
    largura: 1169,
    altura: 766,
    legenda: "Capoeira retratada por volta de 1824, no Rio de Janeiro: um dos registros mais antigos do jogo.",
    credito: "Augustus Earle (domínio público)",
    fonte: "https://commons.wikimedia.org/wiki/File:CapoeiraEarle_02.JPG",
  },
  capoeiraMadreDeus: {
    src: "/cultura/capoeira-madre-deus-sao-luis.webp",
    alt: "Capoeiristas tocando pandeiro e berimbaus na bateria de uma roda de capoeira no bairro da Madre Deus, em São Luís",
    largura: 1200,
    altura: 900,
    legenda: "A bateria de uma roda na Madre Deus, em São Luís: berimbaus e pandeiro.",
    credito: "Anna Karenina Bittencourt",
    licenca: CC_BY_SA_4,
    fonte: "https://commons.wikimedia.org/wiki/File:Capoeira_na_Madre_Deus._S%C3%A3o_Lu%C3%ADs-_Maranh%C3%A3o_01.jpg",
  },
  casaDoMaranhao: {
    src: "/cultura/casa-do-maranhao-vila-gale.webp",
    alt: "Grande casarão neoclássico creme com janelas azuis em arco, no Centro Histórico de São Luís, sob céu azul",
    largura: 1200,
    altura: 800,
    legenda: "O casarão da antiga Casa do Maranhão, na Praia Grande, em 2018 — hoje restaurado como hotel.",
    credito: "Douglas Junior / MTur (domínio público)",
    fonte: "https://commons.wikimedia.org/wiki/File:DouglasJunior_Casa_do_Maranh%C3%A2o_S%C3%A2oLuis_MA_(26994424618).jpg",
  },
  convento: {
    src: "/cultura/convento-das-merces.webp",
    alt: "Prédio colonial do Convento das Mercês entre palmeiras, no Centro Histórico de São Luís",
    largura: 1200,
    altura: 800,
    legenda: "Convento das Mercês: a praça em frente recebe os shows da Consciência Negra.",
    credito: "Artur Oliveira Silva",
    licenca: CC_BY_SA_4,
    fonte: "https://commons.wikimedia.org/wiki/File:Convento_das_Merc%C3%AAs.jpg",
  },
} satisfies Record<string, Imagem>;

export const ARTIGOS: Artigo[] = [
  {
    slug: "tambor-de-crioula-sao-luis",
    titulo: "Tambor de Crioula: o que é, como funciona e onde ver em São Luís",
    tituloSeo: "Tambor de Crioula em São Luís: o que é e onde ver",
    resumo:
      "Patrimônio Cultural do Brasil desde 2007, o Tambor de Crioula é a roda afro-maranhense de tambor, toada e punga. Entenda como ela funciona e onde encontrá-la em São Luís neste novembro da Consciência Negra.",
    categoria: "Consciência Negra",
    data: "2026-10-29",
    tempoLeitura: "7 min",
    capa: IMG.coreiras,
    palavrasChave: [
      "tambor de crioula",
      "tambor de crioula são luís",
      "onde ver tambor de crioula",
      "punga",
      "consciência negra são luís",
      "cultura afro-maranhense",
    ],
    chamadaPlay:
      "Em novembro, o Arraial do Kambada Play ganha a missão “O tambor que chama”, e a HQ “Na Batida do Tambor” leva a roda para a criançada. Dá para provar o quiz da cultura maranhense sem cadastro.",
    blocos: [
      {
        tipo: "paragrafo",
        texto:
          "Primeiro vem o som: três tambores de madeira conversando, um grave que segura, outro que marca e um pequeno que repica sem parar. Depois vem a cor: saias rodadas, floridas, girando no meio da roda. Isso é o Tambor de Crioula, a manifestação afro-maranhense que você escuta antes de ver — e que, em novembro, mês da Consciência Negra, toma ainda mais força em São Luís.",
      },
      { tipo: "subtitulo", texto: "O que é o Tambor de Crioula" },
      {
        tipo: "paragrafo",
        texto:
          "É uma dança de roda de origem africana, criada e mantida por comunidades negras do Maranhão. Junta percussão, canto e dança, e tem forte ligação com a devoção a São Benedito: muita roda acontece para pagar promessa ao santo. Mas não tem calendário fixo — o tambor aparece no São João, no Carnaval, em aniversário, em festa de santo, onde houver motivo para celebrar.",
      },
      {
        tipo: "paragrafo",
        texto:
          "Em 2007, o Iphan registrou o Tambor de Crioula como Patrimônio Cultural do Brasil, no Livro das Formas de Expressão. O título foi revalidado em 2021. Em outras palavras: o país reconhece que essa roda é parte de quem somos, e que precisa ser protegida.",
      },
      {
        tipo: "destaque",
        texto:
          "O Tambor de Crioula não é apresentação para plateia. É encontro: quem toca, quem canta e quem dança estão brincando juntos.",
      },
      { tipo: "subtitulo", texto: "Como a roda funciona" },
      {
        tipo: "paragrafo",
        texto:
          "A roda tem dois papéis bem definidos. Os homens, chamados coreiros, tocam os tambores e puxam as toadas — versos cantados que falam de santo, de amor, de trabalho, de saudade e de provocação bem-humorada. As mulheres, as coreiras, dançam no centro, uma de cada vez ou em pequenos grupos, girando a saia.",
      },
      {
        tipo: "lista",
        itens: [
          "A parelha: são três tambores escavados em tronco e cobertos de couro — o tambor grande, o meião e o crivador. Cada um tem sua função no ritmo.",
          "A afinação: antes e durante a roda, os tambores vão para perto da fogueira. O calor estica o couro e devolve o som.",
          "A matraca: enquanto os tambores tocam, alguém bate dois pedaços de pau no corpo do tambor grande, marcando o compasso. Sim, a matraca também está aqui.",
          "As toadas: um coreiro puxa o verso e a roda responde em coro.",
        ],
      },
      { tipo: "imagem", imagem: IMG.tambores },
      { tipo: "subtitulo", texto: "A punga: o gesto que passa a vez" },
      {
        tipo: "paragrafo",
        texto:
          "A punga é o momento mais esperado. A coreira que está dançando no centro escolhe a próxima e a convida com um toque de barriga — a umbigada. Quem recebe a punga entra na roda e assume a dança. É um gesto de convite, de respeito e de alegria, nunca de disputa.",
      },
      {
        tipo: "paragrafo",
        texto:
          "A vestimenta acompanha: saia longa e rodada, de chita ou tecido estampado, blusa branca de renda ou bordado, colares de contas e, muitas vezes, um torço ou flor na cabeça. Cada grupo tem seu jeito, e é bonito perceber essas diferenças de uma roda para outra.",
      },
      { tipo: "subtitulo", texto: "Onde ver Tambor de Crioula em São Luís" },
      {
        tipo: "paragrafo",
        texto:
          "A Praia Grande, no Centro Histórico, é o endereço mais certo. Mas o tambor também mora nos bairros: Madre Deus, Liberdade, Anjo da Guarda e tantos outros têm grupos tradicionais. Os pontos abaixo são os mais conhecidos; como a programação muda de um ano para o outro, confira a agenda antes de sair de casa.",
      },
      { tipo: "imagem", imagem: IMG.casaDoTambor },
      {
        tipo: "lista",
        itens: [
          "Casa do Tambor de Crioula — Rua da Estrela, na Praia Grande. Centro de referência inaugurado em 2018, com salas de oficina, auditório e exposição. Em anos anteriores recebeu rodas semanais; vale ligar ou passar lá para saber os dias.",
          "Praça da Faustina e ruas da Praia Grande — palco tradicional de rodas ao entardecer, principalmente em datas festivas.",
          "Festival Negritude — em 20 e 21 de novembro de 2026, a Prefeitura de São Luís anunciou shows na Praça das Mercês, dentro da programação da Consciência Negra.",
          "Madre Deus — bairro de muitos grupos de cultura popular, onde rodas e cortejos aparecem ao longo do ano.",
        ],
      },
      { tipo: "subtitulo", texto: "Como chegar sem atrapalhar a roda" },
      {
        tipo: "lista",
        itens: [
          "Chegue cedo: as rodas costumam começar no fim da tarde e ganham corpo à noite.",
          "Fique na roda, não dentro dela. O centro é das coreiras.",
          "Peça licença para fotografar de perto, principalmente as coreiras mais velhas.",
          "Se for convidada para a punga, aceite com alegria — e depois passe a vez.",
          "Bata palma no ritmo. Não precisa saber dançar para cantar o coro.",
        ],
      },
      { tipo: "subtitulo", texto: "Por que o tambor importa em novembro" },
      {
        tipo: "paragrafo",
        texto:
          "O 20 de novembro, Dia Nacional de Zumbi e da Consciência Negra, é feriado nacional. Em São Luís, uma das capitais mais negras do país, ele ganha a voz dos tambores. Ver uma roda de Tambor de Crioula é ver, ao vivo, uma história de resistência que atravessou a escravidão e continua sendo passada de mãe para filha, de mestre para aprendiz.",
      },
      {
        tipo: "destaque",
        texto: "Se for a São Luís em novembro, siga o som do tambor. Ele sempre leva a algum lugar bom.",
      },
      {
        tipo: "links",
        titulo: "Leia também",
        itens: [
          { texto: "Capoeira em São Luís: história, mestres e onde aprender", href: "/cultura/capoeira-em-sao-luis" },
          { texto: "O que fazer em São Luís em novembro de 2026", href: "/cultura/o-que-fazer-em-sao-luis-em-novembro" },
          { texto: "A matraca: o instrumento que dita o ritmo do Boi", href: "/cultura/matraca-o-instrumento-que-dita-o-ritmo" },
        ],
      },
      {
        tipo: "links",
        titulo: "Fontes",
        itens: [
          { texto: "O Imparcial — Tambor de Crioula é revalidado como Patrimônio Cultural do Brasil (2021)", href: "https://oimparcial.com.br/noticias/2021/09/tambor-de-crioula-e-revalidado-como-patrimonio-cultural-do-brasil/" },
          { texto: "Revista Pós Ciências Sociais (UFMA) — Notas sobre o registro do Tambor de Crioula", href: "https://periodicoseletronicos.ufma.br/index.php/rpcsoc/article/view/820" },
          { texto: "O Imparcial — Conheça a Casa do Tambor de Crioula (2018)", href: "https://oimparcial.com.br/cultura/2018/07/conheca-a-casa-do-tambor-de-crioula-uma-das-salvaguardas-da-cultura-maranhense/" },
          { texto: "O Imparcial — Festival Negritude terá cinema nas comunidades e shows (out/2026)", href: "https://oimparcial.com.br/noticias/2026/10/festival-negritude-tera-cinema-nas-comunidades-e-shows-em-sao-luis/" },
        ],
      },
    ],
  },
  {
    slug: "capoeira-em-sao-luis",
    titulo: "Capoeira em São Luís: história, mestres e onde aprender",
    tituloSeo: "Capoeira em São Luís: história e onde aprender",
    resumo:
      "Jogo, luta e dança nascidos da resistência negra, a capoeira tem uma história própria no Maranhão. Conheça os mestres que fizeram a capoeira da Ilha, os estilos e como encontrar uma roda ou uma escola em São Luís.",
    categoria: "Consciência Negra",
    data: "2026-10-29",
    tempoLeitura: "6 min",
    capa: IMG.capoeiraMadreDeus,
    palavrasChave: [
      "capoeira são luís",
      "capoeira maranhão",
      "onde aprender capoeira em são luís",
      "capoeira angola",
      "mestre sapo",
      "mestre patinho",
    ],
    blocos: [
      {
        tipo: "paragrafo",
        texto:
          "O berimbau dá o primeiro toque e a roda se fecha. Dois jogadores se agacham ao pé do instrumento, apertam as mãos e entram no jogo — que é luta, mas parece dança; que é dança, mas exige mandinga. A capoeira é uma das maiores invenções do povo negro no Brasil, e São Luís tem um capítulo próprio nessa história.",
      },
      { tipo: "subtitulo", texto: "De resistência proibida a patrimônio da humanidade" },
      { tipo: "imagem", imagem: IMG.capoeiraEarle },
      {
        tipo: "paragrafo",
        texto:
          "A capoeira nasceu entre africanos escravizados e seus descendentes no Brasil. Com cara de brincadeira, era treino de corpo e de liberdade. Por isso foi perseguida: o Código Penal de 1890 chegou a tratar a capoeiragem como crime. Ela sobreviveu nas ruas, nos portos e nos quintais, ensinada de boca a ouvido pelos mestres.",
      },
      {
        tipo: "paragrafo",
        texto:
          "A virada veio com o reconhecimento. Em 2008, o Iphan registrou a Roda de Capoeira e o Ofício dos Mestres de Capoeira como Patrimônio Cultural do Brasil. Em 2014, a Unesco declarou a Roda de Capoeira Patrimônio Cultural Imaterial da Humanidade.",
      },
      {
        tipo: "destaque",
        texto: "O que um dia foi caso de polícia hoje é ensinado nas escolas. Essa é a história que a capoeira conta.",
      },
      { tipo: "subtitulo", texto: "A capoeira no Maranhão" },
      {
        tipo: "paragrafo",
        texto:
          "Um nome é incontornável: Mestre Sapo, Anselmo Barnabé Rodrigues. Ele chegou a São Luís em 1966, ainda jovem, numa visita de capoeiristas baianos, e ficou. Tornou-se a principal referência da capoeira maranhense e formou gerações de alunos — muitos viraram mestres.",
      },
      {
        tipo: "paragrafo",
        texto:
          "Um desses alunos foi Mestre Patinho, Antônio José da Conceição Ramos (1953–2017), lembrado como o capoeirista de Angola mais antigo de São Luís. Ensinava no Centro Histórico, na subida da Igreja de São Pantaleão, e deixou seu método registrado em DVD e em pesquisa da UFMA. A trajetória dele mostra uma coisa bonita da capoeira: o mestre passa, a roda continua.",
      },
      { tipo: "subtitulo", texto: "Angola, Regional e o jogo de dentro da roda" },
      {
        tipo: "lista",
        itens: [
          "Capoeira Angola: jogo mais próximo do chão, cadenciado, com muita malícia e ritual. Valoriza a tradição e a musicalidade.",
          "Capoeira Regional: mais rápida e de golpes mais altos, com sequências de ensino próprias.",
          "Contemporânea: muitos grupos misturam as duas escolas. Na dúvida, pergunte ao professor qual é a linha do grupo.",
        ],
      },
      {
        tipo: "paragrafo",
        texto:
          "Quem manda na roda é a bateria: berimbaus (gunga, médio e viola), pandeiro, atabaque, agogô e reco-reco. O toque do berimbau diz o jogo — mais lento, mais rápido, mais amarrado. E as cantigas contam a história dos mestres, das lutas e da própria roda.",
      },
      { tipo: "subtitulo", texto: "Onde ver e onde aprender capoeira em São Luís" },
      {
        tipo: "paragrafo",
        texto:
          "São Luís tem dezenas de grupos. Em outubro de 2026, a Prefeitura começou a levar a capoeira para 97 escolas municipais no projeto Patrimônio nas Escolas, com cerca de 40 grupos participando. Ou seja: tem capoeira em praticamente todo canto da Ilha. Para começar:",
      },
      { tipo: "imagem", imagem: IMG.capoeiraMadreDeus },
      {
        tipo: "lista",
        itens: [
          "Centro Histórico: a Praia Grande e a Rua da Estrela concentram coletivos e rodas abertas. Escolas como a Mandingueiros do Amanhã aparecem por ali — confirme os horários pelas redes do grupo.",
          "Madre Deus: bairro de cultura popular, onde rodas acontecem com frequência, principalmente em datas comemorativas.",
          "Perto de casa: pergunte na escola, no centro comunitário ou na associação do bairro. É comum o grupo treinar à noite em quadras.",
          "Novembro: na semana da Consciência Negra, rodas abertas e apresentações costumam entrar na programação cultural da cidade.",
        ],
      },
      { tipo: "subtitulo", texto: "Primeira aula: o que levar" },
      {
        tipo: "lista",
        itens: [
          "Roupa confortável e que estique. Muitos grupos usam calça branca (abadá), mas na primeira aula ninguém cobra.",
          "Pés descalços — a capoeira se joga sem sapato.",
          "Água e disposição. A ginga cansa mais do que parece.",
          "Respeito ao mestre e à roda: chegue no horário, cumprimente e observe antes de entrar.",
        ],
      },
      {
        tipo: "destaque",
        texto: "Na capoeira ninguém começa sabendo. Começa gingando — e erra rindo, como na matraca.",
      },
      {
        tipo: "links",
        titulo: "Leia também",
        itens: [
          { texto: "Tambor de Crioula: o que é, como funciona e onde ver em São Luís", href: "/cultura/tambor-de-crioula-sao-luis" },
          { texto: "O que fazer em São Luís em novembro de 2026", href: "/cultura/o-que-fazer-em-sao-luis-em-novembro" },
        ],
      },
      {
        tipo: "links",
        titulo: "Fontes",
        itens: [
          { texto: "Agência Brasil — Capoeira é levada a escolas de São Luís (out/2026)", href: "https://agenciabrasil.ebc.com.br/radioagencia-nacional/educacao/audio/2026-10/patrimonio-cultural-do-brasil-capoeira-e-levada-escolas-de-sao-luis" },
          { texto: "Iphan — Pesquisa e Mapeamento da Capoeira no Maranhão", href: "https://bcr.iphan.gov.br/acoes-de-salvaguarda/pesquisa-e-mapeamento-da-capoeira-no-maranhao-mesorregiao-norte-maranhense/" },
          { texto: "Revista Recorde (UFRJ) — artigo sobre Mestre Sapo e a capoeira em São Luís", href: "https://revistas.ufrj.br/index.php/Recorde/article/view/748" },
          { texto: "O Imparcial — Morre Mestre Patinho aos 64 anos (2017)", href: "https://oimparcial.com.br/noticias/2017/06/morre-mestre-patinho-aos-64-anos/" },
        ],
      },
    ],
  },
  {
    slug: "vila-gale-opera-sao-luis-centro-historico",
    titulo: "Vila Galé chega a São Luís: o hotel da ópera que acordou um casarão da Praia Grande",
    tituloSeo: "Vila Galé Ópera: o hotel no Centro de São Luís",
    resumo:
      "O Vila Galé Collection Ópera São Luís foi inaugurado em 27 de outubro de 2026 num casarão do século XIX restaurado, na Praia Grande. O que tem lá, o que vem depois e o que isso significa para o Centro Histórico.",
    categoria: "Ilha do Amor",
    data: "2026-10-29",
    tempoLeitura: "5 min",
    capa: IMG.casaDoMaranhao,
    palavrasChave: [
      "vila galé são luís",
      "vila galé ópera são luís",
      "hotel centro histórico são luís",
      "casa do maranhão",
      "praia grande são luís",
      "voo lisboa são luís",
    ],
    blocos: [
      {
        tipo: "paragrafo",
        texto:
          "Durante anos, quem passava pela Praia Grande via o casarão da antiga Casa do Maranhão de janelas fechadas. Agora ele tem luz acesa, hóspede na varanda e música lá dentro: em 27 de outubro de 2026, a rede portuguesa Vila Galé inaugurou oficialmente o Vila Galé Collection Ópera São Luís, o primeiro hotel do grupo no Maranhão.",
      },
      { tipo: "subtitulo", texto: "O que é o Vila Galé Ópera" },
      {
        tipo: "lista",
        itens: [
          "Onde: num prédio do século XIX restaurado, a antiga Casa do Maranhão, na Praia Grande, Centro Histórico.",
          "Tamanho: 43 quartos — hotel pequeno, de charme, da linha Collection da rede.",
          "Tema: a ópera e as artes cênicas inspiram a decoração e a identidade do hotel.",
          "Estrutura: bar, piscina, espaço para eventos e dois restaurantes, o Versátil e o Inevitável.",
          "Abertura: recebe hóspedes desde 1º de outubro; a inauguração oficial foi em 27 de outubro de 2026.",
        ],
      },
      {
        tipo: "paragrafo",
        texto:
          "Na festa de inauguração, quem abriu a noite foi a cultura da Ilha: tambor de crioula, cacuriá e reggae. Um hotel português que se apresenta ao som do tambor — difícil pensar em recado mais maranhense.",
      },
      { tipo: "subtitulo", texto: "Não é só um hotel: são três casarões" },
      {
        tipo: "paragrafo",
        texto:
          "O Ópera é a primeira etapa de um investimento anunciado de R$ 100 milhões no Centro Histórico, que prevê dois hotéis, cinco restaurantes e o restauro de três prédios históricos.",
      },
      {
        tipo: "lista",
        itens: [
          "Vila Galé Collection Ópera São Luís — aberto em outubro de 2026.",
          "Vila Galé Collection Poesia São Luís — no antigo prédio da Defensoria Pública, com abertura parcial prevista para dezembro de 2026.",
          "Um terceiro prédio já abriga os restaurantes Massa Fina e Cervejaria Portuguesa.",
        ],
      },
      {
        tipo: "destaque",
        texto: "Casarão fechado se perde com a chuva e o tempo. Casarão aberto, com gente dentro, fica de pé.",
      },
      { tipo: "subtitulo", texto: "Lisboa–São Luís no mesmo pacote" },
      {
        tipo: "paragrafo",
        texto:
          "A inauguração foi casada com outra estreia: o voo direto da TAP entre Lisboa e São Luís, primeira rota internacional regular da capital, anunciada com dois voos por semana a partir do fim de outubro de 2026 e um terceiro previsto para março de 2027. Turista europeu desembarcando na Ilha e dormindo num casarão do Centro: é a Praia Grande voltando ao mapa.",
      },
      { tipo: "subtitulo", texto: "O que isso muda para quem é daqui" },
      {
        tipo: "paragrafo",
        texto:
          "Mais gente circulando à noite, mais casarão restaurado, mais procura por guia, por restaurante, por artesanato e por cultura popular. A pergunta que fica é como fazer esse movimento chegar também a quem mantém a cultura viva: os grupos de tambor, os mestres, os artesãos, os pequenos negócios do Centro. Hotel que traz turista é bom; turista que conhece o tambor, a matraca e o reggae de verdade é melhor ainda.",
      },
      { tipo: "subtitulo", texto: "Vai visitar? Monte o roteiro pela Praia Grande" },
      {
        tipo: "lista",
        itens: [
          "Caminhe pela Rua da Estrela e pela Rua do Giz, olhando os azulejos de perto.",
          "Passe na Casa do Tambor de Crioula e pergunte pela próxima roda.",
          "Domingo de manhã, procure a Feirinha São Luís, na Praça Benedito Leite.",
          "Termine no Cais da Praia Grande, vendo o fim de tarde sobre o rio.",
          "Restaurantes e bar do hotel: confirme direto com o Vila Galé se atendem quem não está hospedado.",
        ],
      },
      {
        tipo: "links",
        titulo: "Leia também",
        itens: [
          { texto: "O que fazer em São Luís em novembro de 2026", href: "/cultura/o-que-fazer-em-sao-luis-em-novembro" },
          { texto: "São Luís em três sensações: azulejos, reggae e Guaraná Jesus", href: "/cultura/sao-luis-em-tres-sensacoes" },
          { texto: "Tambor de Crioula: o que é, como funciona e onde ver em São Luís", href: "/cultura/tambor-de-crioula-sao-luis" },
        ],
      },
      {
        tipo: "links",
        titulo: "Fontes",
        itens: [
          { texto: "O Imparcial — Vila Galé inaugurou nessa terça-feira (27) no Centro Histórico (out/2026)", href: "https://oimparcial.com.br/noticias/2026/10/vila-gale-inaugura-nessa-terca-feira-27-no-centro-historico-de-sao-luis/" },
          { texto: "Turismo & Eventos — Vila Galé estreia em São Luís com hotel inspirado na ópera", href: "https://jornalturismoeeventos.com.br/vila-gale-collection-opera-sao-luis-estreia-maranhao/" },
          { texto: "Movimento Econômico — São Luís estreia 1ª rota internacional com voo da TAP e abertura do Vila Galé", href: "https://movimentoeconomico.com.br/estados/maranhao-estados/2026/10/26/sao-luis-estreia-1a-rota-internacional-com-voo-da-tap-e-abertura-do-vila-gale/" },
          { texto: "Movimento Econômico — Vila Galé chega ao Centro de São Luís com R$ 100 mi", href: "https://movimentoeconomico.com.br/economia/turismo/2026/08/02/vila-gale-chega-ao-centro-de-sao-luis-com-r-100-mi-em-2-hoteis-e-5-restaurantes/" },
        ],
      },
    ],
  },
  {
    slug: "o-que-fazer-em-sao-luis-em-novembro",
    titulo: "O que fazer em São Luís em novembro de 2026: tambor, feriadão e Centro Histórico",
    tituloSeo: "O que fazer em São Luís em novembro de 2026",
    resumo:
      "Dois feriadões, o Festival Negritude, rodas de Tambor de Crioula, capoeira e um hotel novo na Praia Grande. Um roteiro para aproveitar São Luís em novembro, mês da Consciência Negra.",
    categoria: "Guia",
    data: "2026-10-29",
    tempoLeitura: "5 min",
    capa: IMG.convento,
    palavrasChave: [
      "o que fazer em são luís",
      "são luís novembro 2026",
      "festival negritude são luís",
      "consciência negra são luís",
      "feriado 20 de novembro",
      "roteiro centro histórico são luís",
    ],
    blocos: [
      {
        tipo: "paragrafo",
        texto:
          "Novembro em São Luís é mês de sol firme, de quase nenhuma chuva e de tambor tocando mais alto. É o mês da Consciência Negra, e a Ilha tem muito a dizer sobre isso. Juntamos o que já está anunciado e o que vale a pena fazer em qualquer semana do mês.",
      },
      { tipo: "subtitulo", texto: "Os dois feriadões" },
      {
        tipo: "lista",
        itens: [
          "Finados — segunda-feira, 2 de novembro: fim de semana de três dias logo no começo do mês.",
          "Consciência Negra — sexta-feira, 20 de novembro: feriado nacional e o fim de semana mais cheio de programação cultural.",
        ],
      },
      { tipo: "subtitulo", texto: "Festival Negritude 2026" },
      {
        tipo: "paragrafo",
        texto:
          "A Prefeitura de São Luís anunciou a 5ª edição do Festival Negritude, dedicado à cultura e à identidade negra. A programação divulgada até agora:",
      },
      {
        tipo: "lista",
        itens: [
          "Cinema na Rua — sessões nos bairros, sempre às 17h, até 13 de novembro (Fátima, Vila Embratel, Jaracati, Alemanha e outros).",
          "Shows na Praça das Mercês — 20 e 21 de novembro, com Samba de Terreiro e BaianaSystem entre as atrações anunciadas.",
          "Exposições, concurso de redação e apresentações culturais ao longo do mês.",
        ],
      },
      {
        tipo: "paragrafo",
        texto: "Horários e atrações podem mudar: confira os canais da Prefeitura de São Luís na semana do evento.",
      },
      { tipo: "subtitulo", texto: "Siga o som do Tambor de Crioula" },
      { tipo: "imagem", imagem: IMG.tambores },
      {
        tipo: "paragrafo",
        texto:
          "Se é para escolher uma experiência só, que seja uma roda de Tambor de Crioula. Patrimônio Cultural do Brasil, a roda junta tambor, toada e a punga das coreiras. A Praia Grande, com a Casa do Tambor de Crioula na Rua da Estrela, é o melhor lugar para começar — e na semana do dia 20 as chances de encontrar roda aumentam.",
      },
      { tipo: "subtitulo", texto: "Assista (ou entre) numa roda de capoeira" },
      {
        tipo: "paragrafo",
        texto:
          "São Luís tem dezenas de grupos de capoeira, e novembro é mês de roda aberta. Para quem quer ir além de assistir, muitos grupos aceitam aluno novo em qualquer época do ano.",
      },
      { tipo: "subtitulo", texto: "Conheça o Centro Histórico que está acordando" },
      {
        tipo: "lista",
        itens: [
          "Praia Grande a pé: Rua da Estrela, Rua do Giz, Beco Catarina Mina, os azulejos e os mirantes.",
          "O Vila Galé Ópera, hotel inaugurado em 27 de outubro de 2026 no casarão restaurado da antiga Casa do Maranhão.",
          "Convento das Mercês e a praça em frente, palco dos shows dos dias 20 e 21.",
          "Feirinha São Luís, aos domingos de manhã na Praça Benedito Leite — comida, artesanato e música (confirme a edição da semana).",
        ],
      },
      { tipo: "subtitulo", texto: "Para comer e beber" },
      {
        tipo: "paragrafo",
        texto:
          "Arroz de cuxá, torta de camarão, peixe frito na beira da praia, juçara com farinha e camarão seco. Para acompanhar, Guaraná Jesus bem gelado. O fim de tarde no Espigão da Ponta d’Areia, olhando o sol cair no mar, fecha qualquer dia.",
      },
      { tipo: "subtitulo", texto: "E as praias?" },
      {
        tipo: "paragrafo",
        texto:
          "Novembro é estação seca: dia aberto, vento e mar bom para caminhar no Calhau, no Olho d’Água e no Araçagi na maré baixa. Se o plano incluir os Lençóis Maranhenses, pergunte às agências como estão as lagoas — no fim do ano elas costumam estar mais baixas.",
      },
      {
        tipo: "destaque",
        texto: "Em novembro, São Luís não pede pressa. Pede tambor no fim da tarde e conversa até tarde na Praia Grande.",
      },
      {
        tipo: "links",
        titulo: "Leia também",
        itens: [
          { texto: "Tambor de Crioula: o que é, como funciona e onde ver em São Luís", href: "/cultura/tambor-de-crioula-sao-luis" },
          { texto: "Capoeira em São Luís: história, mestres e onde aprender", href: "/cultura/capoeira-em-sao-luis" },
          { texto: "Vila Galé chega a São Luís: o hotel da ópera na Praia Grande", href: "/cultura/vila-gale-opera-sao-luis-centro-historico" },
          { texto: "São Luís em três sensações: azulejos, reggae e Guaraná Jesus", href: "/cultura/sao-luis-em-tres-sensacoes" },
        ],
      },
      {
        tipo: "links",
        titulo: "Fontes",
        itens: [
          { texto: "O Imparcial — Festival Negritude terá cinema nas comunidades e shows em São Luís (out/2026)", href: "https://oimparcial.com.br/noticias/2026/10/festival-negritude-tera-cinema-nas-comunidades-e-shows-em-sao-luis/" },
          { texto: "Maranhão Hoje — Prefeitura abre programação do Festival Negritude com Cinema na Rua", href: "https://mahoje.com.br/281190-2/" },
          { texto: "Mix Vale — Finados e Consciência Negra formam dois fins de semana prolongados em novembro de 2026", href: "https://www.mixvale.com.br/2026/10/26/dia-de-finados-e-consciencia-negra-formam-dois-fins-de-semana/" },
          { texto: "Turismo São Luís — Feirinha São Luís", href: "https://turismosaoluis.com.br/en/events/feirinha-sao-luis/" },
        ],
      },
    ],
  },
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
    tituloSeo: "O que vestir no arraial do São João maranhense",
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
