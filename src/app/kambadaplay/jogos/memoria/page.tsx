import type { Metadata } from "next";
import Link from "next/link";
import { Memoria } from "@/components/play/jogos/Memoria";

export const metadata: Metadata = {
  title: "Memória das estampas",
  description: "Ache os 8 pares das artes da Kambada. Ranking semanal e cupom para os 3 primeiros.",
};

export default function MemoriaPage() {
  return (
    <div className="play-tema-site min-h-[70vh]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link href="/kambadaplay/jogos" className="text-sm font-semibold text-[var(--destaque-texto)] hover:underline">
          ← Jogos do Kambada Play
        </Link>
        <div className="mt-8">
          <Memoria />
        </div>
      </div>
    </div>
  );
}
