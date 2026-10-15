"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useContorno } from "../Contorno";
import { usePrefereMenosMovimento } from "@/lib/play/movimento";
import { SombraBlob } from "../Personagens";
import criarPersonagem, { animar, type ModoPersonagem, type Traje } from "./modelos/personagem";
import { descartar } from "./modelos/_compartilhado";

export type EstadoPersonagem = { modo: ModoPersonagem; velocidade: number };

type PersonagemProps = {
  traje: Traje;
  variante?: number;
  corPele?: string;
  altura?: number;
  /** Modo fixo (figurantes) ou ref lida por quadro (jogador). */
  modo?: ModoPersonagem;
  estadoRef?: React.MutableRefObject<EstadoPersonagem>;
  /** Deslocamento de fase pra figurantes não se moverem em uníssono. */
  fase?: number;
  posicao?: [number, number, number];
  rotacaoY?: number;
  escala?: number;
  sombra?: boolean;
};

/**
 * Personagem cartoon (factory Three.js pura) dentro do R3F: contorno na
 * montagem, animação por quadro (idle, andar, dançar, tocar) e liberação de
 * recursos no unmount. O corpo respeita prefers-reduced-motion (repouso).
 */
export function Personagem({
  traje,
  variante = 0,
  corPele,
  altura,
  modo = "parado",
  estadoRef,
  fase = 0,
  posicao = [0, 0, 0],
  rotacaoY = 0,
  escala = 1,
  sombra = true,
}: PersonagemProps) {
  const raiz = useMemo(() => criarPersonagem({ traje, variante, corPele, altura }), [traje, variante, corPele, altura]);
  const ref = useRef<THREE.Group>(null);
  const tempo = useRef(0);
  const menosMovimento = usePrefereMenosMovimento();
  useContorno(ref);
  useEffect(() => () => descartar(raiz), [raiz]);

  useFrame((_, delta) => {
    tempo.current += delta;
    const estado = estadoRef?.current;
    animar(raiz, tempo.current, {
      modo: estado?.modo ?? modo,
      velocidade: estado?.velocidade ?? 1,
      fase,
      menosMovimento,
    });
  });

  return (
    <group ref={ref} position={posicao} rotation={[0, rotacaoY, 0]} scale={escala}>
      {sombra && <SombraBlob raio={0.3 * escala} />}
      <primitive object={raiz} />
    </group>
  );
}
