"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { rampaToon } from "@/lib/play/toon";
import { hashDeterministico } from "@/lib/play/hash";
import { usePrefereMenosMovimento } from "@/lib/play/movimento";
import { useQualidade } from "../Qualidade";
import { useContorno } from "../Contorno";
import { PocaDeLuz } from "../Cenario";
import {
  BANCOS,
  PONTOS_NPC,
  BARRACAS,
  CAPELA,
  CERCAS,
  CORETO,
  POSTES_LANTERNA,
  QUADRILHA,
  TAMBOR_DE_CRIOULA,
  VARAIS,
} from "./layout";
import { PALETA, criarLanterna, descartar } from "./modelos/_compartilhado";

const CORES_BANDEIRA = [
  PALETA.vermelho,
  PALETA.amarelo,
  PALETA.verdeAgua,
  PALETA.creme,
  PALETA.azulClaro,
  "#7A5FA0",
];

/**
 * Postes de lanterna da borda da praça: poste de madeira com braço, lanterna
 * de latão com vidro emissivo (sem pointLight: o brilho vem do emissivo, do
 * bloom e da poça de luz no chão), como na referência.
 */
export function PostesDeLanterna() {
  const grupo = useRef<THREE.Group>(null);
  useContorno(grupo);
  const rampa = rampaToon(3);
  const menosMovimento = usePrefereMenosMovimento();
  const lanternas = useRef<THREE.Group[]>([]);
  const tempo = useRef(0);
  // A mesma lanterna de latão do coreto e das barracas, uma por poste.
  const lanternasModelo = useMemo(
    () =>
      POSTES_LANTERNA.map((_, i) => criarLanterna(`lanterna-poste-${i}`, 1.3)),
    [],
  );
  useEffect(
    () => () => lanternasModelo.forEach((l) => descartar(l)),
    [lanternasModelo],
  );

  useFrame((_, delta) => {
    tempo.current += delta;
    const t = tempo.current;
    const lista = lanternas.current;
    for (let i = 0; i < lista.length; i++) {
      const l = lista[i];
      if (!l) continue;
      // Período natural de lanterna pendurada (~1,9 s), ritmo e fase por poste; repouso com reduced-motion.
      const ritmo = 3.2 + i * 0.17;
      l.rotation.z = menosMovimento
        ? 0
        : (Math.sin(t * ritmo + i * 1.7) +
            0.25 * Math.sin(t * ritmo * 0.37 + i)) *
          0.05;
    }
  });

  return (
    <group ref={grupo} name="postes-lanterna">
      {/* Luz quente junto ao boi (a manta vermelha com estrela é a identidade dele). */}
      <PocaDeLuz
        posicao={[PONTOS_NPC.boi.x, 0.03, PONTOS_NPC.boi.z]}
        raio={2.4}
        cor={PALETA.lanterna}
        intensidade={0.34}
      />
      {/* Luz quente no centro da roda do tambor de crioula (o tambor tem brasa). */}
      <PocaDeLuz
        posicao={[TAMBOR_DE_CRIOULA[0], 0.03, TAMBOR_DE_CRIOULA[1]]}
        raio={3.0}
        cor={PALETA.laranja}
        intensidade={0.3}
      />
      {POSTES_LANTERNA.map(([x, z], i) => (
        <group
          key={i}
          position={[x, 0, z]}
          rotation={[0, hashDeterministico(i + 70) * Math.PI * 2, 0]}
        >
          <mesh position={[0, 1.45, 0]}>
            <cylinderGeometry args={[0.09, 0.12, 2.9, 7]} />
            <meshToonMaterial
              color={PALETA.madeiraEscura}
              gradientMap={rampa}
            />
          </mesh>
          <mesh position={[0, 2.95, 0]} userData={{ semContorno: true }}>
            <cylinderGeometry args={[0.13, 0.11, 0.1, 7]} />
            <meshToonMaterial color={PALETA.madeira} gradientMap={rampa} />
          </mesh>
          {/* Braço curto e lanterna pendurada com pivô no gancho */}
          <mesh position={[0.22, 2.7, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.04, 0.04, 0.5, 6]} />
            <meshToonMaterial
              color={PALETA.madeiraEscura}
              gradientMap={rampa}
            />
          </mesh>
          <group
            ref={(el) => {
              if (el) lanternas.current[i] = el;
            }}
            position={[0.44, 2.7, 0]}
          >
            <primitive object={lanternasModelo[i]} />
          </group>
          <PocaDeLuz
            posicao={[0.4, 0.03, 0]}
            raio={2.2}
            cor={PALETA.lanterna}
            intensidade={0.42}
          />
        </group>
      ))}
    </group>
  );
}

/**
 * Varais de bandeirinhas em catenária entre âncoras do layout (capela,
 * coreto, postes), numa única InstancedMesh com cor por instância e balanço
 * de vento por fase; a corda é uma linha fina por varal.
 */
export function Varais() {
  const rampa = rampaToon(3);
  const menosMovimento = usePrefereMenosMovimento();
  const nivel = useQualidade();
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const { bandeiras, cordas } = useMemo(() => {
    const bandeiras: {
      pos: THREE.Vector3;
      rotY: number;
      cor: THREE.Color;
      fase: number;
    }[] = [];
    const cordas: THREE.Line[] = [];
    VARAIS.forEach(([a, b], vi) => {
      const pa = new THREE.Vector3(...a);
      const pb = new THREE.Vector3(...b);
      const comprimento = pa.distanceTo(pb);
      const queda = Math.min(0.9, comprimento * 0.09);
      const n = Math.max(4, Math.round(comprimento / 0.42));
      const pontosCorda: THREE.Vector3[] = [];
      for (let j = 0; j <= n; j++) {
        const t = j / n;
        const p = pa.clone().lerp(pb, t);
        p.y -= Math.sin(t * Math.PI) * queda;
        pontosCorda.push(p);
        if (j > 0 && j < n) {
          bandeiras.push({
            pos: p.clone(),
            rotY: Math.atan2(pb.x - pa.x, pb.z - pa.z) + Math.PI / 2,
            cor: new THREE.Color(
              CORES_BANDEIRA[(vi * 2 + j) % CORES_BANDEIRA.length],
            ),
            fase: vi * 8 + j,
          });
        }
      }
      cordas.push(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(pontosCorda),
          new THREE.LineBasicMaterial({
            color: PALETA.creme,
            transparent: true,
            opacity: 0.55,
          }),
        ),
      );
    });
    return { bandeiras, cordas };
  }, []);
  useEffect(
    () => () =>
      cordas.forEach((c) => {
        c.geometry.dispose();
        (c.material as THREE.Material).dispose();
      }),
    [cordas],
  );

  const visiveis = useMemo(
    () =>
      nivel === "baixa" ? bandeiras.filter((_, i) => i % 2 === 0) : bandeiras,
    [bandeiras, nivel],
  );

  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    visiveis.forEach((v, i) => {
      dummy.position.copy(v.pos);
      dummy.position.y -= 0.14;
      dummy.rotation.set(0, v.rotY, Math.PI);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
      m.setColorAt(i, v.cor);
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [visiveis, dummy]);

  // Vento no vertex shader: cada bandeirinha gira em torno do próprio gancho
  // (0,14 m acima do centro) com fase derivada da posição da instância; as
  // matrizes ficam estáticas e nenhuma volta à CPU por quadro. Com reduced
  // motion o tempo não avança e a pose é a de repouso.
  const vento = useMemo(() => {
    const tempo = { value: 0 };
    const material = new THREE.MeshToonMaterial({
      gradientMap: rampa,
      side: THREE.DoubleSide,
    });
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTempo = tempo;
      shader.vertexShader = shader.vertexShader
        .replace(
          "#include <common>",
          "#include <common>\nuniform float uTempo;",
        )
        .replace(
          "#include <begin_vertex>",
          `#include <begin_vertex>
          #ifdef USE_INSTANCING
            vec3 origem = vec3(instanceMatrix[3][0], instanceMatrix[3][1], instanceMatrix[3][2]);
            float fase = origem.x * 0.9 + origem.z * 0.7;
            float ang = (sin(uTempo * 4.2 + fase) + 0.3 * sin(uTempo * 1.5 + fase * 0.4)) * 0.055;
            float c = cos(ang), s = sin(ang);
            vec3 rel = transformed - vec3(0.0, 0.14, 0.0);
            transformed = vec3(c * rel.x - s * rel.y, s * rel.x + c * rel.y, rel.z) + vec3(0.0, 0.14, 0.0);
          #endif`,
        );
    };
    return { tempo, material };
  }, [rampa]);
  useEffect(() => () => vento.material.dispose(), [vento]);
  const relogio = useRef({ t: 0, uniforme: vento.tempo });
  useFrame((_, delta) => {
    if (menosMovimento) {
      relogio.current.uniforme.value = 0;
      return;
    }
    relogio.current.t += delta;
    relogio.current.uniforme.value = relogio.current.t;
  });

  return (
    <group name="varais">
      {cordas.map((c, i) => (
        <primitive key={i} object={c} />
      ))}
      <instancedMesh
        key={visiveis.length}
        ref={ref}
        args={[undefined, vento.material, visiveis.length]}
        userData={{ semContorno: true }}
      >
        <coneGeometry args={[0.13, 0.3, 3]} />
      </instancedMesh>
    </group>
  );
}

/** Cercas baixas de madeira (mourões + duas travessas) e bancos rústicos voltados pra fogueira. */
export function CercasEBancos() {
  const grupo = useRef<THREE.Group>(null);
  useContorno(grupo);
  const rampa = rampaToon(3);
  const geoMourao = useMemo(
    () => new RoundedBoxGeometry(0.14, 0.9, 0.14, 2, 0.03),
    [],
  );
  const geoTravessa = useMemo(
    () => new RoundedBoxGeometry(1, 0.1, 0.07, 2, 0.02),
    [],
  );
  const geoAssento = useMemo(
    () => new RoundedBoxGeometry(1.5, 0.12, 0.42, 2, 0.03),
    [],
  );
  const geoPe = useMemo(
    () => new RoundedBoxGeometry(0.16, 0.42, 0.36, 2, 0.03),
    [],
  );
  useEffect(
    () => () =>
      [geoMourao, geoTravessa, geoAssento, geoPe].forEach((g) => g.dispose()),
    [geoMourao, geoTravessa, geoAssento, geoPe],
  );
  // Um material por família (madeira, madeira clara, madeira escura), compartilhado por todas as peças.
  const mat = useMemo(
    () => ({
      madeira: new THREE.MeshToonMaterial({
        color: PALETA.madeira,
        gradientMap: rampa,
      }),
      clara: new THREE.MeshToonMaterial({
        color: PALETA.madeiraClara,
        gradientMap: rampa,
      }),
      escura: new THREE.MeshToonMaterial({
        color: PALETA.madeiraEscura,
        gradientMap: rampa,
      }),
    }),
    [rampa],
  );
  useEffect(() => () => Object.values(mat).forEach((m) => m.dispose()), [mat]);

  return (
    <group ref={grupo} name="cercas-e-bancos">
      {CERCAS.map(([a, b], ci) => {
        const dx = b[0] - a[0];
        const dz = b[1] - a[1];
        const comprimento = Math.hypot(dx, dz);
        const rot = Math.atan2(dx, dz) + Math.PI / 2;
        const n = Math.max(2, Math.round(comprimento / 1.1) + 1);
        return (
          <group key={ci} position={[a[0], 0, a[1]]} rotation={[0, rot, 0]}>
            {Array.from({ length: n }, (_, i) => (
              <mesh
                key={i}
                geometry={geoMourao}
                material={mat.madeira}
                position={[(i / (n - 1)) * comprimento, 0.45, 0]}
              />
            ))}
            {[0.62, 0.3].map((y) => (
              <mesh
                key={y}
                geometry={geoTravessa}
                material={mat.clara}
                position={[comprimento / 2, y, 0]}
                scale={[comprimento, 1, 1]}
              />
            ))}
          </group>
        );
      })}
      {BANCOS.map(([x, z], i) => (
        <group
          key={i}
          position={[x, 0, z]}
          rotation={[0, Math.atan2(-x, -z), 0]}
        >
          <mesh
            geometry={geoAssento}
            material={mat.clara}
            position={[0, 0.45, 0]}
          />
          {[-0.55, 0.55].map((px) => (
            <mesh
              key={px}
              geometry={geoPe}
              material={mat.escura}
              position={[px, 0.2, 0]}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

/** Pegadas de sombra de contato (elipse x/z em metros) de cada volume da praça. */
const PEGADAS: {
  x: number;
  z: number;
  rx: number;
  rz: number;
  rotY?: number;
}[] = [
  { x: CAPELA.pos[0], z: CAPELA.pos[1] + 0.6, rx: 3.2, rz: 3.0 },
  { x: CORETO.pos[0], z: CORETO.pos[1], rx: 2.8, rz: 2.8 },
  ...BARRACAS.map((b) => ({
    x: b.pos[0],
    z: b.pos[1],
    rx: 1.7,
    rz: 1.25,
    rotY: b.rotY,
  })),
  ...POSTES_LANTERNA.map(([x, z]) => ({ x, z, rx: 0.42, rz: 0.42 })),
  ...BANCOS.map(([x, z]) => ({
    x,
    z,
    rx: 0.95,
    rz: 0.5,
    rotY: Math.atan2(-x, -z),
  })),
  // Rodas de figurantes: uma sombra larga assenta a roda inteira.
  { x: QUADRILHA[0], z: QUADRILHA[1], rx: 2.3, rz: 2.3 },
  { x: TAMBOR_DE_CRIOULA[0], z: TAMBOR_DE_CRIOULA[1], rx: 2.0, rz: 2.0 },
];

const SOMBRA_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);
  }
`;
const SOMBRA_FRAGMENT = /* glsl */ `
  uniform vec3 cor;
  varying vec2 vUv;
  void main() {
    float d = distance(vUv, vec2(0.5)) * 2.0;
    float alfa = (1.0 - smoothstep(0.5, 1.0, d)) * 0.4;
    gl_FragColor = vec4(cor, alfa);
  }
`;

/**
 * Sombras de contato: decais radiais (uma InstancedMesh, gradiente no
 * fragment) sob capela, coreto, barracas, postes e bancos, assentando os
 * volumes no chão sem sombra dinâmica.
 */
export function SombrasDeContato() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const geometria = useMemo(() => new THREE.PlaneGeometry(2, 2), []);
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { cor: { value: new THREE.Color("#120C08") } },
        vertexShader: SOMBRA_VERTEX,
        fragmentShader: SOMBRA_FRAGMENT,
      }),
    [],
  );
  useEffect(
    () => () => {
      geometria.dispose();
      material.dispose();
    },
    [geometria, material],
  );
  useEffect(() => {
    const m = ref.current;
    if (!m) return;
    PEGADAS.forEach((p, i) => {
      dummy.position.set(p.x, 0.018, p.z);
      dummy.rotation.set(-Math.PI / 2, 0, p.rotY ?? 0, "YXZ");
      dummy.scale.set(p.rx, p.rz, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  }, [dummy]);
  return (
    <instancedMesh
      ref={ref}
      args={[geometria, material, PEGADAS.length]}
      userData={{ semContorno: true }}
      renderOrder={1}
      name="sombras-de-contato"
    />
  );
}
