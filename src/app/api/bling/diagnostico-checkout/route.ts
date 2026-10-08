import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { chamarBling } from "@/lib/bling/cliente";
import { buscarCatalogo } from "@/lib/bling/produtos";
import { ErroBling } from "@/lib/bling/tipos";
import { validarCarrinho } from "@/lib/carrinho/validar";
import { cotarCarrinho } from "@/lib/frete/cotar";
import { compravelOnline } from "@/lib/frete/embalagens";
import { ErroFrete, freteConfigurado } from "@/lib/frete/melhorEnvio";
import { mercadoPagoConfigurado } from "@/lib/mercadopago/cliente";

export const dynamic = "force-dynamic";

/**
 * Diagnóstico do checkout — SOMENTE LEITURA. Não cria pedido, contato nem
 * pagamento. Protegido pelo REVALIDATE_SECRET.
 *
 * Responde, de uma vez, o que precisa estar de pé para a loja vender:
 *  - as variáveis existem? (diz só sim/não — nunca o valor)
 *  - o Bling deixa LER pedidos, contatos e formas de pagamento? (escrita não
 *    se testa sem escrever; ler é o melhor sinal possível sem tocar no ERP)
 *  - que formas de pagamento existem no Bling, para escolher a do pedido;
 *  - quantos produtos podem ser comprados pelo site, e quais não;
 *  - ?cep=XXXXXXXX → uma cotação real no Melhor Envio para uma matraca,
 *    o que prova que o token funciona.
 */

function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

async function tentarLer(caminho: string) {
  try {
    const r = await chamarBling<{ data?: unknown[] }>(caminho, { revalidar: 0 });
    return { ok: true, itens: r.data?.length ?? 0, data: r.data };
  } catch (erro) {
    return {
      ok: false,
      status: erro instanceof ErroBling ? erro.status : 0,
      detalhe: erro instanceof ErroBling ? String(erro.corpo).slice(0, 200) : String(erro),
    };
  }
}

export async function GET(requisicao: Request) {
  const url = new URL(requisicao.url);
  if (!segredoConfere(url.searchParams.get("token"))) {
    return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  }

  const [pedidos, contatos, formas] = await Promise.all([
    tentarLer("/pedidos/vendas?limite=1"),
    tentarLer("/contatos?limite=1"),
    tentarLer("/formas-pagamentos?limite=100"),
  ]);

  const catalogo = await buscarCatalogo();
  const compraveis = catalogo.produtos.filter(compravelOnline);
  const soWhatsApp = catalogo.produtos.filter((p) => !compravelOnline(p)).map((p) => p.nome);

  let cotacao: unknown = "passe ?cep=XXXXXXXX para cotar uma matraca de verdade";
  const cep = url.searchParams.get("cep");
  if (cep && freteConfigurado()) {
    const matraca = compraveis.find((p) => p.categoria === "matracas" && p.opcoes?.length);
    const opcao = matraca?.opcoes?.find((o) => o.quantidade > 0) ?? matraca?.opcoes?.[0];
    if (matraca && opcao) {
      const v = validarCarrinho(
        [{ idBling: opcao.idBling, quantidade: 1 }],
        // Ignora o estoque só nesta simulação: o que se testa é o frete.
        { ...catalogo, produtos: catalogo.produtos.map((p) => (p === matraca ? { ...p, opcoes: p.opcoes?.map((o) => ({ ...o, quantidade: 99 })) } : p)) },
      );
      try {
        cotacao = {
          produto: `${matraca.nome} (${opcao.rotulo})`,
          cepDestino: cep,
          opcoes: await cotarCarrinho(cep.replace(/\D/g, ""), v.itens, v.subtotalCentavos),
        };
      } catch (erro) {
        cotacao = {
          erro: erro instanceof Error ? erro.message : String(erro),
          status: erro instanceof ErroFrete ? erro.status : undefined,
          detalhe: erro instanceof ErroFrete ? erro.detalhe : undefined,
        };
      }
    }
  }

  return NextResponse.json({
    variaveis: {
      MELHORENVIO_TOKEN: freteConfigurado(),
      MERCADOPAGO_ACCESS_TOKEN: mercadoPagoConfigurado(),
      MERCADOPAGO_WEBHOOK_SECRET: Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET),
      BLING_FORMA_PAGAMENTO_ID: process.env.BLING_FORMA_PAGAMENTO_ID ?? null,
      URL_DO_SITE: process.env.URL_DO_SITE ?? null,
    },
    bling: {
      origemDoCatalogo: catalogo.origem,
      leituraDePedidos: pedidos.ok ? { ok: true } : pedidos,
      leituraDeContatos: contatos.ok ? { ok: true } : contatos,
      formasDePagamento: formas.ok
        ? (formas.data as { id: number; descricao?: string; situacao?: number }[]).map((f) => ({
            id: f.id,
            descricao: f.descricao,
            situacao: f.situacao,
          }))
        : formas,
    },
    loja: {
      produtosNaVitrine: catalogo.produtos.length,
      compraveisPeloSite: compraveis.length,
      soPeloWhatsApp: soWhatsApp,
    },
    cotacao,
  });
}
