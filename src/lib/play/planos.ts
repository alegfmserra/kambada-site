/**
 * Planos do Kambada Play — decididos pelo Alexandre em 19/10/2026.
 *
 * Nada aqui cobra ainda: a tela `/kambadaplay/planos` só mostra o que vem e
 * convida a criar a conta (com opt-in de novidades) ou a falar com a gente.
 * Quando a cobrança entrar (Mercado Pago Assinaturas), os valores saem daqui.
 *
 * Play Escola está em espera: não tem preço por aluno nem piloto. O conteúdo
 * (animações, histórias) é produzido aos poucos e combinado com cada escola,
 * então é sempre sob proposta.
 */

export type PlanoId = "gratis" | "familia" | "escola" | "licenca";

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
};

export const PRECOS = {
  familiaMes: 9.9,
  familiaAno: 89,
  /** Prazo combinado para a primeira entrega de animações a uma escola. */
  escolaPrimeiraEntregaDias: 60,
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
  },
  {
    id: "familia",
    nome: "Play Família",
    paraQuem: "Para a casa toda",
    preco: "R$ 9,90/mês",
    precoDetalhe: "ou R$ 89 por ano (2 meses de graça)",
    inclui: [
      "Tudo do Grátis, sem limite de partidas",
      "Até 4 perfis na mesma conta",
      "Novos jogos e temporadas primeiro",
      "Cupom permanente de 5% na loja",
    ],
    disponivel: false,
    destaque: true,
  },
  {
    id: "escola",
    nome: "Play Escola",
    paraQuem: "Para escolas e redes de ensino",
    preco: "Sob proposta",
    precoDetalhe: "conteúdo feito junto com a escola, a partir do plano de aula",
    inclui: [
      "Animações e histórias de cunho educativo, produzidas aos poucos",
      "Primeira entrega de animações em até 60 dias, conforme o combinado",
      "Acompanha o plano de aula ou o plano anual, segundo a negociação",
      "Jogos, cordel e HQ já existentes desde o primeiro dia",
    ],
    disponivel: false,
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
  },
];

export const PERGUNTAS_PLANOS: { pergunta: string; resposta: string }[] = [
  {
    pergunta: "Quando a cobrança começa?",
    resposta:
      "Quando houver mais jogos e mais temporadas de HQ e animação. Até lá, tudo que está no ar é grátis para quem tem conta. Quem criou a conta e marcou as novidades fica sabendo primeiro.",
  },
  {
    pergunta: "Quem já tem conta vai perder alguma coisa?",
    resposta:
      "Não. O plano Grátis continua existindo: ranking, cupons da semana, cordel, HQ e os jogos de hoje seguem abertos. O pago acrescenta, não tira.",
  },
  {
    pergunta: "Como funciona para a escola?",
    resposta:
      "Não existe pacote pronto nem período de teste: a gente conversa com a escola, entende o plano de aula e combina o que será produzido, o prazo e o valor. As animações são feitas aos poucos e a primeira entrega costuma sair em até 60 dias depois do acordo.",
  },
  {
    pergunta: "Como vou pagar?",
    resposta:
      "Cartão ou Pix recorrente pelo Mercado Pago, o mesmo meio de pagamento da loja, com nota fiscal. Cancela quando quiser, sem multa.",
  },
];
