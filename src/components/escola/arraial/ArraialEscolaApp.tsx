"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { lugares, textos, type Lugar } from "@/content/play/arraial";
import { textosPescaria } from "@/content/play/pescaria";
import { useMediaQuery } from "@/lib/play/mediaQuery";
import { prenderFoco } from "@/lib/play/focusTrap";
import { Scene } from "@/components/play/arraial/Scene";
import { Joystick } from "@/components/play/arraial/Joystick";
import { HudTopo, Typewriter } from "@/components/play/arraial/Hud";
import { Pescaria } from "@/components/play/arraial/minigames/Pescaria";
import { PosterArraial } from "@/components/play/arraial/PosterArraial";
import { pontoDeParada } from "@/components/play/arraial/mundo/layout";
import { rotaEscola } from "@/lib/escola/host";
import { MISSAO } from "@/lib/escola/missao";
import type { EstadoPartida, Resposta } from "@/lib/escola/servico";
import type { TrilhaPublica } from "@/lib/escola/tipos";
import { chamar } from "../chamar";
import { FITINHA, JA_DEU_FITINHA, ORDEM, fitinhasPor, pessoa, type Pessoa } from "./falas";

type Conversa = {
  quem: Pessoa;
  /** Falas da abertura; quando acabam, entra a pergunta (se a pessoa pergunta). */
  falas: string[];
  etapa: number;
  /** A pessoa já deu a fitinha nesta conversa: só resta despedir. */
  deu: boolean;
};

const BOTAO_CLARO =
  "toque-matraca rounded-full bg-kambada-gold px-5 py-2 font-body text-sm font-bold text-kambada-ink transition-colors hover:bg-kambada-amarelo-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold";
const BOTAO_ESCURO =
  "toque-matraca rounded-full border-2 border-kambada-cream/40 px-5 py-2 font-body text-sm font-bold text-kambada-cream transition-colors hover:border-kambada-cream/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold";

/**
 * Arraial da escola: a praça 3D do Kambada Play (mesma cena, mesmos
 * personagens), com o conteúdo da turma. Cada pessoa com "!" faz as
 * perguntas da trilha escolhida; as respostas entram no relatório do
 * professor marcadas como "Arraial 3D". Nada aqui fala com a API do Play.
 */
export default function ArraialEscolaApp({ trilha: inicial }: { trilha: TrilhaPublica }) {
  const inputRef = useRef({ x: 0, z: 0 });
  const travadoRef = useRef(false);
  const controleRef = useRef<{ irPara: (x: number, z: number) => void } | null>(null);
  const touch = useMediaQuery("(pointer: coarse)");

  const [estado, setEstado] = useState<EstadoPartida | null>(null);
  const [erro, setErro] = useState("");
  const [fitinhas, setFitinhas] = useState<string[]>([]);
  const [conversa, setConversa] = useState<Conversa | null>(null);
  const [descartadas, setDescartadas] = useState<number[]>([]);
  const [dica, setDica] = useState("");
  const [fechada, setFechada] = useState<(Resposta & { escolha: number }) | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [fim, setFim] = useState<Resposta["fim"] | null>(null);
  // A partida traz o resumo de verdade (na missão: as habilidades que ela vai treinar).
  const trilha = estado?.trilha ?? inicial;
  const missao = trilha.id === MISSAO;
  const [textoCompleto, setTextoCompleto] = useState(false);

  const [pertoId, setPertoId] = useState<string | null>(null);
  const [pertoMinigame, setPertoMinigame] = useState<string | null>(null);
  const [pescaria, setPescaria] = useState(false);
  const [seloPescaria, setSeloPescaria] = useState(false);
  const [mapa, setMapa] = useState(false);
  const [lugar, setLugar] = useState<Lugar | null>(null);
  const [jaAndou, setJaAndou] = useState(false);
  const [falhaWebgl, setFalhaWebgl] = useState(false);

  const iniciar = useCallback(async () => {
    setErro("");
    setFim(null);
    setFechada(null);
    setDescartadas([]);
    setDica("");
    const r = await chamar<{ estado: EstadoPartida }>("desafio", { acao: "iniciar", trilha: inicial.id });
    if (!r.ok) {
      setErro(r.mensagem ?? "Não deu para abrir o desafio.");
      return;
    }
    setEstado(r.estado);
    if (r.estado.descartada !== undefined) setDescartadas([r.estado.descartada]);
    if (r.estado.dica) setDica(r.estado.dica);
    // Retomada: quem já respondeu metade volta com as fitinhas daquela metade.
    setFitinhas(ORDEM.slice(0, fitinhasPor(r.estado.indice, r.estado.total)));
  }, [inicial.id]);

  useEffect(() => {
    // Abre (ou retoma) a partida da trilha ao entrar na praça.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void iniciar();
  }, [iniciar]);

  useEffect(() => {
    travadoRef.current = conversa !== null || pescaria || mapa || lugar !== null || fim !== null;
  }, [conversa, pescaria, mapa, lugar, fim]);

  const abrirConversa = useCallback(
    (id: string) => {
      const quem = pessoa(id);
      if (!quem) return;
      setTextoCompleto(false);
      if (quem.pergunta && fitinhas.includes(quem.id)) {
        setConversa({ quem, falas: [JA_DEU_FITINHA], etapa: 0, deu: true });
        return;
      }
      // Na missão, a segunda fala diz o que vai ser treinado.
      const falas = missao && trilha.resumo ? [quem.falas[0], `Tua missão de hoje: ${trilha.resumo.toLowerCase()}. Bora treinar comigo!`] : quem.falas;
      setConversa({ quem, falas, etapa: 0, deu: false });
    },
    [fitinhas, missao, trilha.resumo],
  );

  /**
   * Fecha a pergunta já respondida: avança para a próxima e, se a resposta
   * completou a parte desta pessoa, ela dá a fitinha. Devolve se deu.
   */
  const concluirPergunta = useCallback((): boolean => {
    if (!fechada || !estado || !conversa) return false;
    const ganhou = !!fechada.fim || fitinhasPor(estado.indice + 1, estado.total) > fitinhas.length;
    setDescartadas([]);
    setDica("");
    if (fechada.proxima) setEstado(fechada.proxima);
    setFechada(null);
    if (ganhou) setFitinhas((f) => (f.includes(conversa.quem.id) ? f : [...f, conversa.quem.id]));
    if (fechada.fim) {
      // Missão curta (menos de 10 perguntas): no fim, as cinco fitinhas.
      setFitinhas([...ORDEM]);
      setFim(fechada.fim);
    }
    return ganhou;
  }, [fechada, estado, conversa, fitinhas.length]);

  // Fechar no meio da pergunta guarda a dica e a opção riscada (o servidor já está na 2ª tentativa).
  const fecharConversa = useCallback(() => {
    concluirPergunta();
    setConversa(null);
  }, [concluirPergunta]);

  const emPergunta = !!conversa && !conversa.deu && conversa.quem.pergunta && conversa.etapa >= conversa.falas.length && !!estado;

  const avancar = useCallback(() => {
    if (!conversa || emPergunta) return;
    if (!textoCompleto) {
      setTextoCompleto(true);
      return;
    }
    if (conversa.etapa < conversa.falas.length - 1 || (conversa.quem.pergunta && !conversa.deu && conversa.etapa < conversa.falas.length)) {
      setTextoCompleto(false);
      setConversa({ ...conversa, etapa: conversa.etapa + 1 });
      return;
    }
    fecharConversa();
  }, [conversa, emPergunta, textoCompleto, fecharConversa]);

  async function responder(escolha: number) {
    if (!estado || enviando || fechada) return;
    setEnviando(true);
    setErro("");
    const r = await chamar<{ resposta: Resposta }>("desafio", { acao: "responder", partida: estado.partida, escolha, origem: "arraial" });
    setEnviando(false);
    if (!r.ok) {
      setErro(r.mensagem ?? "Não deu para responder.");
      return;
    }
    const resp = r.resposta;
    if (resp.descartada !== undefined && !resp.resultado) {
      setDescartadas((d) => [...d, resp.descartada!]);
      setDica(resp.dica ?? "");
      return;
    }
    setFechada({ ...resp, escolha });
  }

  /** Depois da explicação: mais uma pergunta da mesma pessoa, ou a fitinha. */
  function seguir() {
    if (!conversa || !concluirPergunta()) return;
    setTextoCompleto(false);
    setConversa({ ...conversa, falas: [FITINHA], etapa: 0, deu: true });
  }

  // E conversa ou abre a pescaria; M abre o mapa; Esc fecha. Enter/Espaço avançam a fala.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const tecla = e.key.toLowerCase();
      if (conversa) {
        if (e.key === "Escape") fecharConversa();
        else if (e.key === "Enter" || e.key === " ") {
          const alvo = e.target as HTMLElement | null;
          if (alvo && (alvo.tagName === "BUTTON" || alvo.tagName === "A")) return;
          e.preventDefault();
          avancar();
        }
        return;
      }
      if (pescaria || fim) return;
      if (e.key === "Escape") {
        setMapa(false);
        setLugar(null);
        return;
      }
      if (tecla === "m" && !lugar) {
        setMapa((v) => !v);
        return;
      }
      if (tecla !== "e" || mapa || lugar) return;
      if (pertoId) abrirConversa(pertoId);
      else if (pertoMinigame === "pescaria") setPescaria(true);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [conversa, pescaria, fim, mapa, lugar, pertoId, pertoMinigame, abrirConversa, fecharConversa, avancar]);

  const irAte = useCallback((id: string) => {
    const destino = pontoDeParada(id);
    setMapa(false);
    if (destino) controleRef.current?.irPara(destino[0], destino[1]);
    setJaAndou(true);
    const l = lugares.find((x) => x.id === id);
    if (l && l.tipo === "lugar") window.setTimeout(() => setLugar(l), 900);
  }, []);

  const aoFalharWebgl = useCallback(() => setFalhaWebgl(true), []);
  const aoMudarPerto = useCallback((id: string | null) => setPertoId(id), []);
  const aoPrimeiroMovimento = useCallback(() => setJaAndou(true), []);

  const quemPerto = pessoa(pertoId);
  const livre = !conversa && !pescaria && !mapa && !lugar && !fim;
  const pontos = estado ? estado.pontos + (fechada?.pontosGanhos ?? 0) : 0;

  if (falhaWebgl) {
    return (
      <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center gap-5 overflow-y-auto bg-kambada-noite px-6 py-16 text-center text-kambada-cream">
        <PosterArraial posicao="fixed" className="opacity-45" />
        <p className="relative font-display text-2xl font-bold italic">{textos.titulo}</p>
        <p className="relative max-w-sm font-body text-sm leading-relaxed text-kambada-cream/85">
          Este aparelho não conseguiu abrir a praça em 3D. O mesmo desafio funciona na tela de perguntas.
        </p>
        <Link href={rotaEscola(`/aluno/${inicial.id}`)} className={`${BOTAO_CLARO} relative px-6 py-3`}>
          Jogar {trilha.titulo}
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] overflow-hidden bg-kambada-noite">
      <Scene
        inputRef={inputRef}
        travadoRef={travadoRef}
        onPertoChange={aoMudarPerto}
        onPertoMinigameChange={setPertoMinigame}
        fitinhas={fitinhas}
        seloPescaria={seloPescaria}
        celebrando={fim !== null}
        onWebglFalha={aoFalharWebgl}
        onPrimeiroMovimento={aoPrimeiroMovimento}
        controleRef={controleRef}
        onClicarLugar={irAte}
      />

      <HudTopo fitinhas={fitinhas} />

      {/* Trilha, progresso e pontos: abaixo das fitinhas, à direita. */}
      {estado && (
        <div className="pointer-events-none absolute right-4 top-16 z-20 rounded-2xl bg-kambada-noite/85 px-3.5 py-2 text-right font-body text-kambada-cream backdrop-blur-sm">
          <p className="text-xs font-semibold">
            <span aria-hidden>{trilha.emoji}</span> {trilha.titulo}
          </p>
          {missao && trilha.resumo && <p className="text-[11px] text-kambada-cream/80">{trilha.resumo}</p>}
          <p className="text-[11px] text-kambada-cream/80">
            {Math.min(estado.indice + (fechada ? 1 : 0), estado.total)} de {estado.total} perguntas · <b className="text-kambada-gold">{pontos} pts</b>
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={() => setMapa(true)}
        aria-haspopup="dialog"
        aria-label={touch ? textos.mapaBotao : `${textos.mapaBotao}. Atalho: tecla M`}
        className="toque-matraca absolute left-4 top-16 z-20 rounded-full bg-kambada-noite/85 px-3.5 py-2 font-body text-xs font-semibold text-kambada-cream backdrop-blur-sm hover:bg-kambada-noite/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
      >
        🗺 {textos.mapaBotao}
        {!touch && <span className="text-kambada-cream/85"> (M)</span>}
      </button>

      {seloPescaria && (
        <p className="pointer-events-none absolute left-4 top-28 z-20 rounded-full bg-kambada-noite/70 px-3 py-1.5 font-body text-[11px] font-semibold text-kambada-cream backdrop-blur-sm">
          🐟 {textosPescaria.seloNome}
        </p>
      )}

      <div className="pointer-events-none absolute inset-x-0 bottom-36 z-10 flex justify-center px-6 sm:bottom-16">
        <p
          aria-hidden={jaAndou}
          className={`hint-arraial rounded-full bg-kambada-noite/80 px-4 py-1.5 text-center font-body text-[13px] text-kambada-cream/90 backdrop-blur-sm ${jaAndou ? "opacity-0" : "opacity-100"}`}
        >
          {touch ? "Use o direcional pra andar." : "Use W A S D ou as setas pra andar."} Quem tem ❗ em cima te dá uma pergunta e uma fitinha.
        </p>
      </div>

      <Link
        href={rotaEscola("/aluno")}
        className="toque-matraca absolute bottom-24 right-4 z-20 rounded-full bg-kambada-noite/85 px-4 py-2 font-body text-xs font-semibold text-kambada-cream/90 backdrop-blur-sm hover:bg-kambada-noite/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold sm:bottom-4 sm:right-24"
      >
        ← Desafios
      </Link>

      {erro && !conversa && (
        <p role="alert" className="absolute inset-x-0 top-28 z-20 mx-auto w-fit rounded-full bg-kambada-red px-4 py-1.5 font-body text-[13px] font-bold text-white">
          {erro}
        </p>
      )}

      {livre && quemPerto && (
        <div className="absolute inset-x-0 bottom-52 z-20 flex justify-center sm:bottom-24">
          <button
            type="button"
            onClick={() => abrirConversa(quemPerto.id)}
            className="pulso toque-matraca rounded-full border-2 border-kambada-cream bg-kambada-gold px-8 py-3 font-body text-base font-bold text-kambada-ink shadow-xl hover:bg-kambada-amarelo-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
          >
            {textos.falar} com {quemPerto.nome}
            {!touch && <span aria-hidden> (E)</span>}
          </button>
        </div>
      )}
      {livre && !quemPerto && pertoMinigame === "pescaria" && (
        <div className="absolute inset-x-0 bottom-52 z-20 flex justify-center sm:bottom-24">
          <button
            type="button"
            onClick={() => setPescaria(true)}
            className="pulso toque-matraca rounded-full border-2 border-kambada-cream bg-kambada-blue px-8 py-3 font-body text-base font-bold text-kambada-cream shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
          >
            {textosPescaria.botaoBrincar}
            {!touch && <span aria-hidden> (E)</span>}
          </button>
        </div>
      )}

      {touch && livre && <Joystick inputRef={inputRef} />}

      {conversa && (
        <CaixaConversa
          conversa={conversa}
          emPergunta={emPergunta}
          estado={estado}
          textoCompleto={textoCompleto}
          aoCompletar={setTextoCompleto}
          descartadas={descartadas}
          dica={dica}
          fechada={fechada}
          enviando={enviando}
          erro={erro}
          onAvancar={avancar}
          onResponder={responder}
          onSeguir={seguir}
          onFechar={fecharConversa}
        />
      )}

      {mapa && <Mapa fitinhas={fitinhas} onIr={irAte} onFechar={() => setMapa(false)} />}
      {lugar && !conversa && !mapa && (
        <Cartao titulo={lugar.nome} onFechar={() => setLugar(null)}>
          {lugar.descricao}
        </Cartao>
      )}

      {pescaria && (
        <Pescaria
          touch={touch}
          onVitoria={() => setSeloPescaria(true)}
          onFechar={() => setPescaria(false)}
        />
      )}

      {fim && !conversa && <Celebracao fim={fim} trilha={trilha} onDeNovo={iniciar} />}
    </div>
  );
}

function CaixaConversa({
  conversa,
  emPergunta,
  estado,
  textoCompleto,
  aoCompletar,
  descartadas,
  dica,
  fechada,
  enviando,
  erro,
  onAvancar,
  onResponder,
  onSeguir,
  onFechar,
}: {
  conversa: Conversa;
  emPergunta: boolean;
  estado: EstadoPartida | null;
  textoCompleto: boolean;
  aoCompletar: (v: boolean) => void;
  descartadas: number[];
  dica: string;
  fechada: (Resposta & { escolha: number }) | null;
  enviando: boolean;
  erro: string;
  onAvancar: () => void;
  onResponder: (i: number) => void;
  onSeguir: () => void;
  onFechar: () => void;
}) {
  const caixaRef = useRef<HTMLDivElement>(null);
  const rolagemRef = useRef<HTMLDivElement>(null);
  const completar = useCallback(() => aoCompletar(true), [aoCompletar]);

  // Em tela baixa (celular deitado) a dica e a explicação nascem abaixo da borda: rola até elas.
  useEffect(() => {
    const el = rolagemRef.current;
    if (el && (dica || fechada)) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [dica, fechada]);

  // Foco no diálogo ao abrir e devolvido ao fechar; Tab fica preso dentro da caixa.
  useEffect(() => {
    const anterior = document.activeElement as HTMLElement | null;
    caixaRef.current?.focus();
    const prender = (e: KeyboardEvent) => {
      if (caixaRef.current) prenderFoco(e, caixaRef.current);
    };
    window.addEventListener("keydown", prender);
    return () => {
      window.removeEventListener("keydown", prender);
      anterior?.focus();
    };
  }, []);

  const { quem } = conversa;
  const fala = conversa.falas[Math.min(conversa.etapa, conversa.falas.length - 1)];
  const q = estado?.questao;

  return (
    <div ref={rolagemRef} className="pointer-events-auto absolute inset-x-0 bottom-0 z-30 max-h-full overflow-y-auto p-3 pb-4">
      <div
        ref={caixaRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={`Conversa com ${quem.nome}`}
        onClick={emPergunta ? undefined : onAvancar}
        className={`dialogo-entrada mx-auto max-w-lg rounded-2xl border-4 border-kambada-cream bg-kambada-noite/95 p-4 shadow-2xl shadow-black/60 outline-none ${emPergunta ? "" : "cursor-pointer"}`}
      >
        <div className="flex items-start justify-between gap-3">
          <p className="font-display text-base font-black" style={{ color: quem.cor }}>
            {quem.nome}
          </p>
          <button type="button" onClick={(e) => { e.stopPropagation(); onFechar(); }} aria-label="Fechar conversa" className="font-body text-lg leading-none text-kambada-cream/70 hover:text-kambada-cream">
            ×
          </button>
        </div>

        {!emPergunta && (
          <>
            <p key={`sr-${conversa.etapa}-${fala}`} role="status" className="sr-only">{fala}</p>
            <p aria-hidden className="mt-1.5 min-h-[3rem] font-body text-[15px] leading-snug text-kambada-cream">
              <Typewriter key={`${quem.id}-${conversa.etapa}-${fala}`} texto={fala} completo={textoCompleto} onCompleto={completar} />
            </p>
            <p className="seta-avanco mt-1 text-right font-body text-kambada-gold" aria-hidden>
              {textos.avancar}
            </p>
          </>
        )}

        {emPergunta && q && (
          <div className="mt-1.5 font-body text-kambada-cream">
            <p className="text-[11px] font-bold uppercase tracking-wider text-kambada-cream/60">
              {q.cena} · {q.habilidade}
            </p>
            <p className="mt-1 text-[16px] font-semibold leading-snug">{q.enunciado}</p>
            <div className="mt-3 flex flex-col gap-2">
              {q.opcoes.map((o, i) => {
                const saiu = descartadas.includes(i);
                const certa = fechada && fechada.correta === i;
                const errada = fechada && !fechada.certo && fechada.escolha === i;
                return (
                  <button
                    key={i}
                    type="button"
                    disabled={saiu || !!fechada || enviando}
                    onClick={() => onResponder(i)}
                    className={`toque-matraca rounded-xl border-2 px-4 py-2.5 text-left text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold ${
                      certa
                        ? "border-kambada-green bg-kambada-green/30"
                        : errada
                          ? "border-kambada-red bg-kambada-red/25"
                          : saiu
                            ? "border-kambada-cream/15 text-kambada-cream/40 line-through"
                            : "border-kambada-cream/30 bg-kambada-navy hover:border-kambada-gold/70"
                    }`}
                  >
                    {o}
                  </button>
                );
              })}
            </div>
            {dica && !fechada && (
              <p role="status" className="mt-3 rounded-xl bg-kambada-gold/15 px-3 py-2 text-sm">
                Quase! Dica: {dica}
              </p>
            )}
            {erro && <p role="alert" className="mt-3 text-sm font-semibold text-kambada-red">{erro}</p>}
            {fechada && (
              <div role="status" className="mt-3 space-y-3">
                <p className={`rounded-xl px-3 py-2 text-sm ${fechada.resultado === "reforco" ? "bg-kambada-red/20" : "bg-kambada-green/25"}`}>
                  {fechada.resultado === "primeira" && "✓ Acertou de primeira! +100. "}
                  {fechada.resultado === "segunda" && "↻ Acertou na segunda! +50. "}
                  {fechada.resultado === "reforco" && "✗ Dessa vez não foi. Olha só: "}
                  {fechada.explica}
                </p>
                <div className="flex justify-end">
                  <button type="button" autoFocus onClick={onSeguir} className={BOTAO_CLARO}>
                    Continuar →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Mapa({ fitinhas, onIr, onFechar }: { fitinhas: string[]; onIr: (id: string) => void; onFechar: () => void }) {
  const perguntam = ORDEM.map((id) => pessoa(id)!);
  const outros = lugares.filter((l) => !l.foraDoMapa && l.tipo !== "conversa");
  return (
    <Cartao titulo={textos.mapaTitulo} onFechar={onFechar}>
      <p className="text-kambada-cream/80">Quem dá pergunta e fitinha:</p>
      <ul className="mt-2 space-y-1.5">
        {perguntam.map((p) => (
          <li key={p.id}>
            <button type="button" onClick={() => onIr(p.id)} className="flex w-full items-center justify-between gap-3 rounded-xl bg-kambada-navy px-3 py-2 text-left font-semibold hover:bg-kambada-navy/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold">
              <span style={{ color: p.cor }}>{p.nome}</span>
              <span className="text-xs text-kambada-cream/70">{fitinhas.includes(p.id) ? "✓ fitinha" : `${textos.mapaIr} →`}</span>
            </button>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-kambada-cream/80">Para passear:</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {outros.map((l) => (
          <li key={l.id}>
            <button type="button" onClick={() => onIr(l.id)} className="rounded-full border border-kambada-cream/30 px-3 py-1.5 text-xs font-semibold hover:border-kambada-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold">
              {l.nome}
            </button>
          </li>
        ))}
      </ul>
    </Cartao>
  );
}

function Cartao({ titulo, onFechar, children }: { titulo: string; onFechar: () => void; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const prender = (e: KeyboardEvent) => {
      if (ref.current) prenderFoco(e, ref.current);
    };
    window.addEventListener("keydown", prender);
    return () => window.removeEventListener("keydown", prender);
  }, []);
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-kambada-noite/60 p-4 backdrop-blur-[2px]" onClick={onFechar}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
        className="dialogo-entrada max-h-full w-full max-w-sm overflow-y-auto rounded-2xl border-4 border-kambada-cream bg-kambada-noite p-5 font-body text-sm text-kambada-cream shadow-2xl outline-none"
      >
        <p className="font-display text-lg font-black text-kambada-gold">{titulo}</p>
        <div className="mt-2 leading-relaxed">{children}</div>
        <div className="mt-4 flex justify-end">
          <button type="button" onClick={onFechar} className={BOTAO_ESCURO}>
            {textos.lugarFechar}
          </button>
        </div>
      </div>
    </div>
  );
}

function Celebracao({ fim, trilha, onDeNovo }: { fim: NonNullable<Resposta["fim"]>; trilha: TrilhaPublica; onDeNovo: () => void }) {
  const [visivel, setVisivel] = useState(false);
  // Um segundo para o Urrou do boi aparecer na praça antes do cartão.
  useEffect(() => {
    const id = window.setTimeout(() => setVisivel(true), 1000);
    return () => window.clearTimeout(id);
  }, []);
  if (!visivel) return null;
  return (
    <div className="celebracao-veu absolute inset-0 z-40 flex items-center justify-center bg-kambada-noite/85 p-6 backdrop-blur-sm">
      <div role="dialog" aria-modal="true" aria-label="Desafio completo" className="celebracao-cartao w-full max-w-sm rounded-3xl border-4 border-kambada-gold bg-kambada-noite p-7 text-center font-body text-kambada-cream shadow-2xl">
        <h2 className="font-display text-3xl font-black">{textos.celebracaoTitulo}</h2>
        <p className="mt-2 text-sm text-kambada-cream/85">
          {trilha.id === MISSAO ? (
            <>
              <b>Missão cumprida!</b> Tu treinou {trilha.resumo.replace(/^Treinar /, "").toLowerCase()}.
            </>
          ) : (
            <>
              Tu juntou as cinco fitinhas de <b>{trilha.titulo}</b>!
            </>
          )}
        </p>
        <p className="mt-4 font-display text-5xl font-extrabold text-kambada-gold">{fim.pontos} pts</p>
        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <p className="rounded-xl bg-kambada-green/25 p-2"><b className="text-lg">✓ {fim.primeira}</b><br />de primeira</p>
          <p className="rounded-xl bg-kambada-gold/20 p-2"><b className="text-lg">↻ {fim.segunda}</b><br />na segunda</p>
          <p className="rounded-xl bg-kambada-red/25 p-2"><b className="text-lg">✗ {fim.reforco}</b><br />para treinar</p>
        </div>
        <div className="mt-6 flex flex-col gap-2.5">
          <button type="button" autoFocus onClick={onDeNovo} className={`${BOTAO_CLARO} py-3`}>
            Jogar de novo
          </button>
          <Link href={rotaEscola("/aluno")} className={`${BOTAO_ESCURO} py-3`}>
            Outros desafios
          </Link>
        </div>
      </div>
    </div>
  );
}
