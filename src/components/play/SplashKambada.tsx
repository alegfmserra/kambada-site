"use client";

import { useEffect, useState } from "react";
import { LogoKambada } from "@/components/play/LogoKambada";
import { paletaMicanga } from "@/lib/play/cores";

type Tema = "noite" | "arraial" | "papel";

type SplashKambadaProps = {
  /** Clima do overlay: noite estrelada (matraca), arraial (miçangas) ou papel de cordel (conto). */
  tema: Tema;
  /** Chave da rota no sessionStorage: primeira visita da sessão ganha o splash completo. */
  rota: string;
  /** Seletor de uma imagem crítica da tela; o splash espera o load real dela. */
  aguardarImg?: string;
  /** Prontidão externa (ex.: módulo do arraial carregado). Default: true. */
  pronto?: boolean;
  /** Fundo opcional atrás da cenografia (ex.: pôster da praça, que vira o LCP da rota). */
  fundo?: React.ReactNode;
  children: React.ReactNode;
};

type Estado = "carregando" | "revelando" | "veu" | "reduzido" | "fim";
type Palco = "aguardando" | "revelado" | "neutro";

/** Duração mínima do splash completo: momento de marca, sem custar LCP percebido. */
const DURACAO_MINIMA = 850;
/** Duração da cortina de saída (bate com --splash-cortina-dur no globals.css). */
const CORTINA_MS = 950;
/** Véu rápido das navegações subsequentes na mesma sessão. */
const VEU_MS = 320;
/** Fade curto do modo reduced-motion. */
const REDUZIDO_MS = 430;

/** Posições fixas das estrelas do céu (determinístico: sem mismatch de hidratação). */
const ESTRELAS = [
  { left: "12%", top: "16%", tam: 3, atraso: "0s" },
  { left: "78%", top: "12%", tam: 2, atraso: "0.6s" },
  { left: "88%", top: "38%", tam: 3, atraso: "1.4s" },
  { left: "8%", top: "58%", tam: 2, atraso: "0.9s" },
  { left: "30%", top: "8%", tam: 2, atraso: "1.9s" },
  { left: "64%", top: "76%", tam: 3, atraso: "0.3s" },
  { left: "22%", top: "82%", tam: 2, atraso: "1.1s" },
  { left: "52%", top: "22%", tam: 2, atraso: "2.2s" },
];

/** Tracinhos de miçanga espalhados no tema arraial. */
const MICANGAS_DECOR = [
  { left: "14%", top: "24%", rot: -24, i: 0 },
  { left: "80%", top: "20%", rot: 18, i: 1 },
  { left: "10%", top: "72%", rot: 12, i: 2 },
  { left: "84%", top: "68%", rot: -14, i: 3 },
  { left: "46%", top: "10%", rot: 6, i: 4 },
  { left: "50%", top: "86%", rot: -8, i: 5 },
];

function esperarImagem(seletor: string): Promise<void> {
  return new Promise((resolver) => {
    const img = document.querySelector<HTMLImageElement>(seletor);
    if (!img || img.complete) return resolver();
    img.addEventListener("load", () => resolver(), { once: true });
    img.addEventListener("error", () => resolver(), { once: true });
    // Rede lenta ou quebrada nunca prende o visitante no splash
    setTimeout(resolver, 6000);
  });
}

/**
 * Splash de marca das três rotas. Na primeira visita da sessão mostra a logo
 * com o cordão de miçangas acendendo, espera a prontidão real da tela
 * (fontes, imagem do hero, módulo do jogo) por no mínimo 1,4s e sai como
 * cortina; os elementos marcados com [data-entrada-splash] entram em stagger
 * logo atrás (via CSS em globals.css). Navegação repetida ganha só um véu de
 * 300ms; com prefers-reduced-motion o splash vira um fade curto.
 */
export function SplashKambada({
  tema,
  rota,
  aguardarImg,
  pronto = true,
  fundo,
  children,
}: SplashKambadaProps) {
  const [modo, setModo] = useState<"cheio" | "reduzido" | "veu" | null>(null);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [palco, setPalco] = useState<Palco>("aguardando");
  const [baseOk, setBaseOk] = useState(false);

  // Decide o modo no cliente: sessionStorage e media query não existem no SSR
  useEffect(() => {
    let jaViu = false;
    try {
      const chave = `kambada-splash:${rota}`;
      jaViu = sessionStorage.getItem(chave) === "1";
      sessionStorage.setItem(chave, "1");
    } catch {
      // storage bloqueado: trata como primeira visita
    }
    const reduzido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- leitura única de sessionStorage/matchMedia no mount, inexistentes no SSR
    setModo(jaViu ? "veu" : reduzido ? "reduzido" : "cheio");
  }, [rota]);

  // Espera a prontidão real: fontes + imagem crítica + duração mínima (só no cheio)
  useEffect(() => {
    if (!modo) return;
    if (modo === "veu") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- atalho síncrono do véu, sem espera assíncrona nesse ramo
      setPalco("neutro");
      setEstado("veu");
      return;
    }
    let vivo = true;
    const esperas: Promise<unknown>[] = [document.fonts.ready];
    if (modo === "cheio") esperas.push(new Promise((r) => setTimeout(r, DURACAO_MINIMA)));
    if (aguardarImg) esperas.push(esperarImagem(aguardarImg));
    Promise.all(esperas).then(() => {
      if (vivo) setBaseOk(true);
    });
    return () => {
      vivo = false;
    };
  }, [modo, aguardarImg]);

  // Tudo pronto: abre a cortina (cheio) ou faz o fade curto (reduzido)
  useEffect(() => {
    if (!modo || modo === "veu" || !baseOk || !pronto || estado !== "carregando") return;
    if (modo === "reduzido") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- atalho síncrono do fade reduzido, sem espera assíncrona nesse ramo
      setPalco("neutro");
      setEstado("reduzido");
      return;
    }
    setPalco("revelado");
    setEstado("revelando");
  }, [modo, baseOk, pronto, estado]);

  // Estados de saída removem o overlay quando a animação CSS termina
  useEffect(() => {
    const duracoes: Partial<Record<Estado, number>> = {
      veu: VEU_MS,
      reduzido: REDUZIDO_MS,
      revelando: CORTINA_MS,
    };
    const dur = duracoes[estado];
    if (dur === undefined) return;
    const t = setTimeout(() => setEstado("fim"), dur);
    return () => clearTimeout(t);
  }, [estado]);

  // Trava o scroll enquanto o overlay cobre a tela
  useEffect(() => {
    if (estado === "fim") return;
    const anterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = anterior;
    };
  }, [estado]);

  const papel = tema === "papel";

  return (
    <>
      {/* Sem JS o splash some e o conteúdo aparece direto */}
      <noscript>
        <style>{`[data-splash]{display:none}[data-splash-palco] [data-entrada-splash]{opacity:1}`}</style>
      </noscript>

      {estado !== "fim" ? (
        <div
          data-splash
          data-tema={tema}
          data-estado={estado}
          aria-hidden
          className={`grain fixed inset-0 z-[80] flex flex-col items-center justify-center overflow-hidden ${
            papel ? "bg-kambada-papel text-kambada-ink" : "bg-kambada-noite text-kambada-cream"
          }`}
        >
          {fundo}
          {/* Cenografia por tema */}
          {!papel
            ? ESTRELAS.map((e, i) => (
                <span
                  key={i}
                  className="anim-piscar absolute rounded-full bg-kambada-cream/50"
                  style={{
                    left: e.left,
                    top: e.top,
                    width: e.tam,
                    height: e.tam,
                    animationDelay: e.atraso,
                  }}
                />
              ))
            : null}
          {tema === "arraial"
            ? MICANGAS_DECOR.map((m) => (
                <span
                  key={m.i}
                  className="splash-micanga absolute h-1 w-5 rounded-full"
                  style={
                    {
                      left: m.left,
                      top: m.top,
                      transform: `rotate(${m.rot}deg)`,
                      backgroundColor: paletaMicanga[m.i % paletaMicanga.length],
                      "--i": m.i,
                    } as React.CSSProperties
                  }
                />
              ))
            : null}
          {papel ? (
            <span className="pointer-events-none absolute inset-4 border border-kambada-ink/30" />
          ) : null}

          {/* Logo central com entrada em escala + fade */}
          <div className="splash-logo relative">
            <LogoKambada />
          </div>

          {/* Progresso: os tracinhos de miçanga acendem em sequência */}
          <div className="relative mt-9 flex items-center gap-2">
            {paletaMicanga.map((cor, i) => (
              <span
                key={i}
                className="splash-micanga h-1.5 w-6 rounded-full"
                style={{ backgroundColor: cor, "--i": i } as React.CSSProperties}
              />
            ))}
          </div>
        </div>
      ) : null}

      <div data-splash-palco={palco}>{children}</div>
    </>
  );
}
