"use client";

/**
 * App do Kambada Play no celular (PWA, 30/10/2026) — lado do navegador.
 *
 * O Chrome/Android avisa uma vez só, logo depois de carregar a página, que dá
 * para instalar (`beforeinstallprompt`). O aviso é capturado aqui, no nível do
 * módulo, para o botão "Instalar o app" não perdê-lo se montar depois.
 */

type EventoInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const ESCOPO_APP = "/kambadaplay";
export const ARQUIVO_SW = "/kambadaplay-sw.js";

let aviso: EventoInstalar | null = null;
const ouvintes = new Set<() => void>();
const avisar = () => ouvintes.forEach((f) => f());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // o convite aparece no nosso botão, não na barra do navegador
    aviso = e as EventoInstalar;
    avisar();
  });
  window.addEventListener("appinstalled", () => {
    aviso = null;
    avisar();
  });
}

export function ouvirInstalacao(f: () => void): () => void {
  ouvintes.add(f);
  return () => ouvintes.delete(f);
}

export const podeInstalarDireto = () => aviso !== null;

/** Abre o convite do Chrome. Devolve true se a pessoa aceitou. */
export async function instalarDireto(): Promise<boolean> {
  const a = aviso;
  if (!a) return false;
  aviso = null;
  avisar();
  await a.prompt();
  return (await a.userChoice).outcome === "accepted";
}

/** Já está aberto como app (ícone na tela inicial)? */
export function abertoComoApp(): boolean {
  if (typeof window === "undefined") return false;
  const ios = (navigator as Navigator & { standalone?: boolean }).standalone === true;
  return ios || window.matchMedia("(display-mode: standalone)").matches;
}

/** iPhone/iPad (inclusive iPad que se apresenta como Mac). Lá não há convite automático: só pelo Compartilhar. */
export function ehIOS(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
}

/** No iPhone, só o Safari instala (Chrome e outros no iOS não mostram "Adicionar à Tela de Início" em todas as versões). */
export function ehSafariIOS(): boolean {
  return ehIOS() && !/CriOS|FxiOS|EdgiOS|OPiOS/.test(navigator.userAgent);
}

/** Manda uma mensagem ao service worker ativo e espera a resposta. */
export async function falarComSW<T>(mensagem: unknown, tempoMs = 60_000): Promise<T | null> {
  if (!("serviceWorker" in navigator)) return null;
  const reg = await navigator.serviceWorker.getRegistration(ESCOPO_APP);
  const sw = reg?.active;
  if (!sw) return null;
  return new Promise<T | null>((resolve) => {
    const canal = new MessageChannel();
    const relogio = setTimeout(() => resolve(null), tempoMs);
    canal.port1.onmessage = (e) => {
      clearTimeout(relogio);
      resolve(e.data as T);
    };
    sw.postMessage(mensagem, [canal.port2]);
  });
}
