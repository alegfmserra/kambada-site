import type { Metadata } from "next";
import Link from "next/link";
import EsvaziarCarrinho from "@/components/carrinho/EsvaziarCarrinho";
import { processarPagamento, type ResultadoProcessamento } from "@/lib/checkout/processar";
import { mercadoPagoConfigurado } from "@/lib/mercadopago/cliente";
import { linkWhatsApp } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pedido recebido",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Volta do Mercado Pago com pagamento aprovado.
 *
 * Esta página é a SEGUNDA porta que transforma o pagamento em pedido no Bling
 * (a primeira é o webhook). O ID que chega na URL é só um ponteiro: o
 * pagamento é relido na API do Mercado Pago e só vira pedido se estiver
 * aprovado de fato. Recarregar a página não duplica nada — o pedido é
 * idempotente pelo número da loja.
 */
export default async function PaginaSucesso({ searchParams }: Props) {
  const p = await searchParams;
  const id = String(p.payment_id ?? p.collection_id ?? "");

  let resultado: ResultadoProcessamento | null = null;
  let falhou = false;
  if (/^\d+$/.test(id) && mercadoPagoConfigurado()) {
    try {
      resultado = await processarPagamento(id);
    } catch {
      // O webhook tenta de novo sozinho; aqui, só não confirmamos na tela.
      falhou = true;
    }
  }

  const aprovado = resultado?.ok === true;
  const ref = resultado && "ref" in resultado ? resultado.ref : undefined;

  return (
    <section>
      {aprovado && <EsvaziarCarrinho />}
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <p className="text-6xl" aria-hidden="true">
          🦀
        </p>
        <h1 className="mt-6 font-display text-4xl font-extrabold text-balance">
          {aprovado ? "Pedido confirmado. Obrigado!" : "Recebemos o seu pagamento"}
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-texto-suave">
          {aprovado
            ? "O pagamento foi aprovado e o seu pedido já está com a gente. O comprovante do Mercado Pago chega no seu e-mail. Qualquer dúvida, chame a gente no WhatsApp com o número do pedido."
            : "Estamos confirmando o pagamento com o Mercado Pago. Assim que ele aprovar, o pedido entra automaticamente — e o comprovante chega no seu e-mail."}
        </p>
        {ref && (
          <p className="mt-6 font-display text-sm text-texto-tenue">
            Número do pedido: <strong className="text-texto">{ref}</strong>
          </p>
        )}
        {(falhou || (resultado && !resultado.ok && resultado.motivo !== "nao_aprovado")) && (
          <p className="mx-auto mt-6 max-w-xl rounded-xl bg-superficie px-4 py-3 text-sm">
            Se algo parecer estranho, fale com a gente pelo{" "}
            <a
              href={linkWhatsApp(`Oi! Acabei de pagar um pedido${ref ? ` (${ref})` : ""} pelo site.`)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold underline"
            >
              WhatsApp
            </a>{" "}
            com o número do pedido.
          </p>
        )}
        <Link
          href="/loja"
          className="mt-10 inline-block rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro"
        >
          Voltar à loja
        </Link>
      </div>
    </section>
  );
}
