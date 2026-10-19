/**
 * Planos do Kambada Play — decididos pelo Alexandre em 19/10/2026.
 *
 * Nada aqui cobra ainda: todo mundo que cria conta tem 3 meses grátis, e a
 * cobrança do Família entra aos poucos, conforme a plataforma ganhar coisas
 * novas. A tela `/kambadaplay/planos` convida a criar a conta (com opt-in de
 * novidades) ou a falar com a gente.
 *
 * Escolas, eventos e ativações de marca não têm pacote nem preço por aluno:
 * é desenvolvimento personalizado a partir da ideia cultural, sempre sob
 * proposta. O conteúdo (animações, histórias) é produzido aos poucos.
 */

export type PlanoId = "gratis" | "familia" | "personalizado" | "licenca";

export type Plano = {
  id: PlanoId;
  nome: string;
  paraQuem: string;
  /** Linha principal de preço, já formatada. */
  preco: string;
  /** Complemento do preço (anual, condição). */
  precoDetalhe?: string;
  inclui: string[];
  /** Já dá para usar hoje (sem cobrança)? */
  disponivel: boolean;
  /** Plano em evidência na tela. */
  destaque?: boolean;
  /** Texto do selo no canto do cartão. */
  selo: string;
};

export const PRECOS = {
  familiaMes: 9.9,
  familiaAno: 89,
  /** Todo mundo que cria conta ganha este período sem pagar nada. */
  mesesGratis: 3,
  /** Prazo combinado para a primeira entrega de animações num projeto personalizado. */
  personalizadoPrimeiraEntregaDias: 60,
} as const;

export const PLANOS: Plano[] = [
  {
    id: "gratis",
    nome: "Grátis",
    paraQuem: "Para quem cria a conta",
    preco: "R$ 0",
    inclui: [
      "Arraial da Kambada, quiz e memória",
      "Cordel, HQ e animação da temporada",
      "Ranking da semana e cupons do top 3",
      "Novidades e promoções por e-mail (se quiser)",
    ],
    disponivel: true,
    selo: "Disponível",
  },
  {
    id: "familia",
    nome: "Play Família",
    paraQuem: "Para a casa toda",
    preco: `${PRECOS.mesesGratis} meses grátis`,
    precoDetalhe: "depois, R$ 9,90/mês ou R$ 89 por ano (2 meses de graça)",
    inclui: [
      "Tudo do Grátis, sem limite de partidas",
      "Até 4 perfis na mesma conta",
      "Novos jogos e temporadas primeiro",
      "Cupom permanente de 5% na loja",
    ],
    disponivel: false,
    destaque: true,
    selo: "Em breve",
  },
  {
    id: "personalizado",
    nome: "Personalizado",
    paraQuem: "Para escolas, eventos e marcas",
    preco: "Sob proposta",
    precoDetalhe: "desenvolvido a partir da ideia cultural, junto com você",
    inclui: [
      "Escolas: animações e histórias educativas a partir do plano de aula",
      "Eventos e ativações de marca: jogos e conteúdo com a sua identidade",
      "Produção em levas; primeira entrega em até 60 dias após o acordo",
      "Jogos, cordel e HQ já existentes desde o primeiro dia",
    ],
    disponivel: false,
    selo: "Sob proposta",
  },
  {
    id: "licenca",
    nome: "Licença de conteúdo",
    paraQuem: "Para edtechs, sistemas de ensino e secretarias",
    preco: "Sob proposta",
    inclui: [
      "Jogos e histórias integrados à plataforma do cliente",
      "Conteúdo novo por temporada",
      "Marca Kambada e autoria dos artistas preservadas",
    ],
    disponivel: false,
    selo: "Sob proposta",
  },
];

export const PERGUNTAS_PLANOS: { pergunta: string; resposta: string }[] = [
  {
    pergunta: "Quando a cobrança começa?",
    resposta:
      "Todo mundo que cria conta tem 3 meses grátis. A cobrança do Play Família entra aos poucos, à medida que a plataforma ganhar jogos, temporadas e recursos novos, e a gente avisa por e-mail antes. Quem criou a conta e marcou as novidades fica sabendo primeiro.",
  },
  {
    pergunta: "Quem já tem conta vai perder alguma coisa?",
    resposta:
      "Não. O plano Grátis continua existindo: ranking, cupons da semana, cordel, HQ e os jogos de hoje seguem abertos. O pago acrescenta, não tira.",
  },
  {
    pergunta: "Como funciona para escola, evento ou marca?",
    resposta:
      "Não existe pacote pronto nem período de teste: a gente conversa, entende o plano de aula, o evento ou a campanha, e combina o que será produzido, o prazo e o valor. As animações são feitas aos poucos e a primeira entrega costuma sair em até 60 dias depois do acordo.",
  },
  {
    pergunta: "Como vou pagar?",
    resposta:
      "Cartão ou Pix recorrente pelo Mercado Pago, o mesmo meio de pagamento da loja, com nota fiscal. Cancela quando quiser, sem multa.",
  },
];
