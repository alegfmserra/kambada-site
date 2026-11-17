import type { Categoria, Produto } from "../catalogo";
import { disponibilidade } from "../catalogo";

/**
 * Busca da loja (17/11/2026). Roda sobre o catálogo que a vitrine já carrega:
 * sem serviço de busca, sem índice à parte. Com ~60 peças, comparar texto dá conta.
 *
 * Procura no nome da peça, no nome da categoria e nas opções (tamanho, cor,
 * estampa, suporte), sem ligar para acento nem maiúscula. Todas as palavras
 * digitadas precisam aparecer. Plural simples é tolerado ("camisas" acha "Camisa").
 *
 * Arquivo puro (vai também ao navegador): nada de módulo de servidor aqui.
 */

export const TAMANHO_MAXIMO_DO_TERMO = 60;

/** Sem acento, sem maiúscula, só letras, números e espaço simples. */
export function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** O que a pessoa digitou, aparado e limitado. Vários valores na URL (?q=a&q=b): vale o primeiro. */
export function lerTermo(bruto: string | string[] | undefined): string {
  const texto = Array.isArray(bruto) ? (bruto[0] ?? "") : (bruto ?? "");
  return texto.replace(/\s+/g, " ").trim().slice(0, TAMANHO_MAXIMO_DO_TERMO);
}

/** "camisas" → "camisa"; palavra curta fica como está ("gg" não vira "g"). */
function semPlural(palavra: string): string {
  return palavra.length > 3 && palavra.endsWith("s") ? palavra.slice(0, -1) : palavra;
}

export function palavrasDoTermo(termo: string): string[] {
  return normalizar(termo).split(" ").filter(Boolean).map(semPlural);
}

/** Tudo o que se pode procurar numa peça, já normalizado: [nome, resto]. */
function textosDaPeca(produto: Produto, nomeDaCategoria: string): [string, string] {
  const opcoes = (produto.opcoes ?? []).flatMap((o) => [o.rotulo, ...Object.values(o.atributos ?? {})]);
  return [normalizar(produto.nome), normalizar([nomeDaCategoria, produto.categoria, ...produto.variacoes, ...opcoes].join(" "))];
}

/**
 * Peças que casam com o termo. Ordem: primeiro as que casam pelo NOME, depois
 * as que casam por categoria ou opção; dentro de cada grupo, as disponíveis
 * antes das esgotadas, e o resto na ordem do catálogo. Termo vazio não acha nada.
 */
export function buscarProdutos(produtos: Produto[], categorias: Categoria[], termo: string): Produto[] {
  const palavras = palavrasDoTermo(termo);
  if (palavras.length === 0) return [];
  const nomeDe = new Map(categorias.map((c) => [c.slug, c.nome]));

  const achados: { produto: Produto; peso: number; ordem: number }[] = [];
  produtos.forEach((produto, ordem) => {
    if (produto.oculto) return;
    const [nome, resto] = textosDaPeca(produto, nomeDe.get(produto.categoria) ?? "");
    const tudo = `${nome} ${resto}`;
    if (!palavras.every((p) => tudo.includes(p))) return;
    const peloNome = palavras.every((p) => nome.includes(p)) ? 0 : 2;
    const esgotada = disponibilidade(produto).disponivel ? 0 : 1;
    achados.push({ produto, peso: peloNome + esgotada, ordem });
  });
  return achados.sort((a, b) => a.peso - b.peso || a.ordem - b.ordem).map((a) => a.produto);
}

/**
 * O termo como vai para o Google Analytics. Busca é texto livre: se alguém
 * digitar e-mail, telefone ou CPF no campo, isso não pode sair do site.
 */
export function termoParaMedicao(termo: string): string {
  if (/@/.test(termo) || /\d{6,}/.test(termo.replace(/[\s.\-()]/g, ""))) return "(oculto)";
  return normalizar(termo).slice(0, 40);
}
