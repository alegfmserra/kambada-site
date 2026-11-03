"use client";

import { useState } from "react";
import type { AtividadeCultural, Didatica } from "@/lib/escola/cultura";
import { Perguntas, Saber } from "./Perguntas";

/**
 * Animação da área do aluno: o vídeo do Play e, quando ele termina (ou o
 * aluno toca em "Já assisti"), a brincadeira "O que você viu?".
 */
export function VideoCultura({ video, didatica }: { video: AtividadeCultural; didatica: Didatica }) {
  const [viu, setViu] = useState(false);
  return (
    <div className="space-y-6">
      <div className="overflow-hidden rounded-3xl border-4 border-kambada-grafite bg-black shadow-[8px_8px_0_0_#ffcc29]">
        <video
          controls
          playsInline
          preload="metadata"
          poster={`/kambadaplay/videos/${video.slug}.jpg`}
          src={`/kambadaplay/videos/${video.slug}.mp4`}
          onEnded={() => setViu(true)}
          className="aspect-video w-full"
        />
      </div>
      {!viu ? (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-borda p-4 text-sm">
          <span>Quando o vídeo acabar, vem uma brincadeira sobre o que você viu.</span>
          <button type="button" onClick={() => setViu(true)} className="font-semibold underline">
            Já assisti →
          </button>
        </div>
      ) : (
        <Perguntas atividade={video.id} perguntas={didatica.perguntas} titulo="O que você viu?" />
      )}
      <Saber vocesabia={didatica.vocesabia} glossario={didatica.glossario} />
    </div>
  );
}
