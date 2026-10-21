/**
 * Papelaria, chaveiro, ecobag e puxador — decisões do Alexandre em 21/10/2026.
 * Usado pela rota /api/bling/ajustes-2026-10-21 (GET ensaia, POST aplica um passo).
 *
 * A confusão dos bloquinhos: o cadastro "Bloquinho" (R$ 9, saldo 0) tinha as
 * fotos do caderninho KRAFT, e o "Bloco de Anotação Caderninho Ecológico"
 * (R$ 17, saldo 93) tinha as fotos do bloquinho de CAPA IMPRESSA. Em vez de
 * trocar fotos (a API do Bling só acrescenta imagem), troca-se o resto:
 *  - 16689786870 vira o kraft: nome do caderninho, R$ 17, 4 estampas com saldo;
 *  - 16701503083 vira o de capa impressa: "Bloquinho", R$ 10, saldo 0 (a
 *    contagem dele vem depois — Alexandre).
 * Saldos do kraft pelo Alexandre (21/10): Caboclo de Pena 24 · Cazumbá 28 ·
 * Ilha do Amor 23 · Bumba meu Boi 19 = 94. O documento das Marias (13/10) dá
 * Boi 18 (total 93) — vale o número mais novo, do Alexandre.
 */

import { DESCRICOES } from "./descricoes-finais";

export { ID_CATEGORIA, ID_DEPOSITO } from "./ajustes-2026-10-20";

type Obj = Record<string, unknown>;

export const BLOQUINHO_CAPA = { id: 16701503083, nome: "Bloquinho", preco: 10, saldo: 0 };

export const CADERNINHO_KRAFT = {
  id: 16689786870,
  nomeAntigo: "Bloquinho",
  nome: "Bloco de Anotação Caderninho Ecológico",
  preco: 17,
  estampas: [
    { nome: "Bumba meu Boi", saldo: 19 },
    { nome: "Cazumbá", saldo: 28 },
    { nome: "Caboclo de Pena", saldo: 24 },
    { nome: "Ilha do Amor", saldo: 23 },
  ],
};

/** Chaveiro Kambadinha: R$ 10 nas duas cores, 15 de cada (Alexandre, 21/10). */
export const KAMBADINHA = {
  id: 16701502913,
  preco: 10,
  cores: [
    { id: 16722497302, atributos: "Cor:Amarelo", saldo: 15 },
    { id: 16722497303, atributos: "Cor:Preto", saldo: 15 },
  ],
};

/** Ecobag Revoada dos Guarás Mini: 3 → 2 (uma vendida no balcão). */
export const REVOADA_MINI = { id: 16701490750, saldo: 2 };

export const PUXADOR = { id: 16722270860, nome: "Puxador - Suporte para Coreira" };

/**
 * Ecobag Carranca Encantada: estampa "São Luís Ilha Encantada" (a foto que estava, por engano, na
 * Serpente). Só existe Grande; sem estoque por ora (Alexandre, 21/10). R$ 55 = regra da ecobag Grande.
 */
export const CARRANCA = {
  nome: "Ecobag Carranca Encantada",
  preco: 55,
  tamanho: "Grande",
  descricao: [
    "São Luís, Ilha Encantada: a carranca em azul sobre algodão cru, com o nome da Ilha ao lado. Bolsa de feira, de praia e de arraial.",
    "",
    "Material: algodão cru, estampa em silk, fechamento em velcro.",
    "Medidas: Grande 40×35 cm, alça trançada de 58 cm.",
    "Cuidados: lavável; não usar alvejante.",
  ].join("\n"),
};

export function corpoCarranca(idCategoria: number): Obj {
  const categoria = { id: idCategoria };
  return {
    nome: CARRANCA.nome,
    preco: CARRANCA.preco,
    tipo: "P",
    situacao: "A",
    formato: "V",
    categoria,
    descricaoCurta: CARRANCA.descricao,
    variacoes: [{
      nome: `${CARRANCA.nome} Tamanho:${CARRANCA.tamanho}`,
      preco: CARRANCA.preco,
      tipo: "P",
      situacao: "A",
      formato: "S",
      categoria,
      variacao: { nome: `Tamanho:${CARRANCA.tamanho}`, ordem: 1, produtoPai: { cloneInfo: true } },
    }],
  };
}

export function variacoesDoKraft() {
  return CADERNINHO_KRAFT.estampas.map((e, i) => ({ atributos: `Estampa:${e.nome}`, ordem: i + 1, saldo: e.saldo }));
}

/** PUT do bloquinho de capa impressa: nome, preço e o texto que era do outro cadastro. */
export function corpoBloquinhoCapa(atual: Obj): Obj {
  return { ...atual, nome: BLOQUINHO_CAPA.nome, preco: BLOQUINHO_CAPA.preco, descricaoCurta: DESCRICOES[BLOQUINHO_CAPA.id] };
}

/**
 * PUT que transforma o "Bloquinho" (simples) no caderninho kraft com 4
 * estampas, mantendo o ID. O Bling já recusou essa conversão por API (Placa
 * Retangular, 20/10); se recusar de novo, as variações são criadas no painel e
 * o passo "caderninho-kraft-saldo" completa o resto.
 */
export function corpoCaderninhoKraft(atual: Obj): Obj {
  const categoria = (atual.categoria as Obj | undefined) ?? { id: 0 };
  return {
    ...atual,
    nome: CADERNINHO_KRAFT.nome,
    preco: CADERNINHO_KRAFT.preco,
    formato: "V",
    descricaoCurta: DESCRICOES[CADERNINHO_KRAFT.id],
    variacoes: variacoesDoKraft().map((v) => ({
      nome: `${CADERNINHO_KRAFT.nome} ${v.atributos}`,
      preco: CADERNINHO_KRAFT.preco,
      tipo: "P",
      situacao: "A",
      formato: "S",
      categoria,
      variacao: { nome: v.atributos, ordem: v.ordem, produtoPai: { cloneInfo: true } },
    })),
  };
}

export const PASSOS = [
  { chave: "bloquinho-capa", alvo: BLOQUINHO_CAPA.id, oQue: "capa impressa: nome Bloquinho, R$ 17 → 10, descrição da capa branca, saldo 93 → 0" },
  { chave: "caderninho-kraft", alvo: CADERNINHO_KRAFT.id, oQue: "Bloquinho R$ 9 → Bloco de Anotação Caderninho Ecológico R$ 17 com 4 estampas e saldo (19/28/24/23)" },
  { chave: "caderninho-kraft-saldo", alvo: CADERNINHO_KRAFT.id, oQue: "depois da conversão no painel: nome, preço, descrição e saldo de cada estampa" },
  { chave: "kambadinha", alvo: KAMBADINHA.id, oQue: "Chaveiro Kambadinha R$ 15 → 10 (pai e as 2 cores), saldo 10 → 15 em cada" },
  { chave: "revoada-mini", alvo: REVOADA_MINI.id, oQue: "Ecobag Revoada dos Guarás Mini: saldo 3 → 2" },
  { chave: "carranca", alvo: null, oQue: "cria Ecobag Carranca Encantada, só Grande, R$ 55, sem estoque" },
  { chave: "puxador", alvo: PUXADOR.id, oQue: "renomeia Placa de Madeira - Parafuso e Puxador → Puxador - Suporte para Coreira" },
] as const;

export type ChavePasso = (typeof PASSOS)[number]["chave"];
