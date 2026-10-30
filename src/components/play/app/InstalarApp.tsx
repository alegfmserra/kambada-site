"use client";

import Link from "next/link";
import { useState, useSyncExternalStore } from "react";
import { abertoComoApp, ehIOS, ehSafariIOS, instalarDireto, ouvirInstalacao, podeInstalarDireto } from "./pwa";

type Situacao = "carregando" | "instalado" | "direto" | "ios" | "ios-outro-navegador" | "manual";

function situacaoAtual(): Situacao {
  if (abertoComoApp()) return "instalado";
  if (podeInstalarDireto()) return "direto";
  if (ehIOS()) return ehSafariIOS() ? "ios" : "ios-outro-navegador";
  return "manual";
}

/** Muda quando o Chrome libera ou consome o convite, ou quando a página passa a abrir como app. */
function assinar(avisar: () => void): () => void {
  const parar = ouvirInstalacao(avisar);
  const consulta = window.matchMedia("(display-mode: standalone)");
  consulta.addEventListener("change", avisar);
  return () => {
    parar();
    consulta.removeEventListener("change", avisar);
  };
}

const BOTAO =
  "inline-flex items-center gap-2 rounded-full bg-kambada-amarelo px-6 py-3 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-kambada-amarelo";
const BOTAO_PEQUENO =
  "inline-flex items-center gap-1.5 rounded-full bg-kambada-amarelo px-4 py-1.5 text-xs font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro";

/**
 * Botão "Instalar o app" do Kambada Play.
 *  - Android/Chrome (e Chrome/Edge no computador): abre o convite do navegador.
 *  - iPhone/iPad: o Safari não tem convite; mostra os passos (Compartilhar → Adicionar à Tela de Início).
 *  - Já aberto como app: some.
 *  - Outros navegadores: leva para a página "Como instalar".
 * `compacto` = versão da barra de baixo das páginas do Play.
 */
export function InstalarApp({ compacto = false }: { compacto?: boolean }) {
  // Lido só no navegador: no servidor fica "carregando" e nada aparece.
  const situacao = useSyncExternalStore(assinar, situacaoAtual, () => "carregando" as Situacao);
  const [passosAbertos, setPassosAbertos] = useState(false);

  if (situacao === "carregando" || situacao === "instalado") return null;

  if (situacao === "direto") {
    return (
      <button
        type="button"
        className={compacto ? BOTAO_PEQUENO : BOTAO}
        onClick={async () => {
          await instalarDireto();
        }}
      >
        <IconeBaixar /> Instalar o app
      </button>
    );
  }

  if (situacao === "manual") {
    // Navegador sem convite (Firefox, Samsung antigo, etc.): a página explica o caminho pelo menu.
    return compacto ? (
      <Link href="/kambadaplay/instalar" className="text-xs font-semibold text-kambada-amarelo underline-offset-4 hover:underline">
        Instalar o app
      </Link>
    ) : (
      <Link href="/kambadaplay/instalar" className={BOTAO}>
        <IconeBaixar /> Como instalar o app
      </Link>
    );
  }

  return (
    <span className={compacto ? "inline-flex flex-col items-center" : "inline-flex flex-col items-start"}>
      <button
        type="button"
        className={compacto ? BOTAO_PEQUENO : BOTAO}
        aria-expanded={passosAbertos}
        onClick={() => setPassosAbertos((v) => !v)}
      >
        <IconeBaixar /> Instalar o app
      </button>
      {passosAbertos ? <PassosIPhone outroNavegador={situacao === "ios-outro-navegador"} /> : null}
    </span>
  );
}

export function PassosIPhone({ outroNavegador = false }: { outroNavegador?: boolean }) {
  return (
    <ol className="mt-3 max-w-sm list-decimal space-y-2 rounded-xl border-2 border-kambada-amarelo bg-kambada-grafite p-4 pl-9 text-left text-sm leading-relaxed text-kambada-branco">
      {outroNavegador ? (
        <li>
          Abra esta página no <strong>Safari</strong> (o navegador da bússola azul).
        </li>
      ) : null}
      <li>
        Toque em <strong>Compartilhar</strong> <IconeCompartilhar /> (na barra de baixo, ou no alto no iPad).
      </li>
      <li>
        Role a lista e toque em <strong>Adicionar à Tela de Início</strong>.
      </li>
      <li>
        Toque em <strong>Adicionar</strong>. O ícone amarelo do Kambada Play aparece na tela do iPhone.
      </li>
      <li>Abra pelo ícone e entre com o seu login (o do Safari não passa para o app).</li>
    </ol>
  );
}

function IconeBaixar() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14" />
    </svg>
  );
}

export function IconeCompartilhar() {
  return (
    <svg aria-label="(quadrado com seta para cima)" role="img" viewBox="0 0 24 24" className="inline h-4 w-4 align-[-2px]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12M8 7l4-4 4 4M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1" />
    </svg>
  );
}
