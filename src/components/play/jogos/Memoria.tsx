"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ESTRELAS_DO_NIVEL, MEMORIA_NIVEL, NIVEIS, type Nivel } from "@/lib/play/jogos/tipos";
import { ConviteAdulto } from "@/components/PesquisaSatisfacao";
import { BotaoOuvir } from "./BotaoOuvir";
import { EnviarPontuacao } from "./EnviarPontuacao";
import { chamar } from "./jogador";
import { ProximosJogos } from "./ProximosJogos";

/**
 * Memória das estampas: pares com as nossas artes (camisas, matracas,
 * placas pintadas à mão, bonés, ecobags). Ao achar um par, a carta conta de
 * onde a arte vem. Três níveis: 6, 8 ou 12 pares; no difícil, três erros
 * seguidos embaralham as cartas que ainda não foram achadas.
 *
 * Desde 17/11/2026 a mesa fica no servidor: a tela pede "virar a carta da
 * posição i" e o servidor responde qual é (o ranking vale cupom, e a partida
 * não pode ser inventada no navegador). A ordem de CARTAS é o número da carta
 * no servidor: carta nova entra no FIM da lista.
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

/** O que o servidor responde a cada carta virada (ver lib/play/jogos/memoria.ts). */
type Virada = {
  carta: number;
  par?: boolean;
  embaralhou?: boolean;
  jogadas: number;
  estado?: string;
  fim?: { prova: string; pontos: number; jogadas: number; segundos: number };
};

/** Relógio da tela (só enfeite: quem mede o tempo de verdade é o servidor). Chamado só em resposta a toque. */
const relogio = () => Date.now();

/** Espera com registro, para cancelar tudo se a pessoa sair da tela no meio. */
function esperar(lista: number[], ms: number, fazer: () => void) {
  lista.push(window.setTimeout(fazer, ms));
}

export function Memoria() {
  const [fase, setFase] = useState<"inicio" | "jogando" | "fim">("inicio");
  // Abre no fácil (17/11/2026): quem chega é criança pequena; os maiores trocam logo abaixo.
  const [nivel, setNivel] = useState<Nivel>("facil");
  const [pares, setPares] = useState(MEMORIA_NIVEL.facil.pares);
  // A mesa mora no servidor: aqui só se sabe a carta de uma posição depois de virá-la.
  const [mapa, setMapa] = useState<(number | null)[]>([]); // posição -> carta conhecida
  const [abertas, setAbertas] = useState<number[]>([]); // posições viradas na jogada em andamento
  const [achadas, setAchadas] = useState<number[]>([]); // cartas (números) já achadas
  const [jogadas, setJogadas] = useState(0);
  const [aviso, setAviso] = useState("");
  const [segundos, setSegundos] = useState(0);
  const [ficha, setFicha] = useState<Carta | null>(null);
  const [prova, setProva] = useState("");
  const [pontos, setPontos] = useState(0);
  const [erro, setErro] = useState("");
  const travado = useRef(false);
  // Toque dado enquanto o servidor ainda responde à carta anterior: fica guardado e vale em seguida
  // (criança toca nas duas cartas de uma vez; sem isso o segundo toque se perdia).
  const emPedido = useRef(false);
  const naFila = useRef<number | null>(null);
  const inicio = useRef(0);
  const estado = useRef("");
  const esperas = useRef<number[]>([]);

  const regras = MEMORIA_NIVEL[nivel];

  useEffect(() => {
    if (fase !== "jogando") return;
    const t = window.setInterval(() => setSegundos(Math.floor((Date.now() - inicio.current) / 1000)), 500);
    return () => window.clearInterval(t);
  }, [fase]);

  // Saiu da tela no meio de uma espera: nada de mexer no estado depois.
  useEffect(() => {
    const lista = esperas.current;
    return () => lista.forEach((t) => window.clearTimeout(t));
  }, []);

  // Depois que a primeira carta abre, vale o toque que ficou guardado.
  useEffect(() => {
    if (fase !== "jogando" || travado.current || naFila.current === null || abertas.length !== 1) return;
    const pos = naFila.current;
    naFila.current = null;
    if (pos !== abertas[0]) void virar(pos);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- só reage à carta recém-aberta
  }, [abertas, fase]);

  async function comecar() {
    naFila.current = null;
    setErro("");
    const r = await chamar<{ estado: string; pares: number; nivel: Nivel }>("/api/play/memoria", { acao: "iniciar", nivel });
    if (!r.ok) {
      setErro(r.mensagem ?? "Não deu para começar.");
      return;
    }
    estado.current = r.estado;
    setNivel(r.nivel);
    setPares(r.pares);
    setMapa(Array.from({ length: r.pares * 2 }, () => null));
    setAbertas([]);
    setAchadas([]);
    setJogadas(0);
    setAviso("");
    setSegundos(0);
    setFicha(null);
    setProva("");
    travado.current = false;
    inicio.current = relogio();
    setFase("jogando");
  }

  async function virar(pos: number) {
    const conhecida = mapa[pos];
    if (travado.current) {
      if (emPedido.current && abertas.length === 0 && !abertas.includes(pos)) naFila.current = pos;
      return;
    }
    if (abertas.includes(pos) || (conhecida !== null && achadas.includes(conhecida))) return;
    travado.current = true;
    emPedido.current = true;
    const r = await chamar<Virada>("/api/play/memoria", { acao: "virar", estado: estado.current, pos });
    emPedido.current = false;
    if (!r.ok) {
      travado.current = false;
      naFila.current = null;
      // Sem conexão (ou pedidos demais): a partida continua, é só tocar de novo na carta.
      if (!r.mensagem || r.mensagem.startsWith("Sem conexão") || r.mensagem.startsWith("Calma")) {
        setAviso(r.mensagem ?? "Não deu para virar a carta. Toque de novo.");
        return;
      }
      setErro(r.mensagem);
      setFase("inicio");
      return;
    }
    if (r.estado) estado.current = r.estado;
    setAviso("");
    setMapa((m) => m.map((c, i) => (i === pos ? r.carta : c)));
    setJogadas(r.jogadas);
    const achadasAgora = achadas;
    setAbertas([...abertas, pos]);
    if (r.par === undefined) {
      travado.current = false;
      return;
    }

    if (r.par) {
      esperar(esperas.current, 450, () => {
        setAchadas((a) => [...a, r.carta]);
        setAbertas([]);
        setFicha(CARTAS[r.carta] ?? null);
        travado.current = false;
        if (r.fim) {
          setProva(r.fim.prova);
          setPontos(r.fim.pontos);
          setJogadas(r.fim.jogadas);
          setSegundos(r.fim.segundos);
          setFase("fim");
        }
      });
      return;
    }
    // No fácil (crianças menores) as duas cartas ficam à vista por mais tempo antes de virar de volta.
    esperar(esperas.current, nivel === "facil" ? 1500 : 900, () => {
      setAbertas([]);
      // Embaralhou (difícil): o que a tela sabia das cartas viradas para baixo não vale mais.
      if (r.embaralhou) setMapa((m) => m.map((c) => (c !== null && achadasAgora.includes(c) ? c : null)));
      if (r.embaralhou) setAviso(`Vixe! ${regras.embaralhaApos ?? 3} erros seguidos: o Cazumbá embaralhou as cartas.`);
      travado.current = false;
    });
  }

  if (fase === "inicio") {
    return (
      <div className="text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Memória · Kambada Play</p>
        <h1 className="mt-3 font-display text-4xl font-extrabold leading-tight text-texto sm:text-5xl">
          Memória das <span className="destaque">estampas</span>
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-base text-texto-suave sm:mt-5 sm:text-lg">
          Ache os pares das artes da Kambada. Menos jogadas e menos tempo, mais pontos.
        </p>
        <BotaoOuvir id="memoria-como-jogar" className="mt-3" />

        {/* O botão de jogar vem antes da escolha do nível: aparece sem rolar a tela no celular. */}
        {erro ? <p role="alert" className="mt-4 font-semibold text-texto">{erro}</p> : null}
        <div className="mt-5">
          <button
            type="button"
            onClick={comecar}
            className="min-h-14 w-full max-w-xs rounded-full bg-kambada-amarelo px-10 py-4 text-xl font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
          >
            Jogar
          </button>
        </div>

        <fieldset className="mx-auto mt-8 max-w-lg text-left">
          <legend className="text-sm font-semibold text-texto-suave">Nível (já vem no fácil)</legend>
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
                  className={`min-h-11 rounded-xl border-2 p-3 text-left transition-colors ${
                    ativo ? "border-kambada-amarelo bg-kambada-amarelo/20" : "border-borda hover:border-kambada-amarelo"
                  }`}
                >
                  <span className="block font-display text-lg font-extrabold text-texto">
                    {/* O sinal marca a escolha sem depender da cor da borda. */}
                    {ativo ? <span aria-hidden="true">✓ </span> : null}
                    {n.rotulo}{" "}
                    <span aria-hidden="true" className="text-[var(--destaque-texto)]">
                      {ESTRELAS_DO_NIVEL[n.id]}
                    </span>
                  </span>
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
        <ProximosJogos atual="memoria" />
        {/* A pesquisa não pula na frente da criança: fica aqui, para o adulto abrir se quiser. */}
        <ConviteAdulto gatilho="memoria" />
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
      {/* As artes do baralho carregam antes, fora da vista: a carta abre sem esperar a imagem. */}
      <div aria-hidden className="pointer-events-none absolute h-0 w-0 overflow-hidden">
        {CARTAS.slice(0, pares).map((c) => (
          <span key={c.id} className="relative block h-36 w-36">
            <Image src={c.imagem} alt="" fill loading="eager" sizes="(min-width: 640px) 9rem, 50vw" />
          </span>
        ))}
      </div>
      <ul className={`mt-4 grid gap-2 sm:gap-3 ${colunas}`}>
        {mapa.map((numero, pos) => {
          const carta = numero === null ? null : (CARTAS[numero] ?? null);
          const achada = numero !== null && achadas.includes(numero);
          const aberta = carta !== null && (achada || abertas.includes(pos));
          return (
            <li key={pos} className="aspect-square">
              <button
                type="button"
                onClick={() => void virar(pos)}
                aria-label={aberta && carta ? `Carta ${pos + 1}: ${carta.nome}${achada ? ", par achado" : ""}` : `Carta ${pos + 1}, virada para baixo`}
                aria-pressed={aberta}
                className="relative h-full w-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kambada-amarelo"
              >
                {/* Costas: amarelo da marca, com a estrela de cordel */}
                <span
                  className="absolute inset-0 flex items-center justify-center rounded-lg border-2 border-kambada-grafite bg-kambada-amarelo transition-all duration-300 motion-reduce:transition-none"
                  style={{ opacity: aberta ? 0 : 1, transform: aberta ? "scale(0.9)" : "none" }}
                >
                  <svg viewBox="0 0 40 40" className="h-1/2 w-1/2 text-kambada-grafite" aria-hidden>
                    <path fill="currentColor" d="M20 2l4 12 12-4-8 10 8 10-12-4-4 12-4-12-12 4 8-10-8-10 12 4z" />
                  </svg>
                </span>
                {/* Frente: a arte da Kambada (só existe depois que o servidor diz qual é) */}
                <span
                  className={`absolute inset-0 overflow-hidden rounded-lg border-2 transition-all duration-300 motion-reduce:transition-none ${
                    achada ? "border-kambada-amarelo" : "border-kambada-grafite"
                  }`}
                  style={{ opacity: aberta ? 1 : 0, transform: aberta ? "none" : "scale(0.9)" }}
                >
                  {carta ? <Image src={carta.imagem} alt="" fill sizes="(min-width: 640px) 9rem, 50vw" className="object-cover" /> : null}
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
            <BotaoOuvir id={`memoria-ficha-${ficha.id}`} className="mt-2" />
          </>
        ) : (
          <p className="text-sm text-texto-tenue">Vire duas cartas. Cada par conta de onde vem a arte.</p>
        )}
      </div>
    </div>
  );
}
