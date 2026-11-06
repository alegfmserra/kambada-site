"use client";

import { useState } from "react";
import { avisarFeito } from "../cultura/Perguntas";
import { BOTAO } from "../chamar";

/** Fim do artigo: o aluno marca que leu (vai para o relatório do professor e para a trilha). */
export function LiOArtigo({ atividade, jaLeu }: { atividade: string; jaLeu: boolean }) {
  const [leu, setLeu] = useState(jaLeu);
  if (leu) return <p className="rounded-2xl bg-kambada-green/15 p-4 text-center font-semibold" role="status">✓ Artigo lido! Bora para o próximo passo.</p>;
  return (
    <button
      type="button"
      onClick={() => {
        avisarFeito(atividade);
        setLeu(true);
      }}
      className={`${BOTAO} w-full`}
    >
      ✓ Li o artigo
    </button>
  );
}
