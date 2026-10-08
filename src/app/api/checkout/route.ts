import { NextResponse } from "next/server";
import { buscarCatalogo } from "@/lib/bling/produtos";
import { lerPedidoDoCliente, validarCarrinho } from "@/lib/carrinho/validar";
import { lerDadosCliente } from "@/lib/checkout/cliente";
import { novaReferencia, VERSAO_RETRATO, type RetratoPedido } from "@/lib/checkout/pedido";
import { cotarCarrinho } from "@/lib/frete/cotar";
import { freteConfigurado, nomeDaEntrega } from "@/lib/frete/melhorEnvio";
import { ID_RETIRADA, RETIRADA } from "@/lib/frete/retirada";
import { urlDoSite } from "@/lib/loja/urlDoSite";
import {
  criarPreferencia,
  ErroMercadoPago,
  mercadoPagoConfigurado,
} from "@/lib/mercadopago/cliente";

export const dynamic = "force-dynamic";

/**
 * Fecha o pedido e devolve o link de pagamento do Mercado Pago.
 *
 * Tudo que define o valor é refeito aqui, no servidor: preço (catálogo do
 * Bling), estoque, embalagem e frete (nova cotação). Do navegador vêm só os
 * IDs, as quantidades, os dados de entrega e o ID do serviço de frete
 * escolhido. Se o frete escolhido não existir mais na recotação, o pedido
 * volta para o cliente escolher de novo — nunca se cobra um valor que ele
 * não viu.
 */
export async function POST(requisicao: Request) {
  if (!mercadoPagoConfigurado()) {
    return NextResponse.json(
      {
        erro: "O pagamento online está sendo configurado. Finalize pelo WhatsApp.",
        motivo: "pagamento_nao_configurado",
      },
      { status: 503 },
    );
  }

  let corpo: Record<string, unknown>;
  try {
    corpo = (await requisicao.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const pedido = lerPedidoDoCliente(corpo.itens);
  if (!pedido) return NextResponse.json({ erro: "Carrinho inválido." }, { status: 422 });

  const { dados: cliente, erros } = lerDadosCliente(corpo.cliente);
  if (Object.keys(erros).length) {
    return NextResponse.json({ erro: "Confira os dados.", campos: erros }, { status: 422 });
  }

  const freteId = Number(corpo.freteId);
  if (!Number.isSafeInteger(freteId)) {
    return NextResponse.json({ erro: "Escolha uma opção de frete." }, { status: 422 });
  }
  const retirada = freteId === ID_RETIRADA;
  if (!retirada && !freteConfigurado()) {
    return NextResponse.json(
      { erro: "A entrega está sendo configurada. Escolha a retirada ou finalize pelo WhatsApp." },
      { status: 503 },
    );
  }

  const catalogo = await buscarCatalogo();
  const validacao = validarCarrinho(pedido, catalogo);
  if (validacao.problemas.length || validacao.itens.length === 0) {
    return NextResponse.json(
      { erro: "Alguns itens mudaram.", problemas: validacao.problemas },
      { status: 409 },
    );
  }

  try {
    // Retirada: nada a cotar — frete zero, sem transporte.
    let freteDoRetrato: RetratoPedido["frete"];
    if (retirada) {
      freteDoRetrato = { servico: RETIRADA.nome, valor: 0, prazo: 0, gratis: false, retirada: true };
    } else {
      const opcoes = await cotarCarrinho(cliente.cep, validacao.itens, validacao.subtotalCentavos);
      const frete = opcoes.find((o) => o.id === freteId);
      if (!frete) {
        return NextResponse.json(
          { erro: "As opções de frete mudaram. Escolha de novo.", motivo: "frete_mudou" },
          { status: 409 },
        );
      }
      freteDoRetrato = {
        servico: nomeDaEntrega(frete.transportadora, frete.servico),
        valor: frete.precoCobrado,
        prazo: frete.prazoDias,
        gratis: frete.gratis,
      };
    }

    const retrato: RetratoPedido = {
      v: VERSAO_RETRATO,
      ref: novaReferencia(),
      itens: validacao.itens.map((i) => ({
        id: i.idBling,
        q: i.quantidade,
        p: i.precoUnitario,
        n: i.rotulo && i.rotulo !== "Único" ? `${i.nome} (${i.rotulo})` : i.nome,
      })),
      frete: freteDoRetrato,
      cliente,
    };

    const preferencia = await criarPreferencia(retrato, urlDoSite(requisicao));
    return NextResponse.json({ url: preferencia.init_point, ref: retrato.ref });
  } catch (erro) {
    const status = erro instanceof ErroMercadoPago ? erro.status : 0;
    console.error("[checkout] falhou:", status, erro instanceof Error ? erro.message : erro);
    return NextResponse.json(
      { erro: "Não conseguimos abrir o pagamento agora. Tente de novo ou fale no WhatsApp." },
      { status: 502 },
    );
  }
}
