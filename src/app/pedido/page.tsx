import type { Metadata } from "next";
import ConsultaPedido from "@/components/pedido/ConsultaPedido";
import { normalizarReferencia } from "@/lib/checkout/acompanhar";

export const metadata: Metadata = {
  title: "Acompanhar pedido",
  description: "Veja a situação do seu pedido da Kambada: pagamento, separação e entrega.",
  alternates: { canonical: "/pedido" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

/**
 * Só o número do pedido pode vir na URL (é o que o link da página de sucesso
 * preenche). O e-mail nunca: dado pessoal não vai em endereço de página.
 */
export default async function PaginaPedido({ searchParams }: Props) {
  const p = await searchParams;
  const ref = typeof p.ref === "string" ? normalizarReferencia(p.ref).slice(0, 24) : "";

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h1 className="font-display text-4xl font-extrabold">Acompanhar pedido</h1>
        <p className="mt-3 max-w-2xl text-lg text-texto-suave">
          Pagamento, separação e entrega — tudo num lugar só.
        </p>
        <div className="mt-10">
          <ConsultaPedido refInicial={ref} />
        </div>
      </div>
    </section>
  );
}
