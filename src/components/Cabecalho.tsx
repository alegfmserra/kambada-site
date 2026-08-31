"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import AlternadorTema from "@/components/AlternadorTema";
import { CATEGORIAS } from "@/lib/catalogo";
import { NAV } from "@/lib/site";

export default function Cabecalho() {
  const [aberto, setAberto] = useState(false);
  const [submenu, setSubmenu] = useState(false);
  const itemLoja = useRef<HTMLLIElement>(null);

  /* O submenu abre por clique, não por passagem do mouse. Menu que abre no
     hover não existe em tela de toque, atrapalha quem navega por teclado e
     cria um caso ambíguo: aberto pelo mouse, o clique seguinte o fecharia e
     o botão pareceria quebrado. Fecha com Escape ou clique fora. */
  useEffect(() => {
    if (!submenu) return;

    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") setSubmenu(false);
    }
    function aoClicarFora(e: MouseEvent) {
      if (!itemLoja.current?.contains(e.target as Node)) setSubmenu(false);
    }

    document.addEventListener("keydown", aoTeclar);
    document.addEventListener("mousedown", aoClicarFora);
    return () => {
      document.removeEventListener("keydown", aoTeclar);
      document.removeEventListener("mousedown", aoClicarFora);
    };
  }, [submenu]);

  return (
    <header className="sticky top-0 z-40 border-b border-borda bg-fundo/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" aria-label="Kambada — página inicial" className="shrink-0">
          <Image
            src="/marca/kambada-logo-horizontal-amarelo.png"
            alt="Kambada"
            width={160}
            height={48}
            priority
            className="h-9 w-auto sm:h-10 [html[data-tema='claro']_&]:[filter:drop-shadow(0_0_0.5px_#1d1e20)_drop-shadow(0_0_0.5px_#1d1e20)]"
          />
        </Link>

        <nav aria-label="Navegação principal" className="hidden md:block">
          <ul className="flex items-center gap-7">
            {NAV.map((item) => {
              const temSubmenu = item.href === "/loja";

              if (!temSubmenu) {
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-texto-suave transition-colors hover:text-kambada-amarelo-escuro"
                    >
                      {item.rotulo}
                    </Link>
                  </li>
                );
              }

              return (
                <li key={item.href} ref={itemLoja} className="relative">
                  <span className="flex items-center gap-1">
                    <Link
                      href={item.href}
                      className="text-sm font-medium text-texto-suave transition-colors hover:text-kambada-amarelo-escuro"
                    >
                      {item.rotulo}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSubmenu((v) => !v)}
                      aria-expanded={submenu}
                      aria-controls="submenu-loja"
                      className="rounded p-0.5 text-texto-tenue transition-colors hover:text-kambada-amarelo-escuro"
                    >
                      <span className="sr-only">
                        {submenu
                          ? "Fechar categorias da loja"
                          : "Abrir categorias da loja"}
                      </span>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                        className={submenu ? "rotate-180" : undefined}
                      >
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                  </span>

                  {submenu && (
                    <ul
                      id="submenu-loja"
                      className="absolute top-full left-0 mt-3 w-64 overflow-hidden rounded-2xl border border-borda bg-fundo p-2 shadow-xl shadow-black/20"
                    >
                      <li>
                        <Link
                          href="/loja"
                          onClick={() => setSubmenu(false)}
                          className="block rounded-xl px-4 py-2.5 text-sm font-medium text-texto-suave hover:bg-superficie hover:text-kambada-amarelo-escuro"
                        >
                          Toda a loja
                        </Link>
                      </li>
                      {CATEGORIAS.map((categoria) => (
                        <li key={categoria.slug}>
                          <Link
                            href={`/loja/${categoria.slug}`}
                            onClick={() => setSubmenu(false)}
                            className="block rounded-xl px-4 py-2.5 text-sm font-medium text-texto-suave hover:bg-superficie hover:text-kambada-amarelo-escuro"
                          >
                            {categoria.nome}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <AlternadorTema />
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            aria-expanded={aberto}
            aria-controls="menu-mobile"
            className="rounded-md p-2 text-texto md:hidden"
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
      </div>

      {aberto && (
        <nav
          id="menu-mobile"
          aria-label="Navegação principal"
          className="border-t border-borda md:hidden"
        >
          <ul className="mx-auto max-w-6xl px-4 py-2 sm:px-6">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setAberto(false)}
                  className="block py-3 font-medium text-texto-suave hover:text-kambada-amarelo-escuro"
                >
                  {item.rotulo}
                </Link>
                {/* No mobile as categorias ficam sempre à vista: menu suspenso
                    em tela de toque esconde caminho sem necessidade. */}
                {item.href === "/loja" && (
                  <ul className="mb-2 ml-4 border-l border-borda pl-4">
                    {CATEGORIAS.map((categoria) => (
                      <li key={categoria.slug}>
                        <Link
                          href={`/loja/${categoria.slug}`}
                          onClick={() => setAberto(false)}
                          className="block py-2.5 text-sm text-texto-tenue hover:text-kambada-amarelo-escuro"
                        >
                          {categoria.nome}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
