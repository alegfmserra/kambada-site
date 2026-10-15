"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { npcs, textos, type Npc } from "@/content/play/arraial";
import { paletaAcento5 as CORES_FITINHA } from "@/lib/play/cores";
import { track } from "@/lib/play/track";
import { prenderFoco } from "@/lib/play/focusTrap";
import { usePrefereMenosMovimento } from "@/lib/play/movimento";

/** Contador de fitinhas no topo, estilo insígnias. */
export function HudTopo({ fitinhas }: { fitinhas: string[] }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-4">
      <span className="rounded-full bg-kambada-noite/70 px-4 py-1.5 font-display text-sm font-semibold italic text-kambada-cream backdrop-blur-sm">
        {textos.titulo}
      </span>
      <div
        role="img"
        aria-label={`Fitinhas: ${fitinhas.length} de ${npcs.length}`}
        className="flex items-center gap-1.5 rounded-full bg-kambada-noite/80 px-3 py-2 backdrop-blur-sm"
      >
        {npcs.map((npc, i) => {
          const ganhou = fitinhas.includes(npc.id);
          return (
            <span
              // A key muda no instante em que a fitinha é ganha: o span remonta
              // e o pop roda uma única vez, só na fitinha nova.
              key={`${npc.id}-${ganhou}`}
              aria-hidden
              className={`hud-fitinha block h-5 w-2.5 rounded-b-full${ganhou ? " fitinha-pop" : ""}`}
              style={{
                backgroundColor: ganhou ? CORES_FITINHA[i] : "transparent",
                border: ganhou ? "none" : "1.5px solid rgba(245,237,224,0.3)",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/**
 * Texto com efeito máquina de escrever. Reinicia sozinho porque o pai passa
 * `key` por etapa/resposta (remonta em vez de resetar `n` manualmente).
 */
function Typewriter({
  texto,
  completo,
  onCompleto,
}: {
  texto: string;
  completo: boolean;
  onCompleto: () => void;
}) {
  const [n, setN] = useState(0);
  const menosMovimento = usePrefereMenosMovimento();
  // Com prefers-reduced-motion o texto aparece inteiro de uma vez.
  const visiveis = menosMovimento ? texto.length : n;

  useEffect(() => {
    if (menosMovimento) return;
    const id = setInterval(
      () => setN((v) => Math.min(v + 3, texto.length)),
      40,
    );
    return () => clearInterval(id);
  }, [texto, menosMovimento]);

  // A conclusão é avisada num efeito (nunca de dentro do updater do setN,
  // que roda durante o render e faria o pai atualizar no meio do render).
  const terminou = texto.length > 0 && visiveis >= texto.length;
  useEffect(() => {
    if (terminou) onCompleto();
  }, [terminou, onCompleto]);

  return <>{completo ? texto : texto.slice(0, visiveis)}</>;
}

type DialogoProps = {
  npc: Npc;
  /** true durante a animação de saída (a caixa ainda está montada). */
  saindo?: boolean;
  onGanhou: () => void;
  onFechar: () => void;
};

/** Caixa de diálogo fixa embaixo, estilo Pokémon: falas, depois quiz. */
export function Dialogo({
  npc,
  saindo = false,
  onGanhou,
  onFechar,
}: DialogoProps) {
  const [etapa, setEtapa] = useState(0);
  const [textoCompleto, setTextoCompleto] = useState(false);
  const [resposta, setResposta] = useState<number | null>(null);
  const caixaRef = useRef<HTMLDivElement>(null);

  // Ao abrir: move o foco pro diálogo e guarda quem tinha o foco antes, pra devolver ao fechar
  useEffect(() => {
    const elementoAnterior = document.activeElement as HTMLElement | null;
    caixaRef.current?.focus();
    return () => {
      elementoAnterior?.focus();
    };
  }, []);

  // Identidade estável: evita reiniciar o setInterval do Typewriter à toa.
  const aoCompletarTexto = useCallback(() => setTextoCompleto(true), []);

  const emQuiz = etapa >= npc.falas.length;
  const respondido = resposta !== null;
  const acertou = respondido && resposta === npc.quiz.correta;

  const avancar = useCallback(() => {
    if (!textoCompleto) {
      setTextoCompleto(true);
      return;
    }
    if (!emQuiz) {
      setTextoCompleto(false);
      setEtapa((e) => e + 1);
    }
  }, [textoCompleto, emQuiz]);

  // Esc fecha o diálogo; Enter e Espaço avançam a fala (quem está num botão ou
  // link do quiz mantém o comportamento nativo); Tab e Shift+Tab ficam presos
  // dentro da caixa (focus trap).
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onFechar();
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        const alvo = e.target as HTMLElement | null;
        if (alvo && (alvo.tagName === "BUTTON" || alvo.tagName === "A")) return;
        e.preventDefault();
        avancar();
        return;
      }
      if (caixaRef.current) prenderFoco(e, caixaRef.current);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [onFechar, avancar]);

  const responder = (i: number) => {
    if (respondido) return;
    setResposta(i);
    setTextoCompleto(false);
    if (i === npc.quiz.correta) onGanhou();
  };

  const textoAtual = emQuiz
    ? respondido
      ? acertou
        ? npc.quiz.acerto
        : npc.quiz.erro
      : npc.quiz.pergunta
    : npc.falas[etapa];

  return (
    <div
      data-saindo={saindo}
      className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 p-3 pb-4"
    >
      <div
        ref={caixaRef}
        tabIndex={-1}
        className="dialogo-entrada mx-auto max-w-lg cursor-pointer rounded-2xl border-4 border-kambada-cream bg-kambada-noite/95 p-4 shadow-2xl shadow-black/60 outline-none"
        onClick={avancar}
        role="dialog"
        aria-modal="true"
        aria-label={`Conversa com ${npc.nome}`}
      >
        <p
          className="font-display text-base font-black"
          style={{ color: npc.cor }}
        >
          {npc.nome}
        </p>
        {/* Leitor de tela recebe a fala inteira de uma vez (e o resultado do quiz);
            o efeito de máquina de escrever fica só visual. */}
        <p
          key={`anuncio-${npc.id}-${etapa}-${String(resposta)}`}
          role="status"
          className="sr-only"
        >
          {textoAtual}
        </p>
        <p
          aria-hidden
          className="mt-1.5 min-h-[4.5rem] font-body text-[15px] leading-snug text-kambada-cream"
        >
          <Typewriter
            key={`${npc.id}-${etapa}-${String(resposta)}`}
            texto={textoAtual}
            completo={textoCompleto}
            onCompleto={aoCompletarTexto}
          />
        </p>

        {/* Opções do quiz */}
        {emQuiz && !respondido && textoCompleto && (
          <div className="mt-3 flex flex-col gap-2">
            {npc.quiz.opcoes.map((op, i) => (
              <button
                key={op}
                onClick={(e) => {
                  e.stopPropagation();
                  responder(i);
                }}
                className="toque-matraca rounded-xl border-2 border-kambada-cream/30 bg-kambada-navy px-4 py-2.5 text-left font-body text-sm font-semibold text-kambada-cream transition-colors hover:border-kambada-gold/70 hover:bg-kambada-navy/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold active:border-kambada-gold"
              >
                {op}
              </button>
            ))}
          </div>
        )}

        {/* Fim da conversa */}
        {emQuiz && respondido && textoCompleto && (
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            {acertou && npc.cta && (
              <Link
                href={npc.cta.href}
                onClick={(e) => {
                  e.stopPropagation();
                  track("arraial_cta_matraca", { origem: "dialogo" });
                }}
                className="toque-matraca rounded-full bg-kambada-red px-5 py-2 font-body text-sm font-bold text-kambada-cream transition-colors hover:bg-kambada-red/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
              >
                {npc.cta.label}
              </Link>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onFechar();
              }}
              className="toque-matraca rounded-full border-2 border-kambada-cream/40 px-5 py-2 font-body text-sm font-bold text-kambada-cream transition-colors hover:border-kambada-cream/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
            >
              {acertou ? "Continuar na festa" : "Volto depois"}
            </button>
          </div>
        )}

        {/* Seta de avanço nas falas */}
        {!emQuiz && (
          <p
            className="seta-avanco mt-1 text-right font-body text-kambada-gold"
            aria-hidden
          >
            {textos.avancar}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Tela de celebração ao juntar as cinco fitinhas. Espera 1 segundo antes de
 * abrir: o Urrou do boi (o clímax na cena 3D) fica visível em vez de nascer
 * tapado pelo backdrop-blur; depois entra em fade + scale com stagger nas
 * fitinhas do cartão.
 */
export function Celebracao({ onVoltar }: { onVoltar: () => void }) {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setVisivel(true), 1000);
    return () => clearTimeout(id);
  }, []);

  if (!visivel) return null;

  return (
    <div className="celebracao-veu pointer-events-auto absolute inset-0 z-40 flex items-center justify-center bg-kambada-noite/85 p-6 backdrop-blur-sm">
      <div className="celebracao-cartao w-full max-w-sm rounded-3xl border-4 border-kambada-gold bg-kambada-noite p-8 text-center shadow-2xl">
        <div className="flex justify-center gap-2" aria-hidden>
          {CORES_FITINHA.map((cor, i) => (
            <span
              key={cor}
              className="celebracao-fitinha block h-8 w-3.5 rounded-b-full"
              style={{ backgroundColor: cor, "--i": i } as React.CSSProperties}
            />
          ))}
        </div>
        <h2 className="mt-5 font-display text-3xl font-black text-kambada-cream">
          {textos.celebracaoTitulo}
        </h2>
        <p className="mt-3 font-body text-sm leading-relaxed text-kambada-cream/85">
          {textos.celebracaoTexto}
        </p>
        <div className="mt-6 flex flex-col gap-2.5">
          <Link
            href="/kambadaplay"
            onClick={() =>
              track("arraial_cta_matraca", { origem: "celebracao" })
            }
            className="toque-matraca rounded-full bg-kambada-red px-6 py-3 font-body font-bold text-kambada-cream transition-colors hover:bg-kambada-red/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
          >
            {textos.celebracaoCta}
          </Link>
          <button
            onClick={onVoltar}
            className="toque-matraca rounded-full border-2 border-kambada-cream/40 px-6 py-3 font-body font-bold text-kambada-cream transition-colors hover:border-kambada-cream/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
          >
            {textos.celebracaoVoltar}
          </button>
        </div>
      </div>
    </div>
  );
}
