"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { chamar } from "./jogador";

type Cor = "certa" | "lugar" | "nao";
type Linha = { palpite: string; cores: Cor[] };
type Revelacao = { palavra: string; significado: string; exemplo: string };
type Resposta = {
  dia: string;
  edicao: number;
  linhas: Linha[];
  estado: string;
  situacao: "jogando" | "ganhou" | "perdeu";
  revelacao?: Revelacao;
};

const TAMANHO = 5;
const TENTATIVAS = 6;
const TECLAS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
const GUARDA = "kambada-play-palavra";
const SEQUENCIA = "kambada-play-palavra-sequencia";

/** Cor + símbolo: quem não distingue amarelo de laranja lê pelo desenho. */
const ESTILO: Record<Cor, string> = {
  certa: "border-kambada-amarelo bg-kambada-amarelo text-kambada-grafite",
  lugar: "border-[#f5821f] bg-[#f5821f] text-kambada-grafite",
  nao: "border-kambada-cinza bg-kambada-cinza text-white",
};
const SIMBOLO: Record<Cor, string> = { certa: "●", lugar: "◐", nao: "" };
const EMOJI: Record<Cor, string> = { certa: "🟨", lugar: "🟧", nao: "⬛" };
const ROTULO: Record<Cor, string> = { certa: "no lugar certo", lugar: "existe, em outro lugar", nao: "não tem" };

type Sequencia = { ultimoDia: string; atual: number; melhor: number };

function lerGuarda(): { dia: string; resposta: Resposta } | null {
  try {
    return JSON.parse(window.localStorage.getItem(GUARDA) ?? "null");
  } catch {
    return null;
  }
}
function lerSequencia(): Sequencia {
  try {
    const s = JSON.parse(window.localStorage.getItem(SEQUENCIA) ?? "") as Sequencia;
    return { ultimoDia: s.ultimoDia ?? "", atual: s.atual ?? 0, melhor: s.melhor ?? 0 };
  } catch {
    return { ultimoDia: "", atual: 0, melhor: 0 };
  }
}
function diaAnterior(dia: string): string {
  return new Date(Date.parse(`${dia}T00:00:00Z`) - 86_400_000).toISOString().slice(0, 10);
}

/**
 * Palavra do dia maranhense. O servidor guarda a palavra; aqui só se desenha o
 * tabuleiro. A sequência de dias fica no navegador (não vale ranking ainda).
 */
export function Palavra() {
  const [resp, setResp] = useState<Resposta | null>(null);
  const [digitado, setDigitado] = useState("");
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [sequencia, setSequencia] = useState<Sequencia>({ ultimoDia: "", atual: 0, melhor: 0 });
  const [copiado, setCopiado] = useState(false);
  const contou = useRef("");

  useEffect(() => {
    let vivo = true;
    (async () => {
      const r = await chamar<Resposta>("/api/play/palavra", { acao: "iniciar" });
      if (!vivo) return;
      setCarregando(false);
      setSequencia(lerSequencia());
      if (!r.ok) {
        setAviso(r.mensagem ?? "Não deu para abrir o jogo.");
        return;
      }
      const g = lerGuarda();
      // Retoma a partida de hoje se ela já tinha palpites; senão começa nova.
      setResp(g && g.dia === r.dia && g.resposta.linhas.length > 0 ? g.resposta : r);
    })();
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (!resp) return;
    try {
      window.localStorage.setItem(GUARDA, JSON.stringify({ dia: resp.dia, resposta: resp }));
    } catch {
      /* modo privado: joga, só não retoma */
    }
    if (resp.situacao !== "jogando" && contou.current !== resp.dia) {
      contou.current = resp.dia;
      const s = lerSequencia();
      if (s.ultimoDia !== resp.dia) {
        const atual = resp.situacao === "ganhou" ? (s.ultimoDia === diaAnterior(resp.dia) ? s.atual + 1 : 1) : 0;
        const nova = { ultimoDia: resp.dia, atual, melhor: Math.max(s.melhor, atual) };
        try {
          window.localStorage.setItem(SEQUENCIA, JSON.stringify(nova));
        } catch {
          /* idem */
        }
        // eslint-disable-next-line react-hooks/set-state-in-effect -- atualiza a sequência uma vez, quando a partida acaba
        setSequencia(nova);
      }
    }
  }, [resp]);

  const acabou = resp ? resp.situacao !== "jogando" : true;

  const enviar = useCallback(async () => {
    if (!resp || acabou || enviando) return;
    if (digitado.length !== TAMANHO) {
      setAviso(`Faltam letras: a palavra tem ${TAMANHO}.`);
      return;
    }
    setEnviando(true);
    setAviso("");
    const r = await chamar<Resposta>("/api/play/palavra", { acao: "palpite", estado: resp.estado, palpite: digitado });
    setEnviando(false);
    if (!r.ok) {
      setAviso(r.mensagem ?? "Não deu para conferir. Tente de novo.");
      return;
    }
    setResp(r);
    setDigitado("");
  }, [resp, acabou, enviando, digitado]);

  const digitar = useCallback(
    (letra: string) => {
      if (acabou) return;
      setAviso("");
      setDigitado((d) => (d.length < TAMANHO ? d + letra : d));
    },
    [acabou],
  );
  const apagar = useCallback(() => setDigitado((d) => d.slice(0, -1)), []);

  // Teclado do computador.
  useEffect(() => {
    function aoTeclar(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") {
        e.preventDefault();
        void enviar();
      } else if (e.key === "Backspace") {
        apagar();
      } else {
        const l = e.key.normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase();
        if (/^[A-Z]$/.test(l)) digitar(l);
      }
    }
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [enviar, apagar, digitar]);

  // Melhor cor já descoberta de cada letra, para pintar o teclado.
  const corDaTecla: Record<string, Cor> = {};
  const peso: Record<Cor, number> = { nao: 1, lugar: 2, certa: 3 };
  resp?.linhas.forEach((l) =>
    l.palpite.split("").forEach((letra, i) => {
      const c = l.cores[i];
      if (!corDaTecla[letra] || peso[c] > peso[corDaTecla[letra]]) corDaTecla[letra] = c;
    }),
  );

  function textoParaCompartilhar(): string {
    if (!resp) return "";
    const placar = resp.situacao === "ganhou" ? `${resp.linhas.length}/${TENTATIVAS}` : `X/${TENTATIVAS}`;
    const grade = resp.linhas.map((l) => l.cores.map((c) => EMOJI[c]).join("")).join("\n");
    return `Palavra do dia Kambada #${resp.edicao} ${placar}\n${grade}\nJogue também: ${window.location.origin}/kambadaplay/jogos/palavra`;
  }
  async function compartilhar() {
    const texto = textoParaCompartilhar();
    try {
      if (navigator.share) await navigator.share({ text: texto });
      else {
        await navigator.clipboard.writeText(texto);
        setCopiado(true);
        window.setTimeout(() => setCopiado(false), 2500);
      }
    } catch {
      /* a pessoa fechou a janela de compartilhar */
    }
  }

  if (carregando) return <p className="text-texto-suave">Abrindo a palavra de hoje…</p>;
  if (!resp) return <p role="alert" className="rounded-xl border-2 border-borda bg-superficie p-5 text-texto">{aviso}</p>;

  const linhas = Array.from({ length: TENTATIVAS }, (_, i) => {
    const feita = resp.linhas[i];
    if (feita) return { letras: feita.palpite.split(""), cores: feita.cores };
    if (i === resp.linhas.length && !acabou) return { letras: digitado.padEnd(TAMANHO, " ").split(""), cores: null };
    return { letras: Array(TAMANHO).fill(" "), cores: null };
  });

  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Palavra do dia #{resp.edicao}</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-texto sm:text-4xl">
        Qual é a <span className="destaque">palavra</span> de hoje?
      </h1>
      <p className="mt-2 text-texto-suave">
        {TAMANHO} letras, {TENTATIVAS} tentativas. Amarelo ● está no lugar certo; laranja ◐ existe, mas em outro lugar. Uma palavra nova todo dia.
      </p>
      <p className="mt-2 text-sm font-semibold text-texto">
        🔥 Sequência: {sequencia.atual} {sequencia.atual === 1 ? "dia" : "dias"} · melhor: {sequencia.melhor}
      </p>

      <div className="mx-auto mt-6 grid max-w-[19rem] gap-2" role="grid" aria-label="Tentativas">
        {linhas.map((l, i) => (
          <div key={i} role="row" className="grid gap-2" style={{ gridTemplateColumns: `repeat(${TAMANHO}, minmax(0, 1fr))` }}>
            {l.letras.map((letra, j) => {
              const cor = l.cores?.[j];
              return (
                <div
                  key={j}
                  role="gridcell"
                  aria-label={cor ? `${letra}, ${ROTULO[cor]}` : letra.trim() || "vazio"}
                  className={`relative flex aspect-square items-center justify-center rounded-lg border-2 font-display text-2xl font-extrabold uppercase sm:text-3xl ${
                    cor ? ESTILO[cor] : letra.trim() ? "border-texto text-texto" : "border-borda text-texto"
                  }`}
                >
                  {letra.trim()}
                  {cor && SIMBOLO[cor] ? (
                    <span aria-hidden className="absolute right-1 top-0.5 text-[10px] leading-none opacity-70">
                      {SIMBOLO[cor]}
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      <p role="status" className="mt-3 min-h-6 text-sm font-semibold text-[var(--destaque-texto)]">
        {aviso}
      </p>

      {!acabou ? (
        <div className="mt-2 grid gap-2" aria-label="Teclado">
          {TECLAS.map((fila, i) => (
            <div key={fila} className="flex justify-center gap-1">
              {i === 2 ? (
                <button
                  type="button"
                  onClick={() => void enviar()}
                  disabled={enviando}
                  className="min-h-12 shrink-0 rounded-lg bg-kambada-amarelo px-2.5 text-xs font-bold text-kambada-grafite disabled:opacity-60"
                >
                  Enviar
                </button>
              ) : null}
              {fila.split("").map((t) => {
                const c = corDaTecla[t];
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => digitar(t)}
                    aria-label={c ? `${t}, ${ROTULO[c]}` : t}
                    className={`min-h-12 min-w-0 flex-1 rounded-lg border-2 text-base font-bold sm:max-w-11 ${
                      c ? ESTILO[c] : "border-borda bg-superficie text-texto"
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
              {i === 2 ? (
                <button
                  type="button"
                  onClick={apagar}
                  aria-label="Apagar"
                  className="min-h-12 shrink-0 rounded-lg border-2 border-borda bg-superficie px-2.5 text-base font-bold text-texto"
                >
                  ⌫
                </button>
              ) : null}
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border-2 border-borda bg-superficie p-5">
          <p className="font-display text-2xl font-extrabold text-texto">
            {resp.situacao === "ganhou" ? `Éguas, acertou em ${resp.linhas.length}!` : "Não foi dessa vez."}
          </p>
          {resp.revelacao ? (
            <>
              <p className="mt-3 text-sm text-texto-suave">A palavra era</p>
              <p className="font-display text-3xl font-extrabold text-[var(--destaque-texto)]">{resp.revelacao.palavra}</p>
              <p className="mt-2 text-texto">{resp.revelacao.significado}</p>
              <p className="mt-2 italic text-texto-suave">“{resp.revelacao.exemplo}”</p>
            </>
          ) : null}
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void compartilhar()}
              className="rounded-full bg-kambada-amarelo px-8 py-3 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
            >
              {copiado ? "Copiado!" : "Compartilhar resultado"}
            </button>
            <span className="text-sm text-texto-suave">Volte amanhã para a palavra nova.</span>
          </div>
        </div>
      )}
    </div>
  );
}
