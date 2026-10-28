import type { Metadata } from "next";
import Link from "next/link";
import { Quebra } from "@/components/play/jogos/Quebra";

export const metadata: Metadata = {
  title: "Quebra-cabeça das estampas",
  description: "Monte as artes da Kambada em 12, 20 ou 40 peças. Menos trocas e mais rapidez rendem mais pontos no ranking.",
};

export default function QuebraPage() {
  return (
    <div className="play-tema-site min-h-[70vh]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link href="/kambadaplay/jogos" className="text-sm font-semibold text-[var(--destaque-texto)] hover:underline">
          ← Jogos do Kambada Play
        </Link>
        <div className="mt-8">
          <Quebra />
        </div>
      </div>
    </div>
  );
}
