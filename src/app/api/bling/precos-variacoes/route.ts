import { NextResponse } from "next/server";
import { chamarBling } from "@/lib/bling/cliente";
import { precosForaDaRegra } from "@/lib/bling/conferirPrecosVariacoes";
import { invalidarCatalogoEmMemoria } from "@/lib/bling/produtos";
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

async function responder(requisicao: Request, escrever: boolean) {
  if (!segredoDeManutencao(requisicao)) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  const url = new URL(requisicao.url);
  const aplicar = escrever && url.searchParams.get("aplicar") === "1";
  const limite = Math.min(30, Math.max(1, Number(url.searchParams.get("limite") ?? 12)));
  const plano = await precosForaDaRegra();
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
