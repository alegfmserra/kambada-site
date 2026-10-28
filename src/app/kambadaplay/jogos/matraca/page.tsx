import type { Metadata } from "next";
import Link from "next/link";
import { Matraca } from "@/components/play/jogos/Matraca";

export const metadata: Metadata = {
  title: "Monte sua matraca",
  description: "Escolha o tamanho, a estampa e o suporte e veja a sua matraca Kambada. Gostou? Peça pelo WhatsApp.",
};

export default function MatracaPage() {
  return (
    <div className="play-tema-site min-h-[70vh]">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <Link href="/kambadaplay/jogos" className="text-sm font-semibold text-[var(--destaque-texto)] hover:underline">
          ← Jogos do Kambada Play
        </Link>
        <div className="mt-8">
          <Matraca />
        </div>
      </div>
    </div>
  );
}
