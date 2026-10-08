import type { Metadata } from "next";
import Link from "next/link";
import FormularioCheckout from "@/components/checkout/FormularioCheckout";
import { freteConfigurado } from "@/lib/frete/melhorEnvio";
import { mercadoPagoConfigurado } from "@/lib/mercadopago/cliente";

export const metadata: Metadata = {
  title: "Finalizar compra",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Com o frete ligado, o checkout sempre abre: o cliente vê o custo real da
 * entrega antes de decidir. Com o pagamento também ligado, paga no Mercado
 * Pago; sem ele, o pedido sai pronto — com frete e total — para o WhatsApp.
 */
export default function PaginaCheckout() {
  const disponivel = freteConfigurado();
  const pagamentoOnline = disponivel && mercadoPagoConfigurado();

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <Link
          href="/carrinho"
          className="font-display text-sm font-semibold text-texto-tenue hover:text-kambada-amarelo-escuro"
        >
          ← Voltar ao carrinho
        </Link>
        <h1 className="mt-6 font-display text-4xl font-extrabold">Finalizar compra</h1>
        <div className="mt-10">
          {disponivel ? (
            <FormularioCheckout pagamentoOnline={pagamentoOnline} />
          ) : (
            <div className="rounded-3xl border border-dashed border-borda bg-superficie p-8">
              <p className="font-display text-xl font-bold">O pagamento pelo site está em configuração.</p>
              <p className="mt-2 text-texto-suave">
                Seu carrinho continua salvo. Enquanto isso, você fecha o pedido pelo WhatsApp — a
                mensagem já vai com as peças escolhidas.
              </p>
              <Link
                href="/carrinho"
                className="mt-6 inline-block rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro"
              >
                Voltar ao carrinho
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
