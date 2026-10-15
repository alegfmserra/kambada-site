"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePrefereMenosMovimento } from "@/lib/play/movimento";
import { rampaToon } from "@/lib/play/toon";
import { PALETA } from "./mundo/modelos/_compartilhado";
import { Personagem } from "./mundo/Personagem";
import {
  PASSEANTES,
  QUADRILHA,
  TAMBOR_DE_CRIOULA,
  TRIO_FORRO,
} from "./mundo/layout";

const N_DANCARINOS = 8;
const RAIO_RODA = 1.9;
const CENTRO_QUADRILHA: [number, number] = QUADRILHA;
const CICLO_QUADRILHA = 8; // segundos por volta completa da roda

const CENTRO_PALCO: [number, number] = TRIO_FORRO.pos;
// O trio toca em cima do coreto, virado pra praça (rotação do próprio coreto).
const ROTACAO_PALCO = TRIO_FORRO.rotY;

/**
 * Círculos de colisão dos figurantes: a roda da quadrilha e o coreto do trio,
 * pra somar aos colisores existentes da praça.
 */
export const COLISORES_FIGURANTES: { x: number; z: number; r: number }[] = [
  { x: CENTRO_QUADRILHA[0], z: CENTRO_QUADRILHA[1], r: 2.3 },
  { x: CENTRO_PALCO[0], z: CENTRO_PALCO[1], r: 1.6 },
];

/**
 * Quadrilha: três pares (quadrilheiro e quadrilheira) girando numa roda em
 * loop determinístico de 8 segundos, cada boneco com passo de dança próprio
 * e defasado. Com `prefers-reduced-motion`, os pares ficam parados na pose
 * de repouso da roda.
 */
export function Quadrilha() {
  const menosMovimento = usePrefereMenosMovimento();
  const dancarinos = useRef<(THREE.Group | null)[]>([]);

  const dados = useMemo(
    () =>
      Array.from({ length: N_DANCARINOS }, (_, i) => ({
        fase: (i / N_DANCARINOS) * Math.PI * 2,
        traje: (i % 2 === 0 ? "quadrilheiro" : "quadrilheira") as
          "quadrilheiro" | "quadrilheira",
        variante: Math.floor(i / 2),
      })),
    [],
  );

  const tempoRef = useRef(0);
  useFrame((_, delta) => {
    tempoRef.current += delta;
    const t = tempoRef.current;
    dados.forEach((d, i) => {
      const dancarino = dancarinos.current[i];
      if (!dancarino) return;
      const angulo = menosMovimento
        ? d.fase
        : d.fase + (t / CICLO_QUADRILHA) * Math.PI * 2;
      // Balanceio: o par se aproxima e afasta do centro da roda ao girar.
      const balanceio = menosMovimento ? 0 : Math.sin(t * 1.5 + d.fase) * 0.15;
      const raio = RAIO_RODA + balanceio;
      dancarino.position.set(
        Math.cos(angulo) * raio,
        0,
        Math.sin(angulo) * raio,
      );
      dancarino.rotation.y = -angulo;
    });
  });

  return (
    <group
      position={[CENTRO_QUADRILHA[0], 0, CENTRO_QUADRILHA[1]]}
      name="quadrilha"
    >
      {dados.map((d, i) => (
        <group
          key={i}
          ref={(el) => {
            dancarinos.current[i] = el;
          }}
        >
          <Personagem
            traje={d.traje}
            variante={d.variante}
            modo="dancando"
            fase={i * 0.13}
          />
        </group>
      ))}
    </group>
  );
}

/**
 * Trio de forró em cima do coreto: sanfoneiro, zabumbeiro e triângulo, cada
 * um tocando o próprio instrumento (fole, baqueta, pulso) com ciclo defasado.
 * Com `prefers-reduced-motion`, o trio fica parado com os instrumentos na mão.
 */
export function TrioForro() {
  return (
    <group
      position={[CENTRO_PALCO[0], TRIO_FORRO.y, CENTRO_PALCO[1]]}
      rotation={[0, ROTACAO_PALCO, 0]}
      name="trio-forro"
    >
      <Personagem
        traje="sanfoneiro"
        variante={1}
        modo="tocando"
        posicao={[-0.85, 0, 0.1]}
        rotacaoY={0.25}
        sombra={false}
      />
      <Personagem
        traje="zabumbeiro"
        variante={2}
        modo="tocando"
        fase={0.4}
        posicao={[0, 0, 0.15]}
        sombra={false}
      />
      <Personagem
        traje="triangulo"
        variante={0}
        modo="tocando"
        fase={0.8}
        posicao={[0.85, 0, 0.1]}
        rotacaoY={-0.25}
        sombra={false}
      />
    </group>
  );
}

const N_COREIRAS = 6;
const RAIO_TAMBOR = 2.0;
const CENTRO_TAMBOR: [number, number] = TAMBOR_DE_CRIOULA;
const CICLO_TAMBOR = 6; // segundos por volta completa da roda

/** Círculo de colisão do tambor de crioula, pra somar aos colisores da praça. */
export const COLISOR_TAMBOR: { x: number; z: number; r: number } = {
  x: CENTRO_TAMBOR[0],
  z: CENTRO_TAMBOR[1],
  r: 2.2,
};

/**
 * Tambor de crioula: roda de coreiras de saia rodada girando em volta do
 * centro (giro individual da saia por cima do giro da roda) e dois tocadores
 * com o tambor alto entre as pernas. Patrimônio Cultural do Brasil pelo IPHAN
 * (https://bcr.iphan.gov.br/bens-culturais/tambor-de-crioula-do-maranhao/).
 * Com `prefers-reduced-motion`, a roda fica parada em pose.
 */
export function TamborDeCrioula() {
  const menosMovimento = usePrefereMenosMovimento();
  const rampa = rampaToon(3);
  const coreiras = useRef<(THREE.Group | null)[]>([]);
  const dados = useMemo(
    () =>
      Array.from({ length: N_COREIRAS }, (_, i) => ({
        fase: (i / N_COREIRAS) * Math.PI * 2,
        variante: i,
      })),
    [],
  );
  const tempoRef = useRef(0);
  useFrame((_, delta) => {
    tempoRef.current += delta;
    const t = tempoRef.current;
    dados.forEach((d, i) => {
      const c = coreiras.current[i];
      if (!c) return;
      const angulo = menosMovimento
        ? d.fase
        : d.fase + (t / CICLO_TAMBOR) * Math.PI * 2;
      c.position.set(
        Math.cos(angulo) * RAIO_TAMBOR,
        0,
        Math.sin(angulo) * RAIO_TAMBOR,
      );
      c.rotation.y = -angulo + Math.PI / 2;
    });
  });

  return (
    <group
      position={[CENTRO_TAMBOR[0], 0, CENTRO_TAMBOR[1]]}
      name="tambor-de-crioula"
    >
      {/* Tambor grande no centro da roda: a âncora visual do grupo a 25 m */}
      <group rotation={[0.12, 0.4, 0]}>
        <mesh position={[0, 0.42, 0]}>
          <cylinderGeometry args={[0.22, 0.19, 0.84, 14]} />
          <meshToonMaterial color={PALETA.madeira} gradientMap={rampa} />
        </mesh>
        <mesh position={[0, 0.85, 0]} userData={{ semContorno: true }}>
          <cylinderGeometry args={[0.23, 0.23, 0.05, 14]} />
          <meshToonMaterial color={PALETA.creme} gradientMap={rampa} />
        </mesh>
        <mesh position={[0, 0.7, 0]} userData={{ semContorno: true }}>
          <torusGeometry args={[0.225, 0.02, 6, 16]} />
          <meshToonMaterial color={PALETA.amarelo} gradientMap={rampa} />
        </mesh>
      </group>
      {dados.map((d, i) => (
        <group
          key={i}
          ref={(el) => {
            coreiras.current[i] = el;
          }}
        >
          <Personagem
            traje="coreira"
            variante={d.variante}
            modo="coreira"
            fase={i * 0.3}
          />
        </group>
      ))}
      {/* Dois tocadores nas bordas da roda, de frente pro centro */}
      {[0, Math.PI].map((angulo, i) => (
        <Personagem
          key={angulo}
          traje="tocador-tambor"
          variante={i + 1}
          modo="tocando"
          fase={i * 0.45}
          posicao={[
            Math.cos(angulo) * (RAIO_TAMBOR + 0.9),
            0,
            Math.sin(angulo) * (RAIO_TAMBOR + 0.9),
          ]}
          rotacaoY={-angulo - Math.PI / 2}
        />
      ))}
    </group>
  );
}

const POSICAO_AQUECEDOR: [number, number] = [-2.2, 3.0];
// Vira o brincante pra fogueira (centro).
const ROTACAO_AQUECEDOR = Math.atan2(
  -POSICAO_AQUECEDOR[0],
  -POSICAO_AQUECEDOR[1],
);

/** Círculo de colisão do brincante do pandeirão, pra somar aos colisores da praça. */
export const COLISOR_AQUECEDOR: { x: number; z: number; r: number } = {
  x: POSICAO_AQUECEDOR[0],
  z: POSICAO_AQUECEDOR[1],
  r: 0.7,
};

/**
 * Brincante esquentando o pandeirão perto da fogueira: o couro do pandeirão
 * é afinado no calor antes da brincadeira (prática do boi de matraca de São
 * Luís). Fica de frente pro fogo, batendo no couro de leve.
 */
export function Aquecedor() {
  return (
    <Personagem
      traje="aquecedor"
      variante={2}
      modo="tocando"
      posicao={[POSICAO_AQUECEDOR[0], 0, POSICAO_AQUECEDOR[1]]}
      rotacaoY={ROTACAO_AQUECEDOR}
    />
  );
}

/**
 * Passeantes: brincantes parados em anel ao redor da fogueira e entre as
 * barracas, cada um com fase própria de idle, pra praça ler cheia.
 */
export function Passeantes() {
  return (
    <group name="passeantes">
      {PASSEANTES.map((p, i) => (
        <Personagem
          key={i}
          traje={p.traje}
          variante={p.variante}
          posicao={[p.pos[0], 0, p.pos[1]]}
          rotacaoY={p.rotY}
          fase={i * 0.61}
        />
      ))}
    </group>
  );
}
