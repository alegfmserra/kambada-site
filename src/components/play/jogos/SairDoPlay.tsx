"use client";

import Link from "next/link";
import { useState } from "react";
import { falarComSW } from "../app/pwa";
import { chamar } from "./jogador";

/**
 * Apaga o cookie de acesso e volta para a tela de entrada. Pede confirmação:
 * o link fica no rodapé de toda tela e um toque sem querer tirava a criança
 * do jogo.
 */
export function SairDoPlay() {
  const [confirmando, setConfirmando] = useState(false);

  async function sair() {
    await chamar("/api/play/sair", {});
    // App instalado: apaga as páginas guardadas para ler sem internet (podem ter o nome no cabeçalho).
    await falarComSW({ tipo: "limpar-paginas" }, 5000).catch(() => null);
    // Navegação completa de propósito: o cookie acabou de ser apagado e o porteiro precisa rodar de novo.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign("/kambadaplay/entrar");
  }

  if (confirmando) {
    return (
      <span role="group" aria-label="Sair do Kambada Play?" className="inline-flex flex-wrap items-center justify-center gap-3">
        <span className="text-sm font-semibold text-kambada-branco">Sair do Kambada Play?</span>
        <button
          type="button"
          autoFocus
          onClick={() => setConfirmando(false)}
          className="min-h-11 rounded-full bg-kambada-amarelo px-5 text-sm font-bold text-kambada-grafite"
        >
          Ficar
        </button>
        <button
          type="button"
          onClick={sair}
          className="min-h-11 rounded-full border-2 border-kambada-branco/60 px-5 text-sm font-bold text-kambada-branco hover:border-kambada-amarelo hover:text-kambada-amarelo"
        >
          Sim, sair
        </button>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-4">
      <Link href="/kambadaplay/conta" className="text-xs font-semibold text-kambada-amarelo underline-offset-4 hover:underline">
        Minha conta
      </Link>
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="text-xs font-semibold text-kambada-branco/60 underline-offset-4 hover:text-kambada-amarelo hover:underline"
      >
        Sair do Kambada Play
      </button>
    </span>
  );
}
