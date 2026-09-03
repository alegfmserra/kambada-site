import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { chamarBling, listarTudo } from "@/lib/bling/cliente";
import { ErroBling, type ProdutoBling } from "@/lib/bling/tipos";

export const dynamic = "force-dynamic";

/**
 * Cria as Ecobags — Fase 3 da reestruturação "estampa é produto".
 *
 * Diferente de Bonés/Necessaires/Pareôs (Fase 1: produto simples por
 * estampa), Ecobag tem uma SEGUNDA dimensão real — Mini e Grande são
 * tamanhos de verdade, não uma variação artificial. Aqui o padrão certo é
 * o mesmo das Camisas: a estampa é o produto-PAI, o tamanho é a variação
 * dentro dele. "Ecobag Revoada dos Guarás" com filhos "Mini" e "Grande".
 *
 * Uma peça (pai + variações) nasce num ÚNICO POST /produtos — o schema
 * aceita um array `variacoes` aninhado, com `variacao.produtoPai.cloneInfo`
 * (visto em developer.bling.com.br/referencia, 2026-09-03). O estoque, por
 * outro lado, vive no FILHO (cada tamanho tem seu próprio saldo, como já
 * acontece em Camisas) — por isso o saldo é lançado depois, por variação,
 * não no pai.
 *
 * "Caboclo de Pena Laranja/Marrom" (Grande) e "Caboclo de Pena" (Mini): a
 * planilha descreve a cor só na linha Grande. Tratado como a MESMA estampa
 * — decisão registrada aqui porque, se estiver errada, é fácil de corrigir
 * (cadastro novo, não dado histórico).
 *
 * ESTA ROTA ESCREVE NO ERP — mesma disciplina das anteriores: GET ensaia,
 * POST exige aplicar=1, apenas=<slug> testa uma peça de cada vez, tudo
 * conferido por releitura.
 */

const ID_CATEGORIA = 13568333;
const ID_DEPOSITO = 14888952004;
const VENDA_MINI = 40;
const VENDA_GRANDE = 55;

type Tamanho = { rotulo: "Mini" | "Grande"; quantidade: number };
type NovaEcobag = { slug: string; estampa: string; tamanhos: Tamanho[] };

const ECOBAGS: NovaEcobag[] = [
  { slug: "caboclo-de-pena", estampa: "Caboclo de Pena", tamanhos: [{ rotulo: "Mini", quantidade: 1 }, { rotulo: "Grande", quantidade: 21 }] },
  { slug: "tradicao", estampa: "Tradição", tamanhos: [{ rotulo: "Grande", quantidade: 21 }] },
  { slug: "revoada-guaras", estampa: "Revoada dos Guarás", tamanhos: [{ rotulo: "Mini", quantidade: 4 }, { rotulo: "Grande", quantidade: 20 }] },
  { slug: "serpente-azul", estampa: "Serpente Tons de Azul", tamanhos: [{ rotulo: "Mini", quantidade: 20 }, { rotulo: "Grande", quantidade: 19 }] },
  { slug: "carcara", estampa: "Carcará", tamanhos: [{ rotulo: "Grande", quantidade: 3 }] },
  { slug: "quebradeira-coco", estampa: "Quebradeira de Coco", tamanhos: [{ rotulo: "Grande", quantidade: 4 }] },
  { slug: "sao-luis-azulejos", estampa: "São Luís Azulejos", tamanhos: [{ rotulo: "Mini", quantidade: 18 }] },
  { slug: "boizinho-matraca", estampa: "Boizinho com fio de matraca", tamanhos: [{ rotulo: "Mini", quantidade: 19 }] },
];

function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function nomesExistentes(): Promise<Set<string>> {
  const todos = await listarTudo<ProdutoBling>("/produtos?criterio=2", { revalidar: 0 });
  return new Set(todos.map((p) => p.nome));
}

function precoDoTamanho(rotulo: "Mini" | "Grande"): number {
  return rotulo === "Mini" ? VENDA_MINI : VENDA_GRANDE;
}

async function responder(requisicao: Request, escrever: boolean) {
  const url = new URL(requisicao.url);
  if (!segredoConfere(url.searchParams.get("token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const apenas = url.searchParams.get("apenas");
  const alvos = ECOBAGS.filter((e) => apenas === null || e.slug === apenas);

  const nomePai = (e: NovaEcobag) => `Ecobag ${e.estampa}`;
  const existentes = await nomesExistentes();
  const plano = alvos.map((e) => ({
    slug: e.slug,
    nomePai: nomePai(e),
    tamanhos: e.tamanhos,
    acao: existentes.has(nomePai(e)) ? "pular" : "criar",
    motivo: existentes.has(nomePai(e)) ? "já existe" : undefined,
  }));

  if (!escrever || url.searchParams.get("aplicar") !== "1") {
    return NextResponse.json({ modo: "ensaio — nada foi escrito no Bling", plano });
  }

  const feitos: Record<string, unknown>[] = [];
  for (const item of plano) {
    if (item.acao === "pular") continue;
    const e = ECOBAGS.find((x) => x.slug === item.slug)!;

    try {
      const corpo = {
        nome: item.nomePai,
        preco: precoDoTamanho(e.tamanhos[0].rotulo),
        tipo: "P",
        situacao: "A",
        formato: "V",
        categoria: { id: ID_CATEGORIA },
        variacoes: e.tamanhos.map((t, i) => ({
          nome: `${item.nomePai} Tamanho:${t.rotulo}`,
          preco: precoDoTamanho(t.rotulo),
          tipo: "P",
          situacao: "A",
          formato: "S",
          categoria: { id: ID_CATEGORIA },
          variacao: {
            nome: `Tamanho:${t.rotulo}`,
            ordem: i + 1,
            produtoPai: { cloneInfo: true },
          },
        })),
      };

      const criado = await chamarBling<{
        data: {
          id: number;
          variations?: { saved?: { id: number }[] };
        };
      }>("/produtos", { metodo: "POST", corpo });

      const idPai = criado.data.id;

      // Relê o pai inteiro pra ver a lista real de filhos que o Bling criou —
      // não confia na resposta do POST pra saber os ids das variações.
      const paiLido = await chamarBling<{
        data: { nome: string; situacao: string; formato: string };
      }>(`/produtos/${idPai}`, { revalidar: 0 });

      const todosAtuais = await listarTudo<ProdutoBling>("/produtos?criterio=2", {
        revalidar: 0,
      });
      const filhos = todosAtuais.filter(
        (p) => p.nome !== item.nomePai && p.nome.startsWith(`${item.nomePai} `),
      );

      // Confirma cada filho por leitura individual (variacao.produtoPai) e
      // lança o saldo dele — é o filho que guarda estoque, não o pai.
      const filhosConferidos = [];
      for (const filho of filhos) {
        const lido = await chamarBling<{
          data: {
            nome: string;
            preco: number;
            variacao?: { nome?: string; produtoPai?: { id: number } };
          };
        }>(`/produtos/${filho.id}`, { revalidar: 0 });

        const rotulo = e.tamanhos.find((t) => lido.data.variacao?.nome === `Tamanho:${t.rotulo}`);
        const paiConfere = lido.data.variacao?.produtoPai?.id === idPai;

        if (rotulo && paiConfere) {
          await chamarBling("/estoques", {
            metodo: "POST",
            corpo: {
              produto: { id: filho.id },
              deposito: { id: ID_DEPOSITO },
              operacao: "B",
              quantidade: rotulo.quantidade,
              observacoes: `Reestruturação Ecobags (estampa=pai) — planilha de estoque 2026-08-29. Lançado em ${new Date().toISOString().slice(0, 10)}.`,
            },
          });
        }

        const saldo = await chamarBling<{ data?: { saldoVirtualTotal?: number }[] }>(
          `/estoques/saldos?idsProdutos[]=${filho.id}`,
          { revalidar: 0 },
        );

        filhosConferidos.push({
          id: filho.id,
          nome: lido.data.nome,
          preco: lido.data.preco,
          produtoPaiConfere: paiConfere,
          saldoConferido: saldo.data?.[0]?.saldoVirtualTotal ?? null,
          saldoEsperado: rotulo?.quantidade ?? null,
        });
      }

      feitos.push({
        slug: item.slug,
        idPai,
        nomePai: paiLido.data.nome,
        situacaoPai: paiLido.data.situacao,
        formatoPai: paiLido.data.formato,
        filhosEsperados: e.tamanhos.length,
        filhosEncontrados: filhos.length,
        filhos: filhosConferidos,
        bateu:
          filhos.length === e.tamanhos.length &&
          filhosConferidos.every((f) => f.produtoPaiConfere && f.saldoConferido === f.saldoEsperado),
      });
    } catch (err) {
      feitos.push({
        slug: item.slug,
        nome: item.nomePai,
        erro: err instanceof Error ? err.message : String(err),
        respostaDoBling: err instanceof ErroBling ? err.corpo : undefined,
      });
      break;
    }
  }

  return NextResponse.json({ modo: "aplicado", feitos });
}

export async function GET(requisicao: Request) {
  return responder(requisicao, false);
}

export async function POST(requisicao: Request) {
  return responder(requisicao, true);
}
