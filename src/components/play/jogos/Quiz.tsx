"use client";

import { useEffect, useRef, useState } from "react";
import {
  NIVEIS,
  QUIZ_NIVEL,
  type Nivel,
  type PerguntaPublica,
  type RespostaQuiz,
} from "@/lib/play/jogos/tipos";
import { EnviarPontuacao } from "./EnviarPontuacao";
import { chamar } from "./jogador";

type Fase = "inicio" | "carregando" | "pergunta" | "resposta" | "fim";

const LETRAS = ["A", "B", "C", "D"];

/** Éguas! Quem é quem? — uma pergunta por vez; o servidor guarda as respostas certas. */
export function Quiz() {
  const [fase, setFase] = useState<Fase>("inicio");
  const [nivel, setNivel] = useState<Nivel>("medio");
  const [estado, setEstado] = useState("");
  const [pergunta, setPergunta] = useState<PerguntaPublica | null>(null);
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const [resultado, setResultado] = useState<RespostaQuiz | null>(null);
  const [pontos, setPontos] = useState(0);
  const [acertos, setAcertos] = useState(0);
  const [prova, setProva] = useState("");
  const [erro, setErro] = useState("");
  const [restante, setRestante] = useState(QUIZ_NIVEL.medio.tempoBonusS);
  const inicio = useRef(0);

  const regras = QUIZ_NIVEL[nivel];

  // Relógio do bônus (só enfeite: o servidor é quem mede o tempo de verdade).
  useEffect(() => {
    if (fase !== "pergunta") return;
    inicio.current = Date.now();
    const total = QUIZ_NIVEL[nivel].tempoBonusS;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reinicia o relógio do bônus a cada pergunta
    setRestante(total);
    const t = window.setInterval(() => {
      setRestante(Math.max(0, total - (Date.now() - inicio.current) / 1000));
    }, 200);
    return () => window.clearInterval(t);
  }, [fase, pergunta, nivel]);

  async function comecar() {
    setErro("");
    setFase("carregando");
    const r = await chamar<{ estado: string; pergunta: PerguntaPublica }>("/api/play/quiz", {
      acao: "iniciar",
      nivel,
    });
    if (!r.ok) {
      setErro(r.mensagem ?? "Não deu para começar.");
      setFase("inicio");
      return;
    }
    setPontos(0);
    setAcertos(0);
    setProva("");
    setEscolhida(null);
    setResultado(null);
    setEstado(r.estado);
    setPergunta(r.pergunta);
    setFase("pergunta");
  }

  async function responder(i: number) {
    if (fase !== "pergunta") return;
    setEscolhida(i);
    setFase("carregando");
    const r = await chamar<RespostaQuiz>("/api/play/quiz", { acao: "responder", estado, escolha: i });
    if (!r.ok) {
      setErro(r.mensagem ?? "Algo deu errado. Comece de novo.");
      setFase("inicio");
      return;
    }
    setResultado(r);
    setPontos(r.pontos);
    if (r.certa) setAcertos((n) => n + 1);
    if (r.estado) setEstado(r.estado);
    if (r.prova) setProva(r.prova);
    setFase("resposta");
  }

  function proxima() {
    if (!resultado) return;
    if (resultado.proxima) {
      setPergunta(resultado.proxima);
      setEscolhida(null);
      setResultado(null);
      setFase("pergunta");
    } else {
      setFase("fim");
    }
  }

  if (fase === "inicio") {
    return (
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Quiz · Kambada Play</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-texto sm:text-5xl">
          Éguas! <span className="destaque">Quem é quem?</span>
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-lg text-texto-suave">
          10 perguntas sobre a cultura maranhense. Quanto mais rápido você acerta, mais pontos ganha. Depois de
          cada resposta, uma curiosidade.
        </p>

        <fieldset className="mx-auto mt-8 max-w-lg text-left">
          <legend className="text-sm font-semibold text-texto-suave">Escolha o nível</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {NIVEIS.map((n) => {
              const r = QUIZ_NIVEL[n.id];
              const ativo = nivel === n.id;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => setNivel(n.id)}
                  aria-pressed={ativo}
                  className={`rounded-xl border-2 p-3 text-left transition-colors ${
                    ativo ? "border-kambada-amarelo bg-kambada-amarelo/20" : "border-borda hover:border-kambada-amarelo"
                  }`}
                >
                  <span className="block font-display text-lg font-extrabold text-texto">{n.rotulo}</span>
                  <span className="block text-xs text-texto-suave">{n.descricao}</span>
                  <span className="mt-2 block text-xs font-semibold text-texto-tenue">
                    {r.tempoBonusS}s de bônus · pontos ×{r.multiplicador}
                    {r.penalidadeErro ? ` · erro −${r.penalidadeErro}` : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {erro ? <p role="alert" className="mt-4 font-semibold text-texto">{erro}</p> : null}
        <button
          type="button"
          onClick={comecar}
          className="mt-8 rounded-full bg-kambada-amarelo px-10 py-4 text-lg font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
        >
          Bora!
        </button>
      </div>
    );
  }

  if (fase === "fim") {
    return (
      <div className="space-y-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">
          Fim de jogo · nível {NIVEIS.find((n) => n.id === nivel)?.rotulo.toLowerCase()}
        </p>
        <h2 className="font-display text-4xl font-extrabold text-texto sm:text-5xl">
          {pontos} <span className="text-2xl text-texto-tenue">pontos</span>
        </h2>
        <p className="text-lg text-texto-suave">
          Você acertou <strong>{resultado?.acertos ?? acertos}</strong> de 10.{" "}
          {acertos >= 9
            ? "Tá mais maranhense que cuxá!"
            : acertos >= 6
              ? "Mandou bem!"
              : "Dá pra melhorar: joga de novo!"}
          {nivel !== "dificil" && acertos >= 8 ? " Já pode encarar o nível seguinte." : ""}
        </p>
        {prova ? <EnviarPontuacao prova={prova} pontos={pontos} /> : null}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={comecar}
            className="rounded-full border-2 border-borda px-8 py-3 font-bold text-texto transition-colors hover:border-kambada-amarelo"
          >
            Jogar de novo
          </button>
          <button
            type="button"
            onClick={() => setFase("inicio")}
            className="rounded-full border-2 border-borda px-8 py-3 font-bold text-texto transition-colors hover:border-kambada-amarelo"
          >
            Trocar o nível
          </button>
        </div>
      </div>
    );
  }

  if (!pergunta) return <p className="text-center text-texto-suave">Carregando…</p>;
  const mostrandoResposta = fase === "resposta" && resultado;

  return (
    <div>
      <div className="flex items-center justify-between text-sm font-bold text-texto-suave">
        <span>
          Pergunta {pergunta.indice + 1} de {pergunta.total}
          <span className="ml-2 rounded-full bg-kambada-grafite px-2 py-0.5 text-[10px] uppercase tracking-wider text-kambada-amarelo">
            {NIVEIS.find((n) => n.id === nivel)?.rotulo} ×{regras.multiplicador}
          </span>
        </span>
        <span aria-live="polite">{pontos} pontos</span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-borda" aria-hidden>
        <div
          className="h-full bg-kambada-amarelo transition-all"
          style={{ width: `${((pergunta.indice + (mostrandoResposta ? 1 : 0)) / pergunta.total) * 100}%` }}
        />
      </div>

      <h2 className="mt-6 font-display text-2xl font-extrabold leading-snug text-texto sm:text-3xl">
        {pergunta.enunciado}
      </h2>

      {fase === "pergunta" ? (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-borda" aria-hidden title="Tempo de bônus">
          <div
            className="h-full bg-kambada-amarelo-escuro"
            style={{ width: `${(restante / regras.tempoBonusS) * 100}%`, transition: "width 200ms linear" }}
          />
        </div>
      ) : null}

      <ul className="mt-5 grid gap-3">
        {pergunta.opcoes.map((o, i) => {
          let estilo = "border-borda bg-superficie hover:border-kambada-amarelo";
          if (mostrandoResposta) {
            if (i === resultado.correta) estilo = "border-kambada-amarelo bg-kambada-amarelo text-kambada-grafite";
            else if (i === escolhida) estilo = "border-borda bg-kambada-grafite/20 line-through opacity-70";
            else estilo = "border-borda opacity-50";
          }
          return (
            <li key={i}>
              <button
                type="button"
                disabled={fase !== "pergunta"}
                onClick={() => responder(i)}
                className={`flex w-full items-center gap-3 rounded-xl border-2 px-4 py-4 text-left text-lg font-semibold text-texto transition-colors ${estilo}`}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-kambada-grafite text-sm font-bold text-kambada-amarelo">
                  {LETRAS[i]}
                </span>
                {o}
              </button>
            </li>
          );
        })}
      </ul>

      {mostrandoResposta ? (
        <div className="mt-6 rounded-xl border-2 border-borda bg-superficie p-5">
          <p className="font-display text-xl font-extrabold text-texto">
            {resultado.certa
              ? `Éguas, acertou! +${resultado.pontosDaPergunta}`
              : resultado.pontosDaPergunta < 0
                ? `Vixe, errou. ${resultado.pontosDaPergunta} pontos.`
                : "Vixe, não foi dessa vez."}
          </p>
          <p className="mt-2 text-texto-suave">{resultado.explicacao}</p>
          <button
            type="button"
            autoFocus
            onClick={proxima}
            className="mt-4 rounded-full bg-kambada-amarelo px-8 py-3 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
          >
            {resultado.proxima ? "Próxima" : "Ver resultado"}
          </button>
        </div>
      ) : null}
      {fase === "carregando" && !mostrandoResposta ? <p className="mt-4 text-sm text-texto-tenue">…</p> : null}
    </div>
  );
}
