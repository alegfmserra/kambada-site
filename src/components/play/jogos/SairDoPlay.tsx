"use client";

import Link from "next/link";
import { chamar } from "./jogador";

/** Apaga o cookie de acesso e volta para a tela de entrada. */
export function SairDoPlay() {
  return (
    <span className="inline-flex items-center gap-4">
      <Link href="/kambadaplay/conta" className="text-xs font-semibold text-kambada-amarelo underline-offset-4 hover:underline">
        Minha conta
      </Link>
      <button
      type="button"
      onClick={async () => {
        await chamar("/api/play/sair", {});
        // Navegação completa de propósito: o cookie acabou de ser apagado e o porteiro precisa rodar de novo.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/kambadaplay/entrar");
      }}
      className="text-xs font-semibold text-kambada-branco/60 underline-offset-4 hover:text-kambada-amarelo hover:underline"
    >
      Sair do Kambada Play
      </button>
    </span>
  );
}
