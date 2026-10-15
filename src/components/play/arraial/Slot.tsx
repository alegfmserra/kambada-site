"use client";

import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { useGLTF } from "@react-three/drei";
import { DRACO_LOCAL } from "@/lib/play/draco";
import * as THREE from "three";
import { rampaToon } from "@/lib/play/toon";
import { useContorno } from "./Contorno";

type SlotModeloProps = {
  /** Caminho do GLB autoral. Undefined (caso de hoje) usa a primitiva em `children`. */
  glb?: string;
  /** Fator de escala pro GLB bater com o tamanho da primitiva que substitui. */
  escala?: number;
  children: ReactNode;
};

/**
 * Slot de modelo do contrato da Seção 5.6 do PRD: enquanto o GLB autoral do
 * Danilo não chega, renderiza a primitiva (`children`) sem nenhuma mudança
 * de comportamento. Quando `glb` é informado, troca pela malha carregada,
 * aplicando o mesmo material toon da cena (preservando a cor original de
 * cada malha como cor base) e o mesmo contorno por inverted hull.
 *
 * Contrato que o GLB precisa cumprir: origem no chão, nos pés do modelo
 * (mesma convenção da primitiva); escala compatível com o que está sendo
 * substituído, pra não pedir ajuste de controlador nem de câmera; normais
 * soldadas e limpas, pro contorno não falhar nas quinas; geometria
 * comprimida em Draco (e textura em KTX2/Basis quando houver); e um único
 * material por malha (multi-material por submesh ainda não tem suporte
 * aqui, o traverse assume `filho.material` como objeto único).
 */
export function SlotModelo({ glb, escala = 1, children }: SlotModeloProps) {
  if (!glb) return <>{children}</>;
  return (
    <Suspense fallback={<>{children}</>}>
      <ModeloCarregado glb={glb} escala={escala} />
    </Suspense>
  );
}

/**
 * Só é montado quando existe `glb`: mantém a chamada de `useGLTF` fora de
 * qualquer condicional, já que hooks não podem ser chamados condicionalmente
 * dentro do mesmo componente. Quem escolhe entre este componente e
 * `children` é o `SlotModelo`, o pai.
 */
function ModeloCarregado({ glb, escala }: { glb: string; escala: number }) {
  const rampa = rampaToon(3);
  const grupo = useRef<THREE.Group>(null);
  const { scene } = useGLTF(glb, DRACO_LOCAL);
  useContorno(grupo);

  useEffect(() => {
    const materiaisToon: THREE.MeshToonMaterial[] = [];
    scene.traverse((filho) => {
      if (!(filho instanceof THREE.Mesh)) return;
      // Pula as cascas do contorno: elas também são Mesh, mas trocar o
      // material delas destruiria o side: BackSide do inverted hull.
      if (filho.userData.contorno) return;

      const materialOriginal = filho.material as THREE.Material | THREE.Material[];
      const corBase =
        (Array.isArray(materialOriginal) ? materialOriginal[0] : materialOriginal) as
          | THREE.MeshStandardMaterial
          | undefined;
      const cor = corBase?.color ?? new THREE.Color("#FFFFFF");

      if (Array.isArray(materialOriginal)) {
        materialOriginal.forEach((m) => m.dispose());
      } else {
        materialOriginal?.dispose?.();
      }

      const materialToon = new THREE.MeshToonMaterial({ color: cor, gradientMap: rampa });
      filho.material = materialToon;
      materiaisToon.push(materialToon);
    });

    return () => {
      for (const material of materiaisToon) material.dispose();
    };
  }, [scene, rampa]);

  return (
    <group ref={grupo} scale={escala}>
      <primitive object={scene} />
    </group>
  );
}
