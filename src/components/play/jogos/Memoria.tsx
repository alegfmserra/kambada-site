"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MEMORIA_NIVEL, NIVEIS, type Nivel } from "@/lib/play/jogos/tipos";
import { EnviarPontuacao } from "./EnviarPontuacao";
import { chamar } from "./jogador";

/**
 * Memória das estampas: pares com as nossas artes (camisas, matracas,
 * placas pintadas à mão, bonés, ecobags). Ao achar um par, a carta conta de
 * onde a arte vem. Três níveis: 6, 8 ou 12 pares; no difícil, três erros
 * seguidos embaralham as cartas que ainda não foram achadas.
 */
type Carta = { id: string; nome: string; ficha: string; imagem: string; href?: string };

const BASE = "/kambadaplay/jogos/memoria";

/** As 8 primeiras são o baralho do médio; o fácil usa as 6 primeiras; o difícil usa as 12. */
export const CARTAS: Carta[] = [
  {
    id: "coreira",
    nome: "Coreira",
    ficha: "Dançadeira do tambor de crioula, de saia rodada. Na Kambada, ela vira placa pintada à mão.",
    imagem: `${BASE}/placa-coreira.webp`,
  },
  {
    id: "coreiro",
    nome: "Coreiro",
    ficha: "Quem toca o tambor de crioula, de camisa vermelha de flores. Placa pintada à mão no ateliê.",
    imagem: `${BASE}/placa-coreiro.webp`,
  },
  {
    id: "boi-colorido",
    nome: "Boi pintado",
    ficha: "O boi dança coberto de couro bordado. Aqui ele vira pintura numa placa redonda.",
    imagem: `${BASE}/placa-boi-colorido.webp`,
  },
  {
    id: "matraca-bandeira",
    nome: "Matraca Bandeira do Maranhão",
    ficha: "As listras e a estrela da bandeira do Maranhão numa matraca pintada à mão.",
    imagem: `${BASE}/matraca-bandeira-maranhao.webp`,
    href: "/loja/matracas",
  },
  {
    id: "matraca-serpente",
    nome: "Matraca Serpente e Rei da Ilha",
    ficha: "A lenda da Serpente que dorme sob São Luís, pintada em madeira.",
    imagem: `${BASE}/matraca-serpente-rei-da-ilha.webp`,
    href: "/loja/matracas",
  },
  {
    id: "matraca-boi-preto",
    nome: "Matraca Topo Boi Preto",
    ficha: "O boi preto, de couro bordado de estrelas, no topo da matraca.",
    imagem: `${BASE}/matraca-topo-boi-preto.webp`,
    href: "/loja/matracas",
  },
  {
    id: "camisa-boi",
    nome: "Camisa Boi Maranhense que só",
    ficha: "O boi do Bumba Meu Boi com a faixa “Maranhense que só”.",
    imagem: `${BASE}/camisa-boi-maranhense.webp`,
    href: "/loja/camisas",
  },
  {
    id: "camisa-sao-luis",
    nome: "Camisa Alusiva São Luís",
    ficha: "Os símbolos da cidade: azulejo, sobrado, sol, mar e o caranguejo.",
    imagem: `${BASE}/camisa-alusiva-sao-luis.webp`,
    href: "/loja/camisas",
  },
  // Difícil: mais quatro artes, com as fotos de produto do site.
  {
    id: "bone-guaras",
    nome: "Boné Guarás",
    ficha: "O guará, ave vermelha dos manguezais, em silk com relevo num boné de brim.",
    imagem: "/fotos/produtos/16701478057.jpg",
    href: "/loja/bones",
  },
  {
    id: "ecobag-azulejos",
    nome: "Ecobag São Luís Azulejos",
    ficha: "Os azulejos portugueses dos sobrados do Centro Histórico, Patrimônio Mundial.",
    imagem: "/fotos/produtos/16701491047.jpg",
    href: "/loja/ecobags",
  },
  {
    id: "pareo-reggae",
    nome: "Pareô Reggae Roots",
    ficha: "São Luís é a Jamaica brasileira: o reggae também é identidade da Ilha.",
    imagem: "/fotos/produtos/16701478418.jpg",
    href: "/loja/pareos",
  },
  {
    id: "necessaire-azulejos",
    nome: "Necessaire Azulejos",
    ficha: "O desenho do azulejo da cidade, para levar na bolsa.",
    imagem: "/fotos/produtos/16701478149.jpg",
    href: "/loja/necessaires",
  },
];

type Peca = { chave: string; carta: Carta };

function embaralhar<T>(lista: T[]): T[] {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function montarMesa(pares: number): Peca[] {
  const baralho = CARTAS.slice(0, pares);
  return embaralhar(baralho.flatMap((c) => [{ chave: `${c.id}-a`, carta: c }, { chave: `${c.id}-b`, carta: c }]));
}

/** No difícil: as cartas ainda não achadas trocam de lugar entre si. */
function embaralharNaoAchadas(mesa: Peca[], achadas: string[]): Peca[] {
  const livres = mesa.map((p, i) => (achadas.includes(p.carta.id) ? -1 : i)).filter((i) => i >= 0);
  const pecas = embaralhar(livres.map((i) => mesa[i]));
  const nova = [...mesa];
  livres.forEach((pos, k) => (nova[pos] = pecas[k]));
  return nova;
}

export function Memoria() {
  const [fase, setFase] = useState<"inicio" | "jogando" | "fim">("inicio");
  const [nivel, setNivel] = useState<Nivel>("medio");
  const [pares, setPares] = useState(MEMORIA_NIVEL.medio.pares);
  const [mesa, setMesa] = useState<Peca[]>([]);
  const [viradas, setViradas] = useState<string[]>([]);
  const [achadas, setAchadas] = useState<string[]>([]); // ids de carta
  const [jogadas, setJogadas] = useState(0);
  const [errosSeguidos, setErrosSeguidos] = useState(0);
  const [aviso, setAviso] = useState("");
  const [segundos, setSegundos] = useState(0);
  const [token, setToken] = useState("");
  const [ficha, setFicha] = useState<Carta | null>(null);
  const [prova, setProva] = useState("");
  const [pontos, setPontos] = useState(0);
  const [erro, setErro] = useState("");
  const travado = useRef(false);
  const inicio = useRef(0);

  const regras = MEMORIA_NIVEL[nivel];

  useEffect(() => {
    if (fase !== "jogando") return;
    const t = window.setInterval(() => setSegundos(Math.floor((Date.now() - inicio.current) / 1000)), 500);
    return () => window.clearInterval(t);
  }, [fase]);

  async function comecar() {
    setErro("");
    const r = await chamar<{ token: string; pares: number }>("/api/play/memoria", { acao: "iniciar", nivel });
    if (!r.ok) {
      setErro(r.mensagem ?? "Não deu para começar.");
      return;
    }
    setToken(r.token);
    setPares(r.pares);
    setMesa(montarMesa(r.pares));
    setViradas([]);
    setAchadas([]);
    setJogadas(0);
    setErrosSeguidos(0);
    setAviso("");
    setSegundos(0);
    setFicha(null);
    setProva("");
    travado.current = false;
    inicio.current = Date.now();
    setFase("jogando");
  }

  const terminar = useCallback(
    async (totalJogadas: number) => {
      const r = await chamar<{ prova: string; pontos: number }>("/api/play/memoria", {
        acao: "finalizar",
        token,
        jogadas: totalJogadas,
      });
      if (!r.ok) {
        setErro(r.mensagem ?? "Não deu para registrar o resultado.");
        setFase("inicio");
        return;
      }
      setProva(r.prova);
      setPontos(r.pontos);
      setFase("fim");
    },
    [token],
  );

  function virar(p: Peca) {
    if (travado.current || viradas.includes(p.chave) || achadas.includes(p.carta.id)) return;
    const novas = [...viradas, p.chave];
    setViradas(novas);
    if (novas.length < 2) return;

    travado.current = true;
    const total = jogadas + 1;
    setJogadas(total);
    const [a, b] = novas.map((k) => mesa.find((m) => m.chave === k)!);
    if (a.carta.id === b.carta.id) {
      window.setTimeout(() => {
        const todas = [...achadas, a.carta.id];
        setAchadas(todas);
        setViradas([]);
        setFicha(a.carta);
        setErrosSeguidos(0);
        setAviso("");
        travado.current = false;
        if (todas.length === pares) void terminar(total);
      }, 450);
    } else {
      const erros = errosSeguidos + 1;
      window.setTimeout(() => {
        setViradas([]);
        if (regras.embaralhaApos && erros >= regras.embaralhaApos) {
          setMesa((m) => embaralharNaoAchadas(m, achadas));
          setErrosSeguidos(0);
          setAviso("Vixe! Três erros seguidos: o Cazumbá embaralhou as cartas.");
        } else {
          setErrosSeguidos(erros);
        }
        travado.current = false;
      }, 900);
    }
  }

  if (fase === "inicio") {
    return (
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Memória · Kambada Play</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-texto sm:text-5xl">
          Memória das <span className="destaque">estampas</span>
        </h1>
        <p className="mx-auto mt-5 max-w-lg text-lg text-texto-suave">
          Ache os pares de artes da Kambada: camisas, matracas e placas pintadas à mão. Menos jogadas e menos
          tempo valem mais pontos.
        </p>

        <fieldset className="mx-auto mt-8 max-w-lg text-left">
          <legend className="text-sm font-semibold text-texto-suave">Escolha o nível</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {NIVEIS.map((n) => {
              const r = MEMORIA_NIVEL[n.id];
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
                    {r.pares} pares · pontos ×{r.multiplicador}
                    {r.embaralhaApos ? ` · embaralha após ${r.embaralhaApos} erros` : ""}
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
          {jogadas} jogadas em {segundos} segundos, {pares} pares.
        </p>
        <ul className="mx-auto grid max-w-md grid-cols-4 gap-2" aria-label="As artes que você achou">
          {CARTAS.slice(0, pares).map((c) => (
            <li key={c.id} className="relative aspect-square overflow-hidden rounded-md border-2 border-borda">
              <Image src={c.imagem} alt={c.nome} fill sizes="6rem" className="object-cover" />
            </li>
          ))}
        </ul>
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
          <Link
            href="/loja"
            className="rounded-full bg-kambada-amarelo px-8 py-3 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
          >
            Ver essas artes na loja
          </Link>
        </div>
      </div>
    );
  }

  const colunas = pares >= 12 ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-4";

  return (
    <div>
      <div className="flex items-center justify-between text-sm font-bold text-texto-suave">
        <span>
          {achadas.length} de {pares} pares
          <span className="ml-2 rounded-full bg-kambada-grafite px-2 py-0.5 text-[10px] uppercase tracking-wider text-kambada-amarelo">
            {NIVEIS.find((n) => n.id === nivel)?.rotulo} ×{regras.multiplicador}
          </span>
        </span>
        <span>
          {jogadas} jogadas · {segundos}s
        </span>
      </div>
      <ul className={`mt-4 grid gap-2 sm:gap-3 ${colunas}`}>
        {mesa.map((p) => {
          const aberta = viradas.includes(p.chave) || achadas.includes(p.carta.id);
          return (
            <li key={p.chave} className="aspect-square">
              <button
                type="button"
                onClick={() => virar(p)}
                aria-label={aberta ? p.carta.nome : "Carta virada para baixo"}
                aria-pressed={aberta}
                className="relative h-full w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kambada-amarelo"
              >
                {/* Costas: amarelo da marca, com a estrela de cordel */}
                <span
                  className="absolute inset-0 flex items-center justify-center rounded-lg border-2 border-kambada-grafite bg-kambada-amarelo transition-all duration-300"
                  style={{ opacity: aberta ? 0 : 1, transform: aberta ? "scale(0.9)" : "none" }}
                >
                  <svg viewBox="0 0 40 40" className="h-1/2 w-1/2 text-kambada-grafite" aria-hidden>
                    <path fill="currentColor" d="M20 2l4 12 12-4-8 10 8 10-12-4-4 12-4-12-12 4 8-10-8-10 12 4z" />
                  </svg>
                </span>
                {/* Frente: a arte da Kambada */}
                <span
                  className={`absolute inset-0 overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                    achadas.includes(p.carta.id) ? "border-kambada-amarelo" : "border-kambada-grafite"
                  }`}
                  style={{ opacity: aberta ? 1 : 0, transform: aberta ? "none" : "scale(0.9)" }}
                >
                  <Image src={p.carta.imagem} alt="" fill sizes="(min-width: 640px) 9rem, 50vw" className="object-cover" />
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-5 min-h-[5.5rem] rounded-xl border-2 border-borda bg-superficie p-4" aria-live="polite">
        {aviso ? (
          <p className="font-display text-lg font-extrabold text-texto">{aviso}</p>
        ) : ficha ? (
          <>
            <p className="font-display text-lg font-extrabold text-texto">Éguas, um par! {ficha.nome}</p>
            <p className="mt-1 text-sm text-texto-suave">{ficha.ficha}</p>
          </>
        ) : (
          <p className="text-sm text-texto-tenue">Vire duas cartas. Cada par conta de onde vem a arte.</p>
        )}
      </div>
    </div>
  );
}
