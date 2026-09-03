import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { chamarBling } from "@/lib/bling/cliente";
import { ErroBling } from "@/lib/bling/tipos";

export const dynamic = "force-dynamic";

/**
 * Corrige o saldo de estoque de produtos específicos no Bling.
 *
 * ESTA ROTA ESCREVE NO ERP. Mesma disciplina de /api/bling/corrigir:
 *
 * - **GET só ensaia.** Mostra saldo atual × alvo, sem tocar em nada.
 * - **POST aplica**, e exige `aplicar=1`.
 * - `apenas=ID` restringe a um produto — a primeira execução deve ser assim.
 * - Depois de escrever, relê o saldo em `/estoques/saldos` para provar o que
 *   ficou gravado, em vez de confiar na resposta do POST (que só devolve o
 *   id do novo registro de movimentação, não o saldo resultante).
 *
 * NÃO é uma rotina genérica como /corrigir — a lista de alvos é fixa e
 * explícita, porque cada saldo aqui veio de uma fonte específica (a NF-e da
 * remessa Fenace) e foi aprovado um a um. Adicionar um produto novo é editar
 * este arquivo, não descobrir uma regra automática.
 *
 * Documentação do endpoint: POST /estoques, schema OAS 3.0 lido em
 * developer.bling.com.br/referencia em 2026-09-03 — não estava na busca
 * nem no fetch estático, só renderizado no navegador (Swagger client-side).
 * Campo chave: `operacao`, enum B=Balanço, E=Entrada, S=Saída. "Balanço"
 * define o saldo ABSOLUTO (é uma contagem física, não um movimento) — é o
 * que se quer aqui: dizer quanto EXISTE, não quanto entrou ou saiu.
 */

const ID_DEPOSITO = 14888952004; // "Geral" — único depósito da conta, padrão:true

type AlvoDeEstoque = {
  id: number;
  nome: string;
  saldoAlvo: number;
  origem: string;
};

/**
 * Os dois produtos com saldo zerado no Bling apesar de existirem de verdade.
 *
 * A NF-e 26 (remessa Fenace, 2026-08-31) registra 61 pareôs e 88 ecobags
 * grandes saindo do estoque — e a planilha de contagem física
 * (Estoque_Kambada, 2026-08-29) bate com os mesmos números. Dois sinais
 * independentes dizendo a mesma coisa: o Bling nunca teve esse saldo
 * lançado, não é caso de venda não registrada.
 *
 * Aprovado pelo Alexandre em 2026-09-03: a Fenace só começa a vender no dia
 * seguinte, então a contagem de hoje ainda vale — não é preciso esperar o
 * evento terminar para lançar.
 */
const ALVOS: AlvoDeEstoque[] = [
  {
    id: 16689777731,
    nome: "Pareô",
    saldoAlvo: 61,
    origem: "NF-e 26 (remessa Fenace, 2026-08-31) e planilha de contagem física",
  },
  {
    id: 16689780772,
    nome: "Ecobag Grande",
    saldoAlvo: 88,
    origem: "NF-e 26 (remessa Fenace, 2026-08-31) e planilha de contagem física",
  },
  /**
   * Lápis Plantável (= "Lápis Ecológicos Sortido" na planilha, confirmado
   * pelo Alexandre em 2026-09-03) nunca teve saldo lançado no Bling — ficou
   * de fora de toda correção anterior porque o PREÇO já estava certo, e só
   * o preço era o que essas rotas corrigiam. O saldo é outra coisa.
   */
  {
    id: 16689787486,
    nome: "Lápis Plantável",
    saldoAlvo: 600,
    origem: "Planilha de contagem física Estoque_Kambada, 2026-08-29",
  },
];

function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function saldoAtual(idProduto: number): Promise<number | null> {
  const r = await chamarBling<{ data?: { saldoVirtualTotal?: number }[] }>(
    `/estoques/saldos?idsProdutos[]=${idProduto}`,
    { revalidar: 0 },
  );
  return r.data?.[0]?.saldoVirtualTotal ?? null;
}

async function responder(requisicao: Request, escrever: boolean) {
  const url = new URL(requisicao.url);
  if (!segredoConfere(url.searchParams.get("token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const apenasBruto = url.searchParams.get("apenas");
  const apenas = apenasBruto && /^\d+$/.test(apenasBruto) ? Number(apenasBruto) : null;
  const alvos = ALVOS.filter((a) => apenas === null || a.id === apenas);

  const plano = [];
  for (const alvo of alvos) {
    const atual = await saldoAtual(alvo.id);
    plano.push({
      ...alvo,
      saldoAtual: atual,
      acao: atual === alvo.saldoAlvo ? "pular" : "corrigir",
      motivo: atual === alvo.saldoAlvo ? "já correto" : undefined,
    });
  }

  if (!escrever || url.searchParams.get("aplicar") !== "1") {
    return NextResponse.json({
      modo: "ensaio — nada foi escrito no Bling",
      deposito: ID_DEPOSITO,
      plano,
    });
  }

  const feitos: Record<string, unknown>[] = [];
  for (const item of plano) {
    if (item.acao === "pular") continue;

    try {
      await chamarBling("/estoques", {
        metodo: "POST",
        corpo: {
          produto: { id: item.id },
          deposito: { id: ID_DEPOSITO },
          operacao: "B", // Balanço: define o saldo absoluto, não soma.
          quantidade: item.saldoAlvo,
          observacoes: `Correção de saldo — ${item.origem}. Lançado via integração do site em ${new Date().toISOString().slice(0, 10)}.`,
        },
      });

      // O POST só devolve o id do registro de movimentação, não o saldo
      // resultante. Relê o saldo de verdade para provar o que ficou gravado.
      const depois = await saldoAtual(item.id);
      feitos.push({
        id: item.id,
        nome: item.nome,
        de: item.saldoAtual,
        para: item.saldoAlvo,
        conferido: depois,
        bateu: depois === item.saldoAlvo,
      });
    } catch (e) {
      feitos.push({
        id: item.id,
        nome: item.nome,
        erro: e instanceof Error ? e.message : String(e),
        respostaDoBling: e instanceof ErroBling ? e.corpo : undefined,
      });
      break; // para na primeira falha, mesma regra do /corrigir
    }
  }

  return NextResponse.json({ modo: "aplicado", deposito: ID_DEPOSITO, feitos });
}

export async function GET(requisicao: Request) {
  return responder(requisicao, false);
}

export async function POST(requisicao: Request) {
  return responder(requisicao, true);
}
