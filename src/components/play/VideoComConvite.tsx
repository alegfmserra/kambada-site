"use client";

import { pedirPesquisa } from "@/components/PesquisaSatisfacao";

/** O vídeo do Play; quando termina, convida para a pesquisa (27/10/2026). Respeita "já respondeu / agora não". */
/** `legenda` é o endereço do .vtt: entra como faixa do player, ligada por padrão (quem não quiser desliga no próprio player). */
export function VideoComConvite({ poster, src, legenda }: { poster: string; src: string; legenda?: string }) {
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
      {legenda ? <track kind="captions" src={legenda} srcLang="pt-BR" label="Português" default /> : null}
      Seu navegador não toca este vídeo.
    </video>
  );
}
