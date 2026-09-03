import type { Categoria, Produto } from "../catalogo";
import {
  CATEGORIAS as CATEGORIAS_LOCAIS,
  PRODUTOS as PRODUTOS_LOCAIS,
} from "../catalogo";
import { chamarBling, listarTudo } from "./cliente";
import type { ProdutoBling, SaldoBling } from "./tipos";
import { estaAutorizado } from "./tokens";

/**
 * Traz o catálogo do Bling e o converte para o formato que o site já usa.
 *
 * Regra de ouro: **a loja nunca fica fora do ar por causa do Bling.** Se o
 * aplicativo não estiver autorizado, se a API cair ou se o limite estourar,
 * o site serve o catálogo local — o mesmo que veio da planilha. É pior
 * mostrar preço velho do que mostrar uma página de erro para quem quer comprar.
 *
 * ---
 *
 * O QUE A LISTAGEM DO BLING **NÃO** DEVOLVE (medido em 2026-09-03)
 *
 * `GET /produtos` traz apenas: id, nome, codigo, preco, precoCusto, tipo,
 * situacao, formato, descricaoCurta, imagemURL.
 *
 * Não traz `categoria`, não traz `estoque`, não traz `variacoes`. A versão
 * anterior deste arquivo lia os três direto da listagem, e por isso: nenhum
 * produto casava com categoria alguma, todo saldo vinha zero (a loja inteira
 * apareceria "Esgotado") e nenhuma variação era exibida.
 *
 * Daí as três decisões abaixo — cada uma existe por causa de um fato medido,
 * não por preferência:
 *
 * 1. A categoria é deduzida do NOME. A conta do Bling tem uma única categoria,
 *    a "Categoria padrão" (id 13568333), com todos os produtos dentro. Não há
 *    o que casar. O nome, por outro lado, é regular: "Camisa …", "Matraca …".
 * 2. O saldo vem de `/estoques/saldos`, em lote, e o de um produto-pai é a
 *    SOMA dos saldos dos seus filhos — quem guarda peça é a variação.
 * 3. O filho de variação não vai para a vitrine; ele vira uma opção dentro
 *    do pai. Ver `ehFilhoDeVariacao`.
 */

export type Catalogo = {
  categorias: Categoria[];
  produtos: Produto[];
  origem: "bling" | "local";
  /** Preenchido quando a origem não é o Bling — por falha ou por decisão. */
  motivo?: string;
  /** Produtos do Bling que não pertencem a nenhuma vitrine existente. */
  naoClassificados?: string[];
};

function comAcentoNormalizado(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}

export function paraSlug(texto: string): string {
  return comAcentoNormalizado(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * De que prateleira é este produto, pelo nome.
 *
 * Substitui o casamento por categoria do ERP, que hoje é impossível: existe
 * uma só categoria no Bling e a listagem sequer devolve esse campo.
 *
 * O que não casar fica de fora da vitrine — comportamento correto, porque uma
 * categoria nova exige também chamada e foto, que são curadoria humana.
 * `naoClassificados` reporta o que ficou de fora, para não sumir em silêncio.
 */
/**
 * Papelaria, Brindes e Decoração (2026-09-03) ficam de fora desta lista de
 * propósito: os nomes reais no Bling — "Kit Ecológico", "Kambada Goods",
 * "Joguinhos Divertido", "Livro Trilíngue"... — não compartilham um
 * prefixo comum como "Camisa X" ou "Boné X". Casamento por regex não
 * serve aqui; precisaria de uma tabela de nome exato, que ainda não foi
 * escrita porque a vitrine hoje lê do catálogo local (ver
 * BLING_FONTE_DO_CATALOGO em produtos.ts), não do Bling. Se a fonte virar
 * "bling" um dia, essas três categorias precisam de tratamento à parte.
 */
const REGRAS_DE_CATEGORIA: [RegExp, string][] = [
  [/^camisas?\b/, "camisas"],
  [/^matracas?\b/, "matracas"],
  [/^ecobags?\b/, "ecobags"],
  [/^bones?\b/, "bones"],
  [/^pareos?\b/, "pareos"],
  [/^necessaires?\b/, "necessaires"],
];

export function categoriaPeloNome(nome: string): string | null {
  const limpo = comAcentoNormalizado(nome);
  for (const [padrao, slug] of REGRAS_DE_CATEGORIA) {
    if (padrao.test(limpo)) return slug;
  }
  return null;
}

/**
 * Nomes dos produtos-pai, do mais longo para o mais curto.
 *
 * A ordem importa: "Camisa Tradição Texto" precisa ser testado antes de
 * "Camisa", senão um filho seria atribuído ao pai errado.
 */
export function nomesDeProdutosPai(todos: ProdutoBling[]): string[] {
  return todos
    .filter((p) => p.formato === "V")
    .map((p) => p.nome)
    .sort((a, b) => b.length - a.length);
}

/** O pai deste filho, ou null se o produto for avulso. */
export function paiDoProduto(
  p: ProdutoBling,
  nomesDePais: string[],
): string | null {
  return (
    nomesDePais.find((nome) => p.nome !== nome && p.nome.startsWith(`${nome} `)) ??
    null
  );
}

/**
 * O produto é um filho de variação (um tamanho, uma estampa)?
 *
 * Duas provas, nesta ordem:
 * 1. `variacao.produtoPai` — inequívoco, mas só existe no produto individual;
 * 2. o nome começa com o nome de um produto-pai seguido de espaço, que é
 *    exatamente como o Bling nomeia o filho ("Boné" → "Boné Cor/Estampa:…").
 *
 * A regra 2 é o que funciona na listagem, e foi conferida contra os 120
 * produtos da conta: separou 142 filhos de 12 produtos avulsos sem erro.
 */
export function ehFilhoDeVariacao(
  p: ProdutoBling,
  nomesDePais: string[],
): boolean {
  if (p.variacao?.produtoPai?.id) return true;
  return paiDoProduto(p, nomesDePais) !== null;
}

/**
 * "Boné Cor/Estampa:Guarás Bege", com pai "Boné", vira "Guarás Bege".
 *
 * Quando a peça tem mais de um atributo, o Bling junta tudo com ponto e
 * vírgula: "Estampa:Caboclo de Pena;Boi Frontal:Boi Frontal". Sem tratar,
 * isso ia inteiro para a vitrine, com dois-pontos e repetição.
 */
export function rotuloDaVariacao(
  nomeDoFilho: string,
  nomeDoPai: string,
): string {
  const semPai = nomeDoFilho.startsWith(`${nomeDoPai} `)
    ? nomeDoFilho.slice(nomeDoPai.length + 1)
    : nomeDoFilho;

  const partes = semPai
    .split(";")
    // O Bling prefixa com o nome do atributo: "Tamanho:GG", "Estampa:Azulejos".
    .map((parte) => parte.replace(/^[^:]{1,30}:/, "").trim())
    .filter(Boolean);

  // "Boi Frontal:Boi Frontal" vira "Boi Frontal" uma vez só.
  const semRepeticao = [...new Set(partes)];
  return semRepeticao.join(" · ") || semPai.trim();
}

/** Saldos de vários produtos de uma vez, sem estourar o tamanho da URL. */
async function saldosEmLote(ids: number[]): Promise<Map<number, number>> {
  const saldos = new Map<number, number>();
  const TAMANHO_DO_LOTE = 40;

  for (let i = 0; i < ids.length; i += TAMANHO_DO_LOTE) {
    const consulta = ids
      .slice(i, i + TAMANHO_DO_LOTE)
      .map((id) => `idsProdutos[]=${id}`)
      .join("&");
    const r = await chamarBling<{ data?: SaldoBling[] }>(
      `/estoques/saldos?${consulta}`,
      { revalidar: 300 },
    );
    for (const s of r.data ?? []) {
      if (s.produto?.id) saldos.set(s.produto.id, s.saldoVirtualTotal ?? 0);
    }
  }

  return saldos;
}

const CATALOGO_LOCAL: Catalogo = {
  categorias: CATEGORIAS_LOCAIS,
  produtos: PRODUTOS_LOCAIS,
  origem: "local",
};

/**
 * De onde vem o catálogo da vitrine.
 *
 * O padrão é `local`, e isso é deliberado: em 2026-09-03 o preço de venda no
 * Bling estava com o valor de produção (camisa a R$ 33,80, quando ela é
 * vendida a R$ 89,90). Ligar a vitrine no Bling hoje derrubaria os preços da
 * loja. O código já sabe ler o Bling inteiro; falta o preço estar certo lá.
 *
 * Quando estiver, basta `BLING_FONTE_DO_CATALOGO=bling`.
 */
function fonteEscolhida(): "local" | "bling" {
  return process.env.BLING_FONTE_DO_CATALOGO === "bling" ? "bling" : "local";
}

export async function buscarCatalogo(): Promise<Catalogo> {
  if (fonteEscolhida() === "local") {
    return {
      ...CATALOGO_LOCAL,
      motivo:
        "Por decisão: a vitrine usa o catálogo conferido enquanto o preço de venda no Bling não estiver corrigido",
    };
  }

  if (!(await estaAutorizado())) {
    return {
      ...CATALOGO_LOCAL,
      motivo: "Aplicativo ainda não autorizado no Bling",
    };
  }

  try {
    return await montarDoBling();
  } catch (erro) {
    const motivo = erro instanceof Error ? erro.message : String(erro);
    // Falhar aqui não pode derrubar a loja.
    console.error("[bling] catálogo indisponível, usando o local:", motivo);
    return { ...CATALOGO_LOCAL, motivo };
  }
}

export async function montarDoBling(): Promise<Catalogo> {
  const todos = await listarTudo<ProdutoBling>("/produtos?criterio=2"); // 2 = ativos
  const nomesDePais = nomesDeProdutosPai(todos);

  const filhosPorPai = new Map<string, ProdutoBling[]>();
  const paraVitrine: ProdutoBling[] = [];

  for (const p of todos) {
    if (p.formato === "V") {
      paraVitrine.push(p);
      continue;
    }
    const pai = paiDoProduto(p, nomesDePais);
    if (pai) {
      filhosPorPai.set(pai, [...(filhosPorPai.get(pai) ?? []), p]);
      continue;
    }
    if (ehFilhoDeVariacao(p, nomesDePais)) continue; // filho sem pai na lista
    paraVitrine.push(p); // produto simples, sem variação
  }

  // Um pai não guarda peça: quem guarda é a variação. Pedimos o saldo de
  // todo mundo de uma vez e somamos depois.
  const saldos = await saldosEmLote([
    ...paraVitrine.map((p) => p.id),
    ...[...filhosPorPai.values()].flat().map((p) => p.id),
  ]);

  const naoClassificados: string[] = [];
  const produtos: Produto[] = [];

  for (const p of paraVitrine) {
    const categoria = categoriaPeloNome(p.nome);
    if (!categoria) {
      naoClassificados.push(p.nome);
      continue;
    }

    const filhos = filhosPorPai.get(p.nome) ?? [];
    const precos = [p.preco, ...filhos.map((f) => f.preco)].filter(
      (v): v is number => typeof v === "number" && v > 0,
    );
    if (precos.length === 0) continue; // sem preço não se vende

    const menor = Math.min(...precos);
    const maior = Math.max(...precos);

    produtos.push({
      slug: paraSlug(`${p.nome}-${p.id}`),
      nome: p.nome,
      categoria,
      preco: menor,
      precoMaximo: maior > menor ? maior : undefined,
      variacoes: filhos.length
        ? filhos.map((f) => rotuloDaVariacao(f.nome, p.nome)).filter(Boolean)
        : ["Único"],
      quantidade: filhos.length
        ? filhos.reduce((soma, f) => soma + (saldos.get(f.id) ?? 0), 0)
        : (saldos.get(p.id) ?? 0),
    });
  }

  // Sem nenhum produto reconhecido, algo está errado no mapeamento —
  // servir uma loja vazia seria pior que servir o catálogo local.
  if (produtos.length === 0) {
    return {
      ...CATALOGO_LOCAL,
      motivo: "O Bling respondeu, mas nenhum produto casou com as categorias",
      naoClassificados,
    };
  }

  // Categoria sem produto vira link quebrado no menu.
  const comProduto = new Set(produtos.map((p) => p.categoria));
  return {
    categorias: CATEGORIAS_LOCAIS.filter((c) => comProduto.has(c.slug)),
    produtos,
    origem: "bling",
    ...(naoClassificados.length ? { naoClassificados } : {}),
  };
}

/** Saldo ao vivo de um produto, para conferir antes de fechar o pedido. */
export async function saldoAoVivo(idProduto: number): Promise<number | null> {
  try {
    const r = await chamarBling<{ data?: { saldoVirtualTotal?: number }[] }>(
      `/estoques/saldos?idsProdutos[]=${idProduto}`,
      { revalidar: 0 },
    );
    return r.data?.[0]?.saldoVirtualTotal ?? null;
  } catch {
    return null;
  }
}
