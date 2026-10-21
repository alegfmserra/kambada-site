import type { FotoProduto } from "./fotoDoProduto";

/**
 * Foto de demonstração de cada suporte da matraca (Alexandre, 21/10/2026).
 *
 * Nem toda estampa tem foto com cada suporte; então, ao escolher o suporte, a
 * página mostra uma peça REAL com aquele suporte, avisando que é só para ver o
 * suporte — a matraca vai com a estampa que o cliente escolheu.
 *
 * Fotos do acervo (comercial/portfolio/Imagens para Portfólio), em
 * public/fotos/suportes/: reto = "Matraca G Chapeu de Fitas 1 Com Suporte" e
 * "Matraca P Miolinho Com Suporte"; Leque Bordado (recortado em folhas) =
 * "Matraca Bumba Boi Estrelado com Suporte"; Topo Boi Preto = foto da Will
 * (will-2026-10-14_matraca-grande-com-suporte-boi).
 */

const foto = (nome: string, largura: number, altura: number): FotoProduto => ({ src: `/fotos/suportes/${nome}.jpg`, largura, altura });

const GRANDE: Record<string, FotoProduto> = {
  "Com suporte": foto("grande-reto", 960, 1280),
  "Leque Bordado": foto("grande-leque-bordado", 960, 1280),
  "Topo Boi Preto": foto("grande-topo-boi-preto", 1200, 1600),
};
const MINI: Record<string, FotoProduto> = { "Com suporte": foto("mini-reto", 960, 1280) };

/** Fotos de suporte do produto (pelo nome), ou vazio quando não se aplica. */
export function fotosDosSuportes(nomeDoProduto: string): Record<string, FotoProduto> {
  if (/^matraca kambada grande$/i.test(nomeDoProduto)) return GRANDE;
  if (/^matraca kambada mini$/i.test(nomeDoProduto)) return MINI;
  return {};
}

/** O nome do suporte para a legenda: "Com suporte" é o reto. */
export function nomeDoSuporte(valor: string): string {
  return valor === "Com suporte" ? "suporte reto" : `suporte ${valor}`;
}
