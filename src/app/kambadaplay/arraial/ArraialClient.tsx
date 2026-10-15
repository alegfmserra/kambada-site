"use client";

import { useCallback, useEffect, useRef, useState, type ComponentType } from "react";
import { preload } from "react-dom";
import { SplashKambada } from "@/components/play/SplashKambada";
import { PosterArraial } from "@/components/play/arraial/PosterArraial";
import { textos } from "@/content/play/arraial";
import { track } from "@/lib/play/track";
import { useMediaQuery } from "@/lib/play/mediaQuery";

/**
 * O splash da marca cobre a carga; por baixo dele, o pôster estático da praça
 * (uma imagem leve, LCP da rota) já está pintado. O módulo do jogo só começa
 * a carregar depois do `load` da página e num momento ocioso, pra o bundle
 * do three.js não competir com o conteúdo crítico; o splash abre a cortina
 * quando o módulo chegou (prop `pronto`).
 *
 * Em telas de toque (celular e tablet) a praça só é carregada quando a pessoa
 * toca em "Entrar na festa": o bundle 3D custa dados, CPU e bateria, e o
 * pôster já mostra o que espera lá dentro. No desktop a entrada é automática.
 */
export default function ArraialClient() {
  const [App, setApp] = useState<ComponentType | null>(null);
  const toque = useMediaQuery("(pointer: coarse)");
  const [entrou, setEntrou] = useState(false);
  const aguardandoToque = toque && !entrou && App === null;
  const carregando = useRef(false);
  const vigiaRef = useRef<number | null>(null);
  /** Falha de carregamento (rede, chunk bloqueado, tempo esgotado): mostra saída em vez de esperar pra sempre. */
  const [falha, setFalha] = useState<string | null>(null);

  // Em telas largas o pôster é um arquivo: o preload sai no <head> (SSR) antes dos chunks.
  preload("/kambadaplay/images/arraial/poster.webp", { as: "image", fetchPriority: "high", media: "(min-width: 900px)" });

  const carregar = useCallback(async () => {
    if (carregando.current) return;
    carregando.current = true;
    const ocioso = () =>
      new Promise<void>((resolver) => {
        const agendar = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 120));
        agendar(() => resolver());
      });
    const proximoFrame = () => new Promise<void>((r) => requestAnimationFrame(() => requestAnimationFrame(() => r())));
    // 1. O pôster decodifica e pinta (LCP) antes de qualquer JS pesado.
    const poster = document.querySelector<HTMLImageElement>("[data-splash] img");
    await poster?.decode().catch(() => undefined);
    await proximoFrame();
    // Vigia: se o bundle não chegar em 25 s (rede lenta, chunk bloqueado por
    // proxy ou proteção), a pessoa recebe uma saída com "tentar de novo".
    const vigia = window.setTimeout(() => setFalha("tempo"), 25_000);
    vigiaRef.current = vigia;
    try {
      // 2. O three.js é avaliado num chunk próprio (uma tarefa), num momento ocioso.
      await ocioso();
      await import("three");
      // 3. Só então o módulo do jogo (outra tarefa), de novo em momento ocioso.
      await ocioso();
      const mod = await import("./ArraialApp");
      window.clearTimeout(vigia);
      setApp(() => mod.default);
    } catch (erro) {
      window.clearTimeout(vigia);
      console.error("[arraial] falha ao carregar o módulo 3D", erro);
      setFalha("erro");
    }
  }, []);

  const tentarDeNovo = () => {
    // Recarrega a página: chunks com hash antigo (deploy novo) ou bloqueio
    // transitório se resolvem com uma carga limpa.
    window.location.reload();
  };

  // Desktop (ponteiro fino): entra sozinho depois do load. Lê o matchMedia
  // direto: na hidratação a hook ainda devolve o snapshot do servidor (false).
  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;
    const iniciar = () => void carregar();
    if (document.readyState === "complete") iniciar();
    else window.addEventListener("load", iniciar, { once: true });
    return () => window.removeEventListener("load", iniciar);
  }, [carregar]);

  // Cancela o vigia se a rota desmontar antes do bundle chegar.
  useEffect(
    () => () => {
      if (vigiaRef.current !== null) window.clearTimeout(vigiaRef.current);
    },
    []
  );

  const entrar = () => {
    setEntrou(true);
    track("arraial_entrar_toque");
    void carregar();
  };

  if (falha) {
    return (
      <div
        role="alert"
        aria-live="assertive"
        className="fixed inset-0 flex flex-col items-center justify-center gap-4 bg-kambada-noite px-6 text-center text-kambada-cream"
      >
        <PosterArraial posicao="fixed" className="opacity-40" />
        <p className="relative font-display text-2xl font-bold italic">{textos.titulo}</p>
        <p className="relative max-w-sm font-body text-sm leading-relaxed text-kambada-cream/85">
          {falha === "tempo" ? textos.carregaLento : textos.carregaErro}
        </p>
        <button
          type="button"
          autoFocus
          onClick={tentarDeNovo}
          className="toque-matraca relative rounded-full bg-kambada-gold px-6 py-3 font-body font-bold text-kambada-ink hover:bg-kambada-amarelo-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
        >
          {textos.tentarDeNovo}
        </button>
      </div>
    );
  }

  return (
    <>
      <SplashKambada
        tema="arraial"
        rota="arraial"
        pronto={App !== null}
        // O pôster fica visível atrás da logo durante o splash (é o LCP da rota;
        // por trás de um véu opaco o navegador não o contaria).
        fundo={<PosterArraial className="opacity-55" />}
      >
        {App ? <App /> : <div className="fixed inset-0 bg-kambada-noite" aria-hidden />}
      </SplashKambada>
      {/* Chamada de entrada em telas de toque: fora do splash (que é aria-hidden),
          numa camada acima dele, focável e com rótulo. */}
      {aguardandoToque && (
        <div className="fixed inset-x-0 bottom-[14vh] z-[81] flex flex-col items-center gap-3 px-6">
          <button
            type="button"
            onClick={entrar}
            autoFocus
            className="toque-matraca rounded-full border-2 border-kambada-cream bg-kambada-gold px-8 py-3.5 font-body text-base font-bold text-kambada-ink shadow-xl transition-colors hover:bg-kambada-amarelo-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
          >
            {textos.entrar}
          </button>
          <p className="font-body text-xs text-kambada-cream/70">{textos.entrarNota}</p>
        </div>
      )}
    </>
  );
}
