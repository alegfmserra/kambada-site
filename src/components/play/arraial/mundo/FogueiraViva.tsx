"use client";

import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { usePrefereMenosMovimento } from "@/lib/play/movimento";
import { Modelo } from "./Modelo";
import criarFogueira, { animar as animarFogueira } from "./modelos/fogueira";

/**
 * Fogueira central: modelo procedural (img2threejs) com chama em três
 * camadas animadas e a única pointLight da praça, cuja intensidade tremula
 * junto com a chama. Com prefers-reduced-motion a chama só pulsa devagar e
 * a luz fica estável.
 */
export function FogueiraViva({
  onClick,
  onPointerOver,
  onPointerOut,
}: {
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}) {
  const luz = useRef<THREE.PointLight>(null);
  const tempo = useRef(0);
  const menosMovimento = usePrefereMenosMovimento();

  useFrame((_, delta) => {
    if (!luz.current) return;
    tempo.current += delta;
    const t = tempo.current;
    // Tremulação lenta e discreta (até ~1 Hz, ±7%): a luz banha a praça inteira,
    // e componente rápido nela vira pisca-pisca no cenário todo.
    luz.current.intensity = menosMovimento ? 9.5 : 9.5 + Math.sin(t * 1.7) * 0.5 + Math.sin(t * 4.1) * 0.2;
  });

  return (
    <group name="fogueira-viva">
      <Modelo
        nome="fogueira"
        criar={criarFogueira}
        animar={animarFogueira}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      />
      {/* decay físico (2) e alcance curto: a luz aquece a praça sem saturar as toras e as pedras. */}
      <pointLight ref={luz} position={[0, 1.9, 0]} color="#FFA351" distance={13} decay={2} />
    </group>
  );
}
