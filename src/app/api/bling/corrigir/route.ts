import { timingSafeEqual } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { NextResponse } from "next/server";
import { chamarBling, listarTudo } from "@/lib/bling/cliente";
import {
  A_INATIVAR,
  FORA_DA_CORRECAO,
  alvoDoProduto,
} from "@/lib/bling/precos-corretos";
import { nomesDeProdutosPai } from "@/lib/bling/produtos";
import { arquivoTokens } from "@/lib/bling/tokens";
import { ErroBling, type ProdutoBling } from "@/lib/bling/tipos";

export const dynamic = "force-dynamic";

/**
 * Corrige preço de venda e custo dos produtos no Bling.
 *
 * ESTA ROTA ESCREVE NO ERP. Por isso:
 *
 * - **GET só ensaia.** Devolve o plano, produto a produto, sem tocar em nada.
 * - **POST aplica**, e ainda exige `aplicar=1` — para um clique errado não
 *   virar 120 alterações em cadastro que emite nota fiscal.
 * - `apenas=ID` restringe a um produto, que é como a primeira execução deve
 *   ser feita: um produto, conferido no Bling, e só então o resto.
 * - Antes de escrever, o produto original inteiro é gravado em disco, na
 *   pasta persistente. Sem cópia do valor anterior, não há volta.
 *
 * A atualização é feita relendo o produto inteiro e devolvendo-o com dois
 * campos trocados — nunca montando um objeto novo, que apagaria o resto.
 */

function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

type Passo = {
  id: number;
  nome: string;
  acao: "corrigir" | "inativar" | "pular";
  de?: { venda: number; custo: number };
  para?: { venda: number; custo: number };
  motivo?: string;
};

/**
 * Quais registros serão inativados, provados um a um.
 *
 * O nome NÃO basta aqui. "Camisa Alusiva São Luís" começa com "Camisa ", e
 * pelo nome pareceria variação do cadastro genérico — inativá-la levaria
 * junto o catálogo inteiro de camisas. A prova é `variacao.produtoPai`, que
 * só vem no produto individual, e que separou "Camisa Estampa:Caboclo de
 * Pena" (variação de verdade) de "Camisa Unissex" (produto avulso a R$ 80).
 *
 * Heurística de nome serve para montar vitrine. Não serve para escrever no ERP.
 */
async function idsParaInativar(todos: ProdutoBling[]): Promise<Set<number>> {
  const ids = new Set<number>();

  for (const nome of A_INATIVAR) {
    const raiz =
      todos.find((p) => p.nome === nome && p.formato === "V") ??
      todos.find((p) => p.nome === nome);
    if (!raiz) continue;
    ids.add(raiz.id);

    for (const candidato of todos) {
      if (candidato.id === raiz.id) continue;
      if (!candidato.nome.startsWith(`${nome} `)) continue;
      const det = await chamarBling<{ data: ProdutoBling }>(
        `/produtos/${candidato.id}`,
        { revalidar: 0 },
      );
      if (det.data.variacao?.produtoPai?.id === raiz.id) ids.add(candidato.id);
    }
  }

  return ids;
}

async function montarPlano(apenas: number | null): Promise<Passo[]> {
  const todos = await listarTudo<ProdutoBling>("/produtos?criterio=2");
  const nomesDePais = nomesDeProdutosPai(todos);
  // Um produto-pai nunca é variação de outro, por mais que o nome sugira.
  const paiDe = (p: ProdutoBling) =>
    p.formato === "V"
      ? null
      : (nomesDePais.find((n) => p.nome !== n && p.nome.startsWith(`${n} `)) ??
        null);

  const inativar = await idsParaInativar(todos);
  const passos: Passo[] = [];

  for (const p of todos) {
    if (apenas !== null && p.id !== apenas) continue;

    const raiz = paiDe(p) ?? p.nome;

    if (inativar.has(p.id)) {
      passos.push({
        id: p.id,
        nome: p.nome,
        acao: "inativar",
        motivo: "cadastro genérico que duplica o estoque das camisas",
      });
      continue;
    }

    if (FORA_DA_CORRECAO.includes(p.nome) || FORA_DA_CORRECAO.includes(raiz)) {
      passos.push({
        id: p.id,
        nome: p.nome,
        acao: "pular",
        motivo: "sem correspondência inequívoca na planilha",
      });
      continue;
    }

    const alvo = alvoDoProduto(p, nomesDePais);
    if (!alvo) {
      passos.push({
        id: p.id,
        nome: p.nome,
        acao: "pular",
        motivo: "não está na tabela aprovada",
      });
      continue;
    }

    const venda = p.preco ?? 0;
    const custo = p.precoCusto ?? 0;
    if (venda === alvo.venda && custo === alvo.custo) {
      passos.push({ id: p.id, nome: p.nome, acao: "pular", motivo: "já correto" });
      continue;
    }

    passos.push({
      id: p.id,
      nome: p.nome,
      acao: "corrigir",
      de: { venda, custo },
      para: { venda: alvo.venda, custo: alvo.custo },
    });
  }

  return passos;
}

/** Grava os originais antes de qualquer escrita. Sem isso, não há volta. */
async function guardarCopia(originais: unknown[]): Promise<string> {
  const carimbo = new Date().toISOString().replace(/[:.]/g, "-");
  const caminho = join(
    dirname(arquivoTokens()),
    `backup-produtos-${carimbo}.json`,
  );
  await mkdir(dirname(caminho), { recursive: true });
  await writeFile(caminho, JSON.stringify(originais, null, 2), "utf8");
  return caminho;
}

/**
 * Quantos passos por chamada.
 *
 * Cada passo custa três requisições (ler, gravar, reler) a 3 req/s. Os 113
 * produtos de uma vez levariam uns dois minutos e estourariam o tempo da
 * requisição no meio — deixando a correção pela metade e sem relatório.
 *
 * Como o plano é recalculado a cada chamada e marca "já correto" o que
 * terminou, basta chamar de novo até zerar. Retomar é o comportamento normal.
 */
const MAXIMO_PADRAO = 20;

async function aplicar(passos: Passo[], maximo: number) {
  const originais: unknown[] = [];
  const feitos: Record<string, unknown>[] = [];

  for (const passo of passos) {
    if (passo.acao === "pular") continue;
    if (feitos.length >= maximo) break;

    try {
      // Relemos o produto inteiro: a atualização devolve o objeto completo
      // com dois campos trocados. Montar um objeto novo apagaria o resto.
      const atual = await chamarBling<{ data: Record<string, unknown> }>(
        `/produtos/${passo.id}`,
        { revalidar: 0 },
      );
      const corpo = { ...atual.data };
      originais.push(corpo);

      if (passo.acao === "inativar") {
        corpo.situacao = "I";
      } else {
        /**
         * Só o preço de venda. O `precoCusto` aparece na LISTAGEM mas não no
         * produto individual, e mandá-lo no PUT não surte efeito — medido em
         * 2026-09-03: o preço passou de 19 para 55 e o custo continuou 0.
         *
         * Escrever um campo que o Bling ignora daria a impressão de que o
         * custo foi corrigido quando não foi. Fica de fora, e documentado.
         */
        corpo.preco = passo.para!.venda;
      }

      await chamarBling(`/produtos/${passo.id}`, {
        metodo: "PUT",
        corpo,
      });

      // Relê para provar o que ficou gravado, em vez de supor.
      const depois = await chamarBling<{ data: ProdutoBling }>(
        `/produtos/${passo.id}`,
        { revalidar: 0 },
      );
      feitos.push({
        id: passo.id,
        nome: passo.nome,
        acao: passo.acao,
        conferido: {
          preco: depois.data.preco,
          precoCusto: depois.data.precoCusto,
          situacao: depois.data.situacao,
          nome: depois.data.nome,
        },
      });
    } catch (e) {
      feitos.push({
        id: passo.id,
        nome: passo.nome,
        acao: passo.acao,
        erro: e instanceof Error ? e.message : String(e),
        // O corpo diz o motivo. "403" sozinho não permite agir.
        respostaDoBling: e instanceof ErroBling ? e.corpo : undefined,
      });
      // Para na primeira falha: seguir escrevendo depois de um erro
      // desconhecido é como se descobre um estrago grande.
      break;
    }
  }

  const copia = originais.length ? await guardarCopia(originais) : null;
  return { feitos, copiaDosOriginais: copia };
}

async function responder(requisicao: Request, escrever: boolean) {
  const url = new URL(requisicao.url);
  if (!segredoConfere(url.searchParams.get("token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const apenasBruto = url.searchParams.get("apenas");
  const apenas = apenasBruto && /^\d+$/.test(apenasBruto) ? Number(apenasBruto) : null;

  const passos = await montarPlano(apenas);
  const resumo = {
    corrigir: passos.filter((p) => p.acao === "corrigir").length,
    inativar: passos.filter((p) => p.acao === "inativar").length,
    pular: passos.filter((p) => p.acao === "pular").length,
  };

  if (!escrever || url.searchParams.get("aplicar") !== "1") {
    return NextResponse.json({
      modo: "ensaio — nada foi escrito no Bling",
      resumo,
      passos,
    });
  }

  const pedido = Number(url.searchParams.get("maximo"));
  const maximo =
    Number.isInteger(pedido) && pedido > 0 && pedido <= 40
      ? pedido
      : MAXIMO_PADRAO;

  const resultado = await aplicar(passos, maximo);
  const pendentes =
    passos.filter((p) => p.acao !== "pular").length - resultado.feitos.length;

  return NextResponse.json({
    modo: "aplicado",
    resumo,
    // Quantos ainda faltam. Chame de novo até zerar.
    pendentes,
    ...resultado,
  });
}

export async function GET(requisicao: Request) {
  return responder(requisicao, false);
}

export async function POST(requisicao: Request) {
  return responder(requisicao, true);
}
