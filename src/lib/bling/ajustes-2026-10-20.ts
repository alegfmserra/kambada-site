/**
 * Correções pedidas pela Wilzanira e autorizadas pelo Alexandre em 20/10/2026.
 * Usado pela rota /api/bling/ajustes-wilzanira (GET ensaia, POST aplica).
 *
 * Cada passo tem uma chave (`apenas=<chave>` roda só ele) e um alvo fixo. As
 * funções de montagem do corpo são puras — testadas em ajustes-2026-10-20.test.ts
 * — e a rota só lê, chama, relê e confere.
 *
 * Fora daqui, de propósito:
 *  - preço da matraca DTF: não existe em lugar nenhum (Bling, Cadastro Mestre,
 *    Tabela de Atacado, proposta de 13/10). O passo fica BLOQUEADO até
 *    MATRACA_DTF.preco deixar de ser null;
 *  - fotos no Bling: a API só acrescenta. Trocar capa/remover duplicada é no
 *    painel, e depois /api/bling/fotos?aplicar=1&apenas=ID&forcar=1.
 */

import { DESCRICOES } from "./descricoes-finais";

export const ID_CATEGORIA = 13568333;
export const ID_DEPOSITO = 14888952004;

// ── 1. Regatão Sol Nosso de Cada Dia ──
/** O card certo (pai, com descrição e foto). */
export const REGATAO_PAI = 16698814567;
/** Variação "Tamanho:G" do pai — a contagem da Wilsonira (13/10) diz que a peça é GG. */
export const REGATAO_VARIACAO = 16698814686;
/**
 * Cadastro criado em 14/10 pela rota /ajustes para ser a variação GG: o Bling
 * gravou a variação SEM nome ("variacao.nome" vazio), e a vitrine passou a
 * mostrá-lo como um segundo card. Tem o saldo 1. Fica inativo (NÃO excluído),
 * e o saldo 1 passa para a variação do pai, renomeada para GG.
 */
export const REGATAO_DUPLICADO = 16719577404;
export const REGATAO_TAMANHO = "GG";
export const REGATAO_SALDO = 1;

// ── 2. Machão preto "Maranhense que só" (esgotado) ──
export const MACHAO = {
  nome: "Camisa Maranhense que só - Machão",
  /** Mesmo preço do Regatão, a única regata com preço no Bling (R$ 89,90). */
  preco: 89.9,
  /** Grade adulta padrão; todas a zero (esgotada). Confirmar a grade real com o ateliê. */
  tamanhos: ["P", "M", "G", "GG", "XG"],
  descricao: [
    "Tem gente que precisa explicar de onde é. A gente não: é só vestir. \"Maranhense que só\" agora vem num machão preto — sem manga, cava larga, pro calor da Ilha e pro arraial que entra pela madrugada.",
    "",
    "Cor: preta.",
  ].join("\n"),
};

// ── 3. Livro Trilíngue: não será mais produzido ──
export const LIVRO_TRILINGUE = 16689788713;

// ── 4. Placa de Madeira Grande → Placa de Madeira Retangular, com variações ──
export const PLACA = {
  id: 16701503321,
  nomeAntigo: "Placa de Madeira Grande",
  nome: "Placa de Madeira Retangular",
  preco: 160,
  adicionalFixacao: 20,
  modelos: ["Coreira", "Coreiro"],
};

export type VariacaoNova = { atributos: string; preco: number; ordem: number };

/** Modelo × fixação, cada uma com o preço dela: 160 sem, 180 com parafuso e puxador. */
export function variacoesDaPlaca(): VariacaoNova[] {
  const lista: VariacaoNova[] = [];
  for (const modelo of PLACA.modelos) {
    lista.push({ atributos: `Modelo:${modelo};Fixação:Sem parafuso e puxador`, preco: PLACA.preco, ordem: lista.length + 1 });
    lista.push({ atributos: `Modelo:${modelo};Fixação:Com parafuso e puxador`, preco: PLACA.preco + PLACA.adicionalFixacao, ordem: lista.length + 1 });
  }
  return lista;
}

// ── 5. Matraca Mini DTF (estampa impressa) — BLOQUEADA até ter preço ──
export const MATRACA_DTF = {
  nome: "Matraca Kambada Mini DTF sem Suporte",
  /** null = ninguém definiu. O passo não roda enquanto for null. */
  preco: null as number | null,
  /** Contagem da Wilsonira (13/10): "DTF 2+1+2 = 5", dentro das 22 da Pequena sem Suporte. */
  saldo: 5,
  /** Variação única da Matraca Pequena sem Suporte (pintada à mão): 22 − 5 DTF = 17. */
  idPintada: 16698777992,
  saldoPintada: 17,
  descricao: [
    "A matraca na versão mais em conta: a mesma madeira e o mesmo tamanho da mini, com a estampa impressa em DTF em vez de pintada à mão. Bate igual, cabe na mão da criança e vai no bolso pro arraial.",
    "",
    "Material: tatajuba; estampa em DTF.",
    "Medidas: 12×10×2 cm · ~200 g.",
    "Acompanha: cordão. NÃO acompanha suporte.",
    "Estampas: Boi preto, Cazumbá colorido, Cazumbá preto, Miolo de boi colorido e Miolo de boi preto — conforme disponibilidade.",
    "Cuidados: lugar seco, pano seco.",
  ].join("\n"),
};

// ── Montagem dos corpos (puras) ──

type Obj = Record<string, unknown>;

/**
 * Corpo do PUT no PAI do Regatão: descrição nova (com "Cor: off white.") e a
 * variação G renomeada para GG. O resto do produto volta como veio — inclusive
 * a variação duplicada, que é inativada no próprio cadastro, não apagada daqui.
 */
export function corpoRegataoPai(atual: Obj): Obj {
  const variacoes = (atual.variacoes as Obj[] | undefined) ?? [];
  if (!variacoes.some((v) => v.id === REGATAO_VARIACAO)) {
    throw new Error(`variação ${REGATAO_VARIACAO} não está no pai ${REGATAO_PAI}`);
  }
  return {
    ...atual,
    descricaoCurta: DESCRICOES[REGATAO_PAI],
    variacoes: variacoes.map((v) => {
      if (v.id !== REGATAO_VARIACAO) return v;
      const variacao = (v.variacao as Obj | undefined) ?? {};
      return {
        ...v,
        nome: `${atual.nome} Tamanho:${REGATAO_TAMANHO}`,
        variacao: { ...variacao, nome: `Tamanho:${REGATAO_TAMANHO}` },
      };
    }),
  };
}

/** Corpo do POST do machão: pai com as variações de tamanho, como a Camisa Tambor (14/10). */
export function corpoMachao(): Obj {
  return {
    nome: MACHAO.nome,
    preco: MACHAO.preco,
    tipo: "P",
    situacao: "A",
    formato: "V",
    categoria: { id: ID_CATEGORIA },
    descricaoCurta: MACHAO.descricao,
    variacoes: MACHAO.tamanhos.map((t, i) => ({
      nome: `${MACHAO.nome} Tamanho:${t}`,
      preco: MACHAO.preco,
      tipo: "P",
      situacao: "A",
      formato: "S",
      categoria: { id: ID_CATEGORIA },
      variacao: { nome: `Tamanho:${t}`, ordem: i + 1, produtoPai: { cloneInfo: true } },
    })),
  };
}

/**
 * Corpo do PUT que transforma a Placa Grande (produto simples) em pai com
 * variações, mantendo o mesmo ID — o mapa de fotos do site e o histórico de
 * pedidos continuam valendo.
 */
export function corpoPlaca(atual: Obj): Obj {
  return {
    ...atual,
    nome: PLACA.nome,
    preco: PLACA.preco,
    formato: "V",
    descricaoCurta: DESCRICOES[PLACA.id],
    variacoes: variacoesDaPlaca().map((v) => ({
      nome: `${PLACA.nome} ${v.atributos}`,
      preco: v.preco,
      tipo: "P",
      situacao: "A",
      formato: "S",
      categoria: { id: ID_CATEGORIA },
      variacao: { nome: v.atributos, ordem: v.ordem, produtoPai: { cloneInfo: true } },
    })),
  };
}

/** Corpo do POST da matraca DTF. Lança erro sem preço — não se cadastra produto a R$ 0 nem a preço inventado. */
export function corpoMatracaDtf(): Obj {
  if (MATRACA_DTF.preco === null) throw new Error("preço da Matraca Mini DTF não definido");
  return {
    nome: MATRACA_DTF.nome,
    preco: MATRACA_DTF.preco,
    tipo: "P",
    situacao: "A",
    formato: "S",
    categoria: { id: ID_CATEGORIA },
    descricaoCurta: MATRACA_DTF.descricao,
  };
}

/** Os passos, na ordem em que a rota os executa. */
export const PASSOS = [
  { chave: "regatao-duplicado", alvo: REGATAO_DUPLICADO, oQue: "zera o saldo e inativa o card duplicado do Regatão" },
  { chave: "regatao", alvo: REGATAO_PAI, oQue: "descrição com Cor: off white; variação G → GG; saldo da GG = 1" },
  { chave: "machao", alvo: null, oQue: "cria Camisa Maranhense que só - Machão (preta), grade P–XG a zero" },
  { chave: "trilingue", alvo: LIVRO_TRILINGUE, oQue: "inativa o Livro Trilíngue" },
  { chave: "placa", alvo: PLACA.id, oQue: "Placa Grande vira Placa de Madeira Retangular com 4 variações (160/180)" },
  { chave: "matraca-dtf", alvo: null, oQue: "cria Matraca Mini DTF (saldo 5) e baixa a Pequena pintada para 17 — BLOQUEADO sem preço" },
] as const;

export type ChavePasso = (typeof PASSOS)[number]["chave"];
