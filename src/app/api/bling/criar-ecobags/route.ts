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
 * ACHADO EM PRODUÇÃO (2026-09-03): `variacao.produtoPai.cloneInfo: true`
 * faz o filho COPIAR o preço do pai, e ignora o `preco` que eu mandava
 * dentro de cada item de `variacoes`. Passou despercebido no primeiro teste
 * (Carcará, uma variação só, mesmo preço do pai por coincidência) e só
 * apareceu no segundo (Caboclo de Pena, Mini R$40 + Grande R$55): o filho
 * Grande nasceu com R$40, herdado do pai. Por isso a rota NUNCA confia no
 * preço de criação — sempre confere e corrige cada filho depois, com o
 * mesmo padrão de releitura usado no resto da integração.
 *
 * IDEMPOTENTE DE PROPÓSITO: se o pai já existe, a rota não pula a peça
 * inteira — ela vai direto conferir/corrigir os filhos. Foi assim que o
 * preço errado do Caboclo de Pena foi corrigido, só rodando de novo depois
 * do ajuste de código, sem precisar de um script avulso.
 *
 * O estoque vive no FILHO (cada tamanho tem seu próprio saldo, como já
 * acontece em Camisas), nunca no pai.
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

function precoDoTamanho(rotulo: "Mini" | "Grande"): number {
  return rotulo === "Mini" ? VENDA_MINI : VENDA_GRANDE;
}

function nomePai(e: NovaEcobag): string {
  return `Ecobag ${e.estampa}`;
}

async function responder(requisicao: Request, escrever: boolean) {
  const url = new URL(requisicao.url);
  if (!segredoConfere(url.searchParams.get("token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const apenas = url.searchParams.get("apenas");
  const alvos = ECOBAGS.filter((e) => apenas === null || e.slug === apenas);

  // Sempre lido fresco (revalidar:0): a rota roda em rodadas sucessivas
  // dentro da mesma janela de minutos, e o cache padrão de 10 min do Next
  // já causou dado velho numa rota irmã (/corrigir) nesta mesma sessão.
  const todosAtuais = await listarTudo<ProdutoBling>("/produtos?criterio=2", {
    revalidar: 0,
  });
  const paisExistentes = new Map(
    todosAtuais.filter((p) => p.formato === "V").map((p) => [p.nome, p]),
  );

  const plano = alvos.map((e) => ({
    slug: e.slug,
    nomePai: nomePai(e),
    tamanhos: e.tamanhos,
    acao: paisExistentes.has(nomePai(e)) ? "conferir" : "criar",
  }));

  if (!escrever || url.searchParams.get("aplicar") !== "1") {
    return NextResponse.json({ modo: "ensaio — nada foi escrito no Bling", plano });
  }

  const feitos: Record<string, unknown>[] = [];
  for (const item of plano) {
    const e = ECOBAGS.find((x) => x.slug === item.slug)!;

    try {
      let idPai: number;

      if (item.acao === "criar") {
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
        const criado = await chamarBling<{ data: { id: number } }>("/produtos", {
          metodo: "POST",
          corpo,
        });
        idPai = criado.data.id;
      } else {
        idPai = paisExistentes.get(item.nomePai)!.id;
      }

      // Relista sempre — se acabou de criar, a lista carregada no início da
      // função ainda não tem os filhos novos. Acha por prefixo de nome e
      // confirma cada um pelo campo oficial (variacao.produtoPai) — nunca só
      // pelo prefixo, que também bateria com qualquer produto avulso que
      // comece com o mesmo texto.
      const listaAtual = await listarTudo<ProdutoBling>("/produtos?criterio=2", {
        revalidar: 0,
      });
      const candidatos = listaAtual.filter(
        (p) => p.id !== idPai && p.nome.startsWith(`${item.nomePai} `),
      );

      const filhosConferidos = [];
      for (const candidato of candidatos) {
        const lido = await chamarBling<{
          data: {
            id: number;
            nome: string;
            preco: number;
            variacao?: { nome?: string; produtoPai?: { id: number } };
          };
        }>(`/produtos/${candidato.id}`, { revalidar: 0 });

        if (lido.data.variacao?.produtoPai?.id !== idPai) continue; // não é filho de verdade

        const tamanho = e.tamanhos.find(
          (t) => lido.data.variacao?.nome === `Tamanho:${t.rotulo}`,
        );
        if (!tamanho) continue; // filho de tamanho que esta peça não deveria ter

        const precoCerto = precoDoTamanho(tamanho.rotulo);
        let precoFinal = lido.data.preco;

        if (lido.data.preco !== precoCerto) {
          // cloneInfo:true copiou o preço do pai na criação — corrige por
          // cima, relendo o objeto inteiro antes de gravar (nunca monta um
          // corpo novo, que apagaria o resto dos campos do produto).
          const atual = await chamarBling<{ data: Record<string, unknown> }>(
            `/produtos/${candidato.id}`,
            { revalidar: 0 },
          );
          const corpoCorrigido = { ...atual.data, preco: precoCerto };
          await chamarBling(`/produtos/${candidato.id}`, {
            metodo: "PUT",
            corpo: corpoCorrigido,
          });
          const relido = await chamarBling<{ data: { preco: number } }>(
            `/produtos/${candidato.id}`,
            { revalidar: 0 },
          );
          precoFinal = relido.data.preco;
        }

        // Lança o saldo. Idempotente por natureza — "B" (Balanço) sempre
        // define o valor absoluto, então rodar de novo não duplica nada.
        await chamarBling("/estoques", {
          metodo: "POST",
          corpo: {
            produto: { id: candidato.id },
            deposito: { id: ID_DEPOSITO },
            operacao: "B",
            quantidade: tamanho.quantidade,
            observacoes: `Reestruturação Ecobags (estampa=pai) — planilha de estoque 2026-08-29. Lançado em ${new Date().toISOString().slice(0, 10)}.`,
          },
        });
        const saldo = await chamarBling<{ data?: { saldoVirtualTotal?: number }[] }>(
          `/estoques/saldos?idsProdutos[]=${candidato.id}`,
          { revalidar: 0 },
        );

        filhosConferidos.push({
          id: candidato.id,
          nome: lido.data.nome,
          precoAntesDaCorrecao: lido.data.preco,
          precoFinal,
          precoCerto,
          saldoConferido: saldo.data?.[0]?.saldoVirtualTotal ?? null,
          saldoEsperado: tamanho.quantidade,
        });
      }

      feitos.push({
        slug: item.slug,
        acao: item.acao,
        idPai,
        nomePai: item.nomePai,
        filhosEsperados: e.tamanhos.length,
        filhosEncontrados: filhosConferidos.length,
        filhos: filhosConferidos,
        bateu:
          filhosConferidos.length === e.tamanhos.length &&
          filhosConferidos.every(
            (f) => f.precoFinal === f.precoCerto && f.saldoConferido === f.saldoEsperado,
          ),
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
