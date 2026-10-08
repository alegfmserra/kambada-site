import { timingSafeEqual } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { NextResponse } from "next/server";
import { chamarBling } from "@/lib/bling/cliente";
import { buscarCatalogo } from "@/lib/bling/produtos";
import { ErroBling } from "@/lib/bling/tipos";
import { arquivoTokens } from "@/lib/bling/tokens";
import { ncmDoProduto } from "@/lib/fiscal/ncm";

export const dynamic = "force-dynamic";

/**
 * Ajusta o NCM (e a origem 0 — nacional) dos produtos no Bling para o que
 * a Kambada já usa nas notas emitidas — ESCREVE NO ERP.
 *
 * Mesmo protocolo das rotas de preço e de fotos:
 *  - GET só ENSAIA (NCM atual × o das notas). Nada é escrito.
 *  - POST escreve, e ainda exige `aplicar=1`.
 *  - `apenas=ID` restringe a um produto — é assim que a primeira vez se faz.
 *  - Cópia do produto original antes de gravar; releitura para provar.
 *  - Para no primeiro erro.
 *  - `de`/`ate` fatiam a lista (pai + variações), porque o Bling aceita 3
 *    chamadas por segundo e uma requisição longa demais cai por tempo.
 *
 * Produto sem NCM nas notas (`ncmDoProduto` devolve null) não é tocado.
 */

function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

type ProdutoCompleto = Record<string, unknown> & {
  nome?: string;
  tributacao?: Record<string, unknown> & { ncm?: string; origem?: number };
};

async function guardarCopia(originais: unknown[]): Promise<string> {
  const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
  const caminho = join(dirname(arquivoTokens()), `backup-fiscal-${carimbo}.json`);
  await mkdir(dirname(caminho), { recursive: true });
  await writeFile(caminho, JSON.stringify(originais, null, 2), "utf8");
  return caminho;
}

async function responder(requisicao: Request, escrever: boolean) {
  const url = new URL(requisicao.url);
  if (!segredoConfere(url.searchParams.get("token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const catalogo = await buscarCatalogo();
  // Lista plana: cada produto do site e cada variação dele, com o nome do pai
  // (é o nome do pai que define o tipo da peça).
  const alvos = catalogo.produtos.flatMap((p) => {
    const ids = new Set<number>();
    if (p.idBling) ids.add(p.idBling);
    for (const o of p.opcoes ?? []) ids.add(o.idBling);
    return [...ids].map((id) => ({ id, nomePai: p.nome }));
  });

  const apenas = url.searchParams.get("apenas");
  const de = Number(url.searchParams.get("de") ?? 0);
  const ate = Number(url.searchParams.get("ate") ?? 25);
  const fatia = apenas ? alvos.filter((a) => String(a.id) === apenas) : alvos.slice(de, ate);

  const aplicar = escrever && url.searchParams.get("aplicar") === "1";
  const passos: Record<string, unknown>[] = [];
  const originais: unknown[] = [];

  for (const { id, nomePai } of fatia) {
    const regra = ncmDoProduto(nomePai);
    if (!regra) {
      passos.push({ id, produto: nomePai, acao: "sem_regra", motivo: "nunca saiu em nota — decidir com o Glauco" });
      continue;
    }
    try {
      const atual = await chamarBling<{ data: ProdutoCompleto }>(`/produtos/${id}`, { revalidar: 0 });
      const ncmAtual = atual.data.tributacao?.ncm ?? "";
      const origemAtual = atual.data.tributacao?.origem;
      const base = { id, produto: atual.data.nome, ncmAtual, origemAtual, ncmDasNotas: regra.ncm, fonte: regra.fonte, alerta: regra.alerta };

      if (ncmAtual === regra.ncm && origemAtual === 0) {
        passos.push({ ...base, acao: "ok" });
        continue;
      }
      if (!aplicar) {
        passos.push({ ...base, acao: "ajustar" });
        continue;
      }

      originais.push(atual.data);
      const corpo: ProdutoCompleto = {
        ...atual.data,
        tributacao: { ...(atual.data.tributacao ?? {}), ncm: regra.ncm, origem: 0 },
      };
      await chamarBling(`/produtos/${id}`, { metodo: "PUT", corpo });
      const depois = await chamarBling<{ data: ProdutoCompleto }>(`/produtos/${id}`, { revalidar: 0 });
      const ficou = depois.data.tributacao?.ncm === regra.ncm;
      passos.push({ ...base, acao: "ajustado", conferido: { ncm: depois.data.tributacao?.ncm, ficou } });
      if (!ficou) break;
    } catch (e) {
      passos.push({
        id,
        produto: nomePai,
        acao: "erro",
        erro: e instanceof Error ? e.message : String(e),
        respostaDoBling: e instanceof ErroBling ? e.corpo : undefined,
      });
      break;
    }
  }

  const copia = originais.length ? await guardarCopia(originais) : null;
  const conta = (a: string) => passos.filter((p) => p.acao === a).length;
  return NextResponse.json({
    modo: aplicar ? "aplicado" : "ensaio — nada foi escrito no Bling",
    total: alvos.length,
    fatia: apenas ? `apenas ${apenas}` : `${de}–${Math.min(ate, alvos.length)}`,
    resumo: { ok: conta("ok"), ajustar: conta("ajustar"), ajustados: conta("ajustado"), semRegra: conta("sem_regra"), erros: conta("erro") },
    copiaDosOriginais: copia,
    passos,
  });
}

export async function GET(requisicao: Request) {
  return responder(requisicao, false);
}

export async function POST(requisicao: Request) {
  return responder(requisicao, true);
}
