"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { rampaToon } from "@/lib/play/toon";
import { hashDeterministico } from "@/lib/play/hash";
import { usePrefereMenosMovimento } from "@/lib/play/movimento";
import { useQualidade } from "../Qualidade";
import { alturaTerreno } from "./Terreno";
import { BARRACAS, CAMINHO, CAPELA, CORETO, RAIO_CLAREIRA } from "./layout";

const COR = {
  tronco: new THREE.Color("#5A3A1E"),
  troncoClaro: new THREE.Color("#7A5230"),
  copaEscura: new THREE.Color("#1F3D1F"),
  copaMeia: new THREE.Color("#2F5F2C"),
  copaClara: new THREE.Color("#5FA34A"),
  copaLonge: new THREE.Color("#3A5A6A"),
  palmaTronco: new THREE.Color("#8A6238"),
  palmaFolha: new THREE.Color("#3E8A3C"),
  arbusto: new THREE.Color("#35702F"),
  arbustoClaro: new THREE.Color("#5C9A3E"),
  pedra: new THREE.Color("#7E7266"),
  pedraEscura: new THREE.Color("#5A4F46"),
  flores: ["#F2A7C4", "#FFF1B8", "#F6D35B", "#F0F0F0", "#E56E8C"].map(
    (c) => new THREE.Color(c),
  ),
};

const AMOSTRAS_CAMINHO = CAMINHO.getSpacedPoints(60);
function distanciaAoCaminho(x: number, z: number): number {
  let menor = Infinity;
  for (const p of AMOSTRAS_CAMINHO) {
    const d = (p.x - x) ** 2 + (p.z - z) ** 2;
    if (d < menor) menor = d;
  }
  return Math.sqrt(menor);
}

/** Pontos que a vegetação não pode invadir dentro da clareira. */
const OBSTACULOS: { x: number; z: number; r: number }[] = [
  { x: CAPELA.pos[0], z: CAPELA.pos[1], r: 4.2 },
  { x: CORETO.pos[0], z: CORETO.pos[1], r: 3.6 },
  ...BARRACAS.map((b) => ({ x: b.pos[0], z: b.pos[1], r: 2.2 })),
];

function livre(x: number, z: number, margem = 0): boolean {
  for (const o of OBSTACULOS)
    if (Math.hypot(x - o.x, z - o.z) < o.r + margem) return false;
  return distanciaAoCaminho(x, z) > 2.4 + margem;
}

/** Primeiro plano da câmera (entre o jogador e a lente): fica limpo de volumes altos. */
function primeiroPlano(x: number, z: number): boolean {
  return z > 6.5 && Math.abs(x) < 9;
}

/** Corredor da câmera na entrada: o primeiro anel de árvores não invade o rodapé do quadro. */
function corredorDaCamera(x: number, z: number): boolean {
  return z > 10.5 && Math.abs(x) < 6.5;
}

type Instancia = {
  x: number;
  y: number;
  z: number;
  rot: number;
  escala: number;
  cor: THREE.Color;
  fase: number;
};

/** Sorteio determinístico de posições em anel, com rejeição por obstáculos. */
function semear(
  semente: number,
  quantidade: number,
  rMin: number,
  rMax: number,
  escala: [number, number],
  cor: (h: number, r: number) => THREE.Color,
  margem = 0,
): Instancia[] {
  const lista: Instancia[] = [];
  let tentativa = 0;
  while (lista.length < quantidade && tentativa < quantidade * 12) {
    const i = semente * 1000 + tentativa++;
    const a = hashDeterministico(i * 3) * Math.PI * 2;
    const r = rMin + Math.sqrt(hashDeterministico(i * 3 + 1)) * (rMax - rMin);
    const x = Math.cos(a) * r;
    const z = Math.sin(a) * r;
    if (!livre(x, z, margem)) continue;
    const h = hashDeterministico(i * 3 + 2);
    lista.push({
      x,
      z,
      y: alturaTerreno(x, z),
      rot: h * Math.PI * 2,
      escala: escala[0] + h * (escala[1] - escala[0]),
      cor: cor(h, r),
      fase: hashDeterministico(i * 5) * Math.PI * 2,
    });
  }
  return lista;
}

/** Sway discreto das copas via vertex shader (uniforme de tempo, sem reescrever matrizes). */
function materialComVento(cor?: string): {
  material: THREE.MeshToonMaterial;
  tempo: { value: number };
} {
  const tempo = { value: 0 };
  const material = new THREE.MeshToonMaterial({
    color: cor ?? "#ffffff",
    gradientMap: rampaToon(3),
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTempo = tempo;
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTempo;")
      .replace(
        "#include <begin_vertex>",
        `#include <begin_vertex>
        #ifdef USE_INSTANCING
          vec3 origem = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
          float alturaRel = clamp(position.y, 0.0, 4.0) / 4.0;
          float onda = sin(uTempo * 0.9 + origem.x * 0.45 + origem.z * 0.31);
          transformed.x += onda * 0.07 * alturaRel;
          transformed.z += cos(uTempo * 0.7 + origem.z * 0.5) * 0.05 * alturaRel;
        #endif`,
      );
  };
  return { material, tempo };
}

function Instancias({
  lista,
  geometria,
  material,
  alturaBase = 0,
  deitar = false,
}: {
  lista: Instancia[];
  geometria: THREE.BufferGeometry;
  material: THREE.Material;
  alturaBase?: number;
  deitar?: boolean;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    lista.forEach((l, i) => {
      dummy.position.set(l.x, l.y + alturaBase * l.escala, l.z);
      dummy.rotation.set(
        deitar ? (l.fase - 3) * 0.15 : 0,
        l.rot,
        deitar ? (l.fase - 3) * 0.1 : 0,
      );
      dummy.scale.setScalar(l.escala);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, l.cor);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [lista, dummy, alturaBase, deitar]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometria, material, lista.length]}
      userData={{ semContorno: true }}
      frustumCulled
    />
  );
}

/**
 * Floresta que fecha a clareira em profundidade: três anéis de árvores
 * redondas (tronco + três massas de copa facetadas), palmeiras perto da
 * capela e nas bordas, arbustos na transição grama/floresta, pedras e
 * touceiras de flores junto ao caminho e às barracas. Tudo instanciado com
 * variação determinística; o anel mais distante é menor em detalhe e mais
 * azulado (profundidade atmosférica), e as copas balançam por shader.
 */
export function Floresta({
  parte = "tudo",
}: {
  parte?: "arvores" | "rasteira" | "tudo";
}) {
  const nivel = useQualidade();
  const comArvores = parte !== "rasteira";
  const comRasteira = parte !== "arvores";
  const menosMovimento = usePrefereMenosMovimento();

  const corCopa = (h: number, r: number) => {
    const c = COR.copaEscura.clone().lerp(COR.copaMeia, h);
    c.lerp(COR.copaClara, Math.max(0, h - 0.6) * 0.8);
    const longe = THREE.MathUtils.smoothstep(
      r,
      RAIO_CLAREIRA + 6,
      RAIO_CLAREIRA + 24,
    );
    return c.lerp(COR.copaLonge, longe * 0.55);
  };

  const anel1 = useMemo(
    () =>
      semear(
        1,
        64,
        RAIO_CLAREIRA - 0.5,
        RAIO_CLAREIRA + 5,
        [0.85, 1.25],
        corCopa,
        1.2,
      ).filter((a) => !corredorDaCamera(a.x, a.z)),
    [],
  );
  const anel2 = useMemo(
    () =>
      semear(2, 90, RAIO_CLAREIRA + 4, RAIO_CLAREIRA + 14, [1.0, 1.4], corCopa),
    [],
  );
  const anel3 = useMemo(
    () =>
      semear(
        3,
        nivel === "baixa" ? 40 : 110,
        RAIO_CLAREIRA + 13,
        RAIO_CLAREIRA + 30,
        [1.5, 2.4],
        corCopa,
      ),
    [nivel],
  );
  const arvores = useMemo(
    () => [...anel1, ...anel2, ...anel3],
    [anel1, anel2, anel3],
  );

  const palmeiras = useMemo(() => {
    const fixas: Instancia[] = [
      [-2.6, -11.2],
      [3.8, -10.6],
      [-10.4, -6.2],
      [10.8, -5.4],
      [9.6, 8.2],
      [-12.2, 2.4],
    ].map(([x, z], i) => ({
      x,
      z,
      y: alturaTerreno(x, z),
      rot: hashDeterministico(i + 40) * Math.PI * 2,
      escala: 0.9 + hashDeterministico(i + 50) * 0.35,
      cor: COR.palmaFolha
        .clone()
        .offsetHSL(0, 0, (hashDeterministico(i + 60) - 0.5) * 0.1),
      fase: i,
    }));
    return fixas;
  }, []);

  const arbustos = useMemo(
    () =>
      semear(
        4,
        60,
        RAIO_CLAREIRA - 3.2,
        RAIO_CLAREIRA + 1.5,
        [0.5, 1.1],
        (h) => COR.arbusto.clone().lerp(COR.arbustoClaro, h * 0.8),
        0.4,
      ).filter((a) => !primeiroPlano(a.x, a.z)),
    [],
  );
  const arbustosPraca = useMemo(
    () =>
      semear(
        5,
        18,
        7.2,
        11.5,
        [0.35, 0.7],
        (h) => COR.arbusto.clone().lerp(COR.arbustoClaro, h),
        0.6,
      ).filter((a) => !primeiroPlano(a.x, a.z)),
    [],
  );
  const pedras = useMemo(
    () =>
      semear(
        6,
        40,
        6.8,
        RAIO_CLAREIRA - 1,
        [0.25, 0.75],
        (h) => COR.pedra.clone().lerp(COR.pedraEscura, h * 0.7),
        0.5,
      ).filter((p) => !primeiroPlano(p.x, p.z) || p.escala < 0.45),
    [],
  );
  const flores = useMemo(() => {
    // Touceiras: núcleos perto de pedras e do caminho, cada uma com 5 a 8 flores.
    const nucleos = semear(
      7,
      22,
      6.5,
      RAIO_CLAREIRA - 0.5,
      [1, 1],
      (h) => COR.flores[Math.floor(h * COR.flores.length)],
      0.2,
    );
    const lista: Instancia[] = [];
    nucleos.forEach((n, i) => {
      const qtd = 5 + Math.floor(hashDeterministico(i + 900) * 4);
      for (let k = 0; k < qtd; k++) {
        const a = hashDeterministico(i * 31 + k) * Math.PI * 2;
        const d = hashDeterministico(i * 37 + k) * 0.55;
        const x = n.x + Math.cos(a) * d;
        const z = n.z + Math.sin(a) * d;
        lista.push({
          x,
          z,
          y: alturaTerreno(x, z),
          rot: a,
          escala: 0.7 + hashDeterministico(i * 41 + k) * 0.6,
          cor: COR.flores[(i + k) % COR.flores.length],
          fase: k,
        });
      }
    });
    return lista;
  }, []);

  // Geometrias compartilhadas (uma por família).
  const geo = useMemo(
    () => ({
      tronco: new THREE.CylinderGeometry(0.16, 0.26, 2.4, 7),
      copaGrande: new THREE.IcosahedronGeometry(1.35, 1),
      copaMedia: new THREE.IcosahedronGeometry(1.0, 1),
      copaTopo: new THREE.IcosahedronGeometry(0.75, 1),
      palmaTronco: new THREE.CylinderGeometry(0.14, 0.24, 5.2, 7),
      palmaFolha: (() => {
        const g = new THREE.PlaneGeometry(0.7, 2.6, 2, 6);
        const p = g.attributes.position as THREE.BufferAttribute;
        for (let i = 0; i < p.count; i++) {
          const y = p.getY(i) + 1.3; // 0 (base) .. 2.6 (ponta)
          const t = y / 2.6;
          const x = p.getX(i);
          // Arqueia pra baixo ao longo do comprimento e dobra nas bordas (nervura central).
          p.setZ(i, -t * t * 1.3 - Math.abs(x) * (0.35 + t * 0.5));
          p.setX(i, x * (1 - t * 0.6));
        }
        g.computeVertexNormals();
        return g;
      })(),
      arbusto: new THREE.IcosahedronGeometry(0.8, 1),
      pedra: new THREE.DodecahedronGeometry(0.6, 0),
      flor: new THREE.SphereGeometry(0.055, 6, 5),
      haste: new THREE.CylinderGeometry(0.01, 0.014, 0.2, 4),
    }),
    [],
  );
  useEffect(() => () => Object.values(geo).forEach((g) => g.dispose()), [geo]);

  const copa = useMemo(() => materialComVento(), []);
  const folhaPalma = useMemo(() => {
    const r = materialComVento();
    r.material.side = THREE.DoubleSide;
    return r;
  }, []);
  const materiais = useMemo(
    () => ({
      tronco: new THREE.MeshToonMaterial({
        color: COR.tronco,
        gradientMap: rampaToon(3),
      }),
      palmaTronco: new THREE.MeshToonMaterial({
        color: COR.palmaTronco,
        gradientMap: rampaToon(3),
      }),
      arbusto: new THREE.MeshToonMaterial({ gradientMap: rampaToon(3) }),
      pedra: new THREE.MeshToonMaterial({ gradientMap: rampaToon(3) }),
      flor: new THREE.MeshToonMaterial({ gradientMap: rampaToon(3) }),
      haste: new THREE.MeshToonMaterial({
        color: "#3F6B2E",
        gradientMap: rampaToon(3),
      }),
    }),
    [],
  );
  useEffect(
    () => () => {
      Object.values(materiais).forEach((m) => m.dispose());
      copa.material.dispose();
      folhaPalma.material.dispose();
    },
    [materiais, copa, folhaPalma],
  );

  // Uniformes de tempo guardados num ref: o useFrame só toca em ref.current.
  const uniformes = useRef({ t: 0, copa: copa.tempo, palma: folhaPalma.tempo });
  useFrame((_, delta) => {
    if (menosMovimento) return;
    const u = uniformes.current;
    u.t += delta;
    u.copa.value = u.t;
    u.palma.value = u.t;
  });

  // Copas: mesma lista de instâncias com deslocamentos diferentes por massa.
  const troncos = arvores;
  const copaGrande = useMemo(
    () => arvores.map((a) => ({ ...a, cor: a.cor })),
    [arvores],
  );
  const copaMedia = useMemo(
    () =>
      arvores.map((a, i) => ({
        ...a,
        x: a.x + Math.cos(a.rot) * 0.55 * a.escala,
        z: a.z + Math.sin(a.rot) * 0.55 * a.escala,
        escala: a.escala * 0.95,
        cor: a.cor
          .clone()
          .offsetHSL(
            0,
            0.02,
            0.03 + (hashDeterministico(i + 300) - 0.5) * 0.04,
          ),
      })),
    [arvores],
  );
  const copaTopo = useMemo(
    () =>
      arvores.map((a, i) => ({
        ...a,
        x: a.x - Math.cos(a.rot + 1.2) * 0.35 * a.escala,
        z: a.z - Math.sin(a.rot + 1.2) * 0.35 * a.escala,
        escala: a.escala,
        cor: a.cor
          .clone()
          .offsetHSL(
            0,
            0.03,
            0.07 + (hashDeterministico(i + 400) - 0.5) * 0.04,
          ),
      })),
    [arvores],
  );

  // Folhas das palmeiras: 8 por palmeira, em leque, saindo do topo do tronco.
  const folhas = useMemo(() => {
    const lista: Instancia[] = [];
    palmeiras.forEach((p, i) => {
      for (let k = 0; k < 8; k++) {
        lista.push({
          ...p,
          y: p.y + 5.0 * p.escala,
          rot: (k / 8) * Math.PI * 2 + hashDeterministico(i * 9 + k) * 0.4,
          fase: k,
          cor: p.cor
            .clone()
            .offsetHSL(0, 0, (hashDeterministico(i * 11 + k) - 0.5) * 0.08),
        });
      }
    });
    return lista;
  }, [palmeiras]);

  return (
    <group name={`floresta-${parte}`}>
      {comArvores && (
        <>
          <Instancias
            lista={troncos}
            geometria={geo.tronco}
            material={materiais.tronco}
            alturaBase={1.1}
          />
          <Instancias
            lista={copaGrande}
            geometria={geo.copaGrande}
            material={copa.material}
            alturaBase={2.9}
          />
          <Instancias
            lista={copaMedia}
            geometria={geo.copaMedia}
            material={copa.material}
            alturaBase={3.6}
          />
          <Instancias
            lista={copaTopo}
            geometria={geo.copaTopo}
            material={copa.material}
            alturaBase={4.3}
          />
        </>
      )}
      {comRasteira && (
        <>
          <Instancias
            lista={palmeiras}
            geometria={geo.palmaTronco}
            material={materiais.palmaTronco}
            alturaBase={2.6}
          />
          <FolhasDePalmeira
            lista={folhas}
            geometria={geo.palmaFolha}
            material={folhaPalma.material}
          />
          <Instancias
            lista={[...arbustos, ...arbustosPraca]}
            geometria={geo.arbusto}
            material={materiais.arbusto}
            alturaBase={0.45}
          />
          <Instancias
            lista={pedras}
            geometria={geo.pedra}
            material={materiais.pedra}
            alturaBase={0.28}
            deitar
          />
          <Instancias
            lista={flores}
            geometria={geo.flor}
            material={materiais.flor}
            alturaBase={0.2}
          />
          <Instancias
            lista={flores}
            geometria={geo.haste}
            material={materiais.haste}
            alturaBase={0.1}
          />
        </>
      )}
    </group>
  );
}

/** Folhas em leque: cada instância inclina pra fora a partir do topo do tronco. */
function FolhasDePalmeira({
  lista,
  geometria,
  material,
}: {
  lista: Instancia[];
  geometria: THREE.BufferGeometry;
  material: THREE.Material;
}) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    lista.forEach((l, i) => {
      dummy.position.set(l.x, l.y, l.z);
      // Plano deitado saindo do centro: gira em Y pra direção do leque e inclina pra fora/baixo.
      dummy.rotation.set(-Math.PI / 2 + 0.55, l.rot, 0, "YXZ");
      dummy.scale.setScalar(l.escala);
      dummy.updateMatrix();
      // Desloca a base da folha pra fora do tronco na direção do leque.
      dummy.position.set(
        l.x + Math.sin(l.rot) * 0.2,
        l.y,
        l.z + Math.cos(l.rot) * 0.2,
      );
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, l.cor);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [lista, dummy]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometria, material, lista.length]}
      userData={{ semContorno: true }}
    />
  );
}
