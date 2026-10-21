import type { Opcao } from "../catalogo";

/**
 * Seletor por atributo (matracas Estampa × Suporte, 21/10/2026).
 *
 * Quando TODAS as opções têm os mesmos atributos (dois ou mais), a página mostra
 * um grupo de botões por atributo em vez de uma lista com "Boizinho Miolo · Com
 * suporte", "Boizinho Miolo · Sem suporte"… A combinação escolhida aponta para
 * UMA variação do Bling (é ela que vai para o carrinho e para o pedido).
 */

export type Eixo = { chave: string; rotulo: string; valores: string[] };

/** Estampa primeiro (é o que troca a foto), suporte depois, o resto na ordem em que aparece. */
const PRIORIDADE: Record<string, number> = { estampa: 0, modelo: 1, suporte: 2, tamanho: 3 };

const ordemDoEixo = (chave: string) => PRIORIDADE[chave] ?? 9;

/** "Sem suporte" antes de "Com suporte" (o mais barato primeiro); demais na ordem de chegada. */
function ordenarValores(chave: string, valores: string[]): string[] {
  if (chave !== "suporte") return valores;
  const peso = (v: string) => (/^sem\b/i.test(v) ? 0 : /^com\b/i.test(v) ? 1 : 2);
  return [...valores].sort((a, b) => peso(a) - peso(b));
}

/** Os eixos do seletor, ou null quando as opções não formam uma grade de atributos. */
export function eixosDasOpcoes(opcoes: Opcao[]): Eixo[] | null {
  if (opcoes.length < 2) return null;
  const chaves = Object.keys(opcoes[0].atributos ?? {});
  if (chaves.length < 2) return null;
  const mesmasChaves = (o: Opcao) => {
    const k = Object.keys(o.atributos ?? {});
    return k.length === chaves.length && chaves.every((c) => k.includes(c));
  };
  if (!opcoes.every(mesmasChaves)) return null;

  return [...chaves]
    .sort((a, b) => ordemDoEixo(a) - ordemDoEixo(b))
    .map((chave) => ({
      chave,
      rotulo: chave.charAt(0).toUpperCase() + chave.slice(1),
      valores: ordenarValores(chave, [...new Set(opcoes.map((o) => o.atributos![chave]))]),
    }));
}

/** A opção da combinação escolhida — só quando todos os eixos têm valor. */
export function acharOpcao(opcoes: Opcao[], eixos: Eixo[], escolha: Record<string, string>): Opcao | null {
  if (!eixos.every((e) => escolha[e.chave])) return null;
  return opcoes.find((o) => eixos.every((e) => o.atributos?.[e.chave] === escolha[e.chave])) ?? null;
}

/** Existe variação com este valor, combinado com o que já foi escolhido nos OUTROS eixos? */
export function valorExiste(opcoes: Opcao[], eixos: Eixo[], escolha: Record<string, string>, chave: string, valor: string): boolean {
  return opcoes.some(
    (o) => o.atributos?.[chave] === valor && eixos.every((e) => e.chave === chave || !escolha[e.chave] || o.atributos?.[e.chave] === escolha[e.chave]),
  );
}

/** Preço único de um valor (ex.: "Com suporte" = R$ 190 em todas as estampas), ou null se varia. */
export function precoDoValor(opcoes: Opcao[], chave: string, valor: string): number | null {
  const precos = new Set(opcoes.filter((o) => o.atributos?.[chave] === valor).map((o) => o.preco));
  return precos.size === 1 ? [...precos][0] : null;
}

/** Os valores de um eixo têm preços diferentes entre si? (vale mostrar o preço no botão) */
export function eixoMudaPreco(opcoes: Opcao[], eixo: Eixo): boolean {
  const precos = eixo.valores.map((v) => precoDoValor(opcoes, eixo.chave, v));
  return precos.every((p) => p !== null) && new Set(precos).size > 1;
}

/**
 * Ao escolher um valor, a escolha nos outros eixos é mantida se a combinação
 * existir; se não existir (ex.: "Leque Bordado" só com suporte), o outro eixo
 * é ajustado para o único valor possível, ou limpo.
 */
export function escolher(opcoes: Opcao[], eixos: Eixo[], escolha: Record<string, string>, chave: string, valor: string): Record<string, string> {
  const nova = { ...escolha, [chave]: valor };
  for (const e of eixos) {
    if (e.chave === chave || !nova[e.chave]) continue;
    if (valorExiste(opcoes, eixos, { [chave]: valor }, e.chave, nova[e.chave])) continue;
    const possiveis = e.valores.filter((v) => valorExiste(opcoes, eixos, { [chave]: valor }, e.chave, v));
    if (possiveis.length === 1) nova[e.chave] = possiveis[0];
    else delete nova[e.chave];
  }
  return nova;
}

/**
 * A opção que representa a escolha parcial — para trocar a foto assim que a
 * ESTAMPA (o primeiro eixo) é escolhida. Só o suporte escolhido não troca a
 * foto: mostraria uma estampa que o cliente não pediu.
 */
export function opcaoParaFoto(opcoes: Opcao[], eixos: Eixo[], escolha: Record<string, string>): Opcao | null {
  if (!eixos.length || !escolha[eixos[0].chave]) return null;
  return opcoes.find((o) => eixos.every((e) => !escolha[e.chave] || o.atributos?.[e.chave] === escolha[e.chave])) ?? null;
}

/** Valor como o cliente lê: "Com" → "Com suporte". */
export function rotuloDoValor(chave: string, valor: string): string {
  // "Leque Bordado" passou a se chamar "Folhas" (Alexandre, 21/10/2026).
  if (chave === "suporte" && /^leque bordado$/i.test(valor.trim())) return "Folhas";
  return chave === "suporte" && /^(com|sem)$/i.test(valor.trim()) ? `${valor.trim()} suporte` : valor;
}
