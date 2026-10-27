/**
 * Vídeos e animações do Kambada Play. Os arquivos ficam em
 * public/kambadaplay/videos/<slug>.mp4 (versão web, 720p) e .jpg (capa).
 */
export type VideoPlay = {
  slug: string;
  titulo: string;
  /** Marca o título como provisório, até o nome definitivo. */
  provisorio?: boolean;
  descricao: string;
  duracao: string;
};

// 22/10/2026: a animação do Tambor saiu do ar — o áudio estava errado (melhor não apresentar do que apresentar mal).
// Arquivos guardados em Kambada-Play/_arquivo/animacao-tambor/ (fora do site).
// 27/10/2026: "A Hora dos Guarás" entra como vídeo inaugural (fonte em site-novo/VIDEOS-editados/).
export const VIDEOS: VideoPlay[] = [
  {
    slug: "kambadinha-a-hora-dos-guaras",
    titulo: "Kambadinha em: A Hora dos Guarás",
    descricao:
      "Kambadinha, o caranguejo, vê um filhote de guará abrir as asas pela primeira vez. Ele fica no mangue; o guará vai desbravar o mundo. E, no fim da tarde, o céu de São Luís se enche de vermelho.",
    duracao: "1:05",
  },
];

export function videoPorSlug(slug: string): VideoPlay | undefined {
  return VIDEOS.find((v) => v.slug === slug);
}

export const capaDoVideo = (v: VideoPlay) => `/kambadaplay/videos/${v.slug}.jpg`;
export const arquivoDoVideo = (v: VideoPlay) => `/kambadaplay/videos/${v.slug}.mp4`;
