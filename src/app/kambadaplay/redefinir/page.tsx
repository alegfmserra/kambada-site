import type { Metadata } from "next";
import { FormularioRedefinir } from "@/components/play/jogos/FormularioRedefinir";

export const metadata: Metadata = { title: "Nova senha", robots: { index: false, follow: false } };

export default async function RedefinirPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return (
    <div className="play-tema-site">
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Kambada Play</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-texto sm:text-4xl">
          Criar <span className="destaque">nova senha</span>
        </h1>
        <FormularioRedefinir token={token ?? ""} />
      </div>
    </div>
  );
}
