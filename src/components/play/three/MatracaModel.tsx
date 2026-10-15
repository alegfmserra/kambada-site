"use client";

import { forwardRef, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

const URLS = ["/kambadaplay/models/matraca-dir.glb", "/kambadaplay/models/matraca-esq.glb"] as const;

/** Espelho sRGB de `--color-kambada-wood` (globals.css); Three não lê var(--). */
const COR_MADEIRA = "#A9682E";

/**
 * Par de matracas do GLB com material de madeira aplicado em clones (o cache
 * do useGLTF fica intacto). Cleanup duplo no unmount: o R3F descarta as
 * geometrias dos clones e aqui descartamos o material e limpamos o cache.
 */
export const MatracaModel = forwardRef<THREE.Group>((_props, ref) => {
  const dir = useGLTF(URLS[0]);
  const esq = useGLTF(URLS[1]);

  const material = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: COR_MADEIRA,
        roughness: 0.6,
        metalness: 0.05,
      }),
    []
  );

  const cenas = useMemo(() => {
    const clones = [dir.scene.clone(true), esq.scene.clone(true)];
    for (const cena of clones) {
      cena.traverse((child) => {
        if (child instanceof THREE.Mesh) child.material = material;
      });
    }
    return clones;
  }, [dir.scene, esq.scene, material]);

  useEffect(() => {
    return () => {
      material.dispose();
      // As geometrias dos clones são as do cache; depois do dispose do R3F,
      // o cache precisa esvaziar pra um remount recarregar do zero.
      useGLTF.clear([...URLS]);
    };
  }, [material]);

  return (
    <group ref={ref}>
      {cenas.map((cena, i) => (
        <primitive key={i} object={cena} />
      ))}
    </group>
  );
});
MatracaModel.displayName = "MatracaModel";

useGLTF.preload(URLS[0]);
useGLTF.preload(URLS[1]);
