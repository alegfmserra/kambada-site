"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { NAV, linkWhatsApp } from "@/lib/site";

export default function Cabecalho() {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-kambada-grafite/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" aria-label="Kambada — página inicial" className="shrink-0">
          <Image
            src="/marca/kambada-logo-horizontal-amarelo.png"
            alt="Kambada"
            width={160}
            height={48}
            priority
            className="h-9 w-auto sm:h-10"
          />
        </Link>

        <nav aria-label="Navegação principal" className="hidden md:block">
          <ul className="flex items-center gap-8">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm font-medium text-kambada-branco/85 transition-colors hover:text-kambada-amarelo"
                >
                  {item.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <a
          href={linkWhatsApp()}
          target="_blank"
          rel="noopener noreferrer"
          className="hidden rounded-full bg-kambada-amarelo px-5 py-2.5 font-display text-sm font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro md:inline-block"
        >
          Fale com a gente
        </a>

        <button
          type="button"
          onClick={() => setAberto((v) => !v)}
          aria-expanded={aberto}
          aria-controls="menu-mobile"
          className="rounded-md p-2 text-kambada-branco md:hidden"
        >
          <span className="sr-only">
            {aberto ? "Fechar menu" : "Abrir menu"}
          </span>
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            aria-hidden="true"
          >
            {aberto ? (
              <>
                <path d="M5 5l14 14" />
                <path d="M19 5L5 19" />
              </>
            ) : (
              <>
                <path d="M4 7h16" />
                <path d="M4 12h16" />
                <path d="M4 17h16" />
              </>
            )}
          </svg>
        </button>
      </div>

      {aberto && (
        <nav
          id="menu-mobile"
          aria-label="Navegação principal"
          className="border-t border-white/10 md:hidden"
        >
          <ul className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setAberto(false)}
                  className="block py-3 font-medium text-kambada-branco/85 hover:text-kambada-amarelo"
                >
                  {item.rotulo}
                </Link>
              </li>
            ))}
            <li className="py-3">
              <a
                href={linkWhatsApp()}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block rounded-full bg-kambada-amarelo px-5 py-2.5 font-display text-sm font-semibold text-kambada-grafite"
              >
                Fale com a gente
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
