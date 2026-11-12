"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { evento } from "@/lib/analytics/eventos";
import { BLACK, ativaEm, hojeSaoLuis, podeAparecerEm, popupNoAr } from "@/lib/campanhas/black";

const CHAVE = "kambada-black-2026";
const VOLTA_EM_MS = 24 * 3_600_000;

/**
 * Pop-up da Black Kambada: quadrado de 5 × 5 polegadas (480 px; no celular encolhe para caber),
 * centralizado, com o cupom e o botão para a loja. Aparece uma vez por dia por navegador, só dentro
 * da janela da promoção. `?black=1` na URL força a abertura para conferir o visual.
 */
export default function PopupBlackKambada() {
  const caminho = usePathname();
  const [aberto, setAberto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const botao = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (!podeAparecerEm(caminho)) return;
    const forcado = new URLSearchParams(window.location.search).get("black") === "1";
    if (!forcado) {
      if (!popupNoAr(hojeSaoLuis())) return;
      try {
        const ultima = Number(localStorage.getItem(CHAVE) ?? 0);
        if (Date.now() - ultima < VOLTA_EM_MS) return;
      } catch {
        /* sem armazenamento: mostra, só não lembra */
      }
    }
    const t = setTimeout(() => setAberto(true), 1200);
    return () => clearTimeout(t);
  }, [caminho]);

  function fechar() {
    setAberto(false);
    try {
      localStorage.setItem(CHAVE, String(Date.now()));
    } catch {
      /* ok */
    }
  }

  useEffect(() => {
    if (!aberto) return;
    evento("view_promotion", { promotion_name: "Black Kambada 2026" });
    botao.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aberto]);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(BLACK.codigo);
      setCopiado(true);
    } catch {
      /* o código está na tela para digitar */
    }
  }

  if (!aberto) return null;
  const jaVale = ativaEm(hojeSaoLuis());
  const inicio = BLACK.inicio.split("-").reverse().slice(0, 2).join("/");
  const fim = BLACK.fim.split("-").reverse().slice(0, 2).join("/");

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4" onClick={fechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="black-titulo"
        onClick={(e) => e.stopPropagation()}
        className="relative aspect-square w-[min(480px,92vw)] overflow-hidden rounded-3xl bg-[#1d1e20] text-white shadow-2xl"
      >
        <svg aria-hidden className="absolute -right-24 -top-24 h-72 w-72 text-[#F5821F]" viewBox="0 0 200 200">
          <circle cx="100" cy="100" r="46" fill="currentColor" />
          {Array.from({ length: 16 }).map((_, i) => (
            <rect key={i} x="96" y="6" width="8" height="30" rx="4" fill="currentColor" transform={`rotate(${i * 22.5} 100 100)`} />
          ))}
        </svg>
        <button type="button" onClick={fechar} aria-label="Fechar" className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-xl font-bold hover:bg-black">
          ×
        </button>
        <div className="relative flex h-full flex-col justify-between p-[6%]">
          <Image src="/marca/kambada-logo-horizontal-amarelo.png" alt="Somos Kambada" width={160} height={48} className="h-auto w-[34%]" />
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.25em] text-[#FFCC29]">Black Friday{jaVale ? "" : ` · a partir de ${inicio}`}</p>
            <h2 id="black-titulo" className="font-display text-[clamp(2.4rem,11vw,4.2rem)] font-extrabold leading-[0.95]">
              Black <span className="text-[#FFCC29]">Kambada</span>
            </h2>
            <p className="mt-2 font-display text-[clamp(1.6rem,7vw,2.6rem)] font-extrabold leading-none">
              {BLACK.percentual}% <span className="text-[#F5821F]">OFF</span>
            </p>
            <p className="mt-2 text-[clamp(0.8rem,3.4vw,1rem)] text-white/80">Matracas, camisas e peças feitas à mão no Maranhão, com desconto de verdade.</p>
          </div>
          <div className="space-y-2">
            <button type="button" onClick={copiar} className="flex w-full items-center justify-between rounded-2xl border-2 border-dashed border-[#FFCC29] px-4 py-2 text-left">
              <span className="font-mono text-lg font-extrabold tracking-wider text-[#FFCC29]">{BLACK.codigo}</span>
              <span className="text-xs font-bold text-white/80">{copiado ? "Copiado ✓" : "Toque para copiar"}</span>
            </button>
            <Link
              ref={botao}
              href={BLACK.link}
              onClick={() => {
                evento("select_promotion", { promotion_name: "Black Kambada 2026" });
                fechar();
              }}
              className="block rounded-full bg-[#FFCC29] px-5 py-3 text-center font-extrabold text-[#1d1e20] hover:bg-[#e0af14]"
            >
              Ir para a loja →
            </Link>
            <p className="text-center text-[11px] text-white/60">
              {jaVale ? "Use no carrinho" : `Guarde o código: vale a partir de ${inicio}`} · até {fim} · só para os {BLACK.usos} primeiros · desconto nas peças, não no frete
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
