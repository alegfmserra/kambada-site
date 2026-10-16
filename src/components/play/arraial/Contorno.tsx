"use client";

import { useEffect } from "react";
import * as THREE from "three";
import { acento } from "@/lib/play/cores";

/** Espessura de mundo alvo da casca, em unidades da cena (metros). */
const ESPESSURA_CASCA = 0.025;

/** Geometrias que não recebem casca: planos, círculos, anéis e partículas. */
function aceitaCasca(geometria: THREE.BufferGeometry): boolean {
  return !(
    geometria instanceof THREE.PlaneGeometry ||
    geometria instanceof THREE.CircleGeometry ||
    geometria instanceof THREE.RingGeometry
  );
}

/**
 * Calcula a escala por eixo que dá à casca uma espessura de mundo
 * aproximadamente constante, em vez de uma escala uniforme (que distorce
 * geometria alongada: um cilindro fino ganharia deslocamento enorme nas
 * tampas e quase nenhum na lateral).
 */
function escalaPorEixo(geometria: THREE.BufferGeometry, espessura = ESPESSURA_CASCA): THREE.Vector3 {
  if (!geometria.boundingBox) geometria.computeBoundingBox();
  const tamanho = new THREE.Vector3();
  geometria.boundingBox?.getSize(tamanho);
  const eixo = (t: number) => 1 + (2 * espessura) / Math.max(t, 0.05);
  return new THREE.Vector3(eixo(tamanho.x), eixo(tamanho.y), eixo(tamanho.z));
}

/**
 * Aplica o contorno cartoon por inverted hull num grupo alvo: depois da
 * montagem, percorre as malhas do grupo e adiciona a cada uma um clone
 * levemente maior, cor de tinta e faces viradas pra dentro, criando a
 * silhueta escura de xilogravura. Objetos pequenos e repetidos (planos,
 * discos, anéis, pontos) não recebem casca, peças marcadas com
 * `userData.semContorno` (adereços pequenos, como chapéu e chifres) também
 * ficam de fora, e um clone nunca ganha outro. O contorno é congelado no
 * momento da montagem: malha adicionada dinamicamente depois desse instante
 * entra sem casca, o que vira ponto de atenção quando os GLBs autorais
 * (Seção 5.6 do PRD) trocarem a malha em runtime.
 */
export function useContorno(alvo: React.RefObject<THREE.Object3D | null>) {
  useEffect(() => {
    const grupo = alvo.current;
    if (!grupo) return;

    const cascas: THREE.Mesh[] = [];
    grupo.traverse((filho) => {
      if (!(filho instanceof THREE.Mesh)) return;
      if (filho.userData.contorno) return;
      if (filho.userData.semContorno) return;
      if (!aceitaCasca(filho.geometry)) return;

      const casca = new THREE.Mesh(
        filho.geometry,
        new THREE.MeshBasicMaterial({ color: acento.tinta, side: THREE.BackSide })
      );
      // Peças delgadas (membros dos bonecos) pedem casca mais fina: userData.contornoEspessura.
      casca.scale.copy(escalaPorEixo(filho.geometry, filho.userData.contornoEspessura));
      casca.userData.contorno = true;
      filho.add(casca);
      cascas.push(casca);
    });

    return () => {
      for (const casca of cascas) {
        casca.parent?.remove(casca);
        (casca.material as THREE.Material).dispose();
      }
    };
  }, [alvo]);
}
