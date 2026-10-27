"use client";

import { pedirPesquisa } from "@/components/PesquisaSatisfacao";

/** O vídeo do Play; quando termina, convida para a pesquisa (27/10/2026). Respeita "já respondeu / agora não". */
export function VideoComConvite({ poster, src }: { poster: string; src: string }) {
  return (
    <video
      controls
      playsInline
      preload="metadata"
      poster={poster}
      className="aspect-video w-full"
      onEnded={() => setTimeout(() => pedirPesquisa("video"), 1500)}
    >
      <source src={src} type="video/mp4" />
      Seu navegador não toca este vídeo.
    </video>
  );
}
