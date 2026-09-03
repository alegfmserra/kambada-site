/**
 * Catálogo da Kambada — DADOS REAIS.
 *
 * Nomes, preços, variações e disponibilidade foram extraídos da planilha
 * `Estoque_Kambada (1).xlsx`, aba "Estoque" (contagem de 2026-08-29,
 * 101 modelos / 1.378 peças). Nada aqui foi inventado.
 *
 * O que NÃO veio da planilha: descrição de produto e foto. A planilha não
 * tem esses campos, e inventar texto de produto seria criar informação
 * comercial que ninguém aprovou. No lugar da descrição, a vitrine mostra as
 * variações reais (tamanhos e cores contados no estoque).
 *
 * Preço da camisa adulta: R$ 89,90, CONFIRMADO pelo Alexandre em 2026-08-31.
 * O catálogo do Mercado Pago (2026-06-13) trazia R$ 80,00 e está defasado —
 * vale o estoque. Quando o catálogo passar a vir do Bling, esse é o valor que
 * deve estar lá.
 *
 * Na Fase 2 este arquivo é substituído pela consulta ao Bling.
 */

import type { Foto } from "./fotos";
import { FOTOS } from "./fotos";

export type Categoria = {
  slug: string;
  nome: string;
  chamada: string;
  /** Foto de vitrine. Pareôs ainda não têm foto no acervo. */
  foto?: Foto;
};

export type Produto = {
  slug: string;
  nome: string;
  categoria: string; // slug da categoria
  preco: number; // menor preço, quando há variação de tamanho
  precoMaximo?: number; // presente quando a peça tem faixa de preço
  variacoes: string[]; // tamanhos e cores reais contados no estoque
  quantidade: number; // saldo da contagem de 2026-08-29
};

export const CATEGORIAS: Categoria[] = [
  {
    slug: "camisas",
    nome: "Camisas",
    chamada:
      "Estampadas com as lendas e símbolos do nosso Maranhão. Vista-se de história e identidade.",
    foto: FOTOS.camisaIlhaEncantada,
  },
  {
    slug: "matracas",
    nome: "Matracas",
    chamada:
      "Aqui quem dita o ritmo é a matraca. Feitas e pintadas à mão, uma por uma.",
    foto: FOTOS.catMatracas,
  },
  {
    slug: "ecobags",
    nome: "Ecobags",
    chamada:
      "Bolsa de feira, de praia e de arraial. Cabe tudo e ainda conta história.",
    foto: FOTOS.catEcobags,
  },
  {
    slug: "bones",
    nome: "Bonés",
    chamada:
      'Com o charme da ilha, perfeitos para curtir o reggae na praça ou se proteger a "moleira".',
    foto: FOTOS.catBones,
  },
  {
    slug: "pareos",
    nome: "Pareôs",
    chamada: "Para a praia, para o calor, para o Maranhão inteiro.",
  },
  {
    slug: "necessaires",
    nome: "Necessaires",
    chamada: "Pequenas, práticas e com a nossa cara.",
    foto: FOTOS.catNecessaires,
  },
  {
    slug: "papelaria",
    nome: "Papelaria",
    chamada: "Para anotar, escrever e desenhar — sempre com um toque sustentável.",
  },
  {
    slug: "brindes",
    nome: "Brindes",
    chamada: "Mimos pequenos, com a nossa cara, pra presentear ou levar de lembrança.",
  },
  {
    slug: "decoracao",
    nome: "Decoração",
    chamada: "Para decorar seu lar com a arte do Maranhão.",
  },
];

export const PRODUTOS: Produto[] = [
  // --- Camisas ---
  {
    slug: "camisa-lendas-e-carrancas",
    nome: "Lendas e Carrancas",
    categoria: "camisas",
    preco: 89.9,
    variacoes: ["Preta P", "Preta M", "Preta G", "Preta GG", "Preta XG"],
    quantidade: 27,
  },
  {
    slug: "camisa-revoada-dos-guaras",
    nome: "Revoada dos Guarás",
    categoria: "camisas",
    preco: 89.9,
    variacoes: [
      "Off White P",
      "Off White M",
      "Off White G",
      "Off White GG",
      "Off White XG",
      "Rosa G",
    ],
    quantidade: 27,
  },
  {
    slug: "camisa-tradicao",
    nome: "Tradição",
    categoria: "camisas",
    preco: 89.9,
    variacoes: [
      "Azul Marinho P",
      "Azul Marinho M",
      "Azul Marinho G",
      "Azul Marinho GG",
      "Azul Marinho XG",
    ],
    quantidade: 27,
  },
  {
    slug: "camisa-reggae-roots",
    nome: "Reggae Roots",
    categoria: "camisas",
    preco: 89.9,
    variacoes: ["Preta P", "Preta M", "Preta G", "Preta GG"],
    quantidade: 14,
  },
  {
    slug: "camisa-revoada-suede-feminino",
    nome: "Revoada dos Guarás — Suede Feminino",
    categoria: "camisas",
    preco: 74.9,
    variacoes: ["Branco M", "Branco G", "Branco GG", "Azul G", "Azul GG"],
    quantidade: 15,
  },
  {
    slug: "camisa-caboclo-de-pena",
    nome: "Caboclo de Pena",
    categoria: "camisas",
    preco: 89.9,
    variacoes: ["Salmão P", "Salmão M", "Salmão G", "Salmão GG"],
    quantidade: 7,
  },
  {
    slug: "camisa-bumba-meu-boi-infantil",
    nome: "Bumba meu Boi — Infantil",
    categoria: "camisas",
    preco: 74.9,
    variacoes: [
      "Preta 6 anos",
      "Preta 8 anos",
      "Preta 10 anos",
      "Preta 12 anos",
      "Preta 14 anos",
    ],
    quantidade: 8,
  },
  {
    slug: "camisa-lenda-da-serpente-infantil",
    nome: "Lenda da Serpente — Infantil",
    categoria: "camisas",
    preco: 74.9,
    variacoes: [
      "Branca 2 anos",
      "Branca 4 anos",
      "Branca 6 anos",
      "Branca 8 anos",
      "Branca 10 anos",
    ],
    quantidade: 9,
  },
  {
    slug: "camisa-cazumba",
    nome: "Cazumbá",
    categoria: "camisas",
    preco: 89.9,
    variacoes: ["Bege GG"],
    quantidade: 1,
  },

  // --- Matracas ---
  {
    slug: "matraca-kambada-play-com-suporte",
    nome: "Kambada Play — com suporte",
    categoria: "matracas",
    preco: 220,
    variacoes: ["Único"],
    quantidade: 7,
  },
  {
    slug: "matraca-com-suporte",
    nome: "Matraca com suporte — desenhos diversos",
    categoria: "matracas",
    preco: 140,
    precoMaximo: 185,
    variacoes: ["Mini", "Grande"],
    quantidade: 17,
  },
  {
    slug: "matraca-sem-suporte",
    nome: "Matraca sem suporte — desenhos diversos",
    categoria: "matracas",
    preco: 110,
    precoMaximo: 145,
    variacoes: ["Mini", "Grande"],
    quantidade: 18,
  },

  // --- Ecobags ---
  {
    slug: "ecobag-serpente-tons-de-azul",
    nome: "Serpente Tons de Azul",
    categoria: "ecobags",
    preco: 40,
    precoMaximo: 55,
    variacoes: ["Mini", "Grande"],
    quantidade: 39,
  },
  {
    slug: "ecobag-revoada-dos-guaras",
    nome: "Revoada dos Guarás",
    categoria: "ecobags",
    preco: 40,
    precoMaximo: 55,
    variacoes: ["Mini", "Grande"],
    quantidade: 24,
  },
  {
    slug: "ecobag-caboclo-de-pena",
    nome: "Caboclo de Pena",
    categoria: "ecobags",
    preco: 55,
    variacoes: ["Grande"],
    quantidade: 21,
  },
  {
    slug: "ecobag-tradicao",
    nome: "Tradição",
    categoria: "ecobags",
    preco: 55,
    variacoes: ["Grande"],
    quantidade: 21,
  },
  {
    slug: "ecobag-sao-luis-azulejos",
    nome: "São Luís Azulejos",
    categoria: "ecobags",
    preco: 40,
    variacoes: ["Mini"],
    quantidade: 18,
  },
  {
    slug: "ecobag-boizinho-fio-de-matraca",
    nome: "Boizinho com fio de matraca",
    categoria: "ecobags",
    preco: 40,
    variacoes: ["Mini"],
    quantidade: 19,
  },

  // --- Bonés ---
  {
    slug: "bone-guaras-bege",
    nome: "Guarás Bege",
    categoria: "bones",
    preco: 55,
    variacoes: ["Único"],
    quantidade: 22,
  },
  {
    slug: "bone-preto-lendas",
    nome: "Preto Lendas",
    categoria: "bones",
    preco: 55,
    variacoes: ["Único"],
    quantidade: 9,
  },
  {
    slug: "bone-marinho-maranhense-que-so",
    nome: "Marinho Maranhense Que Só",
    categoria: "bones",
    preco: 55,
    variacoes: ["Único"],
    quantidade: 5,
  },

  // --- Pareôs ---
  {
    slug: "pareo-reggae-roots",
    nome: "Reggae Roots",
    categoria: "pareos",
    preco: 89.9,
    variacoes: ["Único"],
    quantidade: 17,
  },
  {
    slug: "pareo-cidade-dos-azulejos",
    nome: "Cidade dos Azulejos",
    categoria: "pareos",
    preco: 89.9,
    variacoes: ["Único"],
    quantidade: 15,
  },
  {
    slug: "pareo-mosaico",
    nome: "Mosaico",
    categoria: "pareos",
    preco: 89.9,
    variacoes: ["Único"],
    quantidade: 15,
  },
  {
    slug: "pareo-revoada-dos-guaras",
    nome: "Revoada dos Guarás",
    categoria: "pareos",
    preco: 89.9,
    variacoes: ["Único"],
    quantidade: 14,
  },

  // --- Necessaires ---
  {
    slug: "necessaire-serpente-tons-de-azul",
    nome: "Serpente Tons de Azul",
    categoria: "necessaires",
    preco: 20,
    variacoes: ["Único"],
    quantidade: 40,
  },
  {
    slug: "necessaire-azulejos",
    nome: "Azulejos",
    categoria: "necessaires",
    preco: 20,
    variacoes: ["Único"],
    quantidade: 30,
  },
  {
    slug: "necessaire-guaras",
    nome: "Guarás",
    categoria: "necessaires",
    preco: 20,
    variacoes: ["Único"],
    quantidade: 30,
  },
  {
    slug: "necessaire-tradicao-colorida",
    nome: "Tradição Colorida",
    categoria: "necessaires",
    preco: 20,
    variacoes: ["Único"],
    quantidade: 30,
  },

  // --- Papelaria ---
  // Nenhum destes tinha seção na loja antes de 2026-09-03. Preço e
  // quantidade conferidos direto no Bling na mesma data. Livro Trilíngue e
  // Livro Vermelho aparecem esgotados porque estão mesmo sem estoque —
  // confirmado pelo Alexandre em 2026-09-03, não é lacuna de contagem.
  {
    slug: "caneta-ecologica",
    nome: "Caneta Ecológica",
    categoria: "papelaria",
    preco: 8,
    variacoes: ["Único"],
    quantidade: 50,
  },
  {
    slug: "lapis-plantavel",
    nome: "Lápis Plantável",
    categoria: "papelaria",
    preco: 8,
    variacoes: ["Único"],
    quantidade: 600,
  },
  {
    slug: "bloco-caderninho-ecologico",
    nome: "Bloco de Anotação — Caderninho Ecológico",
    categoria: "papelaria",
    preco: 17,
    variacoes: ["Único"],
    quantidade: 52,
  },
  // Kit Ecológico saiu do genérico R$80/Único e virou uma estampa por
  // produto, achado nas fotos de produto de 2026-09-03 e confirmado pelo
  // Alexandre — preço certo é R$85. Quantidade em ZERO de propósito: a
  // planilha só tinha "30 unidades" numa linha só, sem separar por
  // estampa, e não há fonte confiável para repartir esse número entre as
  // 4 artes. Pode haver mais estampas além destas 4 — só essas foram
  // fotografadas até agora.
  {
    slug: "kit-ecologico-guaras",
    nome: "Kit Ecológico — Guarás",
    categoria: "papelaria",
    preco: 85,
    variacoes: ["Único"],
    quantidade: 0,
  },
  {
    slug: "kit-ecologico-bumba-meu-boi",
    nome: "Kit Ecológico — Bumba Meu Boi",
    categoria: "papelaria",
    preco: 85,
    variacoes: ["Único"],
    quantidade: 0,
  },
  {
    slug: "kit-ecologico-cazumba",
    nome: "Kit Ecológico — Cazumbá",
    categoria: "papelaria",
    preco: 85,
    variacoes: ["Único"],
    quantidade: 0,
  },
  {
    slug: "kit-ecologico-ilha-do-amor",
    nome: "Kit Ecológico — Ilha do Amor",
    categoria: "papelaria",
    preco: 85,
    variacoes: ["Único"],
    quantidade: 0,
  },
  {
    slug: "kambada-goods",
    nome: "Kambada Goods",
    categoria: "papelaria",
    preco: 10,
    variacoes: ["Único"],
    quantidade: 10,
  },
  {
    slug: "joguinhos-divertido",
    nome: "Joguinhos Divertido",
    categoria: "papelaria",
    preco: 10,
    variacoes: ["Único"],
    quantidade: 0,
  },
  // Bloco de anotação em papel kraft, com decoração de arte cultural
  // maranhense — confirmado pelo Alexandre em 2026-09-03. NÃO é o mesmo
  // item que "Joguinhos Divertido" (essa dúvida já foi resolvida). Sem
  // variação por estampa por enquanto — existem várias estampas, mas
  // oferecer escolha complica demais por ora; a ideia é, no futuro, a
  // estampa virar variação, como em Ecobags e Camisas.
  //
  // Ainda em aberto: pode ser o MESMO produto que "Bloco Anotação
  // Caderninho Ecológico" (R$17, mais abaixo) — os dois têm preço
  // diferente (R$9 × R$17) e são cadastros distintos no Bling. Não
  // fundidos aqui de propósito.
  {
    slug: "bloquinho",
    nome: "Bloquinho",
    categoria: "papelaria",
    preco: 9,
    variacoes: ["Único"],
    quantidade: 0,
  },
  {
    slug: "livro-trilingue",
    nome: "Livro Trilíngue",
    categoria: "papelaria",
    preco: 15,
    variacoes: ["Único"],
    quantidade: 0,
  },
  {
    slug: "livro-vermelho-historinha",
    nome: "Livro Vermelho — Historinha",
    categoria: "papelaria",
    preco: 20,
    variacoes: ["Único"],
    quantidade: 0,
  },

  // --- Brindes ---
  {
    slug: "chaveiro-sortido",
    nome: "Chaveiro",
    categoria: "brindes",
    preco: 15,
    variacoes: ["Sortido"],
    quantidade: 20,
  },
  {
    slug: "porta-chave",
    nome: "Porta-chave",
    categoria: "brindes",
    preco: 55,
    variacoes: ["Caboclo de Pena"],
    quantidade: 5,
  },

  // --- Decoração ---
  // Custo real ainda não fechado (a própria planilha marca como pendente
  // de precificar) — só o preço de venda está confirmado.
  {
    slug: "mandala-modelos-diversos",
    nome: "Mandala",
    categoria: "decoracao",
    preco: 250,
    variacoes: ["Único"],
    quantidade: 2,
  },
  {
    slug: "placa-madeira-reta",
    nome: "Placa de Madeira — Reta",
    categoria: "decoracao",
    preco: 190,
    variacoes: ["Único"],
    quantidade: 4,
  },
  {
    slug: "placa-madeira-redonda",
    nome: "Placa de Madeira — Redonda",
    categoria: "decoracao",
    preco: 120,
    variacoes: ["Único"],
    quantidade: 3,
  },
  {
    slug: "placa-madeira-grande",
    nome: "Placa de Madeira — Grande",
    categoria: "decoracao",
    preco: 160,
    variacoes: ["Único"],
    quantidade: 0,
  },
];

export function categoriaPorSlug(slug: string): Categoria | undefined {
  return CATEGORIAS.find((c) => c.slug === slug);
}

export function produtosDaCategoria(slug: string): Produto[] {
  return PRODUTOS.filter((p) => p.categoria === slug);
}

export function precoEmReais(valor: number): string {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/** "R$ 89,90" ou "R$ 140,00 a R$ 185,00", quando há faixa. */
export function precoExibido(produto: Produto): string {
  if (produto.precoMaximo && produto.precoMaximo !== produto.preco) {
    return `${precoEmReais(produto.preco)} a ${precoEmReais(produto.precoMaximo)}`;
  }
  return precoEmReais(produto.preco);
}

/**
 * Rótulo de disponibilidade. O saldo exato não vai para a vitrine — só a
 * informação que interessa a quem compra.
 */
export function disponibilidade(produto: Produto): {
  texto: string;
  disponivel: boolean;
} {
  if (produto.quantidade <= 0) return { texto: "Esgotado", disponivel: false };
  if (produto.quantidade <= 5)
    return { texto: "Últimas unidades", disponivel: true };
  return { texto: "Disponível", disponivel: true };
}
