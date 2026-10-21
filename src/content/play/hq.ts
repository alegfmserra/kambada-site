/**
 * Histórias em quadrinhos do Kambada Play. As páginas ficam em
 * public/kambadaplay/hq/<slug>/NN.webp (NN com dois dígitos).
 */
export type HQ = {
  slug: string;
  titulo: string;
  resumo: string;
  autoria: string;
  paginas: number;
};

export const HQS: HQ[] = [
  // A primeira da lista é a que aparece em destaque no hub.
  {
    slug: "kambadinha-a-hora-dos-guaras",
    titulo: "Kambadinha em: A Hora dos Guarás",
    resumo:
      "No mangue, o Kambadinha anima um guará com medo de voar. O amigo ganha o céu de São Luís e, no fim da tarde, descobre a revoada dos guarás.",
    autoria: "Roteiro: Alexandre Serra · Ilustrações: Ricardo Pontes",
    paginas: 5,
  },
  {
    slug: "kambadinha-na-batida-do-tambor",
    titulo: "Kambadinha em: Na Batida do Tambor",
    resumo:
      "Em São Luís, o caranguejinho Kambadinha encontra o Cazumbá e descobre o que é o tambor de crioula.",
    autoria: "Roteiro: Will Batista · Ilustrações: Ricardo Pontes",
    paginas: 4,
  },
];

export function hqPorSlug(slug: string): HQ | undefined {
  return HQS.find((h) => h.slug === slug);
}

export const paginaDaHQ = (h: HQ, n: number) =>
  `/kambadaplay/hq/${h.slug}/${String(n).padStart(2, "0")}.webp`;
