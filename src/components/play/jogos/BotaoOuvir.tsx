"use client";

import { useEffect, useRef, useState } from "react";
import { narracaoDe } from "@/content/play/narracoes";

/**
 * Botão "Ouvir" para os pequenos que ainda não leem. Só existe quando há áudio
 * gravado para o `id` (lista em content/play/narracoes.ts, hoje vazia): sem
 * áudio, não renderiza nada. Toca arquivo gravado; não usa voz sintética.
 */
export function BotaoOuvir({ id, rotulo = "Ouvir", className = "" }: { id: string; rotulo?: string; className?: string }) {
  const endereco = narracaoDe(id);
  const audio = useRef<HTMLAudioElement | null>(null);
  const [tocando, setTocando] = useState(false);

  // Trocou a narração ou saiu da tela: para o som.
  useEffect(() => {
    return () => {
      audio.current?.pause();
      audio.current = null;
    };
  }, [endereco]);

  if (!endereco) return null;

  function alternar() {
    if (!endereco) return;
    if (!audio.current) {
      const a = new Audio(endereco);
      a.addEventListener("ended", () => setTocando(false));
      a.addEventListener("pause", () => setTocando(false));
      a.addEventListener("play", () => setTocando(true));
      audio.current = a;
    }
    if (audio.current.paused) {
      audio.current.currentTime = 0;
      void audio.current.play().catch(() => setTocando(false));
    } else {
      audio.current.pause();
    }
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={tocando}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border-2 border-borda-campo px-4 py-2 text-base font-bold text-texto transition-colors hover:border-kambada-amarelo ${className}`}
    >
      <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true" fill="currentColor">
        {tocando ? (
          <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
        ) : (
          <path d="M4 9v6h4l5 4V5L8 9H4zm11.5 3a4 4 0 0 0-2-3.46v6.92a4 4 0 0 0 2-3.46zm-2-8.2v2.1a6.5 6.5 0 0 1 0 12.2v2.1a8.5 8.5 0 0 0 0-16.4z" />
        )}
      </svg>
      {tocando ? "Parar" : rotulo}
    </button>
  );
}
