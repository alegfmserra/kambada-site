/**
 * Ajustes de cadastro e estoque aprovados pelo Alexandre em 14/10/2026
 * ("pode corrigir o estoque, pode criar o que tiver para criar").
 *
 * Fonte: contagem física da Wilsonira de 13/10/2026 ("SOMOS KAMBADA.
 * ESTOQUE.docx"), cruzada com o catálogo do Bling lido em 14/10 — comparativo
 * em site-novo/ESTOQUE_contagem-Wilsonira-x-Bling_2026-10-14.md.
 *
 * O que ficou de fora, de propósito:
 *  - suede e croppeds (lilás, pink, verde): a tabela dela não separa modelo
 *    por linha, e o Bling não tem esses cadastros;
 *  - bermudas (tactel e linho, 33 peças): não existem no site;
 *  - Bloquinho (capa branca): ela não separou de Caderninho — tudo foi
 *    para o Caderninho (kraft), que é o que vende.
 *  - Revoada dos Guarás rosa G e Ecobag Mini Caboclo de Pena: ela não contou
 *    nenhuma unidade, então vão a zero (prateleira manda).
 */

export const ID_CATEGORIA = 13568333;
export const ID_DEPOSITO = 14888952004;

/** Variações de tamanho que a prateleira tem e o Bling não. */
export const VARIACOES_NOVAS: { pai: number; nomePai: string; tamanho: string; saldo: number }[] = [
  { pai: 16698811377, nomePai: "Camisa Alusiva São Luís", tamanho: "G", saldo: 4 },
  { pai: 16698811377, nomePai: "Camisa Alusiva São Luís", tamanho: "XG", saldo: 1 },
  { pai: 16698810433, nomePai: "Camisa Boizinho com Fio de Matraca", tamanho: "M", saldo: 1 },
  { pai: 16698809408, nomePai: "Camisa Caboclo de Pena", tamanho: "XG", saldo: 1 },
  { pai: 16698814567, nomePai: "Camisa Sol Nosso de Cada Dia - Regatão", tamanho: "GG", saldo: 1 },
];

/** Produtos que a prateleira tem e o Bling não. Preço: o padrão das camisas adulto. */
export const PRODUTOS_NOVOS: { nome: string; preco: number; tamanhos: { rotulo: string; saldo: number }[] }[] = [
  {
    nome: "Camisa Tambor",
    preco: 89.9,
    tamanhos: [
      { rotulo: "P", saldo: 5 },
      { rotulo: "M", saldo: 5 },
      { rotulo: "G", saldo: 8 },
      { rotulo: "GG", saldo: 2 },
    ],
  },
];

/** Cadastros existentes que precisam de preço (estavam a R$ 0). Mesmo preço dos chaveiros sortidos. */
export const PRECOS: { nome: string; preco: number }[] = [{ nome: "Chaveiros em Madeira Pinus", preco: 15 }];

/** Balanços (saldo absoluto) por ID de variação ou de produto simples. */
export const BALANCOS: { id: number; nome: string; saldo: number }[] = [
  // Camisas adulto
  { id: 16698807505, nome: "Revoada dos Guarás Off White P", saldo: 2 },
  { id: 16698807506, nome: "Revoada dos Guarás Off White M", saldo: 5 },
  { id: 16698807507, nome: "Revoada dos Guarás Off White G", saldo: 4 },
  { id: 16698807509, nome: "Revoada dos Guarás Off White GG", saldo: 4 },
  { id: 16698807511, nome: "Revoada dos Guarás Off White XG", saldo: 4 },
  { id: 16698807512, nome: "Revoada dos Guarás Rosa G", saldo: 0 },
  { id: 16698808306, nome: "Reggae Roots P", saldo: 8 },
  { id: 16698808307, nome: "Reggae Roots M", saldo: 9 },
  { id: 16698808308, nome: "Reggae Roots G", saldo: 9 },
  { id: 16698808309, nome: "Reggae Roots GG", saldo: 6 },
  { id: 16698804811, nome: "Lendas e Carrancas P", saldo: 3 },
  { id: 16698804812, nome: "Lendas e Carrancas M", saldo: 6 },
  { id: 16698804813, nome: "Lendas e Carrancas G", saldo: 8 },
  { id: 16698804814, nome: "Lendas e Carrancas GG", saldo: 4 },
  { id: 16698804815, nome: "Lendas e Carrancas XG", saldo: 5 },
  { id: 16698804073, nome: "Tradição P", saldo: 5 },
  { id: 16698804074, nome: "Tradição M", saldo: 5 },
  { id: 16698804076, nome: "Tradição G", saldo: 6 },
  { id: 16698804077, nome: "Tradição GG", saldo: 5 },
  { id: 16698804078, nome: "Tradição XG", saldo: 3 },
  { id: 16698813268, nome: "Boi Maranhense que só XG", saldo: 0 },
  { id: 16698811271, nome: "Boizinho com Fio de Matraca P", saldo: 1 },
  { id: 16698811272, nome: "Boizinho com Fio de Matraca GG", saldo: 1 },
  { id: 16698814000, nome: "Tradição Texto G", saldo: 0 },
  { id: 16698810257, nome: "Caboclo de Pena P", saldo: 0 },
  { id: 16698810259, nome: "Caboclo de Pena M", saldo: 0 },
  { id: 16698810261, nome: "Caboclo de Pena G", saldo: 2 },
  { id: 16698810264, nome: "Caboclo de Pena GG", saldo: 0 },
  { id: 16698811627, nome: "Alusiva São Luís PP", saldo: 0 },
  { id: 16698811628, nome: "Alusiva São Luís GG", saldo: 0 },
  { id: 16698814686, nome: "Regatão G", saldo: 0 },
  // Infantis
  { id: 16698815980, nome: "Revoadinha Off White 4 anos", saldo: 1 },
  { id: 16698808468, nome: "Lenda da Serpente Infantil 8 anos", saldo: 0 },
  { id: 16698808714, nome: "Bumba meu Boi Infantil 10 anos", saldo: 0 },
  { id: 16698808715, nome: "Bumba meu Boi Infantil 12 anos", saldo: 1 },
  // Bonés
  { id: 16701478057, nome: "Boné Guarás Bege", saldo: 23 },
  // Ecobags
  { id: 16701486201, nome: "Ecobag Caboclo de Pena Grande", saldo: 24 },
  { id: 16701486200, nome: "Ecobag Caboclo de Pena Mini", saldo: 0 },
  { id: 16701490753, nome: "Ecobag Revoada dos Guarás Grande", saldo: 22 },
  { id: 16701490750, nome: "Ecobag Revoada dos Guarás Mini", saldo: 3 },
  { id: 16701490706, nome: "Ecobag Tradição Grande", saldo: 24 },
  { id: 16701490854, nome: "Ecobag Serpente Tons de Azul Grande", saldo: 23 },
  { id: 16701490851, nome: "Ecobag Serpente Tons de Azul Mini", saldo: 22 },
  { id: 16701491014, nome: "Ecobag Quebradeira de Coco Grande", saldo: 3 },
  { id: 16701491098, nome: "Ecobag Boizinho com fio de matraca Mini", saldo: 20 },
  // Necessaires
  { id: 16701478149, nome: "Necessaire Azulejos", saldo: 32 },
  { id: 16701478328, nome: "Necessaire Tradição Colorida", saldo: 33 },
  { id: 16701478277, nome: "Necessaire Tradição", saldo: 15 },
  { id: 16701478241, nome: "Necessaire Serpente Tons de Azul", saldo: 45 },
  { id: 16701478191, nome: "Necessaire Guarás", saldo: 33 },
  // Pareôs
  { id: 16701478379, nome: "Pareô Cidade dos Azulejos", saldo: 14 },
  { id: 16701478418, nome: "Pareô Reggae Roots", saldo: 16 },
  { id: 16701478426, nome: "Pareô Revoada dos Guarás", saldo: 9 },
  { id: 16701478410, nome: "Pareô Mosaico", saldo: 11 },
  // Papelaria e brindes
  { id: 16689787486, nome: "Lápis Plantável", saldo: 537 },
  { id: 16701502720, nome: "Canetas Ecológicas", saldo: 25 },
  { id: 16701503083, nome: "Bloco Anotação Caderninho Ecológico", saldo: 93 },
  { id: 16701539190, nome: "Kit Ecológico Bumba Meu Boi", saldo: 7 },
  { id: 16701539241, nome: "Kit Ecológico Cazumbá", saldo: 8 },
  { id: 16701538916, nome: "Kit Ecológico Guarás", saldo: 5 },
  { id: 16701539267, nome: "Kit Ecológico Ilha do Amor", saldo: 8 },
  { id: 16701503196, nome: "Kambada Goods", saldo: 11 },
  { id: 16701502407, nome: "Joguinhos Divertido", saldo: 32 },
  { id: 16689788251, nome: "Livro Vermelho (Historinha)", saldo: 3 },
  // Matracas e decoração
  { id: 16698777992, nome: "Matraca Pequena sem Suporte", saldo: 22 },
  { id: 16698777264, nome: "Matraca Grande sem Suporte", saldo: 10 },
  { id: 16698777852, nome: "Matraca Pequena com Suporte", saldo: 6 },
  { id: 16698780234, nome: "Matraca Kambada Play", saldo: 4 },
  { id: 16701503283, nome: "Placa de Madeira Redonda", saldo: 4 },
  { id: 16701503226, nome: "Mandala Modelos Diversos", saldo: 3 },
];

/** Balanços de produtos resolvidos pelo NOME (cadastro existente cujo id não estava no catálogo do site). */
export const BALANCOS_POR_NOME: { nome: string; saldo: number }[] = [{ nome: "Chaveiros em Madeira Pinus", saldo: 83 }];
