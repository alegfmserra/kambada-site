"use client";

import Link from "next/link";
import { useCarrinho } from "./ProvedorCarrinho";

export default function IconeCarrinho() {
  const { pecas, pronto, ultimaAdicao } = useCarrinho();
  const rotulo =
    pronto && pecas > 0
      ? `Carrinho, ${pecas} ${pecas === 1 ? "peça" : "peças"}`
      : "Carrinho, vazio";

  return (
    <Link
      href="/carrinho"
      aria-label={rotulo}
      className="relative inline-flex h-11 w-11 items-center justify-center rounded-full text-texto transition-colors hover:bg-superficie hover:text-kambada-amarelo-escuro"
    >
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 7h12l-1.2 11.1a2 2 0 0 1-2 1.9H9.2a2 2 0 0 1-2-1.9L6 7Z" />
        <path d="M9 7V6a3 3 0 0 1 6 0v1" />
      </svg>
      {pronto && pecas > 0 && (
        <span
          // Nova `key` a cada adição: o React recria o selo e o pulso toca de novo.
          key={ultimaAdicao?.vez ?? 0}
          aria-hidden="true"
          className={`absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-kambada-amarelo px-1 font-display text-xs font-bold text-kambada-grafite ${
            ultimaAdicao ? "pulso-carrinho" : ""
          }`}
        >
          {pecas > 99 ? "99+" : pecas}
        </span>
      )}
    </Link>
  );
}
