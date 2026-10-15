"use client";

import type { JSX } from "react";
import { EffectComposer, BrightnessContrast, HueSaturation, Bloom, Vignette, Noise, SMAA } from "@react-three/postprocessing";
import type { NivelQualidade } from "./Qualidade";

/**
 * Pilha de pós-processamento: grading quente, brilho da fogueira e das
 * lanternas, fechamento de quadro, grão de filme e por fim o antialiasing.
 * Carregada preguiçosamente pela Scene depois do primeiro frame (o chunk do
 * postprocessing e a compilação dos seus shaders ficam fora do boot).
 */
export default function PosProcessamento({ nivel }: { nivel: Exclude<NivelQualidade, "baixa"> }) {
  return (
    <EffectComposer multisampling={0}>
      {[
        <BrightnessContrast key="grading-contraste" contrast={0.08} brightness={0} />,
        <HueSaturation key="grading-saturacao" saturation={0.12} />,
        nivel === "alta" ? (
          <Bloom key="bloom" mipmapBlur luminanceThreshold={0.78} luminanceSmoothing={0.3} intensity={0.55} />
        ) : null,
        <Vignette key="vinheta" eskil={false} offset={0.45} darkness={0.42} />,
        <Noise key="grao" premultiply opacity={0.035} />,
        <SMAA key="smaa" />,
      ].filter((elemento): elemento is JSX.Element => elemento !== null)}
    </EffectComposer>
  );
}
