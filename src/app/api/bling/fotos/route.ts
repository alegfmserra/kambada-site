import { timingSafeEqual } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { NextResponse } from "next/server";
import { chamarBling } from "@/lib/bling/cliente";
import { ErroBling } from "@/lib/bling/tipos";
import { arquivoTokens } from "@/lib/bling/tokens";
import { FOTOS_PRODUTOS } from "@/lib/fotosProdutos";
import { urlDoSite } from "@/lib/loja/urlDoSite";

export const dynamic = "force-dynamic";

/**
 * Anexa as fotos de produto no Bling — ESCREVE NO ERP.
 *
 * Mesmo protocolo da rota de correção de preços (03/09/2026):
 *  - GET só ENSAIA: diz, produto a produto, o que faria. Nada é escrito.
 *  - POST escreve, e ainda exige `aplicar=1`.
 *  - `apenas=ID` restringe a um produto — é assim que a primeira vez se faz.
 *  - Antes de escrever, o produto original inteiro vai para um arquivo de
 *    cópia no servidor. Sem cópia, não há volta.
 *  - Relê depois de gravar, para PROVAR que a imagem ficou — não supor.
 *  - Para no primeiro erro.
 *
 * Só toca produto SEM NENHUMA imagem. Produto que já tem foto é pulado: esta
 * rota nunca troca nem apaga foto existente.
 *
 * Como a foto entra: pelo campo `midia.imagens.imagensURL` — o campo de
 * ESCRITA segundo a especificação OpenAPI do Bling (os campos `externas` e
 * `internas` são só de leitura). O Bling baixa a imagem do link e passa a
 * guardá-la no armazenamento dele; por isso o arquivo precisa estar publicado
 * no site ANTES de chamar esta rota.
 */

function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

type Imagens = { externas?: unknown[]; internas?: unknown[] };
type ProdutoCompleto = Record<string, unknown> & {
  nome?: string;
  midia?: { video?: unknown; imagens?: Imagens };
};

const quantasImagens = (p: ProdutoCompleto) =>
  (p.midia?.imagens?.internas?.length ?? 0) + (p.midia?.imagens?.externas?.length ?? 0);

/** Onde a foto mora: guardada no Bling (internas) ou só o nosso link (externas). */
const ondeEstao = (p: ProdutoCompleto) => ({
  guardadasNoBling: p.midia?.imagens?.internas?.length ?? 0,
  linksExternos: p.midia?.imagens?.externas?.length ?? 0,
});

const esperar = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function guardarCopia(originais: unknown[]): Promise<string> {
  const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
  const caminho = join(dirname(arquivoTokens()), `backup-fotos-${carimbo}.json`);
  await mkdir(dirname(caminho), { recursive: true });
  await writeFile(caminho, JSON.stringify(originais, null, 2), "utf8");
  return caminho;
}

/** Cada passo custa três chamadas (ler, gravar, reler) a 3 por segundo. */
const MAXIMO_PADRAO = 10;

async function responder(requisicao: Request, escrever: boolean) {
  const url = new URL(requisicao.url);
  if (!segredoConfere(url.searchParams.get("token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const base = urlDoSite(requisicao);
  const apenas = url.searchParams.get("apenas");
  const ids = Object.keys(FOTOS_PRODUTOS)
    .map(Number)
    .filter((id) => !apenas || String(id) === apenas);

  const aplicar = escrever && url.searchParams.get("aplicar") === "1";
  const pedido = Number(url.searchParams.get("maximo"));
  const maximo = Number.isInteger(pedido) && pedido > 0 && pedido <= 30 ? pedido : MAXIMO_PADRAO;

  const passos: Record<string, unknown>[] = [];
  const originais: unknown[] = [];
  let escritos = 0;

  for (const id of ids) {
    const link = `${base}/fotos/produtos/${id}.jpg`;
    try {
      const atual = await chamarBling<{ data: ProdutoCompleto }>(`/produtos/${id}`, { revalidar: 0 });
      const ja = quantasImagens(atual.data);

      if (ja > 0) {
        passos.push({
          id,
          nome: atual.data.nome,
          acao: "pular",
          motivo: `já tem ${ja} imagem(ns)`,
          ...ondeEstao(atual.data),
        });
        continue;
      }
      if (!aplicar) {
        passos.push({ id, nome: atual.data.nome, acao: "anexar", link });
        continue;
      }
      if (escritos >= maximo) {
        passos.push({ id, nome: atual.data.nome, acao: "pendente", link });
        continue;
      }

      originais.push(atual.data);
      const corpo: ProdutoCompleto = {
        ...atual.data,
        midia: { ...(atual.data.midia ?? {}), imagens: { imagensURL: [{ link }] } as Imagens },
      };
      await chamarBling(`/produtos/${id}`, { metodo: "PUT", corpo });
      escritos++;

      // O Bling baixa a imagem com alguns segundos de atraso (visto em
      // 08/10/2026: a releitura imediata dá zero e, um minuto depois, a foto
      // está lá). Relê até três vezes antes de concluir que não ficou.
      let depois = await chamarBling<{ data: ProdutoCompleto }>(`/produtos/${id}`, { revalidar: 0 });
      for (let tentativa = 0; tentativa < 3 && quantasImagens(depois.data) === 0; tentativa++) {
        await esperar(4000);
        depois = await chamarBling<{ data: ProdutoCompleto }>(`/produtos/${id}`, { revalidar: 0 });
      }
      const agora = quantasImagens(depois.data);
      passos.push({
        id,
        nome: depois.data.nome,
        acao: "anexada",
        link,
        conferido: { imagensNoBling: agora, ficou: agora > 0, ...ondeEstao(depois.data) },
      });
      // Gravou e, mesmo esperando, não ficou: é o Bling recusando em
      // silêncio. Para aqui — repetir nos outros não muda o resultado.
      if (agora === 0) break;
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

  const copia = originais.length ? await guardarCopia(originais) : null;
  return NextResponse.json({
    modo: aplicar ? "aplicado" : "ensaio — nada foi escrito no Bling",
    base,
    resumo: {
      anexar: passos.filter((p) => p.acao === "anexar").length,
      anexadas: passos.filter((p) => p.acao === "anexada").length,
      pular: passos.filter((p) => p.acao === "pular").length,
      pendentes: passos.filter((p) => p.acao === "pendente").length,
      erros: passos.filter((p) => p.acao === "erro").length,
    },
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
