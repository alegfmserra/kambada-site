/**
 * Vídeos e animações do Kambada Play. Os arquivos ficam em
 * public/kambadaplay/videos/<slug>.mp4 (versão web, 720p), .jpg (capa) e,
 * quando houver, .vtt (legenda em português, faixa do player).
 */
export type TrechoDoVideo = {
  /** Quem fala; sem `quem`, é uma indicação de som ou de cena. */
  quem?: string;
  texto: string;
};

export type VideoPlay = {
  slug: string;
  titulo: string;
  /** Marca o título como provisório, até o nome definitivo. */
  provisorio?: boolean;
  descricao: string;
  duracao: string;
  /** Existe public/kambadaplay/videos/<slug>.vtt: a legenda entra no player, ligada por padrão. */
  legenda?: boolean;
  /** Tudo o que se fala no vídeo, na ordem: aparece em "Ler a história" e tem de bater com a legenda. */
  transcricao?: TrechoDoVideo[];
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
    legenda: true,
    // Texto conferido com o áudio em 17/11/2026 (o mesmo da legenda). As vozes mudaram um pouco os balões da HQ.
    transcricao: [
      { texto: "Música de abertura, sobre o título da história." },
      { quem: "Kambadinha", texto: "E aí, pequeno! Tomando coragem pra voar?" },
      { quem: "Guará", texto: "Sim. Tô com medo. E se eu cair? Será que minhas penas são fracas?" },
      { quem: "Kambadinha", texto: "Relaxa, amigo. É só respirar fundo, abrir as asas e deixar o vento te levar." },
      { quem: "Kambadinha", texto: "Éguas! Tu conseguiu voar!" },
      { quem: "Guará", texto: "Sim! E agora eu vou desbravar o mundo." },
      { quem: "Kambadinha", texto: "Como assim desbravar o mundo?" },
      { quem: "Guará", texto: "O mundo é grande demais pra eu dormir sempre no mesmo galho." },
      { quem: "Kambadinha", texto: "Vou ficando por aqui, pois caranguejo não voa, né?" },
      { quem: "Guará", texto: "Rapaz! A vista daqui de cima é muito massa!" },
      { quem: "Kambadinha", texto: "Deve ser bonito lá de cima. O que será que ele tá descobrindo por aí?" },
      { quem: "Guará", texto: "Para onde todo mundo vai?" },
      { texto: "Só música: a revoada dos guarás cruza o céu do fim da tarde." },
      { quem: "Kambadinha", texto: "Pensei que tu não ia voltar." },
      { quem: "Guará", texto: "Eu não voltei, não. Só vim dormir." },
      { quem: "Kambadinha", texto: "Voar é bom?" },
      { quem: "Guará", texto: "Muito! Amanhã eu vou de novo." },
      { quem: "Kambadinha", texto: "E de noite? Vai dormir onde?" },
      { quem: "Guará", texto: "Aqui..." },
      { quem: "Kambadinha", texto: "Todo fim de tarde eles fazem isso. Olha pro céu hoje e depois me conta se viu." },
    ],
  },
];

export function videoPorSlug(slug: string): VideoPlay | undefined {
  return VIDEOS.find((v) => v.slug === slug);
}

export const capaDoVideo = (v: VideoPlay) => `/kambadaplay/videos/${v.slug}.jpg`;
export const arquivoDoVideo = (v: VideoPlay) => `/kambadaplay/videos/${v.slug}.mp4`;
export const legendaDoVideo = (v: VideoPlay) => (v.legenda ? `/kambadaplay/videos/${v.slug}.vtt` : undefined);
