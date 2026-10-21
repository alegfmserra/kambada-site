import type { FotoProduto } from "./fotoDoProduto";

/**
 * Foto de demonstração de cada suporte da matraca (Alexandre, 21/10/2026).
 *
 * Nem toda estampa tem foto com cada suporte; então, ao escolher o suporte, a
 * página mostra uma peça REAL com aquele suporte, avisando que é só para ver o
 * suporte — a matraca vai com a estampa que o cliente escolheu.
 *
 * Fotos do acervo (comercial/portfolio/Imagens para Portfólio), em
 * public/fotos/suportes/:
 *  - reto: "Matraca G Chapeu de Fitas 1 Com Suporte" (Grande) e
 *    "Matraca P Miolinho Com Suporte" (Mini);
 *  - Folhas (era "Leque Bordado"): o MESMO suporte em duas cores — preto no Boi
 *    Blackout ("Matraca Grande Com Suporte - Boi Blackout Detalhes Brancos") e
 *    colorido nas outras estampas ("Matraca G Bumba Boi de Estrelas com suporte");
 *  - Topo Boi Preto: foto da Will (will-2026-10-14_matraca-grande-com-suporte-boi).
 */

const foto = (nome: string, largura: number, altura: number): FotoProduto => ({ src: `/fotos/suportes/${nome}.jpg`, largura, altura });

const FOLHAS_COLORIDO = foto("grande-folhas-colorido", 960, 1280);
const FOLHAS_PRETO = foto("grande-folhas-preto", 960, 1280);

const GRANDE: Record<string, FotoProduto> = {
  "Com suporte": foto("grande-reto", 960, 1280),
  Folhas: FOLHAS_COLORIDO,
  "Leque Bordado": FOLHAS_COLORIDO, // nome antigo, enquanto o Bling não for renomeado
  [`Folhas${"|"}Boi Blackout`]: FOLHAS_PRETO,
  [`Leque Bordado${"|"}Boi Blackout`]: FOLHAS_PRETO,
  "Topo Boi Preto": foto("grande-topo-boi-preto", 1200, 1600),
};
const MINI: Record<string, FotoProduto> = { "Com suporte": foto("mini-reto", 960, 1280) };

/** Fotos de suporte do produto (pelo nome), ou vazio quando não se aplica. */
export function fotosDosSuportes(nomeDoProduto: string): Record<string, FotoProduto> {
  if (/^matraca kambada grande$/i.test(nomeDoProduto)) return GRANDE;
  if (/^matraca kambada mini$/i.test(nomeDoProduto)) return MINI;
  return {};
}

/** Folhas no Boi Blackout é sempre o preto; nas outras estampas, o colorido. */
export function chaveDaFotoDoSuporte(suporte: string, estampa?: string): string {
  return /^(folhas|leque bordado)$/i.test(suporte) && estampa === "Boi Blackout" ? `${suporte}|Boi Blackout` : suporte;
}

/** O nome do suporte para a legenda. */
export function nomeDoSuporte(chave: string): string {
  const [valor, estampa] = chave.split("|");
  if (valor === "Com suporte") return "suporte reto";
  if (/^(folhas|leque bordado)$/i.test(valor)) return estampa ? "suporte de folhas (preto, como vai no Boi Blackout)" : "suporte de folhas (colorido; no Boi Blackout ele vai preto)";
  return `suporte ${valor}`;
}
