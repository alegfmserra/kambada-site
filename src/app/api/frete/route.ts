import { NextResponse } from "next/server";
import { buscarCatalogo } from "@/lib/bling/produtos";
import { lerPedidoDoCliente, validarCarrinho } from "@/lib/carrinho/validar";
import { cotarCarrinho } from "@/lib/frete/cotar";
import { ErroFrete, freteConfigurado, nomeDaEntrega } from "@/lib/frete/melhorEnvio";
import { faltaParaFreteGratis, FRETE_GRATIS_A_PARTIR_DE, normalizarCep } from "@/lib/frete/regras";
import { opcaoRetirada } from "@/lib/frete/retirada";
import { emReais } from "@/lib/loja/dinheiro";

export const dynamic = "force-dynamic";

/**
 * Cota o frete do carrinho para um CEP.
 *
 * Recebe só {cep, itens: [{idBling, quantidade}]}. Preço e embalagem vêm do
 * catálogo, no servidor.
 */
export async function POST(requisicao: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = (await requisicao.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ erro: "Requisição inválida." }, { status: 400 });
  }

  const cep = normalizarCep(String(corpo.cep ?? ""));
  if (!cep) return NextResponse.json({ erro: "CEP inválido." }, { status: 422 });

  const pedido = lerPedidoDoCliente(corpo.itens);
  if (!pedido) return NextResponse.json({ erro: "Carrinho inválido." }, { status: 422 });

  if (!freteConfigurado()) {
    return NextResponse.json(
      { erro: "A cotação de frete está sendo configurada. Finalize pelo WhatsApp.", motivo: "frete_nao_configurado" },
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

  const subtotal = emReais(validacao.subtotalCentavos);
  const resposta = (entregas: ReturnType<typeof opcaoRetirada>[], aviso?: string) =>
    NextResponse.json({
      subtotal,
      freteGratisAPartirDe: FRETE_GRATIS_A_PARTIR_DE,
      faltaParaFreteGratis: faltaParaFreteGratis(subtotal),
      // A retirada no ateliê vale para qualquer CEP e entra sempre por
      // último: o padrão continua sendo a entrega mais barata.
      opcoes: [...entregas, opcaoRetirada()],
      aviso,
    });

  try {
    const opcoes = await cotarCarrinho(cep, validacao.itens, validacao.subtotalCentavos);
    return resposta(
      opcoes.map((o) => ({
        id: o.id,
        nome: nomeDaEntrega(o.transportadora, o.servico),
        servico: o.servico,
        transportadora: o.transportadora,
        preco: o.precoCobrado,
        precoOriginal: o.preco,
        prazoDias: o.prazoDias,
        gratis: o.gratis,
        retirada: false,
      })),
      opcoes.length === 0
        ? "Nenhuma transportadora atende este CEP. Você pode retirar no ateliê ou falar com a gente no WhatsApp."
        : undefined,
    );
  } catch (erro) {
    const status = erro instanceof ErroFrete ? erro.status : 0;
    // Sem dado pessoal no log: só o código e a mensagem técnica.
    console.error("[frete] cotação falhou:", status, erro instanceof Error ? erro.message : erro);
    // A transportadora fora do ar não impede quem quer retirar.
    return resposta(
      [],
      "Não conseguimos calcular a entrega agora. Você pode retirar no ateliê, tentar de novo ou falar no WhatsApp.",
    );
  }
}
