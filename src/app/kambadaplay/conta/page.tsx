import type { Metadata } from "next";
import { MinhaConta } from "@/components/play/jogos/MinhaConta";
import { destinoSeguro } from "@/lib/play/acesso";

export const metadata: Metadata = { title: "Minha conta", robots: { index: false, follow: false } };

export default async function ContaPage({
  searchParams,
}: {
  searchParams: Promise<{ bemvindo?: string; semEmail?: string; senhaTrocada?: string; de?: string }>;
}) {
  const p = await searchParams;
  // Para onde a pessoa ia quando criou a conta: só endereço de dentro do Play (nunca de fora).
  const destino = destinoSeguro(p.de);
  const continuar = p.bemvindo === "1" && destino.startsWith("/kambadaplay") && !destino.startsWith("/kambadaplay/conta") ? destino : undefined;
  return (
    <div className="play-tema-site min-h-[60vh]">
      <div className="mx-auto max-w-md px-4 py-12 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Kambada Play</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-texto sm:text-4xl">
          Minha <span className="destaque">conta</span>
        </h1>
        <MinhaConta bemvindo={p.bemvindo === "1"} semEmail={p.semEmail === "1"} senhaTrocada={p.senhaTrocada === "1"} continuar={continuar} />
      </div>
    </div>
  );
}
