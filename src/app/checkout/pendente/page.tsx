import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Pagamento em análise",
  robots: { index: false, follow: false },
};

/**
 * Pix aguardando, boleto gerado ou cartão em análise. O pedido só entra no
 * Bling quando o Mercado Pago aprovar — e quem avisa é o webhook. O carrinho
 * NÃO é esvaziado aqui: se o boleto vencer, o cliente ainda tem as peças.
 */
export default function PaginaPendente() {
  return (
    <section>
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <p className="text-6xl" aria-hidden="true">
          ⏳
        </p>
        <h1 className="mt-6 font-display text-4xl font-extrabold">Pagamento em análise</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-texto-suave">
          Se você escolheu Pix ou boleto, conclua o pagamento pelo Mercado Pago. Assim que ele for
          aprovado, o pedido entra automaticamente — e o comprovante do Mercado Pago chega no seu
          e-mail.
        </p>
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
