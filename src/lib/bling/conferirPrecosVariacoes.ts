import { chamarBling, listarTudo } from "./cliente";
import { precoDaRegra } from "./precosVariacoes";
import type { ProdutoBling } from "./tipos";

type Obj = Record<string, unknown>;

export type PrecoForaDaRegra = { pai: string; id: number; variacao: string; de: unknown; para: number };

/**
 * Lê no Bling cada variação de ecobag e matraca e devolve as que estão fora da
 * regra (lib/bling/precosVariacoes.ts). SÓ LEITURA.
 *
 * Por que existe (21/10/2026): salvar o produto-PAI — no painel ou por uma
 * rota que faz PUT nele, como a de fotos — repõe o preço do pai em todas as
 * variações. O checkout cobra o preço da variação no Bling, então uma Ecobag
 * Grande voltava a sair por R$ 40. Usado pela rota /api/bling/precos-variacoes
 * (que corrige) e pela rotina de manutenção (que só avisa).
 */
export async function precosForaDaRegra(): Promise<{ produtos: string[]; mudar: PrecoForaDaRegra[] }> {
  const pais = (await listarTudo<ProdutoBling>("/produtos?criterio=2", { revalidar: 0 })).filter(
    (p) => p.formato === "V" && (/^ecobag/i.test(p.nome) || /^matraca kambada (mini|grande)$/i.test(p.nome)),
  );
  const mudar: PrecoForaDaRegra[] = [];
  for (const pai of pais) {
    const lido = (await chamarBling<{ data: Obj }>(`/produtos/${pai.id}`, { revalidar: 0 })).data;
    for (const v of (lido.variacoes as Obj[] | undefined) ?? []) {
      const atributos = String((v.variacao as Obj | undefined)?.nome ?? v.nome ?? "");
      const para = precoDaRegra(pai.nome, atributos);
      if (para !== null && Number(v.preco) !== para) {
        mudar.push({ pai: pai.nome, id: Number(v.id), variacao: atributos, de: v.preco, para });
      }
    }
  }
  return { produtos: pais.map((p) => p.nome), mudar };
}
