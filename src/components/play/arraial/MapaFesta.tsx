"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { lugares, textos, type Lugar } from "@/content/play/arraial";
import { prenderFoco } from "@/lib/play/focusTrap";

const ROTULO_TIPO: Record<Lugar["tipo"], string> = {
  conversa: textos.tipoConversa,
  brincadeira: textos.tipoBrincadeira,
  lugar: textos.tipoLugar,
};

type MapaProps = {
  fitinhas: string[];
  seloPescaria: boolean;
  /** true durante a animação de saída (a superfície ainda está montada). */
  saindo?: boolean;
  onIr: (id: string) => void;
  onFechar: () => void;
};

/**
 * Mapa da festa: equivalente DOM, navegável por teclado e leitor de tela,
 * dos alvos clicáveis da cena 3D. Cada item leva o personagem até o lugar
 * (a proximidade abre o botão de conversa ou de brincar, como andando).
 */
export function MapaDaFesta({
  fitinhas,
  seloPescaria,
  saindo = false,
  onIr,
  onFechar,
}: MapaProps) {
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    // Devolve o foco ao gatilho (botão do mapa) quando o diálogo fecha.
    const origem = document.activeElement as HTMLElement | null;
    const primeiro = el.querySelector<HTMLElement>("button");
    primeiro?.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onFechar();
        return;
      }
      prenderFoco(e, el);
    };
    el.addEventListener("keydown", aoTeclar);
    return () => {
      el.removeEventListener("keydown", aoTeclar);
      origem?.focus?.();
    };
  }, [onFechar]);

  return (
    <div
      data-saindo={saindo}
      className="celebracao-veu fixed inset-0 z-30 flex items-end justify-center bg-kambada-noite/70 p-4 sm:items-center"
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mapa-titulo"
        tabIndex={-1}
        className="celebracao-cartao w-full max-w-md rounded-2xl border border-kambada-cream/15 bg-kambada-noite/95 p-5 text-kambada-cream shadow-2xl backdrop-blur-md"
      >
        <div className="mb-1 flex items-start justify-between gap-3">
          <h2
            id="mapa-titulo"
            className="font-display text-xl font-bold italic"
          >
            {textos.mapaTitulo}
          </h2>
          <button
            onClick={onFechar}
            className="toque-matraca rounded-full px-3 py-2 font-body text-xs font-semibold text-kambada-cream/85 hover:text-kambada-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
          >
            {textos.mapaFechar}
          </button>
        </div>
        <p className="mb-3 font-body text-[13px] leading-snug text-kambada-cream/75">
          {textos.mapaInstrucao}
        </p>
        <ul className="max-h-[52vh] space-y-1.5 overflow-y-auto pr-1">
          {lugares
            .filter((l) => !l.foraDoMapa)
            .map((l) => {
              const feito =
                (l.tipo === "conversa" && fitinhas.includes(l.id)) ||
                (l.id === "pescaria" && seloPescaria);
              return (
                <li key={l.id}>
                  <button
                    onClick={() => onIr(l.id)}
                    aria-label={`${textos.mapaIr} ${l.nome}${feito ? " (concluído)" : ""}`}
                    className="toque-matraca flex w-full items-center gap-3 rounded-xl border border-kambada-cream/10 bg-kambada-cream/5 px-3 py-2.5 text-left transition-colors hover:bg-kambada-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
                  >
                    <span
                      aria-hidden
                      className={`h-2.5 w-2.5 shrink-0 rounded-full ${feito ? "bg-kambada-gold" : "border border-kambada-cream/40"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-body text-sm font-bold">
                        {l.nome}
                      </span>
                      <span className="block truncate font-body text-xs text-kambada-cream/70">
                        {l.resumo}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-kambada-cream/10 px-2 py-0.5 font-body text-[10px] font-semibold uppercase tracking-wide text-kambada-cream/70">
                      {ROTULO_TIPO[l.tipo]}
                    </span>
                  </button>
                </li>
              );
            })}
        </ul>
      </div>
    </div>
  );
}

/** Cartão de um lugar sem NPC (capela, coreto): descrição e chamada opcional. */
export function CartaoLugar({
  lugar,
  saindo = false,
  onFechar,
}: {
  lugar: Lugar;
  saindo?: boolean;
  onFechar: () => void;
}) {
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = caixa.current;
    if (!el) return;
    const origem = document.activeElement as HTMLElement | null;
    el.focus();
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onFechar();
        return;
      }
      prenderFoco(e, el);
    };
    el.addEventListener("keydown", aoTeclar);
    return () => {
      el.removeEventListener("keydown", aoTeclar);
      // O gatilho pode ter sido o mapa (já fechado) ou um objeto 3D: cai no
      // botão do mapa como ponto de retorno estável.
      if (origem && document.contains(origem)) origem.focus?.();
      else document.querySelector<HTMLElement>("[data-botao-mapa]")?.focus();
    };
  }, [onFechar]);

  return (
    <div
      data-saindo={saindo}
      className="absolute inset-x-0 bottom-24 z-20 flex justify-center px-4"
    >
      <div
        ref={caixa}
        role="dialog"
        aria-modal="true"
        aria-label={lugar.nome}
        tabIndex={-1}
        className="celebracao-cartao w-full max-w-md rounded-2xl border border-kambada-cream/15 bg-kambada-noite/90 p-4 text-kambada-cream shadow-xl backdrop-blur-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
      >
        <p className="font-display text-lg font-bold italic">{lugar.nome}</p>
        <p className="mt-1 font-body text-sm leading-relaxed text-kambada-cream/85">
          {lugar.descricao}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {lugar.cta && (
            <Link
              href={lugar.cta.href}
              className="toque-matraca rounded-full bg-kambada-gold px-4 py-2 font-body text-sm font-bold text-kambada-ink hover:bg-kambada-amarelo-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
            >
              {lugar.cta.label}
            </Link>
          )}
          <button
            onClick={onFechar}
            className="toque-matraca rounded-full border border-kambada-cream/40 px-4 py-2 font-body text-sm font-semibold text-kambada-cream hover:bg-kambada-cream/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
          >
            {textos.lugarFechar}
          </button>
        </div>
      </div>
    </div>
  );
}
