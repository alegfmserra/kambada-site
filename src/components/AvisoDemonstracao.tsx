import { freteConfigurado } from "@/lib/frete/melhorEnvio";
import { mercadoPagoConfigurado } from "@/lib/mercadopago/cliente";

/**
 * Aviso do modo demonstração: sem o Mercado Pago e o Melhor Envio ligados no
 * painel, o carrinho existe, mas o pedido é fechado no WhatsApp, e a loja
 * precisa dizer isso. Há teste no Gate 3 (qa/visual.spec.ts) que confere o
 * aviso nesse modo.
 *
 * Com o pagamento ligado (a loja de verdade, desde 20/10/2026), ele não
 * aparece: era herança da fase de demonstração e ocupava o topo de /loja e de
 * toda categoria, empurrando as peças para baixo. O estado vem da
 * configuração, não do código: desligou o pagamento, o aviso volta sozinho.
 */
export default function AvisoDemonstracao({ className = "" }: { className?: string }) {
  const pagamentoOnline = mercadoPagoConfigurado() && freteConfigurado();
  if (pagamentoOnline) return null;

  return (
    <div
      role="note"
      className={`rounded-2xl border-2 border-dashed border-kambada-amarelo-escuro bg-superficie p-5 ${className}`}
    >
      <p className="font-display font-semibold text-texto">
        <span aria-hidden="true">🦀</span> Peças reais, pedido pelo WhatsApp
      </p>
      <p className="mt-2 text-sm leading-relaxed text-texto-suave">
        Os produtos, preços e tamanhos desta página são{" "}
        <strong>os do nosso estoque</strong>. Monte o seu carrinho e o pedido é fechado no WhatsApp,
        com a mensagem já pronta. O pagamento direto pelo site entra em breve.
      </p>
    </div>
  );
}
