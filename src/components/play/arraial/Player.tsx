"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { Personagem, type EstadoPersonagem } from "./mundo/Personagem";
import { track } from "@/lib/play/track";
import { acento } from "@/lib/play/cores";
import { usePrefereMenosMovimento } from "@/lib/play/movimento";
import { hashDeterministico } from "@/lib/play/hash";
import { useQualidade } from "./Qualidade";
import { ENTRADA, RAIO_ANDAVEL } from "./mundo/layout";

export type Colisor = { x: number; z: number; r: number };

type PlayerProps = {
  /** Vetor de movimento [-1..1] escrito pelo teclado e pelo joystick. */
  inputRef: React.MutableRefObject<{ x: number; z: number }>;
  /** Quando true (diálogo aberto), o personagem não anda. */
  travadoRef: React.MutableRefObject<boolean>;
  colisores: Colisor[];
  /** Notifica a posição a cada frame pra checagem de proximidade. */
  onMover: (pos: THREE.Vector3) => void;
  /** Dispara uma única vez, no primeiro movimento do jogador (some o hint do HUD). */
  onPrimeiroMovimento?: () => void;
  /** Controle externo (mapa da festa, clique em objetos): leva o personagem a um ponto. */
  controleRef?: React.MutableRefObject<{
    irPara: (x: number, z: number) => void;
  } | null>;
};

const RAIO_PRACA = RAIO_ANDAVEL;
const VELOCIDADE = 3.9;
/** Taxa da rampa de aceleração (lerp exponencial por segundo). */
const ACELERACAO = 10;
/** Taxa da fricção ao soltar o input (lerp exponencial por segundo). */
const FRICCAO = 8;
/** Quanto a câmera "respira" na direção da corrida, em unidades de cena. */
const LOOK_AHEAD = 1.2;
/** Centro visual da festa (entre a fogueira e a capela). */
const CENTRO_FESTA = { x: 0, z: -2.7 };
/**
 * Peso do centro da festa no alvo da câmera: maior perto da praça (o fogo
 * domina), menor na borda (o destino do mapa muda o enquadramento de verdade).
 */
function pesoDoCentro(distancia: number): number {
  return 0.58 - 0.26 * Math.min(1, distancia / 16);
}
/** Altura e recuo da câmera em relação ao alvo: pitch de ~33° (atan(14.6/22.8)), distância ~27 m (praça expandida). */
const ALTURA_CAMERA = 13.6;
const RECUO_CAMERA = 21.0;
/** Campo de visão vertical: mais aberto em retrato pra praça caber na largura. */
const FOV_PAISAGEM = 44;
const FOV_RETRATO = 66;

export function Player({
  inputRef,
  travadoRef,
  colisores,
  onMover,
  onPrimeiroMovimento,
  controleRef,
}: PlayerProps) {
  const grupo = useRef<THREE.Group>(null);
  const visual = useRef<THREE.Group>(null);
  const poeira = useRef<THREE.Points>(null);
  const { camera, size } = useThree();
  const alvoCamera = useRef(new THREE.Vector3());
  /** Ponto de mira suavizado: evita o chicote quando o personagem é teleportado. */
  const alvoOlhar = useRef(new THREE.Vector3());
  const alvoOlharDesejado = useRef(new THREE.Vector3());
  const primeiroFrame = useRef(true);
  /** A chegada da câmera só começa quando a cortina do splash terminou de abrir. */
  const cortinaAberta = useRef(false);
  const splashRef = useRef<Element | null | undefined>(undefined);
  const velocidade = useRef(new THREE.Vector2(0, 0));
  const lookAhead = useRef(new THREE.Vector2(0, 0));
  const tempoRef = useRef(0);
  const jaAndou = useRef(false);
  /** Estado lido pelo boneco por quadro: parado ou andando, e a fração da velocidade. */
  const estadoBoneco = useRef<EstadoPersonagem>({
    modo: "parado",
    velocidade: 0,
  });
  const menosMovimento = usePrefereMenosMovimento();
  const nivel = useQualidade();
  const poeiraDesligada = menosMovimento || nivel === "baixa";

  // Poeira do chão ao andar: ativa enquanto o personagem se move e some parado.
  const geoPoeira = useMemo(() => {
    const n = 10;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (hashDeterministico(i * 3) - 0.5) * 0.5;
      pos[i * 3 + 1] = hashDeterministico(i * 3 + 1) * 0.15;
      pos[i * 3 + 2] = (hashDeterministico(i * 3 + 2) - 0.5) * 0.5;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  // Cleanup da geometria criada fora do JSX (o R3F só descarta o que ele mesmo cria).
  useEffect(() => () => geoPoeira.dispose(), [geoPoeira]);

  // Controle externo: o mapa da festa e os cliques nos objetos 3D chamam
  // irPara e o personagem aparece no ponto (a proximidade dispara o HUD).
  useEffect(() => {
    if (!controleRef) return;
    controleRef.current = {
      irPara: (x, z) => {
        grupo.current?.position.set(x, 0, z);
        velocidade.current.set(0, 0);
      },
    };
    return () => {
      controleRef.current = null;
    };
  }, [controleRef]);

  // Hook de teste (só fora de produção): teleporta o personagem pra um ponto,
  // tornando a checagem de proximidade determinística no e2e headless.
  useEffect(() => {
    if (process.env.NODE_ENV === "production") return;
    const w = window as unknown as {
      __arraialTest?: {
        irPara: (x: number, z: number) => void;
        posicao: () => { x: number; z: number };
      };
    };
    w.__arraialTest = {
      irPara: (x: number, z: number) => {
        grupo.current?.position.set(x, 0, z);
      },
      posicao: () => ({
        x: grupo.current?.position.x ?? 0,
        z: grupo.current?.position.z ?? 0,
      }),
    };
    return () => {
      delete w.__arraialTest;
    };
  }, []);

  // Teclado (desktop)
  useEffect(() => {
    const teclas = new Set<string>();
    const atualizar = () => {
      let x = 0;
      let z = 0;
      if (teclas.has("w") || teclas.has("arrowup")) z -= 1;
      if (teclas.has("s") || teclas.has("arrowdown")) z += 1;
      if (teclas.has("a") || teclas.has("arrowleft")) x -= 1;
      if (teclas.has("d") || teclas.has("arrowright")) x += 1;
      inputRef.current = { x, z };
    };
    const baixo = (e: KeyboardEvent) => {
      teclas.add(e.key.toLowerCase());
      atualizar();
    };
    const cima = (e: KeyboardEvent) => {
      teclas.delete(e.key.toLowerCase());
      atualizar();
    };
    window.addEventListener("keydown", baixo);
    window.addEventListener("keyup", cima);
    return () => {
      window.removeEventListener("keydown", baixo);
      window.removeEventListener("keyup", cima);
    };
  }, [inputRef]);

  // Mutação de buffer de geometria dentro de useFrame é o padrão three.js pra
  // animar partículas sem alocar por frame; o React Compiler ainda não
  // reconhece esse padrão fora do modelo de estado dele.
  // eslint-disable-next-line react-hooks/immutability -- mutação de buffer, padrão three.js de animação de partícula
  useFrame((_, deltaBruto) => {
    const g = grupo.current;
    if (!g) return;
    // Frame longo (compilação de shader, aba em segundo plano): limita o passo
    // pra o personagem não saltar através dos colisores num único frame.
    const delta = Math.min(deltaBruto, 1 / 30);
    tempoRef.current += delta;

    const { x, z } = travadoRef.current ? { x: 0, z: 0 } : inputRef.current;
    const len = Math.hypot(x, z);
    const comInput = len > 0.05;

    // Vetor de velocidade persistente: acelera na direção do input e desacelera
    // por fricção ao soltar, com lerp exponencial (interrupção sempre parte do
    // valor atual, nunca de um reset).
    const vel = velocidade.current;
    const alvoVx = comInput ? (x / len) * VELOCIDADE : 0;
    const alvoVz = comInput ? (z / len) * VELOCIDADE : 0;
    const taxa = comInput ? ACELERACAO : FRICCAO;
    const k = 1 - Math.exp(-taxa * delta);
    vel.x += (alvoVx - vel.x) * k;
    vel.y += (alvoVz - vel.y) * k;
    const rapidez = vel.length();
    const andando = rapidez > 0.05;

    if (comInput && !jaAndou.current) {
      jaAndou.current = true;
      track("arraial_start");
      onPrimeiroMovimento?.();
    }

    if (andando) {
      g.position.x += vel.x * delta;
      g.position.z += vel.y * delta;

      // Mantém dentro da praça
      const dist = Math.hypot(g.position.x, g.position.z);
      if (dist > RAIO_PRACA) {
        g.position.x *= RAIO_PRACA / dist;
        g.position.z *= RAIO_PRACA / dist;
      }
      // Empurra pra fora dos obstáculos
      for (const c of colisores) {
        const dx = g.position.x - c.x;
        const dz = g.position.z - c.z;
        const d = Math.hypot(dx, dz);
        if (d < c.r && d > 0.001) {
          g.position.x = c.x + (dx / d) * c.r;
          g.position.z = c.z + (dz / d) * c.r;
        }
      }
      // Vira na direção do movimento real (a velocidade, não o input cru)
      if (visual.current) {
        const alvo = Math.atan2(vel.x, vel.y);
        const atual = visual.current.rotation.y;
        let diff = alvo - atual;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        visual.current.rotation.y = atual + diff * Math.min(1, delta * 12);
      }
    }

    // O boneco anda (pernas em pêndulo, quica) proporcional à velocidade real.
    estadoBoneco.current.modo = andando ? "andando" : "parado";
    estadoBoneco.current.velocidade = rapidez / VELOCIDADE;

    // Poeira do chão: só aparece andando; some com prefers-reduced-motion e na qualidade baixa.
    if (poeira.current) {
      poeira.current.visible = andando && !poeiraDesligada;
      if (andando && !poeiraDesligada) {
        const arr = geoPoeira.attributes.position.array as Float32Array;
        for (let i = 0; i < arr.length; i += 3) {
          // eslint-disable-next-line react-hooks/immutability -- mutação de buffer, ver comentário acima do useFrame
          arr[i + 1] += delta * 0.3;
          if (arr[i + 1] > 0.3) {
            // Reposição determinística (hash do índice e do tempo), sem Math.random.
            arr[i + 1] = 0;
            arr[i] = (hashDeterministico(i + tempoRef.current * 7) - 0.5) * 0.5;
            arr[i + 2] =
              (hashDeterministico(i * 3 + tempoRef.current * 11) - 0.5) * 0.5;
          }
        }
        geoPoeira.attributes.position.needsUpdate = true;
      }
    }

    // Câmera em terceira pessoa, atrás e acima (clima de diorama), com
    // look-ahead: o alvo do lookAt desliza na direção da corrida com o mesmo
    // lerp exponencial, abrindo espaço de leitura à frente do personagem.
    const ahead = lookAhead.current;
    const alvoAheadX = menosMovimento ? 0 : (vel.x / VELOCIDADE) * LOOK_AHEAD;
    const alvoAheadZ = menosMovimento ? 0 : (vel.y / VELOCIDADE) * LOOK_AHEAD;
    const kAhead = 1 - Math.exp(-4 * delta);
    ahead.x += (alvoAheadX - ahead.x) * kAhead;
    ahead.y += (alvoAheadZ - ahead.y) * kAhead;

    // Diorama (referência: elevação ~35°, praça no centro, céu no topo). O alvo
    // é a mistura entre o jogador e o centro da festa, então a praça continua
    // o foco mesmo com o personagem na borda; em retrato a câmera recua mais.
    // fov contínuo pela razão de aspecto (paisagem 42, quadrado ~48, retrato 54),
    // sem degrau ao girar e com céu garantido em aspectos intermediários.
    const aspecto = size.width / size.height;
    const mistura = THREE.MathUtils.clamp((1.6 - aspecto) / 1.0, 0, 1);
    const recuo = 1;
    const fov = FOV_PAISAGEM + (FOV_RETRATO - FOV_PAISAGEM) * mistura;
    if (
      camera instanceof THREE.PerspectiveCamera &&
      Math.abs(camera.fov - fov) > 0.01
    ) {
      // Interpola o fov ao girar o aparelho (sem corte seco); no primeiro frame assenta direto.
      const kFov =
        primeiroFrame.current || menosMovimento ? 1 : 1 - Math.exp(-5 * delta);
      // eslint-disable-next-line react-hooks/immutability -- a câmera do R3F é objeto three.js mutável; fov muda só quando a orientação muda
      camera.fov += (fov - camera.fov) * kFov;
      camera.updateProjectionMatrix();
    }
    const peso = pesoDoCentro(
      Math.hypot(g.position.x - CENTRO_FESTA.x, g.position.z - CENTRO_FESTA.z),
    );
    const alvoX = g.position.x * (1 - peso) + CENTRO_FESTA.x * peso + ahead.x;
    const alvoZ = g.position.z * (1 - peso) + CENTRO_FESTA.z * peso + ahead.y;
    alvoCamera.current.set(
      alvoX,
      ALTURA_CAMERA * recuo,
      alvoZ + RECUO_CAMERA * recuo,
    );
    // Mira e posição com amortecimentos próprios: a mira é mais firme (a praça
    // não "nada") e a posição mais lenta (chegada e viagens do mapa em ~1 s).
    if (primeiroFrame.current) {
      primeiroFrame.current = false;
      alvoOlhar.current.set(alvoX, 1.2, alvoZ);
      // Momento de chegada: a câmera nasce mais alta e distante (posição inicial
      // da Scene) e assenta; com menos movimento, assenta de imediato.
      if (menosMovimento) camera.position.copy(alvoCamera.current);
    } else {
      // A chegada espera a cortina do splash terminar de abrir (o splash sai do
      // DOM no estado "fim"); antes disso o gesto rodaria escondido.
      if (!cortinaAberta.current) {
        if (splashRef.current === undefined)
          splashRef.current = document.querySelector("[data-splash]");
        const splash = splashRef.current;
        cortinaAberta.current =
          !splash ||
          !splash.isConnected ||
          splash.getAttribute("data-estado") === "fim";
        if (!cortinaAberta.current) {
          camera.lookAt(alvoOlhar.current);
          onMover(g.position);
          return;
        }
      }
      alvoOlharDesejado.current.set(alvoX, 1.2, alvoZ);
      alvoOlhar.current.lerp(
        alvoOlharDesejado.current,
        1 - Math.exp(-(menosMovimento ? 12 : 6) * delta),
      );
    }
    camera.position.lerp(
      alvoCamera.current,
      1 - Math.exp(-(menosMovimento ? 12 : 3.2) * delta),
    );
    camera.lookAt(alvoOlhar.current);

    onMover(g.position);
  });

  return (
    <group ref={grupo} position={[ENTRADA[0], 0, ENTRADA[1]]}>
      <group ref={visual}>
        <Personagem traje="jogador" variante={1} estadoRef={estadoBoneco} />
      </group>
      <points ref={poeira} geometry={geoPoeira} visible={false}>
        <pointsMaterial
          color={acento.tinta}
          size={0.05}
          transparent
          opacity={0.35}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}
