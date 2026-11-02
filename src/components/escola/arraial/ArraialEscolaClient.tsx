"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { SplashKambada } from "@/components/play/SplashKambada";
import { PosterArraial } from "@/components/play/arraial/PosterArraial";
import { textos } from "@/content/play/arraial";
import { useMediaQuery } from "@/lib/play/mediaQuery";
import type { TrilhaPublica } from "@/lib/escola/tipos";

type Props = { trilha: TrilhaPublica };

/**
 * Carga da praça 3D no portal da escola: igual à do Play (pôster por baixo
 * do splash, three.js num chunk próprio em momento ocioso; no toque só
 * carrega quando a criança toca em "Entrar na festa"), sem a parte de conta
 * e instalação do Play.
 */
export function ArraialEscolaClient({ trilha }: Props) {
  const [App, setApp] = useState<ComponentType<Props> | null>(null);
  const toque = useMediaQuery("(pointer: coarse)");
  const [entrou, setEntrou] = useState(false);
  const [falha, setFalha] = useState(false);
  const carregando = useRef(false);

  const carregar = useCallback(async () => {
    if (carregando.current) return;
    carregando.current = true;
    const ocioso = () =>
      new Promise<void>((r) => (window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 120)))(() => r()));
    const vigia = window.setTimeout(() => setFalha(true), 25_000);
    try {
      await ocioso();
      await import("three");
      await ocioso();
      const mod = await import("./ArraialEscolaApp");
      window.clearTimeout(vigia);
      setApp(() => mod.default);
    } catch (erro) {
      window.clearTimeout(vigia);
      console.error("[arraial-escola] falha ao carregar o módulo 3D", erro);
      setFalha(true);
    }
  }, []);

  // Desktop: entra sozinho depois do load.
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const iniciar = () => void carregar();
    if (document.readyState === "complete") iniciar();
    else window.addEventListener("load", iniciar, { once: true });
    return () => window.removeEventListener("load", iniciar);
  }, [carregar]);

  if (falha) {
    return (
      <div role="alert" className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-4 bg-kambada-noite px-6 text-center text-kambada-cream">
        <PosterArraial posicao="fixed" className="opacity-40" />
        <p className="relative font-display text-2xl font-bold italic">{textos.titulo}</p>
        <p className="relative max-w-sm font-body text-sm text-kambada-cream/85">{textos.carregaErro}</p>
        <button type="button" autoFocus onClick={() => window.location.reload()} className="toque-matraca relative rounded-full bg-kambada-gold px-6 py-3 font-body font-bold text-kambada-ink">
          {textos.tentarDeNovo}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-kambada-noite">
      <SplashKambada tema="arraial" rota="arraial-escola" pronto={App !== null} fundo={<PosterArraial className="opacity-55" />}>
        {App ? <App trilha={trilha} /> : <div className="fixed inset-0 bg-kambada-noite" aria-hidden />}
      </SplashKambada>
      {toque && !entrou && App === null && (
        <div className="fixed inset-x-0 bottom-[14vh] z-[81] flex flex-col items-center gap-3 px-6">
          <button
            type="button"
            autoFocus
            onClick={() => {
              setEntrou(true);
              void carregar();
            }}
            className="toque-matraca rounded-full border-2 border-kambada-cream bg-kambada-gold px-8 py-3.5 font-body text-base font-bold text-kambada-ink shadow-xl"
          >
            {textos.entrar}
          </button>
          <p className="font-body text-xs text-kambada-cream/70">{textos.entrarNota}</p>
        </div>
      )}
    </div>
  );
}
