"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { acento, ceuArraial } from "@/lib/play/cores";

const CEU_VERTEX = /* glsl */ `
  varying vec3 vPos;
  void main() {
    vPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const CEU_FRAGMENT = /* glsl */ `
  uniform vec3 corZenite;
  uniform vec3 corHorizonte;
  varying vec3 vPos;
  void main() {
    float altura = clamp(normalize(vPos).y * 0.5 + 0.5, 0.0, 1.0);
    // Dither de 1/255 quebra o banding do gradiente em telas de 8 bits.
    float ruido = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453) / 255.0;
    gl_FragColor = vec4(mix(corHorizonte, corZenite, altura) + ruido, 1.0);
  }
`;

const POCA_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const POCA_FRAGMENT = /* glsl */ `
  uniform vec3 cor;
  uniform float intensidade;
  varying vec2 vUv;
  void main() {
    float d = distance(vUv, vec2(0.5));
    float alfa = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(cor * intensidade, alfa * alfa);
  }
`;

type PocaDeLuzProps = {
  posicao?: [number, number, number];
  raio?: number;
  cor?: string;
  intensidade?: number;
};

/**
 * Poça de luz fake no chão sob fontes emissivas (lampiões, barracas): disco
 * com gradiente radial aditivo, mesma família de truque do anel da fogueira.
 * Devolve leitura de espaço na borda escura da praça por quase zero custo,
 * sem somar pointLight ao orçamento de duas luzes reais.
 */
export function PocaDeLuz({
  posicao = [0, 0.02, 0],
  raio = 1.3,
  cor = acento.dourado,
  intensidade = 0.5,
}: PocaDeLuzProps) {
  const uniforms = useMemo(
    () => ({
      cor: { value: new THREE.Color(cor) },
      intensidade: { value: intensidade },
    }),
    [cor, intensidade]
  );
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={posicao} userData={{ semContorno: true }}>
      <circleGeometry args={[raio, 24]} />
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        uniforms={uniforms}
        vertexShader={POCA_VERTEX}
        fragmentShader={POCA_FRAGMENT}
      />
    </mesh>
  );
}

/**
 * Céu em gradiente vertical: zênite na cor da noite, horizonte um pouco mais
 * claro. Esfera grande com faces viradas pra dentro; não escreve profundidade
 * (renderOrder baixo) pra Stars e o resto da cena sempre desenharem por cima,
 * sem depender da ordem de distância real em relação à câmera.
 */
export function Ceu() {
  const uniforms = useMemo(
    () => ({
      corZenite: { value: new THREE.Color(ceuArraial.zenite) },
      corHorizonte: { value: new THREE.Color(ceuArraial.horizonte) },
    }),
    []
  );
  return (
    <mesh renderOrder={-1}>
      <sphereGeometry args={[60, 24, 16]} />
      <shaderMaterial
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
        uniforms={uniforms}
        vertexShader={CEU_VERTEX}
        fragmentShader={CEU_FRAGMENT}
      />
    </mesh>
  );
}
