"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePrefereMenosMovimento } from "@/lib/play/movimento";
import { prenderFoco } from "@/lib/play/focusTrap";
import { textosPescaria as t } from "@/content/play/pescaria";

type Resultado = "jogando" | "vitoria" | "esgotado";

type Faixa = { periodo: number; numero: number };

const FAIXAS: Faixa[] = [
  { periodo: 4.2, numero: 3 },
  { periodo: 5.6, numero: 7 },
  { periodo: 6.8, numero: 5 },
];

const TENTATIVAS_TOTAL = 3;
const ZONA_CENTRO = 50;

/** Onda triangular 0..1..0, determinística por tempo decorrido, sem Math.random. */
function posicaoPeixe(periodo: number, tempo: number): number {
  const fase = (tempo % periodo) / periodo;
  const onda = fase < 0.5 ? fase * 2 : 2 - fase * 2;
  return 8 + onda * 84;
}

type PescariaProps = {
  /** true quando o toque é o meio de entrada principal (troca o texto de instrução). */
  touch: boolean;
  /** Dispara uma vez, no momento em que o jogador fisga o peixe. */
  onVitoria: () => void;
  /** Fecha o overlay; o argumento diz se fechou depois de vencer. */
  onFechar: (vitoriaAlcancada: boolean) => void;
};

/**
 * Minigame de mira e timing: segurar e soltar o anzol quando o peixe cruza a
 * zona dourada. Overlay DOM sobre a cena 3D (sem canvas novo), acessível por
 * teclado e por toque. O movimento dos peixes é uma onda triangular por
 * tempo decorrido, sem Math.random, atualizada por um passo periódico que
 * fica mais espaçado e sem transição suave com prefers-reduced-motion,
 * virando um passo discreto em vez de nado contínuo, com janela de acerto
 * mais generosa.
 */
export function Pescaria({ touch, onVitoria, onFechar }: PescariaProps) {
  const menosMovimento = usePrefereMenosMovimento();
  const [tempoDiscreto, setTempoDiscreto] = useState(0);
  const [tentativas, setTentativas] = useState(TENTATIVAS_TOTAL);
  const [resultado, setResultado] = useState<Resultado>("jogando");
  const [peixeFisgado, setPeixeFisgado] = useState<number | null>(null);
  const [mensagemErro, setMensagemErro] = useState(false);
  const [segurando, setSegurando] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);
  /** Relógio do jogo lido pelo julgamento do anzol, fora do ciclo de render. */
  const tempoRef = useRef(0);
  const trilhosRef = useRef<(HTMLDivElement | null)[]>([]);

  const zonaLargura = menosMovimento ? 24 : 12;

  // Relógio do jogo em requestAnimationFrame: nado contínuo escrevendo só
  // transform (translateX) direto no DOM, sem re-render nem layout por passo.
  useEffect(() => {
    if (menosMovimento || resultado !== "jogando") return;
    let raf = 0;
    let anterior = performance.now();
    const passo = (agora: number) => {
      tempoRef.current += (agora - anterior) / 1000;
      anterior = agora;
      FAIXAS.forEach((faixa, i) => {
        const trilho = trilhosRef.current[i];
        if (trilho) {
          trilho.style.transform = `translateX(${posicaoPeixe(faixa.periodo, tempoRef.current)}%)`;
        }
      });
      raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [menosMovimento, resultado]);

  // Com prefers-reduced-motion o nado vira um passo discreto e espaçado, com
  // janela de acerto mais generosa (comportamento preservado de antes).
  useEffect(() => {
    if (!menosMovimento) return;
    const intervaloMs = 900;
    const id = setInterval(() => {
      tempoRef.current += intervaloMs / 1000;
      setTempoDiscreto(tempoRef.current);
    }, intervaloMs);
    return () => clearInterval(id);
  }, [menosMovimento]);

  // Ao abrir: move o foco pro overlay e guarda quem tinha o foco antes, pra devolver ao fechar.
  useEffect(() => {
    const elementoAnterior = document.activeElement as HTMLElement | null;
    caixaRef.current?.focus();
    return () => {
      elementoAnterior?.focus();
    };
  }, []);

  // Esc fecha o minigame (abandono se ainda não fisgou); Tab e Shift+Tab ficam
  // presos dentro do overlay (focus trap).
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onFechar(resultado === "vitoria");
        return;
      }
      if (caixaRef.current) prenderFoco(e, caixaRef.current);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar, resultado]);

  // Hook de teste (só fora de produção): força um acerto, pro e2e não depender de timing real.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __pescariaTest?: { fisgar: () => void } };
    w.__pescariaTest = {
      fisgar: () => {
        setResultado("vitoria");
        setPeixeFisgado(FAIXAS[0].numero);
        onVitoria();
      },
    };
    return () => {
      delete w.__pescariaTest;
    };
  }, [onVitoria]);

  const iniciarTentativa = useCallback(() => {
    if (resultado !== "jogando") return;
    setSegurando(true);
    setMensagemErro(false);
  }, [resultado]);

  const soltarAnzol = useCallback(() => {
    if (resultado !== "jogando" || !segurando) return;
    setSegurando(false);
    const alvo = FAIXAS.find(
      (f) => Math.abs(posicaoPeixe(f.periodo, tempoRef.current) - ZONA_CENTRO) <= zonaLargura / 2
    );
    if (alvo) {
      setResultado("vitoria");
      setPeixeFisgado(alvo.numero);
      onVitoria();
      return;
    }
    const restantes = tentativas - 1;
    setTentativas(restantes);
    if (restantes <= 0) {
      setResultado("esgotado");
    } else {
      setMensagemErro(true);
    }
  }, [resultado, segurando, tentativas, zonaLargura, onVitoria]);

  // Espaço como alternativa de teclado ao segurar e soltar o anzol.
  useEffect(() => {
    const baixo = (e: KeyboardEvent) => {
      if (e.code !== "Space" || e.repeat) return;
      e.preventDefault();
      iniciarTentativa();
    };
    const cima = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();
      soltarAnzol();
    };
    window.addEventListener("keydown", baixo);
    window.addEventListener("keyup", cima);
    return () => {
      window.removeEventListener("keydown", baixo);
      window.removeEventListener("keyup", cima);
    };
  }, [iniciarTentativa, soltarAnzol]);

  return (
    <div className="pointer-events-auto absolute inset-0 z-30 flex items-end justify-center p-3 pb-4 sm:items-center">
      <div
        ref={caixaRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t.titulo}
        className="w-full max-w-md rounded-2xl border-4 border-kambada-cream bg-kambada-noite/95 p-4 shadow-2xl shadow-black/60 outline-none"
      >
        <div className="flex items-center justify-between">
          <p className="font-display text-lg font-black text-kambada-blue">{t.titulo}</p>
          {resultado === "jogando" && (
            <p className="font-body text-xs font-semibold text-kambada-cream/80">
              {t.tentativas(tentativas)}
            </p>
          )}
        </div>

        {resultado === "jogando" && (
          <>
            <p className="mt-1 font-body text-[13px] leading-snug text-kambada-cream/80">
              {touch ? t.instrucaoTouch : t.instrucaoDesktop}
            </p>

            {/* Tanque com as três faixas de peixe */}
            <div className="relative mt-3 flex flex-col gap-2">
              {/* Zona de acerto, uma faixa vertical compartilhada pelas três raias */}
              <div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 z-10 rounded-full border-2 border-kambada-gold bg-kambada-gold/15"
                style={{
                  left: `${ZONA_CENTRO - zonaLargura / 2}%`,
                  width: `${zonaLargura}%`,
                }}
              />
              {FAIXAS.map((faixa, i) => (
                <div
                  key={faixa.numero}
                  className="relative h-11 overflow-hidden rounded-full bg-kambada-navy/70"
                >
                  {/* Trilho de largura total: translateX em % da própria largura
                      equivale ao antigo left em %, mas sem layout nem paint. */}
                  <div
                    ref={(el) => {
                      trilhosRef.current[i] = el;
                    }}
                    className="absolute inset-0 will-change-transform"
                    style={{
                      transform: `translateX(${posicaoPeixe(
                        faixa.periodo,
                        menosMovimento ? tempoDiscreto : 0
                      )}%)`,
                    }}
                  >
                    <span
                      className="absolute left-0 top-1/2 flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-kambada-blue font-body text-xs font-bold text-kambada-cream"
                      aria-label={t.peixeNumero(faixa.numero)}
                    >
                      {faixa.numero}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {mensagemErro && (
              <p role="status" className="mt-2 font-body text-xs font-semibold text-kambada-cream/70">
                {t.erro}
              </p>
            )}

            <button
              onPointerDown={iniciarTentativa}
              onPointerUp={soltarAnzol}
              onPointerCancel={() => setSegurando(false)}
              onPointerLeave={() => setSegurando(false)}
              className="pulso toque-matraca mt-3 w-full rounded-full border-2 border-kambada-cream bg-kambada-gold px-6 py-3 font-body text-sm font-bold text-kambada-ink shadow-xl transition-colors hover:bg-kambada-amarelo-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
            >
              {t.botaoAnzol}
              {!touch && <span aria-hidden> (espaço)</span>}
            </button>
          </>
        )}

        {resultado === "vitoria" && (
          <div className="mt-2">
            <p role="status" className="font-body text-sm font-bold text-kambada-gold">
              {t.vitoriaTitulo}
            </p>
            <p className="mt-1 font-body text-sm leading-relaxed text-kambada-cream/90">
              {t.vitoriaTexto}
              {peixeFisgado !== null && ` (${t.peixeNumero(peixeFisgado)})`}
            </p>
            <button
              onClick={() => onFechar(true)}
              className="toque-matraca mt-4 w-full rounded-full bg-kambada-gold px-5 py-2.5 font-body text-sm font-bold text-kambada-ink transition-colors hover:bg-kambada-amarelo-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
            >
              {t.botaoContinuar}
            </button>
          </div>
        )}

        {resultado === "esgotado" && (
          <div className="mt-2">
            <p role="status" className="font-body text-sm font-bold text-kambada-cream">
              {t.esgotadoTitulo}
            </p>
            <p className="mt-1 font-body text-sm leading-relaxed text-kambada-cream/90">
              {t.esgotadoTexto}
            </p>
            <button
              onClick={() => onFechar(false)}
              className="toque-matraca mt-4 w-full rounded-full border-2 border-kambada-cream/40 px-5 py-2.5 font-body text-sm font-bold text-kambada-cream transition-colors hover:border-kambada-cream/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
            >
              {t.botaoSair}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
