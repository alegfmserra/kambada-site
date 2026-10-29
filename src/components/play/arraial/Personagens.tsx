"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { acento } from "@/lib/play/cores";
import { rampaToon } from "@/lib/play/toon";
import { usePrefereMenosMovimento } from "@/lib/play/movimento";
import { useContorno } from "./Contorno";
import { Personagem } from "./mundo/Personagem";
import criarBoi, { animar as animarBoi } from "./mundo/modelos/boi";
import { descartar } from "./mundo/modelos/_compartilhado";

type SombraBlobProps = {
  raio?: number;
  opacidade?: number;
  posicao?: [number, number, number];
  /** Alonga a sombra num eixo (usada no boi, que é comprido em z). */
  escalaZ?: number;
};

/**
 * Sombra de contato barata (blob shadow): disco escuro achatado no chão sob
 * cada personagem, no lugar de sombra dinâmica (castShadow segue desligado
 * por orçamento, decisão da Scene). CircleGeometry nunca recebe casca de
 * contorno, então não duplica draw call de inverted hull.
 */
export function SombraBlob({
  raio = 0.32,
  opacidade = 0.25,
  posicao = [0, 0.03, 0],
  escalaZ = 1,
}: SombraBlobProps) {
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={posicao}
      scale={[1, escalaZ, 1]}
      userData={{ semContorno: true }}
    >
      <circleGeometry args={[raio, 16]} />
      <meshBasicMaterial
        color={acento.tinta}
        transparent
        opacity={opacidade}
        depthWrite={false}
      />
    </mesh>
  );
}

/**
 * Zé e Francisca à porta da capela, com o padre celebrando: o casamento
 * junino (noiva de vestido com babados e véu, noivo de paletó remendado e
 * gravata torta, padre de batina com o livro).
 */
export function Noivos({ posicao }: { posicao: [number, number, number] }) {
  return (
    <group position={posicao} name="noivos">
      <Personagem
        traje="ze"
        variante={1}
        posicao={[-0.42, 0, 0]}
        rotacaoY={0.35}
      />
      <Personagem
        traje="francisca"
        variante={0}
        posicao={[0.42, 0, 0]}
        rotacaoY={-0.35}
        fase={0.7}
      />
      <Personagem
        traje="padre"
        variante={2}
        posicao={[0, 0, -0.75]}
        fase={1.3}
      />
    </group>
  );
}

/** Dona Ritinha, brincante de boi de matraca, tocando a matraca no ritmo. */
export function Brincante({ posicao }: { posicao: [number, number, number] }) {
  return (
    <Personagem
      traje="ritinha"
      variante={2}
      modo="tocando"
      posicao={posicao}
      rotacaoY={0.6}
    />
  );
}

type BoiProps = {
  posicao: [number, number, number];
  /**
   * true durante a celebração das cinco fitinhas: dispara o momento do
   * Urrou, o clímax do auto do boi (a ressurreição, ápice da tradição).
   * Fonte: Wikipedia, Bumba meu boi do Maranhão
   * (https://pt.wikipedia.org/wiki/Bumba_meu_boi_do_Maranh%C3%A3o).
   */
  celebrando?: boolean;
};

/**
 * Boi Estrela: modelo cartoon (mundo/modelos/boi.ts) com manta de veludo,
 * estrela bordada, franja de fitas e as pernas do brincante por baixo. Dança
 * no lugar; na celebração entra no modo Urrou com um anel de partículas
 * douradas subindo.
 */
export function Boi({ posicao, celebrando = false }: BoiProps) {
  const menosMovimento = usePrefereMenosMovimento();
  const raiz = useMemo(() => criarBoi(), []);
  const grupo = useRef<THREE.Group>(null);
  const particulasUrrou = useRef<THREE.Points>(null);
  const tempoRef = useRef(0);
  useContorno(grupo);
  useEffect(() => () => descartar(raiz), [raiz]);

  // Anel de partículas douradas do Urrou: posições fixas ao redor do boi;
  // quem sobe é a transform do grupo de pontos inteiro.
  const geoUrrou = useMemo(() => {
    const n = 20;
    const pos = new Float32Array(n * 3);
    const raio = 1.1;
    for (let i = 0; i < n; i++) {
      const angulo = (i / n) * Math.PI * 2;
      pos[i * 3] = Math.cos(angulo) * raio;
      pos[i * 3 + 1] = 0.3 + (i % 4) * 0.15;
      pos[i * 3 + 2] = Math.sin(angulo) * raio;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);
  useEffect(() => () => geoUrrou.dispose(), [geoUrrou]);

  useFrame((_, delta) => {
    tempoRef.current += delta;
    const t = tempoRef.current;
    animarBoi(raiz, t, {
      menosMovimento,
      modo: celebrando ? "urrou" : "parado",
    });
    const p = particulasUrrou.current;
    if (p) {
      p.visible = celebrando && !menosMovimento;
      if (p.visible) {
        const ciclo = 1.6;
        const fase = (t % ciclo) / ciclo;
        p.position.y = 0.4 + fase * 1.4;
        p.rotation.y = t * 0.8;
        (p.material as THREE.PointsMaterial).opacity = 0.9 * (1 - fase);
      }
    }
  });

  return (
    <group
      ref={grupo}
      position={posicao}
      rotation={[0, -Math.PI / 2.5, 0]}
      name="boi-estrela"
    >
      <SombraBlob raio={0.7} escalaZ={1.5} posicao={[0, 0.03, 0]} />
      <primitive object={raiz} />
      {/* Anel de partículas douradas do Urrou, só visível durante a celebração */}
      <points ref={particulasUrrou} geometry={geoUrrou} visible={false}>
        <pointsMaterial
          color={acento.dourado}
          size={0.09}
          transparent
          opacity={0.85}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/** Objeto que brilha no chão (passo "achar" de um recado): gira e flutua devagar. */
export function ObjetoBrilhante({ posicao }: { posicao: [number, number, number] }) {
  const menosMovimento = usePrefereMenosMovimento();
  const ref = useRef<THREE.Group>(null);
  const tempoRef = useRef(0);
  useFrame((_, delta) => {
    tempoRef.current += delta;
    if (!ref.current) return;
    const t = tempoRef.current;
    ref.current.position.y = posicao[1] + 0.45 + (menosMovimento ? 0 : Math.sin(t * 2.4) * 0.1);
    ref.current.rotation.y = menosMovimento ? 0 : t * 1.2;
  });
  const cor = "#6EC9FF";
  return (
    <group ref={ref} position={[posicao[0], posicao[1] + 0.45, posicao[2]]}>
      <mesh>
        <octahedronGeometry args={[0.2, 0]} />
        <meshBasicMaterial color={cor} />
      </mesh>
      <pointLight color={cor} intensity={2.2} distance={4} />
    </group>
  );
}

type MarcadorProps = {
  posicao: [number, number, number];
  visivel: boolean;
  /** Cor do marcador; dourado (conversa de NPC) por padrão, azul pros minigames. */
  cor?: string;
};

/** Marcador "!" flutuando sobre quem ainda tem conversa ou brincadeira pendente. */
export function Marcador({
  posicao,
  visivel,
  cor = acento.dourado,
}: MarcadorProps) {
  const menosMovimento = usePrefereMenosMovimento();
  const ref = useRef<THREE.Group>(null);
  const tempoRef = useRef(0);
  useFrame((_, delta) => {
    tempoRef.current += delta;
    if (!ref.current) return;
    const t = tempoRef.current;
    ref.current.position.y =
      posicao[1] + (menosMovimento ? 0 : Math.sin(t * 3) * 0.12);
    ref.current.rotation.y = menosMovimento ? 0 : t * 0.8;
  });
  if (!visivel) return null;
  const rampa = rampaToon(3);
  return (
    <group ref={ref} position={posicao}>
      <mesh position={[0, 0.18, 0]}>
        <boxGeometry args={[0.12, 0.36, 0.12]} />
        <meshToonMaterial
          color={cor}
          emissive={cor}
          emissiveIntensity={0.9}
          gradientMap={rampa}
        />
      </mesh>
      <mesh position={[0, -0.14, 0]}>
        <boxGeometry args={[0.12, 0.12, 0.12]} />
        <meshToonMaterial
          color={cor}
          emissive={cor}
          emissiveIntensity={0.9}
          gradientMap={rampa}
        />
      </mesh>
    </group>
  );
}
