"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { rampaToon } from "@/lib/play/toon";
import { hashDeterministico } from "@/lib/play/hash";
import { fbm, ruido2 } from "./ruido";
import { CAMINHO, RAIO_CLAREIRA, RAIO_PAVIMENTO, RAIO_TERRA, TAMBOR_DE_CRIOULA } from "./layout";

/** Cores do chão (referências-analise.md, seção A). */
const COR = {
  gramaLuz: new THREE.Color("#8DBB4E"),
  gramaMeia: new THREE.Color("#5C8E3A"),
  gramaSombra: new THREE.Color("#345A2C"),
  terra: new THREE.Color("#B8743C"),
  terraEscura: new THREE.Color("#8E5630"),
  laje: new THREE.Color("#A08F78"),
  lajeClara: new THREE.Color("#B8A68C"),
  lajeEscura: new THREE.Color("#7E6E5A"),
};

const TAMANHO = 150;
const SEGMENTOS = 110;

/** Amostras do caminho pra medir distância ponto-curva sem alocar por vértice. */
const AMOSTRAS_CAMINHO = CAMINHO.getSpacedPoints(48);

function distanciaAoCaminho(x: number, z: number): number {
  let menor = Infinity;
  for (const p of AMOSTRAS_CAMINHO) {
    const d = (p.x - x) * (p.x - x) + (p.z - z) * (p.z - z);
    if (d < menor) menor = d;
  }
  return Math.sqrt(menor);
}

/**
 * Altura do terreno: plano dentro da clareira, subindo suave com ondulação
 * a partir da borda da floresta (o relevo some atrás das árvores e garante
 * que nenhum horizonte plano apareça entre os troncos).
 */
export function alturaTerreno(x: number, z: number): number {
  const r = Math.hypot(x, z);
  // Plano na clareira; fora dela só uma ondulação suave (sem morro, pra a
  // linha das copas distantes ficar baixa e o céu entrar no quadro).
  const borda = THREE.MathUtils.smoothstep(r, RAIO_CLAREIRA - 1.5, RAIO_CLAREIRA + 10);
  const ondulacao = (fbm(x * 0.09, z * 0.09) - 0.5) * 2;
  return borda * (0.4 + ondulacao * 0.7);
}

function corDoChao(x: number, z: number, alvo: THREE.Color): void {
  const r = Math.hypot(x, z);
  const n = fbm(x * 0.35 + 3, z * 0.35 + 9);
  // Grama: mais iluminada perto da fogueira e das lanternas, escura na borda da floresta.
  const luz = 1 - THREE.MathUtils.smoothstep(r, 4, RAIO_CLAREIRA + 2);
  alvo.copy(COR.gramaSombra).lerp(COR.gramaMeia, Math.min(1, luz * 1.3));
  alvo.lerp(COR.gramaLuz, Math.max(0, luz - 0.35) * 0.9 * (0.6 + n * 0.6));
  // Manchas de variação pra não ler como cor chapada.
  alvo.offsetHSL(0, (n - 0.5) * 0.08, (n - 0.5) * 0.06);

  // Terra batida da praça (com borda irregular) e do caminho.
  const bordaTerra = RAIO_TERRA + (n - 0.5) * 1.6;
  const mistTerra = 1 - THREE.MathUtils.smoothstep(r, bordaTerra - 0.9, bordaTerra + 0.4);
  const dCaminho = distanciaAoCaminho(x, z);
  // Borda do caminho mais definida (~0,3 m de transição) e um pouco mais estreito.
  const largura = 1.4 + (ruido2(x * 0.5, z * 0.5) - 0.5) * 0.5;
  const mistCaminho = 1 - THREE.MathUtils.smoothstep(dCaminho, largura - 0.15, largura + 0.15);
  // Roda do tambor de crioula: disco de terra batida próprio (~3,6 m), que ancora o grupo.
  const dTambor = Math.hypot(x - TAMBOR_DE_CRIOULA[0], z - TAMBOR_DE_CRIOULA[1]);
  const mistTambor = 1 - THREE.MathUtils.smoothstep(dTambor, 3.2 + (n - 0.5) * 0.6, 3.9 + (n - 0.5) * 0.6);
  const terra = Math.max(mistTerra, mistCaminho, mistTambor);
  if (terra > 0) {
    const corTerra = COR.terra.clone().lerp(COR.terraEscura, 0.25 + (n - 0.5) * 0.5);
    // A terra perto da fogueira fica mais quente/clara.
    corTerra.lerp(COR.terra, luz * 0.4);
    alvo.lerp(corTerra, terra);
  }
}

/**
 * Chão contínuo da clareira: um único plano grande com relevo suave fora da
 * clareira e cores por vértice (grama, terra da praça, caminho de terra que
 * entra pelo primeiro plano). Sem borda nem face inferior visível: o plano
 * vai até bem além do alcance da câmera e a floresta fecha o horizonte.
 */
export function Chao() {
  const geometria = useMemo(() => {
    const g = new THREE.PlaneGeometry(TAMANHO, TAMANHO, SEGMENTOS, SEGMENTOS);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    const cores = new Float32Array(pos.count * 3);
    const cor = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, alturaTerreno(x, z));
      corDoChao(x, z, cor);
      cores[i * 3] = cor.r;
      cores[i * 3 + 1] = cor.g;
      cores[i * 3 + 2] = cor.b;
    }
    g.setAttribute("color", new THREE.BufferAttribute(cores, 3));
    g.computeVertexNormals();
    return g;
  }, []);

  useEffect(() => () => geometria.dispose(), [geometria]);

  return (
    <mesh geometry={geometria} userData={{ semContorno: true }} name="chao">
      <meshToonMaterial vertexColors gradientMap={rampaToon(3)} />
    </mesh>
  );
}

/**
 * Pavimentação em anéis de lajes de pedra arredondadas ao redor da fogueira
 * (uma InstancedMesh, cor por instância), como na referência. A terra entre
 * as lajes faz as juntas.
 */
export function Pavimento() {
  const aneis = useMemo(() => {
    const lista: { x: number; z: number; rot: number; escala: number; cor: THREE.Color }[] = [];
    // Cinco anéis encostados (o primeiro abraça o anel de pedras da fogueira),
    // com lajes largas e junta fina: lajota assentada, e não pedra solta.
    const raios = [1.55, 2.3, 3.05, 3.78, 4.5, 5.1, RAIO_PAVIMENTO];
    raios.forEach((raio, ai) => {
      const n = Math.round(raio * 7.6);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + ai * 0.21;
        const h = hashDeterministico(ai * 100 + i);
        const cor = COR.laje.clone().lerp(h > 0.5 ? COR.lajeClara : COR.lajeEscura, Math.abs(h - 0.5) * 1.4);
        lista.push({
          x: Math.cos(a) * raio + (h - 0.5) * 0.03,
          z: Math.sin(a) * raio + (hashDeterministico(i * 7 + ai) - 0.5) * 0.03,
          rot: a + Math.PI / 2 + (h - 0.5) * 0.03,
          escala: 0.96 + h * 0.08,
          cor,
        });
      }
    });
    return lista;
  }, []);

  const geometria = useMemo(() => new RoundedBoxGeometry(0.8, 0.16, 0.7, 2, 0.05), []);
  useEffect(() => () => geometria.dispose(), [geometria]);

  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  useEffect(() => {
    const malha = ref.current;
    if (!malha) return;
    aneis.forEach((l, i) => {
      dummy.position.set(l.x, 0.05, l.z);
      dummy.rotation.set(0, l.rot, 0);
      dummy.scale.set(l.escala, 1, l.escala);
      dummy.updateMatrix();
      malha.setMatrixAt(i, dummy.matrix);
      malha.setColorAt(i, l.cor);
    });
    malha.instanceMatrix.needsUpdate = true;
    if (malha.instanceColor) malha.instanceColor.needsUpdate = true;
  }, [aneis, dummy]);

  return (
    <group name="pavimento">
      {/* Terra batida escura sob as lajes, pra as juntas lerem como sombra. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} userData={{ semContorno: true }}>
        <circleGeometry args={[RAIO_PAVIMENTO + 0.4, 48]} />
        <meshToonMaterial color="#5E4A3A" gradientMap={rampaToon(3)} />
      </mesh>
      <instancedMesh
        ref={ref}
        args={[geometria, undefined, aneis.length]}
        userData={{ semContorno: true }}
      >
        <meshToonMaterial gradientMap={rampaToon(3)} />
      </instancedMesh>
    </group>
  );
}
