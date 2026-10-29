"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Npc } from "@/content/play/arraial";
import { chamar } from "@/components/play/jogos/jogador";
import type { Ganho, PerfilPublico } from "@/lib/play/jogos/perfil";
import type { Dialogo } from "@/lib/play/jogos/recados";
import { Typewriter } from "./Hud";
import { MiniAtividade } from "./MiniAtividade";
import { emitirPerfil } from "./perfilStore";

type Retorno = {
  falas: string[];
  certa?: boolean;
  avancou: boolean;
  concluida?: { titulo: string; xp: number };
  perfil: PerfilPublico;
  ganho?: Ganho;
};

const BOTAO = "toque-matraca rounded-full bg-kambada-gold px-5 py-2 font-body text-sm font-bold text-kambada-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold";
const OPCAO = "w-full rounded-xl border-2 border-kambada-cream/40 px-4 py-2 text-left font-body text-sm font-bold text-kambada-cream hover:border-kambada-cream/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold disabled:opacity-60";

/**
 * Conversa de recado (missão entre personagens): falas, depois a ação do passo
 * (confirmar, escolher, responder, provar ou entregar). Quem decide se o passo
 * avança é o servidor; aqui só se mostra e se envia o que o jogador escolheu.
 */
export function DialogoRecado({ npc, dialogo, saindo = false, aoFechar }: { npc: Npc; dialogo: Dialogo; saindo?: boolean; aoFechar: () => void }) {
  const [falas, setFalas] = useState<string[]>(dialogo.falas);
  const [etapa, setEtapa] = useState(0);
  const [textoCompleto, setTextoCompleto] = useState(false);
  /** true quando as falas na tela são o retorno do servidor de um passo que avançou. */
  const [retorno, setRetorno] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [erro, setErro] = useState("");
  const [concluida, setConcluida] = useState<Retorno["concluida"]>();
  const [provando, setProvando] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const terminou = etapa >= falas.length;

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    caixa.current?.focus();
    return () => anterior?.focus();
  }, []);

  const avancar = useCallback(() => {
    if (terminou) return;
    if (!textoCompleto) {
      setTextoCompleto(true);
      return;
    }
    setTextoCompleto(false);
    setEtapa((e) => e + 1);
  }, [terminou, textoCompleto]);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (provando) return;
      if (e.key === "Escape") return aoFechar();
      if (e.key === "Enter" || e.key === " ") {
        const alvo = e.target as HTMLElement | null;
        if (alvo && (alvo.tagName === "BUTTON" || alvo.tagName === "A")) return;
        e.preventDefault();
        avancar();
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aoFechar, avancar, provando]);

  async function enviar(resposta?: number) {
    if (ocupado) return;
    setOcupado(true);
    setErro("");
    const r = await chamar<Retorno>("/api/play/arraial", { acao: "recado-fim", npc: npc.id, recado: dialogo.recado, resposta });
    setOcupado(false);
    if (!r.ok) {
      setErro(r.mensagem ?? "Não deu para continuar agora.");
      return;
    }
    emitirPerfil({ perfil: r.perfil, ganho: r.ganho });
    if (r.concluida) setConcluida(r.concluida);
    if (r.falas.length) {
      setFalas(r.falas);
      setEtapa(0);
      setTextoCompleto(false);
      // Resposta errada: depois das falas volta a pergunta (retorno = false).
      setRetorno(r.certa !== false);
    } else {
      aoFechar();
    }
  }

  const texto = terminou ? "" : falas[etapa];

  return (
    <div data-saindo={saindo} className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 p-3 pb-4">
      <div
        ref={caixa}
        tabIndex={-1}
        onClick={avancar}
        role="dialog"
        aria-modal="true"
        aria-label={`Conversa com ${npc.nome}`}
        className="dialogo-entrada mx-auto max-w-lg cursor-pointer rounded-2xl border-4 border-kambada-cream bg-kambada-noite/95 p-4 shadow-2xl shadow-black/60 outline-none"
      >
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-base font-black" style={{ color: npc.cor }}>
            {npc.nome}
          </p>
          <p className="font-body text-[11px] font-semibold uppercase tracking-wider text-kambada-cream/60">
            {dialogo.categoria === "semanal" ? "Missão da semana" : "Missão"}: {dialogo.titulo}
          </p>
        </div>

        {!terminou ? (
          <>
            <p key={`a-${etapa}-${falas.length}`} role="status" className="sr-only">
              {texto}
            </p>
            <p aria-hidden className="mt-1.5 min-h-[4.5rem] font-body text-[15px] leading-snug text-kambada-cream">
              <Typewriter key={`${falas.length}-${etapa}`} texto={texto} completo={textoCompleto} onCompleto={() => setTextoCompleto(true)} />
            </p>
            <p className="seta-avanco mt-1 text-right font-body text-kambada-gold" aria-hidden>
              ▾
            </p>
          </>
        ) : (
          <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
            {concluida ? (
              <p role="status" className="rounded-lg bg-kambada-gold px-3 py-2 text-center font-body text-sm font-bold text-kambada-ink">
                Missão concluída: {concluida.titulo} · +{concluida.xp} XP
              </p>
            ) : null}
            {erro ? <p role="alert" className="font-body text-sm text-kambada-cream">{erro}</p> : null}

            {retorno ? (
              <button type="button" onClick={aoFechar} className={BOTAO}>
                Fechar
              </button>
            ) : dialogo.tipo === "avisar" ? (
              <button type="button" onClick={aoFechar} className={BOTAO}>
                Entendi
              </button>
            ) : dialogo.tipo === "responder" && dialogo.pergunta ? (
              <>
                <p className="font-body text-sm font-bold text-kambada-gold">{dialogo.pergunta.enunciado}</p>
                {dialogo.pergunta.opcoes.map((o, i) => (
                  <button key={o} type="button" disabled={ocupado} onClick={() => enviar(i)} className={OPCAO}>
                    {o}
                  </button>
                ))}
              </>
            ) : dialogo.tipo === "falar" && dialogo.escolhas ? (
              dialogo.escolhas.map((o, i) => (
                <button key={o} type="button" disabled={ocupado} onClick={() => enviar(i)} className={OPCAO}>
                  {o}
                </button>
              ))
            ) : dialogo.tipo === "prova" && dialogo.mini ? (
              <button type="button" onClick={() => setProvando(true)} className={BOTAO}>
                Começar a prova
              </button>
            ) : dialogo.tipo === "entregar" ? (
              <button type="button" disabled={ocupado} onClick={() => enviar()} className={BOTAO}>
                Entregar a lembrança do baú
              </button>
            ) : (
              <button type="button" disabled={ocupado} onClick={() => enviar()} className={BOTAO}>
                Combinado!
              </button>
            )}
          </div>
        )}
      </div>
      {provando && dialogo.mini ? (
        <MiniAtividade
          mini={dialogo.mini}
          recado={dialogo.recado}
          aoFechar={() => {
            setProvando(false);
            aoFechar();
          }}
        />
      ) : null}
    </div>
  );
}
