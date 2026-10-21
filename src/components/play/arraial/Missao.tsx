"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { npcs, type Npc } from "@/content/play/arraial";
import { EnviarPontuacao } from "@/components/play/jogos/EnviarPontuacao";
import { chamar } from "@/components/play/jogos/jogador";
import type { MissaoPublica, PerguntaArraial, RespostaArraial } from "@/lib/play/jogos/arraial";
import type { NpcId } from "@/lib/play/jogos/missoesArraial";
import { prenderFoco } from "@/lib/play/focusTrap";
import { track } from "@/lib/play/track";
import { Typewriter } from "./Hud";

const BOTAO_OURO =
  "toque-matraca rounded-full bg-kambada-gold px-5 py-2 font-body text-sm font-bold text-kambada-ink transition-colors hover:bg-kambada-amarelo-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold";
const BOTAO_CONTORNO =
  "toque-matraca rounded-full border-2 border-kambada-cream/40 px-5 py-2 font-body text-sm font-bold text-kambada-cream transition-colors hover:border-kambada-cream/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold";

const nomeDe = (id?: NpcId) => npcs.find((n) => n.id === id)?.nome ?? "";

/**
 * Alguma fala desta partida foi pulada (clique/Enter antes de o texto terminar
 * de aparecer)? Vai junto em cada resposta do desafio; o servidor zera o bônus
 * de rapidez — e mede o tempo de leitura por conta própria, sem confiar nisto.
 * Zera quando o desafio sai da tela (a partida acaba ali e outra começa).
 */
let pulouFalaNaPartida = false;

type DialogoMissaoProps = {
  npc: Npc;
  missao: MissaoPublica;
  /** Pistas já anotadas nesta partida. */
  pistas: string[];
  saindo?: boolean;
  onPista: (npc: NpcId) => void;
  onDesafio: () => void;
  onFechar: () => void;
};

/**
 * Conversa da missão: falas do personagem, pista anotada no fim e a indicação
 * de com quem falar depois. O anfitrião, depois da primeira conversa, chama
 * para o desafio.
 */
export function DialogoMissao({ npc, missao, pistas, saindo = false, onPista, onDesafio, onFechar }: DialogoMissaoProps) {
  const id = npc.id as NpcId;
  const conversa = missao.conversas[id];
  const ehAnfitriao = id === missao.anfitriao;
  // Decidido ao abrir: anotar a pista no fim da 1ª conversa não pode virar a tela para o desafio.
  const [modoDesafio] = useState(() => ehAnfitriao && pistas.includes(id));
  const falas = modoDesafio ? missao.falasDoDesafio : conversa.falas;

  const [etapa, setEtapa] = useState(0);
  const [textoCompleto, setTextoCompleto] = useState(false);
  const caixaRef = useRef<HTMLDivElement>(null);
  const terminou = etapa >= falas.length;
  const aoCompletarTexto = useCallback(() => setTextoCompleto(true), []);

  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    caixaRef.current?.focus();
    return () => anterior?.focus();
  }, []);

  // A pista entra no caderninho quando a última fala termina.
  const anotou = useRef(false);
  useEffect(() => {
    if (terminou && !modoDesafio && !anotou.current) {
      anotou.current = true;
      onPista(id);
    }
  }, [terminou, modoDesafio, id, onPista]);

  const avancar = useCallback(() => {
    if (terminou) return;
    if (!textoCompleto) {
      pulouFalaNaPartida = true;
      setTextoCompleto(true);
      return;
    }
    setTextoCompleto(false);
    setEtapa((e) => e + 1);
  }, [terminou, textoCompleto]);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") return onFechar();
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

  const texto = terminou ? "" : falas[etapa];
  const faltam = npcs.filter((n) => !pistas.includes(n.id) && n.id !== id).length;

  return (
    <div data-saindo={saindo} className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 p-3 pb-4">
      <div
        ref={caixaRef}
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
            Missão: {missao.titulo}
          </p>
        </div>

        {!terminou ? (
          <>
            <p key={`anuncio-${id}-${etapa}`} role="status" className="sr-only">
              {texto}
            </p>
            <p aria-hidden className="mt-1.5 min-h-[4.5rem] font-body text-[15px] leading-snug text-kambada-cream">
              <Typewriter key={`${id}-${etapa}`} texto={texto} completo={textoCompleto} onCompleto={aoCompletarTexto} />
            </p>
            <p className="seta-avanco mt-1 text-right font-body text-kambada-gold" aria-hidden>
              ▾
            </p>
          </>
        ) : modoDesafio ? (
          <div className="mt-3">
            <p className="font-body text-sm text-kambada-cream/85">
              {pistas.length >= npcs.length
                ? "Tu juntou as 5 pistas: vale 100 pontos de bônus no desafio!"
                : `Faltam ${npcs.length - pistas.length} pistas. Dá pra encarar agora, mas sem o bônus de 100 pontos.`}
            </p>
            <div className="mt-3 flex flex-wrap justify-end gap-2">
              <button onClick={(e) => (e.stopPropagation(), onFechar())} className={BOTAO_CONTORNO}>
                Ainda não
              </button>
              <button onClick={(e) => (e.stopPropagation(), onDesafio())} className={BOTAO_OURO} autoFocus>
                Encarar o desafio
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <p role="status" className="rounded-xl border border-kambada-gold/50 bg-kambada-navy/80 px-3 py-2 font-body text-sm text-kambada-cream">
              <span className="font-bold text-kambada-gold">📜 Pista anotada:</span> {conversa.pista}
            </p>
            <p className="mt-2 font-body text-xs text-kambada-cream/70">
              {faltam === 0
                ? `Pistas completas! Volta em ${nomeDe(missao.anfitriao)} para o desafio.`
                : conversa.proximo && !pistas.includes(conversa.proximo)
                  ? `Dica: agora fala com ${nomeDe(conversa.proximo)}.`
                  : `Faltam ${faltam} pistas pela festa.`}
            </p>
            <div className="mt-3 flex justify-end">
              <button onClick={(e) => (e.stopPropagation(), onFechar())} className={BOTAO_OURO} autoFocus>
                Continuar na festa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const LETRAS = ["A", "B", "C"];

/**
 * Desafio final da missão: perguntas uma a uma (o servidor confere), e no fim
 * a pontuação vai para o ranking da semana.
 */
export function DesafioArraial({
  estado: estadoInicial,
  primeira,
  titulo,
  onTerminou,
  onFechar,
}: {
  estado: string;
  primeira: PerguntaArraial;
  titulo: string;
  onTerminou: (acertos: number) => void;
  onFechar: () => void;
}) {
  const [estado, setEstado] = useState(estadoInicial);
  const [pergunta, setPergunta] = useState(primeira);
  const [resultado, setResultado] = useState<RespostaArraial | null>(null);
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [fim, setFim] = useState<RespostaArraial | null>(null);
  // Lido ao abrir: durante o desafio não há falas para pular.
  const [pulou] = useState(() => pulouFalaNaPartida);
  const caixaRef = useRef<HTMLDivElement>(null);

  useEffect(
    () => () => {
      pulouFalaNaPartida = false;
    },
    [],
  );

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (caixaRef.current) prenderFoco(e, caixaRef.current);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  async function responder(i: number) {
    if (enviando || resultado) return;
    setEscolhida(i);
    setEnviando(true);
    const r = await chamar<RespostaArraial>("/api/play/arraial", { acao: "responder", estado, escolha: i, pulou });
    setEnviando(false);
    if (!r.ok) {
      setErro(r.mensagem ?? "Algo deu errado. Recarregue o arraial.");
      return;
    }
    setResultado(r);
    if (r.estado) setEstado(r.estado);
  }

  function seguir() {
    if (!resultado) return;
    if (resultado.proxima) {
      setPergunta(resultado.proxima);
      setResultado(null);
      setEscolhida(null);
    } else {
      setFim(resultado);
      track("arraial_completo", { acertos: resultado.acertos, pontos: resultado.pontos });
    }
  }

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 flex items-center justify-center overflow-y-auto bg-kambada-noite/85 p-4 backdrop-blur-sm">
      <div
        ref={caixaRef}
        role="dialog"
        aria-modal="true"
        aria-label={`Desafio da missão ${titulo}`}
        className="w-full max-w-md rounded-3xl border-4 border-kambada-gold bg-kambada-noite p-6 text-kambada-cream shadow-2xl"
      >
        {fim ? (
          <div className="text-center">
            <p className="font-body text-xs font-bold uppercase tracking-[0.25em] text-kambada-gold">Desafio concluído</p>
            <p className="mt-2 font-display text-4xl font-black">
              {fim.pontos} <span className="text-lg text-kambada-cream/60">pontos</span>
            </p>
            <p className="mt-2 font-body text-sm text-kambada-cream/85">
              Acertou {fim.acertos} de {pergunta.total}
              {fim.bonusPistas ? ` · +${fim.bonusPistas} pelas 5 pistas` : ""}.{" "}
              {(fim.acertos ?? 0) >= pergunta.total - 1 ? "Éguas, tu sabe a história do boi!" : "Volta amanhã e tenta de novo!"}
            </p>
            <p className="mt-1.5 font-body text-xs text-kambada-cream/60">
              Bônus de rapidez: só para quem ouviu os anfitriões até o fim
              {fim.bonusRapidez === false ? " (desta vez ficou de fora: alguma fala foi pulada)." : "."}
            </p>
            {fim.prova ? (
              <div className="mt-5 text-left text-texto">
                <EnviarPontuacao prova={fim.prova} pontos={fim.pontos} />
              </div>
            ) : null}
            <div className="mt-5 flex flex-col gap-2.5">
              <Link
                href="/loja/matracas"
                onClick={() => track("arraial_cta_matraca", { origem: "desafio" })}
                className={`${BOTAO_OURO} py-3`}
              >
                Essa cultura em peça: matracas da Kambada
              </Link>
              <button onClick={() => onTerminou(fim.acertos ?? 0)} className={`${BOTAO_CONTORNO} py-3`}>
                Voltar pra festa
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between font-body text-xs font-bold text-kambada-cream/70">
              <span>
                Desafio · pergunta {pergunta.indice + 1} de {pergunta.total}
              </span>
              <span aria-live="polite">{resultado?.pontos ?? ""}</span>
            </div>
            <h2 className="mt-3 font-display text-xl font-black leading-snug">{pergunta.enunciado}</h2>
            <ul className="mt-4 grid gap-2">
              {pergunta.opcoes.map((o, i) => {
                let estilo = "border-kambada-cream/30 bg-kambada-navy hover:border-kambada-gold/70";
                if (resultado) {
                  if (i === resultado.correta) estilo = "border-kambada-gold bg-kambada-gold text-kambada-ink";
                  else if (i === escolhida) estilo = "border-kambada-cream/30 opacity-60 line-through";
                  else estilo = "border-kambada-cream/20 opacity-50";
                }
                return (
                  <li key={o}>
                    <button
                      disabled={!!resultado || enviando}
                      onClick={() => responder(i)}
                      className={`toque-matraca flex w-full items-center gap-3 rounded-xl border-2 px-4 py-3 text-left font-body text-sm font-semibold transition-colors ${estilo}`}
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-kambada-noite text-xs font-bold text-kambada-gold">
                        {LETRAS[i]}
                      </span>
                      {o}
                    </button>
                  </li>
                );
              })}
            </ul>
            {erro ? (
              <p role="alert" className="mt-3 font-body text-sm font-semibold">
                {erro}
              </p>
            ) : null}
            {resultado ? (
              <div className="mt-4 rounded-xl border border-kambada-cream/20 p-4" role="status">
                <p className="font-display text-lg font-black">
                  {resultado.certa ? `Éguas, acertou! +${resultado.pontosDaPergunta}` : "Vixe, não foi dessa vez."}
                </p>
                <p className="mt-1 font-body text-sm text-kambada-cream/85">{resultado.vocesabia}</p>
                <button onClick={seguir} autoFocus className={`${BOTAO_OURO} mt-3`}>
                  {resultado.proxima ? "Próxima" : "Ver resultado"}
                </button>
              </div>
            ) : null}
            {!resultado ? (
              <button onClick={onFechar} className="mt-5 font-body text-xs text-kambada-cream/50 underline-offset-4 hover:underline">
                Sair do desafio (a partida se perde)
              </button>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
