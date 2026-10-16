import type { Metadata } from "next";
import Link from "next/link";
import { Placar } from "@/components/play/jogos/Placar";

export const metadata: Metadata = {
  title: "Ranking",
  description: "O ranking do Kambada Play. Os 3 primeiros da semana ganham cupom de desconto na loja.",
};

export default function PlacarPage() {
  return (
    <div className="play-tema-site min-h-[70vh]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link href="/kambadaplay/jogos" className="text-sm font-semibold text-[var(--destaque-texto)] hover:underline">
          ← Jogos do Kambada Play
        </Link>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Kambada Play</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight text-texto sm:text-5xl">
          Ranking <span className="destaque">da semana</span>
        </h1>
        <p className="mt-3 text-texto-suave">Jogue, some pontos e concorra a cupom de desconto na loja.</p>
        <div className="mt-8">
          <Placar />
        </div>
      </div>
    </div>
  );
}
