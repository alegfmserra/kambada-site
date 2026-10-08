import { freteConfigurado } from "@/lib/frete/melhorEnvio";
import { mercadoPagoConfigurado } from "@/lib/mercadopago/cliente";

/**
 * Aviso presente em toda página da loja. Há teste no Gate 3 que falha se ele
 * sumir.
 *
 * Diz a verdade sobre o estado da loja, que muda com a configuração e não com
 * o código: com o Mercado Pago e o Melhor Envio ligados no painel, a compra é
 * pelo site; sem eles, o carrinho existe, mas o pedido é fechado no WhatsApp.
 * Ligar o pagamento troca este texto sozinho, sem novo deploy.
 */
export default function AvisoDemonstracao() {
  const pagamentoOnline = mercadoPagoConfigurado() && freteConfigurado();

  return (
    <div
      role="note"
      className="rounded-2xl border-2 border-dashed border-kambada-amarelo-escuro bg-superficie p-5"
    >
      <p className="font-display font-semibold text-texto">
        {pagamentoOnline ? "🦀 Peças reais, compra pelo site" : "🦀 Peças reais, pedido pelo WhatsApp"}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-texto-suave">
        Os produtos, preços e tamanhos desta página são{" "}
        <strong>os do nosso estoque</strong>.{" "}
        {pagamentoOnline ? (
          <>
            Escolha, coloque no carrinho e pague pelo Mercado Pago — cartão em até 3x, Pix ou
            boleto. As fotos das peças estão chegando; qualquer dúvida, o WhatsApp está aberto.
          </>
        ) : (
          <>
            Monte o seu carrinho e o pedido é fechado no WhatsApp, com a mensagem já pronta. O
            pagamento direto pelo site entra em breve.
          </>
        )}
      </p>
    </div>
  );
}
