/**
 * Planos do Kambada Play — decididos pelo Alexandre em 19/10/2026.
 *
 * Nada aqui cobra ainda: tudo fica liberado de graça até 31/12/2026, e a
 * cobrança do Família e do Brincante começa em 01/01/2027 (avisada por e-mail).
 * Quem cria a conta até 31/12 e assina o anual até 31/01/2027 paga o preço de
 * fundador no 1º ano.
 *
 * Cupons de assinante (regras completas na minuta dos Termos):
 * - Família: 1 cupom de 10 % por mês, teto de R$ 20 de desconto.
 * - Brincante: 2 cupons de 10 % por mês, sem teto, + 1 frete grátis por mês (cobre até R$ 30 do frete; renova com a assinatura).
 * - No mensal, os cupons só liberam depois do 1º pagamento compensado.
 * - Não acumulam com cupons de parceiros nem com o SEACHEGA10; acumulam com o cupom do ranking.
 *
 * Escolas, eventos e ativações de marca não têm pacote nem preço por aluno:
 * é desenvolvimento personalizado a partir da ideia cultural, sempre sob proposta.
 */

export type PlanoId = "gratis" | "familia" | "brincante" | "personalizado" | "licenca";

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
  brincanteMes: 19.9,
  brincanteAno: 179,
  /** Preço de fundador (1º ano do anual): conta criada até 31/12/2026 e assinatura até 31/01/2027. */
  familiaAnoFundador: 69,
  brincanteAnoFundador: 149,
  /** Até quando tudo fica liberado sem cobrança. */
  gratisAte: "31/12/2026",
  cobrancaComeca: "01/01/2027",
  fundadorAssinarAte: "31/01/2027",
  /** Prazo combinado para a primeira entrega de animações num projeto personalizado. */
  personalizadoPrimeiraEntregaDias: 60,
} as const;

export const PLANOS: Plano[] = [
  {
    id: "gratis",
    nome: "Grátis",
    paraQuem: "Para quem cria a conta",
    preco: "R$ 0",
    precoDetalhe: "para sempre",
    inclui: [
      "Quiz em todos os níveis e memória das estampas",
      "Ranking da semana: o top 3 ganha cupom de até 10 % na loja",
      "1º episódio da animação e a 1ª HQ",
      "Novidades e promoções por e-mail (se quiser)",
    ],
    disponivel: true,
    selo: "Disponível",
  },
  {
    id: "familia",
    nome: "Play Família",
    paraQuem: "Para a casa toda",
    preco: "R$ 9,90/mês",
    precoDetalhe: `ou R$ 89 por ano · liberado grátis até ${PRECOS.gratisAte}`,
    inclui: [
      "Tudo do Grátis, sem limite",
      "Arraial da Kambada em 3D, com conversas novas todo mês",
      "Todas as animações, HQs e histórias em áudio para dormir",
      "Desenhos e atividades para imprimir",
      "Até 4 perfis na mesma conta",
      "1 cupom de 10 % por mês na loja (até R$ 20 de desconto)",
    ],
    disponivel: false,
    selo: "Grátis até 31/12",
  },
  {
    id: "brincante",
    nome: "Play Brincante",
    paraQuem: "Para quem é da festa",
    preco: "R$ 19,90/mês",
    precoDetalhe: `ou R$ 179 por ano · liberado grátis até ${PRECOS.gratisAte}`,
    inclui: [
      "Tudo do Família",
      "2 cupons de 10 % por mês na loja, sem limite de valor",
      "1 frete grátis por mês (até R$ 30), renovado a cada mês de assinatura",
      "Episódios e jogos novos antes de todo mundo",
      "Pré-venda de lançamentos e estampas limitadas",
      "15 % de desconto em oficinas da Kambada",
      "Arquivos para impressora 3D",
      "Vote no próximo episódio e veja seu nome nos créditos",
      "No plano anual: uma visita ao ateliê da Kambada, com hora marcada",
    ],
    disponivel: false,
    destaque: true,
    selo: "Grátis até 31/12",
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
    resposta: `Em ${PRECOS.cobrancaComeca}, com aviso por e-mail antes. Ninguém é cobrado sem escolher um plano.`,
  },
  {
    pergunta: "Como funcionam os cupons da loja?",
    resposta:
      "Aparecem em \"Minha conta\" e valem até o fim do mês. No plano mensal, liberam após o 1º pagamento confirmado. Não somam com cupons de parceiros nem com o de boas-vindas; somam com o do ranking da semana.",
  },
  {
    pergunta: "Quem não assinar perde alguma coisa?",
    resposta:
      "Não. Quiz, memória, ranking com cupom do top 3, o 1º episódio e a 1ª HQ seguem abertos. O pago acrescenta, não tira.",
  },
  {
    pergunta: "Como funciona para escola, evento ou marca?",
    resposta:
      "Sem pacote pronto nem período de teste: conversamos e combinamos o que será produzido, o prazo e o valor. A primeira entrega sai em até 60 dias após o acordo.",
  },
  {
    pergunta: "Como vou pagar?",
    resposta:
      "Cartão de crédito pelo Mercado Pago, com renovação automática que você cancela em 1 clique em \"Minha conta\". O anual também pode ser pago à vista no Pix.",
  },
];
