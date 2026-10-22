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

// 22/10/2026: a animação saiu do ar — o áudio estava errado (melhor não apresentar do que apresentar mal).
// Arquivos guardados em Kambada-Play/_arquivo/animacao-tambor/ (fora do site). Para voltar: devolver
// mp4 e jpg a public/kambadaplay/videos/ e recolocar este item:
//   { slug: "kambadinha-na-batida-do-tambor", titulo: "Kambadinha na Batida do Tambor", provisorio: true,
//     descricao: "O caranguejinho Kambadinha passeia pelas ruas de São Luís ao som do tambor de crioula.", duracao: "0:45" }
export const VIDEOS: VideoPlay[] = [];

export function videoPorSlug(slug: string): VideoPlay | undefined {
  return VIDEOS.find((v) => v.slug === slug);
}

export const capaDoVideo = (v: VideoPlay) => `/kambadaplay/videos/${v.slug}.jpg`;
export const arquivoDoVideo = (v: VideoPlay) => `/kambadaplay/videos/${v.slug}.mp4`;
