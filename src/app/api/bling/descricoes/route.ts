import { timingSafeEqual } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { NextResponse } from "next/server";
import { chamarBling } from "@/lib/bling/cliente";
import { DESCRICOES, DIVERGENCIAS } from "@/lib/bling/descricoes-finais";
import { invalidarCatalogoEmMemoria } from "@/lib/bling/produtos";
import { ErroBling } from "@/lib/bling/tipos";
import { arquivoTokens } from "@/lib/bling/tokens";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Grava a descrição curta dos produtos no Bling — ESCREVE NO ERP.
 *
 * Mesmo protocolo das rotas de preço e de fotos:
 *  - GET só ENSAIA: mostra, produto a produto, o texto atual e o novo.
 *  - POST escreve, e exige `aplicar=1`.
 *  - `apenas=ID` restringe a um produto — a primeira vez é assim.
 *  - `maximo=N` limita quantos grava por chamada (3 chamadas por produto).
 *  - O produto original inteiro vai para um arquivo de cópia antes de gravar.
 *  - Relê depois para PROVAR que o texto ficou.
 *  - Para no primeiro erro.
 *
 * Fonte dos textos: src/lib/bling/descricoes-finais.ts (rascunho do Fred
 * revisado pela Wilsonira em 13/10/2026). Produto cujo texto já é o final é
 * pulado, então a rota pode rodar quantas vezes for preciso.
 */

function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

type ProdutoCompleto = Record<string, unknown> & { nome?: string; descricaoCurta?: string };

const normalizar = (t: string | undefined) => (t ?? "").replace(/\r\n/g, "\n").trim();

async function guardarCopia(originais: unknown[]): Promise<string> {
  const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
  const caminho = join(dirname(arquivoTokens()), `backup-descricoes-${carimbo}.json`);
  await mkdir(dirname(caminho), { recursive: true });
  await writeFile(caminho, JSON.stringify(originais, null, 2), "utf8");
  return caminho;
}

async function responder(requisicao: Request, escrever: boolean) {
  const url = new URL(requisicao.url);
  if (!segredoConfere(url.searchParams.get("token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }
  const apenas = url.searchParams.get("apenas");
  const aplicar = escrever && url.searchParams.get("aplicar") === "1";
  const pedido = Number(url.searchParams.get("maximo"));
  const maximo = Number.isInteger(pedido) && pedido > 0 && pedido <= 30 ? pedido : 8;
  const ids = Object.keys(DESCRICOES).map(Number).filter((id) => !apenas || String(id) === apenas);

  const passos: Record<string, unknown>[] = [];
  const originais: unknown[] = [];
  let escritos = 0;

  for (const id of ids) {
    const novo = DESCRICOES[id];
    try {
      const atual = await chamarBling<{ data: ProdutoCompleto }>(`/produtos/${id}`, { revalidar: 0 });
      const texto = normalizar(atual.data.descricaoCurta);
      if (texto === normalizar(novo)) {
        passos.push({ id, nome: atual.data.nome, acao: "pular", motivo: "já é o texto final" });
        continue;
      }
      if (!aplicar) {
        passos.push({ id, nome: atual.data.nome, acao: "gravar", atual: texto.slice(0, 120), novo: novo.slice(0, 120) });
        continue;
      }
      if (escritos >= maximo) {
        passos.push({ id, nome: atual.data.nome, acao: "pendente" });
        continue;
      }
      originais.push(atual.data);
      await chamarBling(`/produtos/${id}`, { metodo: "PUT", corpo: { ...atual.data, descricaoCurta: novo } });
      escritos++;
      const depois = await chamarBling<{ data: ProdutoCompleto }>(`/produtos/${id}`, { revalidar: 0 });
      const ficou = normalizar(depois.data.descricaoCurta) === normalizar(novo);
      passos.push({ id, nome: depois.data.nome, acao: "gravada", conferido: { ficou } });
      if (!ficou) break;
    } catch (e) {
      passos.push({
        id,
        acao: "erro",
        erro: e instanceof Error ? e.message : String(e),
        respostaDoBling: e instanceof ErroBling ? e.corpo : undefined,
      });
      break;
    }
  }

  if (escritos > 0) invalidarCatalogoEmMemoria();
  const copia = originais.length ? await guardarCopia(originais) : null;
  return NextResponse.json({
    modo: aplicar ? "aplicado" : "ensaio — nada foi escrito no Bling",
    resumo: {
      gravar: passos.filter((p) => p.acao === "gravar").length,
      gravadas: passos.filter((p) => p.acao === "gravada").length,
      pular: passos.filter((p) => p.acao === "pular").length,
      pendentes: passos.filter((p) => p.acao === "pendente").length,
      erros: passos.filter((p) => p.acao === "erro").length,
    },
    copiaDosOriginais: copia,
    divergenciasParaDecidir: DIVERGENCIAS,
    passos,
  });
}

export async function GET(requisicao: Request) {
  return responder(requisicao, false);
}
export async function POST(requisicao: Request) {
  return responder(requisicao, true);
}
