"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import LinkWhatsApp from "@/components/LinkWhatsApp";
import { evento } from "@/lib/analytics/eventos";
import { BLACK, GATILHO, cupomDaBlackDisponivel, diaMes, faseDaBlack, fracaoRolada, guardarCupom, hojeSaoLuis, podeAparecerEm, popupNoAr } from "@/lib/campanhas/black";
import { linkWhatsApp } from "@/lib/site";

const CHAVE = "kambada-black-2026";
const CHAVE_PAGINAS = "kambada-black-paginas";
const VOLTA_EM_MS = 6 * 3_600_000;

/** Conta as páginas desta visita (por aba). Sem armazenamento, toda página conta como a 1ª. */
function contarPagina(): number {
  try {
    const n = Number(sessionStorage.getItem(CHAVE_PAGINAS) ?? 0) + 1;
    sessionStorage.setItem(CHAVE_PAGINAS, String(n));
    return n;
  } catch {
    return 1;
  }
}

/**
 * Pop-up da Black Kambada: quadrado de 5 × 5 polegadas (480 px; no celular encolhe para caber),
 * centralizado. Aparece até 4 vezes ao dia (de 6 em 6 horas) por navegador, só dentro
 * da janela da promoção. `?black=1` na URL força a abertura para conferir o visual.
 *
 * Duas fases (17/11/2026):
 *  - antes de 22/11, lista de espera: o botão é "Me avisa no WhatsApp" e o código não aparece;
 *  - de 22 a 30/11, o código para copiar e o botão para a loja.
 *
 * Gatilho com intenção: abre na 2ª página da visita, ou ao rolar metade da página,
 * ou depois de 25 s na mesma página. Antes abria 1,2 s depois de qualquer carregamento.
 */
export default function PopupBlackKambada() {
  const caminho = usePathname() ?? "/";
  const [aberto, setAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const dialogo = useRef<HTMLDialogElement>(null);
  const ultimoContado = useRef<string | null>(null);
  const paginas = useRef(0);

  useEffect(() => {
    // No Play nada é contado nem guardado.
    if (caminho.startsWith("/kambadaplay")) return;
    // Cada página conta uma vez (em desenvolvimento o efeito roda duas vezes).
    if (ultimoContado.current !== caminho) {
      ultimoContado.current = caminho;
      paginas.current = contarPagina();
    }
    if (!podeAparecerEm(caminho)) return;

    const forcado = new URLSearchParams(window.location.search).get("black") === "1";
    if (forcado) {
      const t = setTimeout(() => setAberto(true), 300);
      return () => clearTimeout(t);
    }
    if (!popupNoAr(hojeSaoLuis())) return;
    try {
      const ultima = Number(localStorage.getItem(CHAVE) ?? 0);
      if (Date.now() - ultima < VOLTA_EM_MS) return;
    } catch {
      /* sem armazenamento: mostra, só não lembra */
    }

    // Com a promoção aberta, o pop-up mostra o código: só abre se o cupom ainda tem usos (18/11/2026).
    let vivo = true;
    const abrirSeDisponivel = () => {
      if (faseDaBlack(hojeSaoLuis()) !== "aberta") return setAberto(true);
      void cupomDaBlackDisponivel().then((disponivel) => {
        if (vivo && disponivel) setAberto(true);
      });
    };
    // 2ª página da visita em diante: a pessoa já está passeando; abre depois de a página assentar.
    if (paginas.current >= GATILHO.paginas) {
      const t = setTimeout(() => abrirSeDisponivel(), 1200);
      return () => {
        vivo = false;
        clearTimeout(t);
      };
    }
    // 1ª página: espera metade da rolagem ou 25 s, o que vier primeiro. Abre uma vez só:
    // depois de fechado, continuar rolando a mesma página não o traz de volta.
    const t = setTimeout(() => abrir(), GATILHO.esperaMs);
    const limpar = () => {
      clearTimeout(t);
      window.removeEventListener("scroll", aoRolar);
    };
    const abrir = () => {
      limpar();
      abrirSeDisponivel();
    };
    function aoRolar() {
      if (fracaoRolada(window.scrollY, document.documentElement.scrollHeight, window.innerHeight) >= GATILHO.rolagem) abrir();
    }
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => {
      vivo = false;
      limpar();
    };
  }, [caminho]);

  function fechar() {
    setAberto(false);
    try {
      localStorage.setItem(CHAVE, String(Date.now()));
    } catch {
      /* ok */
    }
  }

  /* <dialog> com showModal(): o navegador prende o foco dentro, deixa o resto
     da página inerte para leitor de tela e devolve o foco a quem estava com
     ele quando fecha. O elemento fica sempre montado; só o conteúdo entra e sai. */
  useEffect(() => {
    const d = dialogo.current;
    if (!d) return;
    if (aberto && !d.open) d.showModal();
    if (!aberto && d.open) d.close();
  }, [aberto]);

  useEffect(() => {
    if (!aberto) return;
    evento("view_promotion", {
      promotion_name: BLACK.nome,
      creative_slot: "popup",
      creative_name: faseDaBlack(hojeSaoLuis()) === "aberta" ? "codigo" : "lista-de-espera",
    });
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [aberto]);

  async function copiar() {
    guardarCupom(BLACK.codigo);
    evento("select_promotion", { promotion_name: BLACK.nome, creative_slot: "popup", creative_name: "copiar-codigo" });
    try {
      await navigator.clipboard.writeText(BLACK.codigo);
      setCopiado(true);
    } catch {
      /* o código está na tela para digitar */
    }
  }

  // `?black=1` antes da janela mostra a fase de espera (serve para conferir o visual).
  const jaVale = faseDaBlack(hojeSaoLuis()) === "aberta";
  const inicio = diaMes(BLACK.inicio);
  const fim = diaMes(BLACK.fim);

  return (
    <dialog
      ref={dialogo}
      aria-labelledby="black-titulo"
      aria-describedby="black-texto"
      data-area="popup-black"
      // Esc: o navegador dispara "cancel"; fechamos pelo estado para gravar a hora.
      onCancel={(e) => {
        e.preventDefault();
        fechar();
      }}
      // Clique fora do cartão (no próprio <dialog>, que cobre a tela) fecha.
      onClick={(e) => {
        if (e.target === e.currentTarget) fechar();
      }}
      className="fixed inset-0 z-[70] m-0 h-dvh max-h-none w-screen max-w-none place-items-center bg-black/70 p-4 backdrop:bg-transparent open:grid"
    >
      {aberto && (
      <div
        // No celular a altura segue o conteúdo e rola por dentro se faltar tela;
        // o quadrado de 5 × 5 polegadas vale de 640 px para cima.
        className="relative max-h-[92dvh] w-[min(480px,92vw)] overflow-x-hidden overflow-y-auto overscroll-contain rounded-3xl bg-[#1d1e20] text-white shadow-2xl sm:aspect-square"
      >
        <svg aria-hidden className="absolute -right-24 -top-24 h-72 w-72 text-[#F5821F]" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="46" fill="currentColor" />
          {Array.from({ length: 16 }).map((_, i) => (
            <rect key={i} x="96" y="6" width="8" height="30" rx="4" fill="currentColor" transform={`rotate(${i * 22.5} 100 100)`} />
          ))}
        </svg>
        {/* O cartão é escuro nos dois temas: o contorno de foco aqui dentro é sempre claro. */}
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          data-alvo="fechar"
          className="absolute right-3 top-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-black/60 text-xl font-bold hover:bg-black focus-visible:outline-[#FFCC29]"
        >
          ×
        </button>
        <div className="relative flex min-h-full flex-col justify-between gap-5 p-[6%]">
          <Image src="/marca/kambada-logo-horizontal-amarelo.png" alt="Somos Kambada" width={160} height={48} className="h-auto w-[34%]" />
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#FFCC29]">Black Friday{jaVale ? "" : ` · a partir de ${inicio}`}</p>
            <h2 id="black-titulo" className="font-display text-[clamp(2.4rem,11vw,4.2rem)] font-extrabold leading-[0.95]">
              Black <span className="text-[#FFCC29]">Kambada</span>
            </h2>
            <p className="mt-2 font-display text-[clamp(1.6rem,7vw,2.6rem)] font-extrabold leading-none">
              {BLACK.percentual}% <span className="text-[#F5821F]">OFF</span>
            </p>
            <p id="black-texto" className="mt-2 text-[clamp(0.8rem,3.4vw,1rem)] text-white/80">
              {jaVale
                ? "Matracas, camisas e peças feitas à mão no Maranhão, com desconto de verdade."
                : `De ${inicio} a ${fim}, matracas, camisas e peças feitas à mão no Maranhão com desconto de verdade. Peça o aviso e a gente manda o lembrete no dia.`}
            </p>
          </div>
          {jaVale ? (
            <div className="space-y-2">
              <button
                type="button"
                onClick={copiar}
                data-evento="select_promotion"
                className="flex min-h-11 w-full items-center justify-between rounded-2xl border-2 border-dashed border-[#FFCC29] px-4 py-2 text-left focus-visible:outline-white"
              >
                <span className="font-mono text-lg font-extrabold tracking-wider text-[#FFCC29]">{BLACK.codigo}</span>
                <span className="text-xs font-bold text-white/80" aria-live="polite">
                  {copiado ? "Copiado ✓" : "Toque para copiar"}
                </span>
              </button>
              <Link
                href={BLACK.link}
                data-evento="select_promotion"
                onClick={() => {
                  guardarCupom(BLACK.codigo);
                  evento("select_promotion", { promotion_name: BLACK.nome, creative_slot: "popup", creative_name: "ir-para-a-loja" });
                  fechar();
                }}
                className="block rounded-full bg-[#FFCC29] px-5 py-3 text-center font-extrabold text-[#1d1e20] hover:bg-[#e0af14] focus-visible:outline-white"
              >
                Ir para a loja →
              </Link>
              <p className="text-center text-[11px] text-white/70">
                Use ao finalizar a compra · até {fim} · só para os {BLACK.usos} primeiros · desconto nas peças, não no frete
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <LinkWhatsApp
                origem="black-aviso"
                href={linkWhatsApp(BLACK.mensagemAviso)}
                onClick={fechar}
                className="block rounded-full bg-[#FFCC29] px-5 py-3 text-center font-extrabold text-[#1d1e20] hover:bg-[#e0af14] focus-visible:outline-white"
              >
                Me avisa no WhatsApp
              </LinkWhatsApp>
              <p className="text-center text-[11px] text-white/70">
                Vale de {inicio} a {fim} · só para os {BLACK.usos} primeiros · desconto nas peças, não no frete
              </p>
            </div>
          )}
        </div>
      </div>
      )}
    </dialog>
  );
}
