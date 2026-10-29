"use client";

import { useEffect, useRef, useState } from "react";
import { chamar } from "@/components/play/jogos/jogador";
import type { Ganho, PerfilPublico } from "@/lib/play/jogos/perfil";
import type { MiniId, ResultadoMini } from "@/lib/play/jogos/minis";
import { emitirPerfil } from "./perfilStore";

type Partida = { estado: string; nome: string; instrucao: string; simbolos: string[]; sequencia: number[] };
type Fim = ResultadoMini & { perfil?: PerfilPublico; ganho?: Ganho };

const MS_POR_PASSO = 800;

/** Uma mini-atividade de repetir a sequência: o servidor sorteia, o jogador vê, repete, e o servidor confere. */
export function MiniAtividade({ mini, aoFechar }: { mini: MiniId; aoFechar: () => void }) {
  const [partida, setPartida] = useState<Partida | null>(null);
  const [erro, setErro] = useState("");
  const [passo, setPasso] = useState(-1); // símbolo aceso agora; -1 = nenhum
  const [vendo, setVendo] = useState(true);
  const [resposta, setResposta] = useState<number[]>([]);
  const [fim, setFim] = useState<Fim | null>(null);
  const [rodada, setRodada] = useState(0);
  const fechar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let vivo = true;
    chamar<Partida>("/api/play/arraial", { acao: "mini-iniciar", mini }).then((r) => {
      if (!vivo) return;
      if (r.ok) {
        setPartida(r);
        setPasso(-1);
        setVendo(true);
        setResposta([]);
        setFim(null);
      } else setErro(r.mensagem ?? "Não deu para começar agora.");
    });
    return () => {
      vivo = false;
    };
  }, [mini, rodada]);

  // Mostra a sequência símbolo a símbolo.
  useEffect(() => {
    if (!partida || !vendo) return;
    let i = 0;
    const id = window.setInterval(() => {
      if (i >= partida.sequencia.length * 2) {
        window.clearInterval(id);
        setPasso(-1);
        setVendo(false);
        return;
      }
      // Alterna aceso/apagado para dois toques iguais seguidos serem vistos.
      setPasso(i % 2 === 0 ? partida.sequencia[i / 2] : -1);
      i += 1;
    }, MS_POR_PASSO / 2);
    return () => window.clearInterval(id);
  }, [partida, vendo]);

  useEffect(() => {
    fechar.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") aoFechar();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [aoFechar]);

  async function tocar(n: number) {
    if (!partida || vendo || fim) return;
    const nova = [...resposta, n];
    setResposta(nova);
    if (nova.length < partida.sequencia.length) return;
    const r = await chamar<Fim>("/api/play/arraial", { acao: "mini-fim", estado: partida.estado, resposta: nova });
    if (!r.ok) {
      setErro(r.mensagem ?? "Não deu para conferir agora.");
      return;
    }
    setFim(r);
    if (r.perfil) emitirPerfil({ perfil: r.perfil, ganho: r.ganho });
  }

  const nomes = partida?.simbolos ?? [];
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 px-3 pb-3 pt-16 sm:items-center" onClick={aoFechar}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={partida?.nome ?? "Mini-atividade"}
        onClick={(e) => e.stopPropagation()}
        className="max-h-[88%] w-full max-w-md overflow-y-auto rounded-2xl bg-kambada-noite p-4 font-body text-kambada-cream shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-bold text-kambada-gold">{partida?.nome ?? "Carregando…"}</h2>
          <button ref={fechar} type="button" onClick={aoFechar} className="rounded-lg bg-kambada-cream/10 px-3 py-1 text-[12px] font-bold">
            Fechar
          </button>
        </div>
        {erro ? <p role="alert" className="mt-3 text-[13px]">{erro}</p> : null}
        {partida ? (
          <>
            <p className="mt-2 text-[12px] text-kambada-cream/80">{partida.instrucao}</p>
            <p role="status" className="mt-3 min-h-[1.5rem] text-center text-[15px] font-bold text-kambada-gold">
              {vendo ? (passo >= 0 ? nomes[passo] : "Olhe com atenção…") : fim ? "" : `Sua vez: ${resposta.length}/${partida.sequencia.length}`}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {nomes.map((nome, n) => (
                <button
                  key={nome}
                  type="button"
                  disabled={vendo || !!fim}
                  onClick={() => tocar(n)}
                  className={`rounded-xl px-2 py-3 text-[13px] font-bold transition-colors ${
                    vendo && passo === n ? "bg-kambada-gold text-kambada-ink" : "bg-kambada-cream/15 disabled:opacity-60"
                  }`}
                >
                  {nome}
                </button>
              ))}
            </div>
            {fim ? (
              <div className="mt-3 rounded-lg bg-kambada-cream/10 p-3 text-[13px]">
                <p className="font-bold">
                  {fim.perfeito ? "Perfeito! " : `${fim.acertos} de ${fim.total} certos. `}
                  {fim.ganho?.xp ? `+${fim.ganho.xp} XP` : fim.perfil ? "XP de hoje desta atividade já foi ganho." : ""}
                </p>
                {!fim.perfeito ? <p className="mt-1 text-kambada-cream/80">Era: {fim.gabarito.map((s) => nomes[s]).join(" → ")}</p> : null}
                <button type="button" onClick={() => setRodada((r) => r + 1)} className="mt-2 rounded-full bg-kambada-gold px-4 py-1.5 text-[12px] font-bold text-kambada-ink">
                  Jogar de novo
                </button>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
