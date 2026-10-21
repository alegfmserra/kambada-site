import { NextResponse } from "next/server";
import { chamarBling, listarTudo } from "@/lib/bling/cliente";
import { invalidarCatalogoEmMemoria } from "@/lib/bling/produtos";
import type { ProdutoBling } from "@/lib/bling/tipos";
import { segredoDeManutencao } from "@/lib/seguranca/segredo";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * "Leque Bordado" passa a se chamar "Folhas" (Alexandre, 21/10/2026, tarde):
 * renomeia o valor do atributo Suporte nas variações da Matraca Kambada Grande
 * e o texto da descrição do produto. Nota fiscal e pedidos novos saem com o
 * nome novo.
 *
 * GET ensaia; POST `aplicar=1` grava em lotes (`limite`, padrão 7) e relê cada
 * variação. `parte=descricao` troca só o texto da descrição do pai.
 */

type Obj = Record<string, unknown>;
const DE = "Leque Bordado";
const PARA = "Folhas";
const DESCRICAO_DE = /Leque Bordado \(recortado em folhas\)/g;
const DESCRICAO_PARA = "Folhas (recortado em folhas — preto no Boi Blackout, colorido nas estampas coloridas)";

async function paiGrande(): Promise<Obj> {
  const pais = await listarTudo<ProdutoBling>("/produtos?criterio=2&tipo=C", { revalidar: 0 });
  const pai = pais.find((p) => p.nome === "Matraca Kambada Grande");
  if (!pai) throw new Error("Matraca Kambada Grande não encontrada no Bling");
  return (await chamarBling<{ data: Obj }>(`/produtos/${pai.id}`, { revalidar: 0 })).data;
}

async function responder(requisicao: Request, escrever: boolean) {
  if (!segredoDeManutencao(requisicao)) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  const url = new URL(requisicao.url);
  const aplicar = escrever && url.searchParams.get("aplicar") === "1";
  const limite = Math.min(14, Math.max(1, Number(url.searchParams.get("limite") ?? 7)));
  const pai = await paiGrande();

  if (url.searchParams.get("parte") === "descricao") {
    const atual = String(pai.descricaoCurta ?? "");
    const nova = atual.replace(DESCRICAO_DE, DESCRICAO_PARA);
    if (!aplicar || nova === atual) return NextResponse.json({ modo: aplicar ? "nada a mudar" : "ensaio", muda: nova !== atual });
    await chamarBling(`/produtos/${pai.id}`, { metodo: "PUT", corpo: { ...pai, descricaoCurta: nova } });
    const relido = (await chamarBling<{ data: Obj }>(`/produtos/${pai.id}`, { revalidar: 0 })).data;
    invalidarCatalogoEmMemoria();
    return NextResponse.json({
      modo: "aplicado",
      bateu: String(relido.descricaoCurta ?? "").includes(DESCRICAO_PARA),
      variacoesIntactas: ((relido.variacoes as Obj[]) ?? []).length === ((pai.variacoes as Obj[]) ?? []).length,
    });
  }

  const alvos = ((pai.variacoes as Obj[]) ?? [])
    .map((v) => ({ id: Number(v.id), nome: String(v.nome ?? ""), atributos: String((v.variacao as Obj | undefined)?.nome ?? "") }))
    .filter((v) => v.atributos.includes(`Suporte:${DE}`) || v.nome.includes(`Suporte:${DE}`));
  if (!aplicar) return NextResponse.json({ modo: "ensaio", faltam: alvos.length, alvos });

  const feitos: unknown[] = [];
  for (const a of alvos.slice(0, limite)) {
    const filho = (await chamarBling<{ data: Obj }>(`/produtos/${a.id}`, { revalidar: 0 })).data;
    const variacao = (filho.variacao as Obj | undefined) ?? {};
    await chamarBling(`/produtos/${a.id}`, {
      metodo: "PUT",
      corpo: {
        ...filho,
        nome: String(filho.nome ?? "").replace(DE, PARA),
        variacao: { ...variacao, nome: String(variacao.nome ?? "").replace(DE, PARA) },
      },
    });
    const relido = (await chamarBling<{ data: Obj }>(`/produtos/${a.id}`, { revalidar: 0 })).data;
    feitos.push({ id: a.id, antes: a.nome, agora: relido.nome, atributos: (relido.variacao as Obj | undefined)?.nome, preco: relido.preco, bateu: !String(relido.nome).includes(DE) });
  }
  invalidarCatalogoEmMemoria();
  return NextResponse.json({ modo: "aplicado", feitos, faltam: alvos.length - feitos.length });
}

export const GET = (r: Request) => responder(r, false);
export const POST = (r: Request) => responder(r, true);
