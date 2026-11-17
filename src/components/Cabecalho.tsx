"use client";

import Form from "next/form";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import AlternadorTema from "@/components/AlternadorTema";
import IconeCarrinho from "@/components/carrinho/IconeCarrinho";
import { CATEGORIAS } from "@/lib/catalogo";
import { TAMANHO_MAXIMO_DO_TERMO } from "@/lib/loja/busca";
import { NAV } from "@/lib/site";

export default function Cabecalho() {
  const [aberto, setAberto] = useState(false);
  const [submenu, setSubmenu] = useState(false);
  const itemLoja = useRef<HTMLLIElement>(null);
  // Busca da loja (17/11/2026): a lupa abre um campo logo abaixo do cabeçalho.
  const [busca, setBusca] = useState(false);
  const botaoBusca = useRef<HTMLButtonElement>(null);
  // No Kambada Play a lupa não aparece: a busca é da loja.
  const noPlay = (usePathname() ?? "/").startsWith("/kambadaplay");

  /* Busca aberta: Escape fecha e devolve o foco à lupa. */
  useEffect(() => {
    if (!busca) return;
    function aoTeclar(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      setBusca(false);
      botaoBusca.current?.focus();
    }
    document.addEventListener("keydown", aoTeclar);
    return () => document.removeEventListener("keydown", aoTeclar);
  }, [busca]);

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

  /* Menu mobile aberto: trava a rolagem da página (senão o dedo rola o fundo,
     não o menu) e fecha com Escape. */
  useEffect(() => {
    if (!aberto) return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = anterior;
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  return (
    <header className="sticky top-0 z-40 border-b border-borda bg-fundo/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 lg:gap-4 py-4 sm:px-6">
        <Link href="/" aria-label="Kambada — página inicial" data-alvo="logo" className="shrink-0">
          {/* Escuro: logo toda amarela. Claro: logo toda preta (arquivo do Alexandre, 20/10/2026). */}
          <Image
            src="/marca/kambada-logo-horizontal-amarelo.png"
            alt="Kambada"
            width={160}
            height={48}
            priority
            className="so-escuro h-9 w-auto sm:h-10"
          />
          <Image
            src="/marca/kambada-logo-horizontal-preto.png"
            alt="Kambada"
            width={160}
            height={48}
            priority
            className="so-claro h-9 w-auto sm:h-10"
          />
        </Link>

        <nav aria-label="Navegação principal" className="hidden md:block">
          <ul className="flex items-center gap-4 lg:gap-7">
            {NAV.map((item) => {
              const temSubmenu = item.href === "/loja";

              if (!temSubmenu) {
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      data-alvo={`menu-${item.rotulo}`}
                      className="text-sm font-medium text-texto-suave transition-colors hover-marca"
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
                      data-alvo={`menu-${item.rotulo}`}
                      className="text-sm font-medium text-texto-suave transition-colors hover-marca"
                    >
                      {item.rotulo}
                    </Link>
                    <button
                      type="button"
                      onClick={() => setSubmenu((v) => !v)}
                      aria-expanded={submenu}
                      aria-controls="submenu-loja"
                      data-alvo={submenu ? "menu-loja-fechar-categorias" : "menu-loja-abrir-categorias"}
                      className="inline-flex h-8 w-8 items-center justify-center rounded text-texto-tenue transition-colors hover-marca"
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
                          data-alvo="menu-loja-toda-a-loja"
                          className="block rounded-xl px-4 py-2.5 text-sm font-medium text-texto-suave hover:bg-superficie hover-marca"
                        >
                          Toda a loja
                        </Link>
                      </li>
                      {CATEGORIAS.map((categoria) => (
                        <li key={categoria.slug}>
                          <Link
                            href={`/loja/${categoria.slug}`}
                            onClick={() => setSubmenu(false)}
                            data-alvo={`menu-loja-${categoria.slug}`}
                            className="block rounded-xl px-4 py-2.5 text-sm font-medium text-texto-suave hover:bg-superficie hover-marca"
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

        <div className="flex items-center gap-1 sm:gap-2">
          {!noPlay && (
            <button
              ref={botaoBusca}
              type="button"
              onClick={() => {
                setBusca((v) => !v);
                setAberto(false);
              }}
              aria-expanded={busca}
              aria-controls="busca-cabecalho"
              aria-label={busca ? "Fechar a busca" : "Buscar na loja"}
              title="Buscar na loja"
              data-alvo={busca ? "busca-fechar" : "busca-abrir"}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full text-texto transition-colors hover:bg-superficie hover-marca"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="6.5" />
                <path d="M16 16l4.5 4.5" />
              </svg>
            </button>
          )}
          {/* Sem estado no cliente: /conta manda para /entrar quem não está logado.
              No celular o ícone dá lugar à lupa (não cabem os cinco); a conta fica no menu. */}
          <Link
            href="/conta"
            aria-label="Minha conta"
            title="Minha conta"
            data-alvo="minha-conta"
            className="hidden h-11 w-11 items-center justify-center rounded-full text-texto transition-colors hover:bg-superficie hover-marca sm:inline-flex"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="8" r="3.5" />
              <path d="M5 20a7 7 0 0 1 14 0" />
            </svg>
          </Link>
          <IconeCarrinho />
          <AlternadorTema />
          <button
            type="button"
            onClick={() => {
              setAberto((v) => !v);
              setBusca(false);
            }}
            aria-expanded={aberto}
            aria-controls="menu-mobile"
            data-alvo={aberto ? "menu-fechar" : "menu-abrir"}
            className="inline-flex h-11 w-11 items-center justify-center rounded-md text-texto md:hidden"
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

      {busca && !noPlay && (
        <div id="busca-cabecalho" className="border-t border-borda" data-area="cabecalho-busca">
          <Form
            action="/loja/busca"
            role="search"
            onSubmit={() => setBusca(false)}
            className="mx-auto flex max-w-6xl gap-2 px-4 py-3 sm:px-6"
          >
            <label htmlFor="busca-campo" className="sr-only">
              O que você procura na loja?
            </label>
            <input
              id="busca-campo"
              type="search"
              name="q"
              required
              maxLength={TAMANHO_MAXIMO_DO_TERMO}
              placeholder="Camisa, matraca, boné…"
              autoComplete="off"
              enterKeyHint="search"
              // Quem abriu a busca quer digitar: o foco já entra no campo.
              autoFocus
              className="min-h-11 w-full min-w-0 rounded-full border border-borda-campo bg-superficie px-5 py-2 text-texto outline-none placeholder:text-texto-tenue focus:border-kambada-amarelo-escuro"
            />
            <button
              type="submit"
              data-alvo="buscar"
              className="min-h-11 shrink-0 rounded-full bg-kambada-amarelo px-5 font-display text-sm font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
            >
              Buscar
            </button>
          </Form>
        </div>
      )}

      {aberto && (
        <nav
          id="menu-mobile"
          aria-label="Navegação principal"
          // Rola por dentro: o cabeçalho é fixo, então sem limite de altura o fim da lista ficava fora da tela.
          className="max-h-[calc(100dvh-5rem)] overflow-y-auto overscroll-contain border-t border-borda md:hidden"
        >
          <ul className="mx-auto max-w-6xl px-4 pt-2 pb-20 sm:px-6">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setAberto(false)}
                  data-alvo={`menu-${item.rotulo}`}
                  className="block py-3 font-medium text-texto-suave hover-marca"
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
                          data-alvo={`menu-loja-${categoria.slug}`}
                          className="block py-2.5 text-sm text-texto-tenue hover-marca"
                        >
                          {categoria.nome}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
            {/* No celular o ícone da conta saiu do topo para caber a lupa. */}
            <li className="sm:hidden">
              <Link
                href="/conta"
                onClick={() => setAberto(false)}
                data-alvo="minha-conta"
                className="block py-3 font-medium text-texto-suave hover-marca"
              >
                Minha conta
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
