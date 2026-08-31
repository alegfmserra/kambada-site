/**
 * CATÁLOGO DE DEMONSTRAÇÃO — não são produtos reais.
 *
 * Serve só para provar o formato da vitrine antes da integração com o Bling.
 * Nomes e preços são ilustrativos e foram inventados para este teste; nenhum
 * deles saiu do estoque da Kambada. Quando a Fase 2 entrar, este arquivo é
 * apagado e os dados passam a vir do Bling, que é a fonte de verdade.
 *
 * As três categorias, sim, são reais: vieram do site em produção.
 */

export type ProdutoDemo = {
  slug: string;
  nome: string;
  categoria: string;
  preco: number;
  descricao: string;
  emEstoque: boolean;
};

export const CATEGORIAS_DEMO = [
  "Camisetas",
  "Matracas e acessórios",
  "Bonés",
] as const;

export const PRODUTOS_DEMO: ProdutoDemo[] = [
  {
    slug: "camiseta-ilha-do-amor",
    nome: "Camiseta Ilha do Amor",
    categoria: "Camisetas",
    preco: 89.9,
    descricao:
      "Estampa das lendas e dos azulejos de São Luís, em algodão que aguenta o calor da ilha.",
    emEstoque: true,
  },
  {
    slug: "camiseta-boi-de-matraca",
    nome: "Camiseta Boi de Matraca",
    categoria: "Camisetas",
    preco: 89.9,
    descricao:
      "O sotaque da baixada no peito. Para quem brinca o Boi do começo ao fim.",
    emEstoque: true,
  },
  {
    slug: "camiseta-reggae-da-ilha",
    nome: "Camiseta Reggae da Ilha",
    categoria: "Camisetas",
    preco: 89.9,
    descricao:
      "Verde, amarelo e vermelho no ritmo da pedrada maranhense.",
    emEstoque: false,
  },
  {
    slug: "matraca-personalizada",
    nome: "Matraca personalizada",
    categoria: "Matracas e acessórios",
    preco: 64.9,
    descricao:
      "Feita e pintada à mão. A mesma que virou brinde de arraial e acabou virando marca.",
    emEstoque: true,
  },
  {
    slug: "chaveiro-mini-matraca",
    nome: "Chaveiro Mini Matraca",
    categoria: "Matracas e acessórios",
    preco: 24.9,
    descricao: "O São João no bolso o ano inteiro.",
    emEstoque: true,
  },
  {
    slug: "ecobag-caboclo-de-pena",
    nome: "Ecobag Caboclo de Pena",
    categoria: "Matracas e acessórios",
    preco: 49.9,
    descricao: "Bolsa de feira, de praia e de arraial. Cabe tudo e ainda conta história.",
    emEstoque: true,
  },
  {
    slug: "bone-ilha-rebelde",
    nome: "Boné Ilha Rebelde",
    categoria: "Bonés",
    preco: 79.9,
    descricao: "Aba curva, bordado em dourado. Protege a moleira com estilo.",
    emEstoque: true,
  },
  {
    slug: "bone-matraca-bordado",
    nome: "Boné Matraca Bordada",
    categoria: "Bonés",
    preco: 79.9,
    descricao: "A matraca no bordado, o Maranhão na cabeça.",
    emEstoque: true,
  },
];

export function precoEmReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
