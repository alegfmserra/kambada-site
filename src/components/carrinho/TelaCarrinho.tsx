"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import LinkWhatsApp from "@/components/LinkWhatsApp";
import { evento } from "@/lib/analytics/eventos";
import type { ItemCarrinho } from "@/lib/carrinho/logica";
import CalculoDeFrete from "@/components/frete/CalculoDeFrete";
import { entregaMaisEmConta, precoDaEntrega, type OpcaoFreteNaTela } from "@/lib/frete/exibir";
import { textoParcelas } from "@/lib/loja/parcelas";
import Link from "next/link";
import { MAXIMO_POR_ITEM, mensagemWhatsApp } from "@/lib/carrinho/logica";
import { fotoDoItem as foto } from "@/lib/fotoDoProduto";
import { faltaParaFreteGratis, FRETE_GRATIS_A_PARTIR_DE } from "@/lib/frete/regras";
import { formatarReais } from "@/lib/loja/dinheiro";
import { linkWhatsApp } from "@/lib/site";
import { useCarrinho } from "./ProvedorCarrinho";

/**
 * `freteOnline`: dá para cotar a entrega no site — o checkout abre.
 * `pagamentoOnline`: dá também para pagar no site. Sem ele, o checkout cota o
 * frete e entrega o pedido pronto no WhatsApp.
 */
/** Peça do carrinho no formato do Google Analytics (nome, categoria, preço e quantidade; nada de quem compra). */
const itemGa = (i: ItemCarrinho, quantidade: number) => ({
  item_id: String(i.idBling),
  item_name: i.nome,
  item_category: i.categoria,
  item_variant: i.rotulo,
  price: i.preco,
  quantity: quantidade,
});

export default function TelaCarrinho({
  pagamentoOnline,
  freteOnline,
}: {
  pagamentoOnline: boolean;
  freteOnline: boolean;
}) {
  const { itens, pronto, alterarQuantidade, remover, subtotal, pecas } = useCarrinho();
  // Frete cotado aqui mesmo, pelo CEP (17/11/2026): antes só aparecia dentro do checkout.
  const [entregas, setEntregas] = useState<OpcaoFreteNaTela[] | null>(null);
  const paraCotar = useMemo(() => itens.map((i) => ({ idBling: i.idBling, quantidade: i.quantidade })), [itens]);

  // Medição (17/11/2026): carrinho visto (uma vez por abertura da página), peça tirada e peça somada.
  const jaViu = useRef(false);
  useEffect(() => {
    if (!pronto || jaViu.current || itens.length === 0) return;
    jaViu.current = true;
    evento("view_cart", { currency: "BRL", value: subtotal, items: itens.map((i) => itemGa(i, i.quantidade)) });
  }, [pronto, itens, subtotal]);
  const medir = (nome: "add_to_cart" | "remove_from_cart", i: ItemCarrinho, quantidade: number) =>
    evento(nome, { currency: "BRL", value: i.preco * quantidade, items: [itemGa(i, quantidade)] });

  if (!pronto) {
    return <p className="text-texto-suave">Carregando o carrinho…</p>;
  }

  if (itens.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-borda bg-superficie p-10 text-center">
        <p className="text-5xl" aria-hidden="true">
          🦀
        </p>
        <h2 className="mt-4 font-display text-2xl font-bold">Seu carrinho está vazio</h2>
        <p className="mt-2 text-texto-suave">As peças que você escolher aparecem aqui.</p>
        <Link
          href="/loja"
          data-alvo="carrinho-vazio-ver-a-loja"
          className="mt-6 inline-block rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro whitespace-nowrap"
        >
          Ver a loja
        </Link>
      </div>
    );
  }

  const falta = faltaParaFreteGratis(subtotal);
  const whatsapp = linkWhatsApp(mensagemWhatsApp(itens));
  const maisEmConta = entregas ? entregaMaisEmConta(entregas) : null;
  const precoMaisEmConta = maisEmConta ? precoDaEntrega(maisEmConta) : null;

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_22rem]" data-area="carrinho">
      <ul className="divide-y divide-borda border-y border-borda">
        {itens.map((i) => {
          const teto = Math.min(i.estoque, MAXIMO_POR_ITEM);
          return (
            <li key={i.idBling} className="flex flex-wrap items-start gap-4 py-6">
              {foto(i.idBling, i.slug) ? (
                <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-white">
                  <Image
                    src={foto(i.idBling, i.slug)!.src}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-contain"
                  />
                </div>
              ) : (
                <div
                  aria-hidden="true"
                  className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl border border-dashed border-borda bg-superficie text-2xl"
                >
                  🦀
                </div>
              )}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/loja/${i.categoria}/${i.slug}`}
                  data-alvo="peca"
                  className="font-display font-semibold hover:text-kambada-amarelo-escuro"
                >
                  {i.nome}
                </Link>
                {i.rotulo && i.rotulo !== "Único" && (
                  <p className="text-sm text-texto-suave">{i.rotulo}</p>
                )}
                <p className="mt-1 text-sm text-texto-tenue">{formatarReais(i.preco)} cada</p>

                <div className="mt-3 flex items-center gap-4">
                  <div className="flex items-center rounded-full border border-borda" role="group" aria-label={`Quantidade de ${i.nome}`}>
                    <button
                      type="button"
                      onClick={() => {
                        medir("remove_from_cart", i, 1);
                        alterarQuantidade(i.idBling, i.quantidade - 1);
                      }}
                      aria-label="Diminuir"
                      data-evento="remove_from_cart"
                      className="h-11 w-11 rounded-full text-lg"
                    >
                      −
                    </button>
                    <span className="w-8 text-center font-display font-semibold">{i.quantidade}</span>
                    <button
                      type="button"
                      onClick={() => {
                        medir("add_to_cart", i, 1);
                        alterarQuantidade(i.idBling, i.quantidade + 1);
                      }}
                      disabled={i.quantidade >= teto}
                      aria-label="Aumentar"
                      data-evento="add_to_cart"
                      className="h-11 w-11 rounded-full text-lg disabled:opacity-40"
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      medir("remove_from_cart", i, i.quantidade);
                      remover(i.idBling);
                    }}
                    data-evento="remove_from_cart"
                    className="min-h-11 text-sm text-texto-tenue underline hover:text-texto"
                  >
                    Remover
                  </button>
                </div>
              </div>
              <p className="font-display font-bold">{formatarReais(i.preco * i.quantidade)}</p>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit rounded-3xl border border-borda bg-superficie p-6 lg:sticky lg:top-28">
        <h2 className="font-display text-lg font-bold">Resumo</h2>
        <dl className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <dt>
              {pecas} {pecas === 1 ? "peça" : "peças"}
            </dt>
            <dd className="font-semibold">{formatarReais(subtotal)}</dd>
          </div>
          <div className="flex justify-between text-texto-suave">
            <dt>Frete</dt>
            <dd className="text-right">
              {!freteOnline
                ? "calculado no próximo passo"
                : !maisEmConta || !precoMaisEmConta
                  ? "informe o CEP abaixo"
                  : maisEmConta.local || precoMaisEmConta.gratis
                    ? precoMaisEmConta.texto
                    : `a partir de ${precoMaisEmConta.texto}`}
            </dd>
          </div>
        </dl>
        {freteOnline && (
          <div className="mt-4 border-t border-borda pt-4">
            <CalculoDeFrete itens={paraCotar} local="carrinho" aoCotar={setEntregas} cotarAoAbrir />
          </div>
        )}
        <p className="mt-3 text-sm text-texto-suave" aria-live="polite">
          <span aria-hidden="true">💳</span> {textoParcelas(Math.round(subtotal * 100))}
        </p>

        <div className="mt-4 rounded-xl bg-fundo px-4 py-3 text-sm">
          <p aria-live="polite">
            {falta > 0 ? (
              <>
                Faltam <strong>{formatarReais(falta)}</strong> para o frete grátis (a partir de{" "}
                {formatarReais(FRETE_GRATIS_A_PARTIR_DE)}).
              </>
            ) : (
              <>
                <span aria-hidden="true">🎉</span> Você ganhou <strong>frete grátis</strong> na entrega mais econômica.
              </>
            )}
          </p>
          <progress
            max={FRETE_GRATIS_A_PARTIR_DE}
            value={Math.max(0, FRETE_GRATIS_A_PARTIR_DE - falta)}
            aria-label="Quanto do valor para o frete grátis já está no carrinho"
            className="mt-2 block h-2 w-full appearance-none overflow-hidden rounded-full bg-borda [&::-moz-progress-bar]:bg-realce [&::-webkit-progress-bar]:bg-borda [&::-webkit-progress-value]:bg-realce"
          />
        </div>

        {freteOnline ? (
          <Link
            href="/checkout"
            data-alvo="finalizar-compra"
            className="mt-6 block rounded-full bg-kambada-amarelo px-6 py-4 text-center font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro whitespace-nowrap"
          >
            {pagamentoOnline ? "Finalizar compra" : "Calcular frete e finalizar"}
          </Link>
        ) : (
          <LinkWhatsApp
            origem="carrinho-finalizar"
            href={whatsapp}
            className="mt-6 block rounded-full bg-kambada-amarelo px-6 py-4 text-center font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro whitespace-nowrap"
          >
            Finalizar pelo WhatsApp
          </LinkWhatsApp>
        )}

        {freteOnline && (
          <LinkWhatsApp
            origem="carrinho-prefere-whatsapp"
            href={whatsapp}
            className="mt-3 block text-center text-sm text-texto-suave underline hover:text-texto"
          >
            Prefere fechar pelo WhatsApp?
          </LinkWhatsApp>
        )}
        {!pagamentoOnline && (
          <p className="mt-3 text-center text-xs text-texto-tenue">
            O pagamento direto pelo site entra em breve.{" "}
            {freteOnline
              ? "Você calcula o frete aqui e fecha o pedido pelo WhatsApp, já com o total."
              : "A mensagem do WhatsApp já vai com o seu carrinho."}
          </p>
        )}
      </aside>
    </div>
  );
}
