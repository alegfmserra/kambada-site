"use client";

import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Stars, PerformanceMonitor, AdaptiveDpr } from "@react-three/drei";
import * as THREE from "three";
import { npcs, textos } from "@/content/play/arraial";
import { acento, ceuArraial, luzArraial } from "@/lib/play/cores";
import { Ceu } from "./Cenario";
import { FogueiraViva } from "./mundo/FogueiraViva";
import { Noivos, Brincante, Boi, Marcador } from "./Personagens";
import { Personagem } from "./mundo/Personagem";
import { Quadrilha, TrioForro, TamborDeCrioula, Aquecedor, Passeantes } from "./Figurantes";
import { Player, type Colisor } from "./Player";
import { QualidadeProvider, type NivelQualidade } from "./Qualidade";
import { usePrefereMenosMovimento } from "@/lib/play/movimento";
import { Chao, Pavimento } from "./mundo/Terreno";
import { Floresta } from "./mundo/Floresta";
import {
  CercasEBancos,
  PostesDeLanterna,
  SombrasDeContato,
  Varais,
} from "./mundo/Decoracoes";
import { Modelo } from "./mundo/Modelo";
import criarCapela, { animar as animarCapela } from "./mundo/modelos/capela";
import criarBarraca, { animar as animarBarraca } from "./mundo/modelos/barraca";
import criarCoreto, { animar as animarCoreto } from "./mundo/modelos/coreto";
import {
  BARRACAS,
  CAPELA,
  CORETO,
  PONTOS_NPC,
  PONTO_PESCARIA,
  colisoresDoLayout,
} from "./mundo/layout";

/** Posição de cada ponto interativo na praça (x, z) + onde flutua o "!" (y). */
export const PONTOS = PONTOS_NPC;

/**
 * Pontos de minigame, num mapa separado dos NPCs pra não vazar pro loop do
 * quiz nem pro contador de fitinhas. Mesma forma de `PONTOS`.
 */
export const PONTOS_MINIGAME: Record<
  string,
  { x: number; z: number; alturaMarcador: number }
> = {
  pescaria: PONTO_PESCARIA,
};

const COLISORES: Colisor[] = [
  ...colisoresDoLayout(),
  ...npcs.map((n) => ({
    x: PONTOS[n.id].x,
    z: PONTOS[n.id].z,
    r: n.id === "boi" ? 1.5 : 0.7,
  })),
  { x: -2.2, z: 3.0, r: 0.7 }, // brincante esquentando o pandeirão
];

const RAIO_CONVERSA = 2.6;

/** Dpr máximo por nível de qualidade (Seção 7.4 do PRD: teto nunca passa de 2). */
const DPR_POR_NIVEL: Record<NivelQualidade, [number, number]> = {
  alta: [1, 2],
  media: [1, 1.5],
  baixa: [1, 1],
};

/**
 * Montagem escalonada: a cena entra em etapas, uma por frame (terreno e
 * fogueira, floresta, construções, decorações e figurantes), pra o commit do
 * React e a compilação dos shaders virarem várias tarefas curtas em vez de
 * um único long task no boot. Tudo acontece atrás do splash.
 */
const ETAPAS = 6;
function Escalonador({ aoAvancar }: { aoAvancar: (etapa: number) => void }) {
  const etapa = useRef(0);
  useFrame(() => {
    if (etapa.current >= ETAPAS) return;
    etapa.current += 1;
    aoAvancar(etapa.current);
  });
  return null;
}

/**
 * Roda uma vez, dentro do Canvas: avisa o pai assim que o primeiro frame do
 * useFrame executa, prova de que o contexto WebGL está de pé e renderizando.
 */
function DetectorDePrimeiroFrame({ aoRodar }: { aoRodar: () => void }) {
  const jaRodou = useRef(false);
  useFrame(() => {
    if (jaRodou.current) return;
    jaRodou.current = true;
    aoRodar();
  });
  return null;
}

type SceneProps = {
  inputRef: React.MutableRefObject<{ x: number; z: number }>;
  travadoRef: React.MutableRefObject<boolean>;
  /** id do NPC ao alcance, ou null. */
  onPertoChange: (id: string | null) => void;
  /** id do ponto de minigame ao alcance, ou null. */
  onPertoMinigameChange: (id: string | null) => void;
  fitinhas: string[];
  /** true quando o selo da pescaria já foi conquistado, pra esconder o marcador. */
  seloPescaria: boolean;
  /** true durante a celebração das cinco fitinhas: dispara o momento do Urrou no boi. */
  celebrando: boolean;
  /** Dispara se o WebGL falhar ao subir ou perder o contexto sem recuperar. */
  onWebglFalha: () => void;
  /** Dispara uma vez, no primeiro movimento do jogador (o HUD apaga o hint inicial). */
  onPrimeiroMovimento?: () => void;
  /** Controle do personagem pra o mapa da festa (irPara). */
  controleRef?: React.MutableRefObject<{
    irPara: (x: number, z: number) => void;
  } | null>;
  /** Clique/toque num objeto da praça (capela, coreto, barraca): id do lugar. */
  onClicarLugar?: (id: string) => void;
  /** Personagens com um recado (missão) esperando: ganham um "!" verde. */
  recadoNpcs?: string[];
};

/**
 * Sondagem de WebGL feita uma única vez por sessão: cria um contexto de
 * teste, guarda o resultado e libera o contexto na hora (cada contexto vivo
 * conta no limite do navegador; criar um por render derrubaria o da cena).
 */
let webglDisponivel: boolean | null = null;
function temWebgl(): boolean {
  if (webglDisponivel !== null) return webglDisponivel;
  const teste = document.createElement("canvas");
  const gl = teste.getContext("webgl2") ?? teste.getContext("webgl");
  webglDisponivel = Boolean(gl);
  gl?.getExtension("WEBGL_lose_context")?.loseContext();
  return webglDisponivel;
}

/** Pós-processamento entra depois do primeiro frame, num chunk próprio. */
const PosProcessamento = lazy(() => import("./PosProcessamento"));

/** Factories estáveis (uma instância por barraca, memorizada pelo id). */
const criarBarracaPor: Record<string, () => THREE.Group> = Object.fromEntries(
  BARRACAS.map((b) => [
    b.id,
    () =>
      criarBarraca({
        corToldo: b.corToldo,
        corPaineis: b.corPaineis,
        itens: b.itens,
      }),
  ]),
);

export function Scene({
  inputRef,
  travadoRef,
  onPertoChange,
  onPertoMinigameChange,
  fitinhas,
  seloPescaria,
  recadoNpcs = [],
  celebrando,
  onWebglFalha,
  onPrimeiroMovimento,
  controleRef,
  onClicarLugar,
}: SceneProps) {
  const clicar = useCallback(
    (id: string) => () => {
      onClicarLugar?.(id);
    },
    [onClicarLugar],
  );
  // Cursor de ponteiro sobre os objetos clicáveis, sem passar por estado do
  // React (um hover não deve re-renderizar a cena inteira).
  const entrar = useCallback(() => {
    document.body.style.cursor = "pointer";
  }, []);
  const sair = useCallback(() => {
    document.body.style.cursor = "";
  }, []);
  useEffect(
    () => () => {
      document.body.style.cursor = "";
    },
    [],
  );
  const ultimoPerto = useRef<string | null>(null);
  const ultimoPertoMinigame = useRef<string | null>(null);
  const [nivel, setNivel] = useState<NivelQualidade>("alta");
  const primeiroFrameOk = useRef(false);
  const falhaJaDisparada = useRef(false);
  const [posLigado, setPosLigado] = useState(false);
  const [etapa, setEtapa] = useState(0);
  const menosMovimento = usePrefereMenosMovimento();

  const dispararFalhaWebgl = useCallback(() => {
    if (falhaJaDisparada.current) return;
    falhaJaDisparada.current = true;
    onWebglFalha();
  }, [onWebglFalha]);

  const aoDescerNivel = useCallback(() => {
    setNivel((atual) => (atual === "alta" ? "media" : "baixa"));
  }, []);

  const aoSubirNivel = useCallback(() => {
    setNivel((atual) => (atual === "baixa" ? "media" : "alta"));
  }, []);

  const aoCairNoFallback = useCallback(() => {
    setNivel("baixa");
  }, []);

  // Sem WebGL (bloqueado ou indisponível): fallback na hora, sem esperar o timer.
  useEffect(() => {
    if (!temWebgl()) dispararFalhaWebgl();
  }, [dispararFalhaWebgl]);

  // Sanidade: se o primeiro frame nunca rodar em 12s, o WebGL não subiu de verdade.
  useEffect(() => {
    const id = setTimeout(() => {
      if (!primeiroFrameOk.current) dispararFalhaWebgl();
    }, 12000);
    return () => clearTimeout(id);
  }, [dispararFalhaWebgl]);

  // Coordenadas dos pontos pro hook de teste (só fora de produção),
  // pra o e2e não duplicar posições e não quebrar quando a praça mudar.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as { __arraialPontos?: typeof PONTOS };
    w.__arraialPontos = { ...PONTOS, ...PONTOS_MINIGAME };
    return () => {
      delete w.__arraialPontos;
    };
  }, []);

  const aoMover = useCallback(
    (pos: THREE.Vector3) => {
      let maisPerto: string | null = null;
      let menorDist = RAIO_CONVERSA;
      for (const npc of npcs) {
        const p = PONTOS[npc.id];
        const d = Math.hypot(pos.x - p.x, pos.z - p.z);
        if (d < menorDist) {
          menorDist = d;
          maisPerto = npc.id;
        }
      }
      if (maisPerto !== ultimoPerto.current) {
        ultimoPerto.current = maisPerto;
        onPertoChange(maisPerto);
      }

      let maisPertoMinigame: string | null = null;
      let menorDistMinigame = RAIO_CONVERSA;
      for (const id of Object.keys(PONTOS_MINIGAME)) {
        const p = PONTOS_MINIGAME[id];
        const d = Math.hypot(pos.x - p.x, pos.z - p.z);
        if (d < menorDistMinigame) {
          menorDistMinigame = d;
          maisPertoMinigame = id;
        }
      }
      if (maisPertoMinigame !== ultimoPertoMinigame.current) {
        ultimoPertoMinigame.current = maisPertoMinigame;
        onPertoMinigameChange(maisPertoMinigame);
      }
    },
    [onPertoChange, onPertoMinigameChange],
  );

  return (
    <div
      role="img"
      aria-label="Clareira de floresta com um arraial junino em 3D: fogueira ao centro, capela ao fundo, coreto com trio de forró, barracas de comida e brincadeiras, e cinco personagens para conversar"
      className="h-full w-full"
    >
      {/* Alternativa textual pra quem usa leitor de tela: descreve a cena e os pontos de conversa,
          já que a descoberta espacial no canvas 3D não é perceptível sem visão. */}
      <div className="sr-only">
        <p>
          Uma clareira cercada de floresta, com um caminho de terra que entra
          pelo primeiro plano e leva à praça de pedra onde a fogueira está
          acesa. Ao fundo, uma capela branca com torre e sino, onde o padre
          celebra o casamento de Zé e Francisca; à esquerda, um coreto de
          madeira onde um trio toca forró; ao redor, barracas de canjica, milho
          e maçã do amor, a barraca da Kambada com a vendedora e uma barraca de
          pescaria com um minigame de mira e timing pra fisgar um peixe e ganhar
          um selo. Lanternas, varais de bandeirinhas, uma quadrilha dançando,
          uma roda de tambor de crioula e o Boi Estrela com sua manta de veludo
          completam o clima junino maranhense. Cinco personagens estão
          espalhados pela praça, prontos para conversar:
        </p>
        <ul>
          {npcs.map((npc) => (
            <li key={npc.id}>{npc.nome}</li>
          ))}
        </ul>
        <p>{textos.instrucaoDesktop}</p>
      </div>
      <Canvas
        dpr={DPR_POR_NIVEL[nivel]}
        camera={{ fov: 42, position: [-2.8, 21, 34], near: 0.5, far: 130 }}
        onCreated={({ gl }) => {
          // Contexto perdido sem recuperação automática: mostra o fallback textual.
          gl.domElement.addEventListener("webglcontextlost", (e) => {
            e.preventDefault();
            dispararFalhaWebgl();
          });
        }}
      >
        <color attach="background" args={[ceuArraial.horizonte]} />
        {/* Névoa de profundidade: as árvores do fundo clareiam e dessaturam, o horizonte some. */}
        <fog attach="fog" args={[ceuArraial.nevoa, 28, 78]} />

        {/* Adapta dpr e nível de qualidade ao FPS medido em runtime (PRD, Seção 7.4):
            três degraus (alta/média/baixa) cortam bloom, pós-processamento inteiro,
            partículas e metade das bandeirinhas antes de qualquer coisa mais drástica. */}
        <PerformanceMonitor
          flipflops={3}
          onDecline={aoDescerNivel}
          onIncline={aoSubirNivel}
          onFallback={aoCairNoFallback}
        />
        <AdaptiveDpr pixelated />
        <Escalonador aoAvancar={setEtapa} />
        <DetectorDePrimeiroFrame
          aoRodar={() => {
            primeiroFrameOk.current = true;
            // O pós-processamento só monta com a cena já de pé, fora do boot.
            setTimeout(() => setPosLigado(true), 700);
          }}
        />

        {/* Rig de luz: hemisférica (céu violeta / chão verde-escuro), direcional quente
            baixa do lado da fogueira e um contra-luz frio de luar vindo de trás da câmera
            pra recortar as copas. Sem sombra dinâmica (orçamento); as lanternas e a
            fogueira iluminam por emissivo, poças de luz e uma única pointLight. */}
        <hemisphereLight args={["#5C6DB5", "#2E4A24", 0.9]} />
        <directionalLight
          position={[-6, 10, -4]}
          intensity={0.85}
          color={luzArraial.quente}
          castShadow={false}
        />
        <directionalLight
          position={[6, 9, 14]}
          intensity={0.5}
          color="#7F92E6"
          castShadow={false}
        />

        <Ceu />
        <Stars
          radius={30}
          depth={8}
          count={900}
          factor={4}
          saturation={0}
          fade
          speed={menosMovimento ? 0 : 0.4}
        />

        <QualidadeProvider value={nivel}>
          <Chao />
          <Pavimento />
          <FogueiraViva
            onClick={clicar("fogueira")}
            onPointerOver={entrar}
            onPointerOut={sair}
          />
          {etapa >= 1 && <Floresta parte="arvores" />}
          {etapa >= 2 && <Floresta parte="rasteira" />}

          {etapa >= 3 && (
            <>
              <Modelo
                nome="capela"
                criar={criarCapela}
                animar={animarCapela}
                posicao={[CAPELA.pos[0], 0, CAPELA.pos[1]]}
                rotacaoY={CAPELA.rotY}
                onClick={clicar("capela")}
                onPointerOver={entrar}
                onPointerOut={sair}
              />
              <Modelo
                nome="coreto"
                criar={criarCoreto}
                animar={animarCoreto}
                posicao={[CORETO.pos[0], 0, CORETO.pos[1]]}
                rotacaoY={CORETO.rotY}
                onClick={clicar("coreto")}
                onPointerOver={entrar}
                onPointerOut={sair}
              />
            </>
          )}
          {etapa >= 4 && (
            <>
              {BARRACAS.map((b) => (
                <Modelo
                  key={b.id}
                  nome={`barraca-${b.id}`}
                  criar={criarBarracaPor[b.id]}
                  animar={animarBarraca}
                  posicao={[b.pos[0], 0, b.pos[1]]}
                  rotacaoY={b.rotY}
                  onClick={clicar(b.lugarId)}
                  onPointerOver={entrar}
                  onPointerOut={sair}
                />
              ))}
            </>
          )}

          {etapa >= 5 && (
            <>
              <SombrasDeContato />
              <PostesDeLanterna />
              <Varais />
              <CercasEBancos />
            </>
          )}
          {etapa >= 6 && (
            <>
              <Noivos posicao={[PONTOS.noivos.x, 0, PONTOS.noivos.z]} />
              <Personagem
                traje="chico"
                variante={2}
                posicao={[PONTOS.fogueira.x, 0, PONTOS.fogueira.z]}
                rotacaoY={-2.2}
              />
              {/* Vendedora da Kambada, no balcão da barraca */}
              <Personagem
                traje="vendedora"
                variante={0}
                posicao={[PONTOS.barraca.x + 0.2, 0, PONTOS.barraca.z + 1.2]}
                rotacaoY={Math.PI}
                fase={0.5}
              />
              <Boi
                posicao={[PONTOS.boi.x, 0, PONTOS.boi.z]}
                celebrando={celebrando}
              />
              <Brincante
                posicao={[PONTOS.brincante.x, 0, PONTOS.brincante.z]}
              />
              <Quadrilha />
              <TrioForro />
              <TamborDeCrioula />
              <Aquecedor />
              <Passeantes />
            </>
          )}

          {npcs.map((npc) => {
            const p = PONTOS[npc.id];
            return (
              <Marcador
                key={npc.id}
                posicao={[p.x, p.alturaMarcador, p.z]}
                visivel={!fitinhas.includes(npc.id)}
              />
            );
          })}
          {npcs.map((npc) => {
            const p = PONTOS[npc.id];
            return <Marcador key={`recado-${npc.id}`} posicao={[p.x + 0.45, p.alturaMarcador, p.z]} visivel={recadoNpcs.includes(npc.id)} cor="#5BD68A" />;
          })}
          <Marcador
            posicao={[
              PONTOS_MINIGAME.pescaria.x,
              PONTOS_MINIGAME.pescaria.alturaMarcador,
              PONTOS_MINIGAME.pescaria.z,
            ]}
            visivel={!seloPescaria}
            cor={acento.azul}
          />

          <Player
            inputRef={inputRef}
            travadoRef={travadoRef}
            colisores={COLISORES}
            onMover={aoMover}
            onPrimeiroMovimento={onPrimeiroMovimento}
            controleRef={controleRef}
          />

          {/* Pós-processamento (grading, bloom, vinheta, grão, SMAA): chunk
              preguiçoso montado após o primeiro frame; some inteiro na qualidade baixa. */}
          {posLigado && nivel !== "baixa" && (
            <Suspense fallback={null}>
              <PosProcessamento nivel={nivel} />
            </Suspense>
          )}
        </QualidadeProvider>
      </Canvas>
    </div>
  );
}
