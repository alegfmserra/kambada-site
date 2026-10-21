import { NextResponse } from "next/server";
import { chamarBling, listarTudo } from "@/lib/bling/cliente";
import { precoDaRegra } from "@/lib/bling/precosVariacoes";
import { invalidarCatalogoEmMemoria } from "@/lib/bling/produtos";
import type { ProdutoBling } from "@/lib/bling/tipos";
import { segredoDeManutencao } from "@/lib/seguranca/segredo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Corrige no Bling o preço de cada variação de ecobag e matraca (regras em
 * lib/bling/precosVariacoes.ts). O site mostra o preço da variação como está
 * no Bling; estavam com o preço do pai (o Bling ignora o preço dos filhos num
 * PUT do pai — por isso aqui é variação por variação).
 *
 * GET ensaia; POST `aplicar=1` grava e relê, em lotes (`limite`, padrão 12):
 * a requisição longa caía no proxy da Hostinger (307) e o trabalho morria no
 * meio. Chame de novo até `faltam: 0`.
 */

type Obj = Record<string, unknown>;

async function planejar() {
  const pais = (await listarTudo<ProdutoBling>("/produtos?criterio=2", { revalidar: 0 })).filter(
    (p) => p.formato === "V" && (/^ecobag/i.test(p.nome) || /^matraca kambada (mini|grande)$/i.test(p.nome)),
  );
  const mudar: { pai: string; id: number; variacao: string; de: unknown; para: number }[] = [];
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

async function responder(requisicao: Request, escrever: boolean) {
  if (!segredoDeManutencao(requisicao)) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  const url = new URL(requisicao.url);
  const aplicar = escrever && url.searchParams.get("aplicar") === "1";
  const limite = Math.min(30, Math.max(1, Number(url.searchParams.get("limite") ?? 12)));
  const plano = await planejar();
  if (!aplicar) {
    return NextResponse.json({ modo: "ensaio", produtos: plano.produtos, faltam: plano.mudar.length, mudar: plano.mudar });
  }

  const feitos: unknown[] = [];
  for (const m of plano.mudar.slice(0, limite)) {
    const filho = (await chamarBling<{ data: Obj }>(`/produtos/${m.id}`, { revalidar: 0 })).data;
    await chamarBling(`/produtos/${m.id}`, { metodo: "PUT", corpo: { ...filho, preco: m.para } });
    const relido = (await chamarBling<{ data: Obj }>(`/produtos/${m.id}`, { revalidar: 0 })).data;
    feitos.push({ pai: m.pai, variacao: m.variacao, de: m.de, para: m.para, agora: relido.preco, bateu: Number(relido.preco) === m.para });
  }
  invalidarCatalogoEmMemoria();
  return NextResponse.json({ modo: "aplicado", feitos, faltam: plano.mudar.length - feitos.length });
}

export const GET = (r: Request) => responder(r, false);
export const POST = (r: Request) => responder(r, true);
