"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { NIVEIS, QUEBRA_NIVEL, type Nivel } from "@/lib/play/jogos/tipos";
import { pedirPesquisa } from "@/components/PesquisaSatisfacao";
import { EnviarPontuacao } from "./EnviarPontuacao";
import { chamar } from "./jogador";
import { CARTAS } from "./Memoria";

/**
 * Quebra-cabeça das estampas: as artes da Kambada (placas, matracas, camisas)
 * em 12, 20 ou 40 peças quadradas. Toque numa peça e depois em outra para
 * trocá-las de lugar; a peça que cai no lugar certo fica marcada. O servidor
 * mede o tempo e calcula os pontos.
 */

const ARTES = CARTAS.slice(0, 8);

function embaralhar(total: number): number[] {
  // Nenhuma peça começa no lugar certo, para toda partida pedir pelo menos meia troca por peça.
  for (;;) {
    const a = Array.from({ length: total }, (_, i) => i);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    if (a.every((p, i) => p !== i)) return a;
  }
}

/** Fatia da imagem quadrada para a peça (col, linha), com corte centralizado no tabuleiro retangular. */
function estiloDaPeca(imagem: string, peca: number, colunas: number, linhas: number): React.CSSProperties {
  const col = peca % colunas;
  const lin = Math.floor(peca / colunas);
  return {
    backgroundImage: `url(${imagem})`,
    backgroundSize: `${colunas * 100}% auto`,
    backgroundPosition: `${(col / (colunas - 1)) * 100}% ${(((colunas - linhas) / 2 + lin) / (colunas - 1)) * 100}%`,
  };
}

export function Quebra() {
  const [fase, setFase] = useState<"inicio" | "jogando" | "fim">("inicio");
  const [nivel, setNivel] = useState<Nivel>("medio");
  const [arte, setArte] = useState<number | "surpresa">("surpresa");
  const [ativa, setAtiva] = useState(0);
  const [grade, setGrade] = useState({ colunas: 5, linhas: 4 });
  const [ordem, setOrdem] = useState<number[]>([]); // posição -> peça
  const [escolhida, setEscolhida] = useState<number | null>(null);
  const [trocas, setTrocas] = useState(0);
  const [segundos, setSegundos] = useState(0);
  const [token, setToken] = useState("");
  const [prova, setProva] = useState("");
  const [pontos, setPontos] = useState(0);
  const [segundosFinais, setSegundosFinais] = useState(0);
  const [erro, setErro] = useState("");
  const [modelo, setModelo] = useState(false);
  const inicio = useRef(0);

  useEffect(() => {
    if (fase !== "jogando") return;
    const t = window.setInterval(() => setSegundos(Math.floor((Date.now() - inicio.current) / 1000)), 500);
    return () => window.clearInterval(t);
  }, [fase]);

  async function comecar() {
    setErro("");
    const r = await chamar<{ token: string; nivel: Nivel; colunas: number; linhas: number }>("/api/play/quebra", { acao: "iniciar", nivel });
    if (!r.ok) {
      setErro(r.mensagem ?? "Não deu para começar.");
      return;
    }
    const escolhidaArte = arte === "surpresa" ? Math.floor(Math.random() * ARTES.length) : arte;
    setNivel(r.nivel);
    setAtiva(escolhidaArte);
    setToken(r.token);
    setGrade({ colunas: r.colunas, linhas: r.linhas });
    setOrdem(embaralhar(r.colunas * r.linhas));
    setEscolhida(null);
    setTrocas(0);
    setSegundos(0);
    setProva("");
    setModelo(false);
    inicio.current = Date.now();
    setFase("jogando");
  }

  const terminar = useCallback(
    async (totalTrocas: number) => {
      const r = await chamar<{ prova: string; pontos: number; segundos: number }>("/api/play/quebra", {
        acao: "finalizar",
        token,
        trocas: totalTrocas,
      });
      if (!r.ok) {
        setErro(r.mensagem ?? "Não deu para registrar o resultado.");
        setFase("inicio");
        return;
      }
      setProva(r.prova);
      setPontos(r.pontos);
      setSegundosFinais(r.segundos);
      setFase("fim");
      window.setTimeout(() => pedirPesquisa("quebra"), 3000);
    },
    [token],
  );

  function tocar(pos: number) {
    if (fase !== "jogando" || ordem[pos] === pos) return; // peça já no lugar fica parada
    if (escolhida === null) {
      setEscolhida(pos);
      return;
    }
    if (escolhida === pos) {
      setEscolhida(null);
      return;
    }
    const nova = [...ordem];
    [nova[escolhida], nova[pos]] = [nova[pos], nova[escolhida]];
    const totalTrocas = trocas + 1;
    setOrdem(nova);
    setTrocas(totalTrocas);
    setEscolhida(null);
    if (nova.every((p, i) => p === i)) void terminar(totalTrocas);
  }

  const total = grade.colunas * grade.linhas;
  const certas = ordem.filter((p, i) => p === i).length;
  const imagem = ARTES[ativa].imagem;
  const rotuloNivel = NIVEIS.find((n) => n.id === nivel)?.rotulo ?? "";

  if (fase === "inicio") {
    return (
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Quebra-cabeça das estampas</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-texto sm:text-4xl">
          Monte a <span className="destaque">arte</span>
        </h1>
        <p className="mt-2 text-texto-suave">Toque numa peça e depois em outra para trocar de lugar. Quanto menos trocas e mais rápido, mais pontos.</p>

        <fieldset className="mt-6">
          <legend className="text-sm font-bold text-texto">Nível</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {NIVEIS.map((n) => {
              const r = QUEBRA_NIVEL[n.id];
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
                  <span className="mt-1 block text-xs font-semibold text-texto-tenue">
                    {r.colunas * r.linhas} peças · pontos ×{r.multiplicador}
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="text-sm font-bold text-texto">Qual arte?</legend>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-5">
            <button
              type="button"
              onClick={() => setArte("surpresa")}
              aria-pressed={arte === "surpresa"}
              className={`flex aspect-square items-center justify-center rounded-lg border-2 p-1 text-center text-xs font-bold text-texto ${
                arte === "surpresa" ? "border-kambada-amarelo bg-kambada-amarelo/20" : "border-borda hover:border-kambada-amarelo"
              }`}
            >
              Surpresa
            </button>
            {ARTES.map((a, i) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setArte(i)}
                aria-pressed={arte === i}
                aria-label={a.nome}
                className={`aspect-square rounded-lg border-2 bg-cover bg-center ${
                  arte === i ? "border-kambada-amarelo ring-2 ring-kambada-amarelo" : "border-borda hover:border-kambada-amarelo"
                }`}
                style={{ backgroundImage: `url(${a.imagem})` }}
              />
            ))}
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
    const a = ARTES[ativa];
    return (
      <div className="space-y-6 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">
          Montou! · nível {rotuloNivel.toLowerCase()}
        </p>
        <h2 className="font-display text-4xl font-extrabold text-texto sm:text-5xl">
          {pontos} <span className="text-2xl text-texto-tenue">pontos</span>
        </h2>
        <p className="text-lg text-texto-suave">
          {trocas} trocas em {segundosFinais} segundos, {total} peças.
        </p>
        <div
          role="img"
          aria-label={a.nome}
          className="mx-auto aspect-square w-full max-w-xs rounded-xl border-2 border-kambada-amarelo bg-cover bg-center"
          style={{ backgroundImage: `url(${a.imagem})` }}
        />
        <div>
          <p className="font-display text-xl font-extrabold text-texto">{a.nome}</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-texto-suave">{a.ficha}</p>
        </div>
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
            Outra arte ou nível
          </button>
          <Link
            href={a.href ?? "/loja"}
            className="rounded-full bg-kambada-amarelo px-8 py-3 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
          >
            Ver essa arte na loja
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between text-sm font-bold text-texto-suave">
        <span>
          {certas} de {total} no lugar
          <span className="ml-2 rounded-full bg-kambada-grafite px-2 py-0.5 text-[10px] uppercase tracking-wider text-kambada-amarelo">
            {rotuloNivel} ×{QUEBRA_NIVEL[nivel].multiplicador}
          </span>
        </span>
        <span>
          {trocas} trocas · {segundos}s
        </span>
      </div>

      <div
        className="mt-4 grid gap-px overflow-hidden rounded-lg border-2 border-kambada-grafite bg-kambada-grafite"
        style={{ gridTemplateColumns: `repeat(${grade.colunas}, minmax(0, 1fr))` }}
        role="group"
        aria-label="Tabuleiro do quebra-cabeça"
      >
        {ordem.map((peca, pos) => {
          const noLugar = peca === pos;
          const marcada = escolhida === pos;
          return (
            <button
              key={pos}
              type="button"
              onClick={() => tocar(pos)}
              aria-label={`Peça ${pos + 1}${noLugar ? ", no lugar" : marcada ? ", escolhida" : ""}`}
              aria-pressed={marcada}
              disabled={noLugar}
              className={`aspect-square transition-transform focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-kambada-amarelo ${
                marcada ? "z-10 scale-95 ring-4 ring-inset ring-kambada-amarelo" : ""
              } ${noLugar ? "" : "cursor-pointer"}`}
              style={{ ...estiloDaPeca(imagem, peca, grade.colunas, grade.linhas), opacity: noLugar ? 1 : 0.92 }}
            />
          );
        })}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-texto-tenue" aria-live="polite">
          {escolhida === null ? "Toque numa peça fora do lugar." : "Agora toque na peça que vai trocar com ela."}
        </p>
        <button
          type="button"
          onClick={() => setModelo((m) => !m)}
          aria-expanded={modelo}
          className="shrink-0 rounded-full border-2 border-borda px-4 py-1.5 text-sm font-bold text-texto hover:border-kambada-amarelo"
        >
          {modelo ? "Esconder modelo" : "Ver modelo"}
        </button>
      </div>
      {modelo ? (
        <div
          role="img"
          aria-label={`Modelo: ${ARTES[ativa].nome}`}
          className="mx-auto mt-3 w-full max-w-[12rem] rounded-lg border-2 border-borda bg-cover bg-center"
          style={{ aspectRatio: `${grade.colunas} / ${grade.linhas}`, backgroundImage: `url(${imagem})` }}
        />
      ) : null}
    </div>
  );
}
