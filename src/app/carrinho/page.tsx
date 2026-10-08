import type { Metadata } from "next";
import TelaCarrinho from "@/components/carrinho/TelaCarrinho";
import { freteConfigurado } from "@/lib/frete/melhorEnvio";
import { mercadoPagoConfigurado } from "@/lib/mercadopago/cliente";

export const metadata: Metadata = {
  title: "Carrinho",
  // Página pessoal de cada visitante: não tem o que indexar.
  robots: { index: false, follow: false },
};

// Lê variável de ambiente a cada visita: quando o Mercado Pago for ligado no
// painel, o botão de pagar aparece sem precisar de novo build.
export const dynamic = "force-dynamic";

export default function PaginaCarrinho() {
  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <h1 className="font-display text-4xl font-extrabold">Carrinho</h1>
        <div className="mt-10">
          <TelaCarrinho
            pagamentoOnline={mercadoPagoConfigurado() && freteConfigurado()}
            freteOnline={freteConfigurado()}
          />
        </div>
      </div>
    </section>
  );
}
