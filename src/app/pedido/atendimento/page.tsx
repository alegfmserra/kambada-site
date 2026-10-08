import type { Metadata } from "next";
import Link from "next/link";
import FormularioAtendimento from "@/components/pedido/FormularioAtendimento";
import { normalizarReferencia } from "@/lib/checkout/acompanhar";

export const metadata: Metadata = {
  title: "Reclamação, troca ou devolução",
  description: "Fale com a Kambada sobre um pedido: entrega, reclamação, troca, defeito ou devolução.",
  alternates: { canonical: "/pedido/atendimento" },
};

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

export default async function PaginaAtendimento({ searchParams }: Props) {
  const p = await searchParams;
  const ref = typeof p.ref === "string" ? normalizarReferencia(p.ref).slice(0, 24) : "";

  return (
    <section>
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <Link href="/pedido" className="font-display text-sm font-semibold text-texto-tenue hover:text-kambada-amarelo-escuro">
          ← Acompanhar pedido
        </Link>
        <h1 className="mt-6 font-display text-4xl font-extrabold">Reclamação, troca ou devolução</h1>
        <p className="mt-3 max-w-2xl text-lg text-texto-suave">
          Conte o que houve com o seu pedido. A gente responde pelo WhatsApp e resolve com você.
        </p>
        <div className="mt-10">
          <FormularioAtendimento refInicial={ref} />
        </div>
      </div>
    </section>
  );
}
