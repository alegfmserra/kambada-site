import type { Metadata } from "next";
import Link from "next/link";
import { Palavra } from "@/components/play/jogos/Palavra";

export const metadata: Metadata = {
  title: "Palavra do dia maranhense",
  description: "Uma palavra do Maranhão por dia: 5 letras, 6 tentativas. Descubra o significado e compartilhe o resultado.",
};

export default function PalavraPage() {
  return (
    <div className="play-tema-site min-h-[70vh]">
      <div className="mx-auto max-w-md px-4 py-10 sm:px-6">
        <Link href="/kambadaplay/jogos" className="text-sm font-semibold text-[var(--destaque-texto)] hover:underline">
          ← Jogos do Kambada Play
        </Link>
        <div className="mt-8">
          <Palavra />
        </div>
      </div>
    </div>
  );
}
