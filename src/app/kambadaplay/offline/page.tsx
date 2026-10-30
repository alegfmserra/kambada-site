import type { Metadata } from "next";
import { HQsGuardadas } from "@/components/play/app/HQsGuardadas";

export const metadata: Metadata = { title: "Sem internet" };

/**
 * Tela que o app do Play mostra quando a página pedida não está guardada e
 * não há internet (o service worker a guarda na instalação). Sem dado de conta.
 */
export default function OfflinePage() {
  return (
    <div className="play-tema-site">
      <div className="mx-auto max-w-2xl px-4 py-14 sm:px-6">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Kambada Play</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-texto sm:text-4xl">
          Você está sem internet
        </h1>
        <p className="mt-4 text-lg text-texto-suave">
          Os jogos precisam de conexão. Enquanto ela não volta, dá para ler as HQs que ficaram guardadas neste aparelho.
        </p>
        <HQsGuardadas />
      </div>
    </div>
  );
}
