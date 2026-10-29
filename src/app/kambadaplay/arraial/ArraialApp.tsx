"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { extras, lugares, npcs, textos, type Falante, type Lugar, type Npc } from "@/content/play/arraial";
import { textosPescaria } from "@/content/play/pescaria";
import { track } from "@/lib/play/track";
import { useMediaQuery } from "@/lib/play/mediaQuery";
import { Scene } from "@/components/play/arraial/Scene";
import { Joystick } from "@/components/play/arraial/Joystick";
import { HudTopo, Dialogo, Celebracao } from "@/components/play/arraial/Hud";
import { PerfilHud, emitirPerfil } from "@/components/play/arraial/PerfilHud";
import { DialogoRecado } from "@/components/play/arraial/DialogoRecado";
import { usePerfilAtual } from "@/components/play/arraial/perfilStore";
import type { Dialogo as DialogoDeRecado } from "@/lib/play/jogos/recados";
import { DesafioArraial, DialogoMissao } from "@/components/play/arraial/Missao";
import { chamar } from "@/components/play/jogos/jogador";
import type { MissaoPublica, PerguntaArraial } from "@/lib/play/jogos/arraial";
import type { NpcId } from "@/lib/play/jogos/missoesArraial";
import { Pescaria } from "@/components/play/arraial/minigames/Pescaria";
import { CartaoLugar, MapaDaFesta } from "@/components/play/arraial/MapaFesta";
import { pontoDeParada } from "@/components/play/arraial/mundo/layout";
import { PosterArraial } from "@/components/play/arraial/PosterArraial";
import { useSaida } from "@/components/play/arraial/useSaida";

export default function ArraialApp() {
  const inputRef = useRef({ x: 0, z: 0 });
  const timerCartao = useRef<number | null>(null);
  const travadoRef = useRef(false);

  const [pertoId, setPertoId] = useState<string | null>(null);
  const [dialogo, setDialogo] = useState<Npc | null>(null);
  // Recado (missão entre personagens) que o personagem tem para a conta; tem prioridade sobre a conversa da missão do mês.
  const [recado, setRecado] = useState<{ npc: Falante; dialogo: DialogoDeRecado } | null>(null);
  const consultando = useRef(false);
  const abrirConversa = useCallback((npc: Falante) => {
    if (consultando.current) return;
    consultando.current = true;
    chamar<{ dialogo: DialogoDeRecado | null }>("/api/play/arraial", { acao: "recado-falar", npc: npc.id })
      .then((r) => {
        if (r.ok && r.dialogo) setRecado({ npc, dialogo: r.dialogo });
        else if ("quiz" in npc) setDialogo(npc as Npc);
        else setRecado({ npc, dialogo: { recado: "", titulo: npc.nome, categoria: "povo", passo: 0, tipo: "avisar", falas: npc.falas, nova: false } });
      })
      .finally(() => {
        consultando.current = false;
      });
  }, []);
  const recadoNpcs = usePerfilAtual()?.recados.marcados;
  const fecharRecado = useCallback(() => setRecado(null), []);
  const [fitinhas, setFitinhas] = useState<string[]>([]);
  const [celebrar, setCelebrar] = useState(false);
  const [celebrado, setCelebrado] = useState(false);
  const touch = useMediaQuery("(pointer: coarse)");

  // Missão do mês (servidor): falas, pistas e desafio. Sem ela, o arraial
  // cai no diálogo antigo (uma pergunta por personagem), sem ranking.
  const [missao, setMissao] = useState<MissaoPublica | null>(null);
  const estadoRef = useRef("");
  const [desafio, setDesafio] = useState<{ estado: string; pergunta: PerguntaArraial } | null>(null);
  const [avisoMissao, setAvisoMissao] = useState("");
  useEffect(() => {
    if (!avisoMissao) return;
    const id = window.setTimeout(() => setAvisoMissao(""), 6000);
    return () => window.clearTimeout(id);
  }, [avisoMissao]);
  const iniciarMissao = useCallback(() => {
    // Promessa: o estado só muda quando a resposta chega (nada síncrono no efeito).
    return chamar<{ estado: string; missao: MissaoPublica }>("/api/play/arraial", { acao: "iniciar" }).then((r) => {
      if (!r.ok) return;
      estadoRef.current = r.estado;
      setMissao(r.missao);
      setFitinhas([]);
    });
  }, []);
  useEffect(() => {
    let vivo = true;
    chamar<{ estado: string; missao: MissaoPublica }>("/api/play/arraial", { acao: "iniciar" }).then((r) => {
      if (!vivo || !r.ok) return;
      estadoRef.current = r.estado;
      setMissao(r.missao);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const anotarPista = useCallback(async (npc: NpcId) => {
    setFitinhas((f) => {
      if (f.includes(npc)) return f;
      track("arraial_fitinha", { npc, total: f.length + 1 });
      return [...f, npc];
    });
    const r = await chamar<{ estado: string } & Parameters<typeof emitirPerfil>[0]>("/api/play/arraial", { acao: "pista", estado: estadoRef.current, npc });
    if (r.ok) estadoRef.current = r.estado;
    emitirPerfil(r);
  }, []);

  const abrirDesafio = useCallback(async () => {
    setDialogo(null);
    const r = await chamar<{ estado: string; pergunta: PerguntaArraial }>("/api/play/arraial", {
      acao: "desafio",
      estado: estadoRef.current,
    });
    if (!r.ok) {
      setAvisoMissao(r.mensagem ?? "Não deu para abrir o desafio. Recarregue o arraial.");
      return;
    }
    track("arraial_desafio_inicio", { pistas: fitinhas.length });
    setDesafio({ estado: r.estado, pergunta: r.pergunta });
  }, [fitinhas.length]);

  const fimDoDesafio = useCallback(
    (acertos: number) => {
      setDesafio(null);
      if (acertos >= 4) {
        setCelebrar(true);
        setCelebrado(true);
      }
      // Partida nova: outra conversa sorteada e pistas zeradas.
      void iniciarMissao();
    },
    [iniciarMissao],
  );

  const [pertoMinigameId, setPertoMinigameId] = useState<string | null>(null);
  const [pescariaAberta, setPescariaAberta] = useState(false);
  const [seloPescaria, setSeloPescaria] = useState(false);
  const [falhaWebgl, setFalhaWebgl] = useState(false);

  // A instrução inicial some após o primeiro movimento (ou ao usar o mapa).
  const [jaAndou, setJaAndou] = useState(false);
  const aoPrimeiroMovimento = useCallback(() => setJaAndou(true), []);

  // Mapa da festa (equivalente DOM dos alvos 3D) e cartão de lugar sem NPC.
  const controleRef = useRef<{ irPara: (x: number, z: number) => void } | null>(
    null,
  );
  const [mapaAberto, setMapaAberto] = useState(false);
  const [lugarAberto, setLugarAberto] = useState<Lugar | null>(null);
  const irAte = useCallback((id: string) => {
    const destino = pontoDeParada(id);
    const lugar = lugares.find((l) => l.id === id);
    setMapaAberto(false);
    if (destino) controleRef.current?.irPara(destino[0], destino[1]);
    track("arraial_mapa_ir", { lugar: id });
    setLugarAberto(null);
    // O cartão do lugar abre depois que a câmera assenta na viagem (~0,9 s);
    // um novo destino ou o unmount cancelam o timer anterior.
    if (timerCartao.current !== null) window.clearTimeout(timerCartao.current);
    if (lugar && lugar.tipo === "lugar") {
      timerCartao.current = window.setTimeout(() => setLugarAberto(lugar), 900);
    }
    setJaAndou(true);
  }, []);
  const fecharLugar = useCallback(() => setLugarAberto(null), []);
  // Superfícies com animação de saída: ficam montadas 150 ms com data-saindo.
  const dialogoSaida = useSaida(dialogo);
  const lugarSaida = useSaida(lugarAberto);
  const mapaSaida = useSaida(mapaAberto ? true : null);
  useEffect(
    () => () => {
      if (timerCartao.current !== null)
        window.clearTimeout(timerCartao.current);
    },
    [],
  );
  const fecharMapa = useCallback(() => setMapaAberto(false), []);
  const aoMudarPerto = useCallback((id: string | null) => setPertoId(id), []);

  useEffect(() => {
    travadoRef.current =
      dialogo !== null ||
      recado !== null ||
      desafio !== null ||
      celebrar ||
      pescariaAberta ||
      mapaAberto ||
      lugarAberto !== null;
  }, [dialogo, recado, desafio, celebrar, pescariaAberta, mapaAberto, lugarAberto]);

  useEffect(() => {
    track("arraial_open");
  }, []);

  // Tecla E abre a conversa ou o minigame de pescaria no desktop; M abre o mapa.
  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      if (
        e.key.toLowerCase() === "m" &&
        !dialogo &&
        !celebrar &&
        !pescariaAberta &&
        !lugarAberto
      ) {
        setMapaAberto((v) => !v);
        return;
      }
      if (
        e.key.toLowerCase() !== "e" ||
        dialogo ||
        recado ||
        celebrar ||
        pescariaAberta ||
        mapaAberto ||
        lugarAberto
      )
        return;
      if (pertoId) {
        const npc = [...npcs, ...extras].find((n) => n.id === pertoId);
        if (npc) abrirConversa(npc);
        return;
      }
      if (pertoMinigameId === "pescaria") {
        setPescariaAberta(true);
        track("arraial_minigame_pescaria_inicio");
      }
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [
    abrirConversa,
    recado,
    pertoId,
    pertoMinigameId,
    dialogo,
    celebrar,
    pescariaAberta,
    mapaAberto,
    lugarAberto,
  ]);

  const npcPerto = pertoId ? [...npcs, ...extras].find((n) => n.id === pertoId) : null;

  const ganhouFitinha = () => {
    if (!dialogo) return;
    setFitinhas((f) => {
      if (f.includes(dialogo.id)) return f;
      track("arraial_fitinha", { npc: dialogo.id, total: f.length + 1 });
      return [...f, dialogo.id];
    });
  };

  const fecharDialogo = () => {
    setDialogo(null);
    // Com missão, a celebração vem depois do desafio, não ao juntar as pistas.
    if (missao) {
      if (fitinhas.length === npcs.length) setAvisoMissao(`Pistas completas! Volta em ${npcs.find((n) => n.id === missao.anfitriao)?.nome} para o desafio.`);
      return;
    }
    if (!celebrado && fitinhas.length === npcs.length) {
      setCelebrar(true);
      setCelebrado(true);
      track("arraial_completo");
    }
  };

  const abrirPescaria = () => {
    setPescariaAberta(true);
    track("arraial_minigame_pescaria_inicio");
  };

  const ganhouPescaria = () => {
    setSeloPescaria(true);
    track("arraial_minigame_pescaria_vitoria");
  };

  const fecharPescaria = (vitoriaAlcancada: boolean) => {
    setPescariaAberta(false);
    if (!vitoriaAlcancada) track("arraial_minigame_pescaria_abandono");
  };

  // Identidade estável: a Scene usa este callback como dependência de efeitos.
  const aoFalharWebgl = useCallback(() => {
    setFalhaWebgl(true);
    track("arraial_webgl_fallback");
  }, []);

  if (falhaWebgl) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center gap-5 overflow-y-auto bg-kambada-noite px-6 py-16 text-center text-kambada-cream">
        {/* A praça continua visível como imagem, por trás do texto. */}
        <PosterArraial posicao="fixed" className="opacity-45" />
        <p className="relative font-display text-2xl font-bold italic">
          {textos.titulo}
        </p>
        <p className="relative max-w-sm font-body text-sm leading-relaxed text-kambada-cream/85">
          Não foi possível carregar a praça em 3D neste aparelho. Aqui está quem
          você encontraria por lá, prontos pra conversar:
        </p>
        <ul className="relative font-body text-sm text-kambada-cream/85">
          {npcs.map((npc) => (
            <li key={npc.id}>{npc.nome}</li>
          ))}
        </ul>
        <Link
          href="/kambadaplay/matraca"
          className="toque-matraca relative rounded-full bg-kambada-gold px-6 py-3 font-body font-bold text-kambada-ink transition-colors hover:bg-kambada-amarelo-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold"
        >
          Conhecer a matraca
        </Link>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-kambada-noite">
      <Scene
        inputRef={inputRef}
        travadoRef={travadoRef}
        onPertoChange={aoMudarPerto}
        onPertoMinigameChange={setPertoMinigameId}
        fitinhas={fitinhas}
        recadoNpcs={recadoNpcs}
        seloPescaria={seloPescaria}
        celebrando={celebrar}
        onWebglFalha={aoFalharWebgl}
        onPrimeiroMovimento={aoPrimeiroMovimento}
        controleRef={controleRef}
        onClicarLugar={irAte}
      />

      <HudTopo fitinhas={fitinhas} />
      <PerfilHud />

      {/* Mapa da festa: abaixo do título, alcançável por teclado (M) e toque */}
      <button
        onClick={() => setMapaAberto(true)}
        aria-haspopup="dialog"
        aria-expanded={mapaAberto}
        aria-label={
          touch ? textos.mapaBotao : `${textos.mapaBotao}. Atalho: tecla M`
        }
        data-botao-mapa
        className="toque-matraca absolute left-4 top-16 z-20 flex items-center gap-2 rounded-full bg-kambada-noite/85 px-3.5 py-2 font-body text-xs font-semibold text-kambada-cream backdrop-blur-sm transition-colors hover:bg-kambada-noite/95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold focus-visible:ring-offset-2 focus-visible:ring-offset-kambada-noite"
      >
        <svg
          aria-hidden
          viewBox="0 0 16 16"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.6}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M1.5 3.5 5.5 2l5 1.5 4-1.5v10.5l-4 1.5-5-1.5-4 1.5Z" />
          <path d="M5.5 2v10.5M10.5 3.5V14" />
        </svg>
        {textos.mapaBotao}
        {!touch && (
          <span aria-hidden className="text-kambada-cream/85">
            (M)
          </span>
        )}
      </button>

      {/* Selo do minigame de pescaria, abaixo do contador de fitinhas do HudTopo,
          numa faixa vertical livre pra não sobrepor a instrução centrada em top-16 */}
      {seloPescaria && (
        <div className="pointer-events-none absolute right-4 top-28 z-20 flex items-center gap-1.5 rounded-full bg-kambada-noite/70 px-3 py-1.5 backdrop-blur-sm">
          {/* Peixe no traço da marca: contorno simples, sem emoji */}
          <svg
            aria-hidden
            viewBox="0 0 24 16"
            className="h-3.5 w-5 text-kambada-gold"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M3 8c2.8-3.8 7.2-5.2 10.8-3.9C16.1 4.9 18 6.3 19.5 8c-1.5 1.7-3.4 3.1-5.7 3.9C10.2 13.2 5.8 11.8 3 8Z" />
            <path d="M19.5 8 23 4.8v6.4L19.5 8Z" />
            <circle cx="7.2" cy="7.2" r="0.4" fill="currentColor" />
          </svg>
          <span className="font-body text-[11px] font-semibold text-kambada-cream">
            {textosPescaria.seloNome}
          </span>
        </div>
      )}

      {/* Instrução no rodapé (acima do joystick no toque), sem cobrir a capela:
          some com fade depois do primeiro movimento do jogador */}
      <div className="pointer-events-none absolute inset-x-0 bottom-36 z-10 flex justify-center px-6 sm:bottom-16">
        <p
          aria-hidden={jaAndou}
          className={`hint-arraial rounded-full bg-kambada-noite/80 px-4 py-1.5 text-center font-body text-[13px] text-kambada-cream/90 backdrop-blur-sm ${
            jaAndou ? "opacity-0" : "opacity-100"
          }`}
        >
          {touch ? textos.instrucaoMobile : textos.instrucaoDesktop}
        </p>
      </div>
      <Link
        href="/kambadaplay"
        className="toque-matraca pointer-events-auto absolute bottom-24 right-4 z-20 sm:bottom-4 sm:right-24 rounded-full bg-kambada-noite/85 px-4 py-2 font-body text-xs font-semibold text-kambada-cream/90 backdrop-blur-sm transition-colors hover:bg-kambada-noite/95 hover:text-kambada-cream focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold focus-visible:ring-offset-2 focus-visible:ring-offset-kambada-noite"
      >
        ← Kambada Play
      </Link>

      {/* Botão de conversa quando há alguém por perto */}
      {npcPerto &&
        !dialogo &&
        !celebrar &&
        !pescariaAberta &&
        !mapaAberto &&
        !lugarAberto && (
          <div className="absolute inset-x-0 bottom-52 z-20 flex justify-center sm:bottom-24">
            <button
              onClick={() => abrirConversa(npcPerto)}
              aria-label={`${textos.falar} com ${npcPerto.nome}${touch ? "" : ". Atalho: tecla E"}`}
              className="pulso toque-matraca pointer-events-auto rounded-full border-2 border-kambada-cream bg-kambada-gold px-8 py-3 font-body text-base font-bold text-kambada-ink shadow-xl transition-colors hover:bg-kambada-amarelo-escuro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold focus-visible:ring-offset-2 focus-visible:ring-offset-kambada-noite"
            >
              {textos.falar} com {npcPerto.nome}
              {!touch && <span aria-hidden> (E)</span>}
            </button>
          </div>
        )}

      {/* Botão de minigame quando o ponto de pescaria está por perto */}
      {!npcPerto &&
        pertoMinigameId === "pescaria" &&
        !dialogo &&
        !celebrar &&
        !pescariaAberta &&
        !mapaAberto &&
        !lugarAberto && (
          <div className="absolute inset-x-0 bottom-52 z-20 flex justify-center sm:bottom-24">
            <button
              onClick={abrirPescaria}
              aria-label={`${textosPescaria.botaoBrincar}${touch ? "" : ". Atalho: tecla E"}`}
              className="pulso toque-matraca pointer-events-auto rounded-full border-2 border-kambada-cream bg-kambada-blue px-8 py-3 font-body text-base font-bold text-kambada-cream shadow-xl transition-colors hover:bg-kambada-blue/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-kambada-gold focus-visible:ring-offset-2 focus-visible:ring-offset-kambada-noite"
            >
              {textosPescaria.botaoBrincar}
              {!touch && <span aria-hidden> (E)</span>}
            </button>
          </div>
        )}

      {/* Joystick só no touch: dinâmico, a zona de captura é a metade
          inferior esquerda da tela e a base nasce onde o polegar pousa */}
      {touch && !dialogo && !desafio && !celebrar && !pescariaAberta && (
        <Joystick inputRef={inputRef} />
      )}

      {lugarSaida.valor && !dialogo && !celebrar && !pescariaAberta && (
        <CartaoLugar
          lugar={lugarSaida.valor}
          saindo={lugarSaida.saindo}
          onFechar={fecharLugar}
        />
      )}
      {mapaSaida.valor && (
        <MapaDaFesta
          fitinhas={fitinhas}
          seloPescaria={seloPescaria}
          saindo={mapaSaida.saindo}
          onIr={irAte}
          onFechar={fecharMapa}
        />
      )}
      {avisoMissao && !dialogo && !desafio && (
        <div className="pointer-events-none absolute inset-x-0 top-28 z-20 flex justify-center px-6">
          <p role="status" className="rounded-full bg-kambada-gold px-4 py-1.5 text-center font-body text-[13px] font-bold text-kambada-ink shadow-xl">
            {avisoMissao}
          </p>
        </div>
      )}
      {recado && <DialogoRecado npc={recado.npc} dialogo={recado.dialogo} aoFechar={fecharRecado} />}
      {dialogoSaida.valor && missao && (
        <DialogoMissao
          npc={dialogoSaida.valor}
          missao={missao}
          pistas={fitinhas}
          saindo={dialogoSaida.saindo}
          onPista={anotarPista}
          onDesafio={abrirDesafio}
          onFechar={fecharDialogo}
        />
      )}
      {desafio && missao && (
        <DesafioArraial
          estado={desafio.estado}
          primeira={desafio.pergunta}
          titulo={missao.titulo}
          onTerminou={fimDoDesafio}
          onFechar={() => fimDoDesafio(0)}
        />
      )}
      {dialogoSaida.valor && !missao && (
        <Dialogo
          npc={dialogoSaida.valor}
          saindo={dialogoSaida.saindo}
          onGanhou={ganhouFitinha}
          onFechar={fecharDialogo}
        />
      )}
      {celebrar && <Celebracao onVoltar={() => setCelebrar(false)} />}
      {pescariaAberta && (
        <Pescaria
          touch={touch}
          onVitoria={ganhouPescaria}
          onFechar={fecharPescaria}
        />
      )}
    </div>
  );
}
