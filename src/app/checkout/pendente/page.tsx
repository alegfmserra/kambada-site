import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import AtualizarSozinho from "@/components/checkout/AtualizarSozinho";
import { buscarPagamento, mercadoPagoConfigurado } from "@/lib/mercadopago/cliente";

export const metadata: Metadata = {
  title: "Pagamento em análise",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Pix aguardando, boleto gerado ou cartão em análise.
 *
 * O Pix quase sempre cai aqui: o cliente volta do Mercado Pago antes de o
 * banco confirmar. Por isso a página RELÊ o pagamento na API (o ID da URL é
 * só ponteiro) e se atualiza sozinha; quando ele aprova, manda o cliente para
 * a página de sucesso — que é uma das portas que cria o pedido no Bling.
 * Assim o pedido entra mesmo que a notificação do Mercado Pago falhe.
 *
 * O carrinho NÃO é esvaziado aqui: se o boleto vencer, o cliente ainda tem
 * as peças.
 */
export default async function PaginaPendente({ searchParams }: Props) {
  const p = await searchParams;
  const id = String(p.payment_id ?? p.collection_id ?? "");
  const temId = /^\d+$/.test(id);

  if (temId && mercadoPagoConfigurado()) {
    let aprovado = false;
    try {
      aprovado = (await buscarPagamento(id)).status === "approved";
    } catch {
      // Mercado Pago fora do ar: segue mostrando a espera e tenta de novo.
    }
    // Fora do try: o redirect do Next funciona lançando uma exceção própria.
    if (aprovado) redirect(`/checkout/sucesso?payment_id=${id}`);
  }

  return (
    <section>
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <p className="text-6xl" aria-hidden="true">
          ⏳
        </p>
        <h1 className="mt-6 font-display text-4xl font-extrabold">Aguardando o pagamento</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-texto-suave">
          Se você escolheu Pix ou boleto, conclua o pagamento pelo Mercado Pago. Assim que ele for
          aprovado, o pedido entra automaticamente — e o comprovante do Mercado Pago chega no seu
          e-mail.
        </p>
        {temId && (
          <>
            <p className="mt-6 text-sm text-texto-tenue" aria-live="polite">
              Esta página confere sozinha a cada poucos segundos. Pode deixá-la aberta.
            </p>
            <AtualizarSozinho />
          </>
        )}
        <div>
          <Link
            href="/loja"
            className="mt-10 inline-block rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro"
          >
            Voltar à loja
          </Link>
        </div>
      </div>
    </section>
  );
}
