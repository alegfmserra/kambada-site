"use client";

import { Suspense, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { PresentationControls, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";
import { MatracaModel } from "./MatracaModel";
import { useMediaQuery } from "@/lib/play/mediaQuery";

/** Alvo mutável dirigido pelo ScrollTrigger da seção (scrollytelling). */
export type AlvoVitrine = { giro: number; aprox: number };

const CAMERA_Z = 5.4;

/** Rotação idle lenta; o PresentationControls por fora soma o arraste do usuário. */
function GiroIdle({ ativo, children }: { ativo: boolean; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (ativo && ref.current) ref.current.rotation.y += delta * 0.25;
  });
  return <group ref={ref}>{children}</group>;
}

/** Segue o alvo do scrub: gira o grupo e aproxima a câmera com lerp curto. */
function SeguirScroll({
  alvo,
  children,
}: {
  alvo: React.RefObject<AlvoVitrine>;
  children: React.ReactNode;
}) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    if (!alvo.current || !ref.current) return;
    ref.current.rotation.y = THREE.MathUtils.lerp(
      ref.current.rotation.y,
      alvo.current.giro,
      0.14
    );
    camera.position.z = THREE.MathUtils.lerp(
      camera.position.z,
      CAMERA_Z - alvo.current.aprox * 1.1,
      0.12
    );
  });
  return <group ref={ref}>{children}</group>;
}

type VitrineCanvasProps = {
  /** Presente quando o scrollytelling desktop está ativo; ausente no modo idle. */
  alvo?: React.RefObject<AlvoVitrine>;
  /** Pausa o loop de render quando a seção sai da viewport. */
  visivel?: boolean;
};

export default function VitrineCanvas({ alvo, visivel = true }: VitrineCanvasProps) {
  const reduzido = useMediaQuery("(prefers-reduced-motion: reduce)");
  const scrolly = Boolean(alvo) && !reduzido;

  const peca = (
    <Suspense fallback={null}>
      <GiroIdle ativo={!reduzido && !scrolly}>
        {/* O modelo fica centrado em y≈1.33; desloca pra centralizar na moldura */}
        <group position={[0, -1.25, 0]}>
          <MatracaModel />
        </group>
      </GiroIdle>
    </Suspense>
  );

  return (
    <Canvas
      camera={{ position: [0, 0.1, CAMERA_Z], fov: 34 }}
      dpr={[1, 2]}
      frameloop={visivel ? "always" : "never"}
    >
      {/* IBL de fim de tarde como base; a directional quente segue como key */}
      <Suspense fallback={null}>
        <Environment preset="sunset" environmentIntensity={0.6} />
      </Suspense>
      <ambientLight intensity={0.35} color="#F5EDE0" />
      <directionalLight position={[3, 4, 3]} intensity={1.6} color="#FFD9A0" />
      <directionalLight position={[-4, 2, -2]} intensity={0.4} color="#3E8FC9" />

      <PresentationControls
        global
        cursor
        speed={1.4}
        polar={[-0.3, 0.3]}
        azimuth={[-Infinity, Infinity]}
      >
        {scrolly && alvo ? <SeguirScroll alvo={alvo}>{peca}</SeguirScroll> : peca}
      </PresentationControls>

      <ContactShadows position={[0, -1.35, 0]} opacity={0.45} scale={5} blur={2.6} far={2} />
    </Canvas>
  );
}
