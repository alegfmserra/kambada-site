"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useContorno } from "../Contorno";
import { usePrefereMenosMovimento } from "@/lib/play/movimento";
import { descartar } from "./modelos/_compartilhado";

type ModeloProps = {
  /** Factory Three.js pura (ver modelos/*.ts). Deve ser estável entre renders (useCallback/useMemo). */
  criar: () => THREE.Group;
  /** Animação ambiental barata por frame, opcional. */
  animar?: (raiz: THREE.Group, t: number, opcoes: { menosMovimento: boolean }) => void;
  posicao?: [number, number, number];
  rotacaoY?: number;
  escala?: number;
  /** Nome do grupo raiz (alvo de clique e de debug). */
  nome?: string;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
};

/**
 * Monta um modelo procedural (factory Three.js) dentro do R3F: aplica o
 * contorno por inverted hull na montagem, roda a animação ambiental no
 * useFrame (pausada com prefers-reduced-motion, a menos que o modelo trate
 * a opção) e libera geometria/materiais no unmount.
 */
export function Modelo({
  criar,
  animar,
  posicao = [0, 0, 0],
  rotacaoY = 0,
  escala = 1,
  nome,
  onClick,
  onPointerOver,
  onPointerOut,
}: ModeloProps) {
  const raiz = useMemo(() => criar(), [criar]);
  const ref = useRef<THREE.Group>(null);
  const tempo = useRef(0);
  const menosMovimento = usePrefereMenosMovimento();
  useContorno(ref);

  useEffect(() => () => descartar(raiz), [raiz]);

  useFrame((_, delta) => {
    if (!animar) return;
    tempo.current += delta;
    animar(raiz, tempo.current, { menosMovimento });
  });

  return (
    <group
      ref={ref}
      name={nome}
      position={posicao}
      rotation={[0, rotacaoY, 0]}
      scale={escala}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    >
      <primitive object={raiz} />
    </group>
  );
}
