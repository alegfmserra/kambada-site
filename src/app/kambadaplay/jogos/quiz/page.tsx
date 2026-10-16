import type { Metadata } from "next";
import Link from "next/link";
import { Quiz } from "@/components/play/jogos/Quiz";

export const metadata: Metadata = {
  title: "Éguas! Quem é quem? — Quiz",
  description: "10 perguntas sobre a cultura maranhense, com ranking semanal e cupom para os 3 primeiros.",
};

export default function QuizPage() {
  return (
    <div className="play-tema-site min-h-[70vh]">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <Link href="/kambadaplay/jogos" className="text-sm font-semibold text-[var(--destaque-texto)] hover:underline">
          ← Jogos do Kambada Play
        </Link>
        <div className="mt-8">
          <Quiz />
        </div>
      </div>
    </div>
  );
}
