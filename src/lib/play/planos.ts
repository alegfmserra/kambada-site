/**
 * Planos do Kambada Play — decididos pelo Alexandre em 19/10/2026.
 *
 * DECISÃO DE 30/10/2026: o site NÃO mostra preço, cobrança nem "grátis até…" do
 * Play. Os valores existem só na pesquisa de satisfação (teste de preço) e na
 * documentação interna (Kambada-Play/). Não reintroduzir números aqui.
 *
 * Cupons de assinante (regras completas na minuta dos Termos):
 * - Família: 1 cupom de 10 % por mês, com teto de desconto.
 * - Brincante: 2 cupons de 10 % por mês, sem teto, + 1 frete grátis por mês.
 * - No mensal, os cupons só liberam depois do 1º pagamento compensado.
 * - Não acumulam com cupons de parceiros nem com o SEACHEGA10; acumulam com o cupom do ranking.
 *
 * Escolas, eventos e ativações de marca não têm pacote: é desenvolvimento
 * personalizado a partir da ideia cultural, sempre sob proposta.
 */

export type PlanoId = "gratis" | "familia" | "brincante" | "personalizado" | "licenca";

export type Plano = {
  id: PlanoId;
  nome: string;
  paraQuem: string;
  inclui: string[];
  /** Já dá para usar hoje (sem cobrança)? */
  disponivel: boolean;
  /** Plano em evidência na tela. */
  destaque?: boolean;
  /** Texto do selo no canto do cartão. */
  selo: string;
};

export const PRECOS = {
  /** Prazo combinado para a primeira entrega de animações num projeto personalizado. */
  personalizadoPrimeiraEntregaDias: 60,
} as const;

export const PLANOS: Plano[] = [
  {
    id: "gratis",
    nome: "Básico",
    paraQuem: "Para quem cria a conta",
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
    inclui: [
      "Tudo do Básico, sem limite",
      "Arraial da Kambada em 3D, com conversas novas todo mês",
      "Todas as animações, HQs e histórias em áudio para dormir",
      "Desenhos e atividades para imprimir",
      "Até 4 perfis na mesma conta",
      "1 cupom de 10 % por mês na loja",
    ],
    disponivel: false,
    selo: "Liberado",
  },
  {
    id: "brincante",
    nome: "Play Brincante",
    paraQuem: "Para quem é da festa",
    inclui: [
      "Tudo do Família",
      "2 cupons de 10 % por mês na loja, sem limite de valor",
      "1 frete grátis por mês na loja",
      "Episódios e jogos novos antes de todo mundo",
      "Pré-venda de lançamentos e estampas limitadas",
      "15 % de desconto em oficinas da Kambada",
      "Arquivos para impressora 3D",
      "Vote no próximo episódio e veja seu nome nos créditos",
      "No plano anual: uma visita ao ateliê da Kambada, com hora marcada",
    ],
    disponivel: false,
    destaque: true,
    selo: "Liberado",
  },
  {
    id: "personalizado",
    nome: "Personalizado",
    paraQuem: "Para escolas, eventos e marcas",
    inclui: [
      "Escolas: animações e histórias educativas a partir do plano de aula",
      "Eventos e ativações de marca: jogos e conteúdo com a sua identidade",
      "Produção em levas; primeira entrega em até 60 dias após o acordo",
      "Jogos, cordel e HQ já existentes desde o primeiro dia",
    ],
    disponivel: false,
    selo: "Sob medida",
  },
  {
    id: "licenca",
    nome: "Licença de conteúdo",
    paraQuem: "Para edtechs, sistemas de ensino e secretarias",
    inclui: [
      "Jogos e histórias integrados à plataforma do cliente",
      "Conteúdo novo por temporada",
      "Marca Kambada e autoria dos artistas preservadas",
    ],
    disponivel: false,
    selo: "Sob medida",
  },
];

export const PERGUNTAS_PLANOS: { pergunta: string; resposta: string }[] = [
  {
    pergunta: "Como funcionam os cupons da loja?",
    resposta:
      "Aparecem em \"Minha conta\" e valem até o fim do mês. Não somam com cupons de parceiros nem com o de boas-vindas; somam com o do ranking da semana.",
  },
  {
    pergunta: "Quem tem só a conta básica perde alguma coisa?",
    resposta:
      "Não. Quiz, memória, ranking com cupom do top 3, o 1º episódio e a 1ª HQ seguem abertos. Os planos acrescentam, não tiram.",
  },
  {
    pergunta: "Como funciona para escola, evento ou marca?",
    resposta:
      "Sem pacote pronto: conversamos e combinamos o que será produzido e o prazo. A primeira entrega sai em até 60 dias após o acordo.",
  },
];
