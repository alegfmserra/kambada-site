/**
 * Fotos da Kambada.
 *
 * Origem: pasta `comercial/Imagens Diversas` do acervo da marca (87 fotos
 * editadas, entregues pelo Alexandre em 2026-08-31). Foram selecionadas,
 * giradas conforme a orientação original, redimensionadas e convertidas
 * para WebP por `scripts/preparar-fotos.mjs`.
 *
 * O texto alternativo descreve o que a foto realmente mostra — é o que
 * pessoas com leitor de tela ouvem, e o que o Google lê. Nada de "foto 1".
 */

export type Foto = {
  arquivo: string;
  alt: string;
  largura: number;
  altura: number;
};

export const FOTOS = {
  familiaCaminhando: {
    arquivo: "/fotos/familia-caminhando.webp",
    alt: "Pai e filha caminhando de mãos dadas por uma rua do centro histórico de São Luís, os dois vestindo camisetas da Kambada",
    largura: 1600,
    altura: 2133,
  },
  familiaSentados: {
    arquivo: "/fotos/familia-sentados.webp",
    alt: "Pai sentado com a filha no colo em frente a um casarão colonial de São Luís, ele de camiseta Tradição e ela de camiseta Guarás",
    largura: 1200,
    altura: 1500,
  },
  meninaRindo: {
    arquivo: "/fotos/menina-rindo.webp",
    alt: "Menina rindo no colo do pai, vestindo a camiseta infantil Guarás, da Kambada",
    largura: 900,
    altura: 1200,
  },
  familiaMaosDadas: {
    arquivo: "/fotos/familia-maos-dadas.webp",
    alt: "Pai e filha de mãos dadas em uma praça arborizada de São Luís, os dois com camisetas da Kambada",
    largura: 900,
    altura: 1125,
  },
  camisaIlhaEncantada: {
    arquivo: "/fotos/camisa-ilha-encantada.webp",
    alt: "Homem vestindo a camiseta preta São Luís Ilha Encantada, em frente a um casarão verde do centro histórico",
    largura: 900,
    altura: 1200,
  },
  camisaCasarao: {
    arquivo: "/fotos/camisa-casarao.webp",
    alt: "Detalhe das costas da camiseta São Luís Ilha Encantada, com a marca Kambada bordada",
    largura: 900,
    altura: 1200,
  },
  estampaDetalhe: {
    arquivo: "/fotos/estampa-detalhe.webp",
    alt: "Close da estampa dourada São Luís Ilha Encantada, com a serpente, a carranca e a caravela",
    largura: 900,
    altura: 1200,
  },
  expositorFeira: {
    arquivo: "/fotos/expositor-feira.webp",
    alt: "Banca da Kambada em feira, com matracas pintadas à mão, ecobags e marcadores de página expostos",
    largura: 1200,
    altura: 1783,
  },
  mandala: {
    arquivo: "/fotos/mandala.webp",
    alt: "Mandala de palha com pintura de figura do Bumba Meu Boi ao centro",
    largura: 800,
    altura: 1067,
  },
  kitTradicao: {
    arquivo: "/fotos/kit-tradicao.webp",
    alt: "Kit Kambada com matraca pintada à mão, ecobag e necessaire da linha Tradição",
    largura: 800,
    altura: 1067,
  },
  catMatracas: {
    arquivo: "/fotos/cat-matracas.webp",
    alt: "Matraca de madeira pintada à mão com a figura do boi em vermelho, branco e azul",
    largura: 800,
    altura: 1067,
  },
  catBones: {
    arquivo: "/fotos/cat-bones.webp",
    alt: "Boné azul marinho bordado com a frase Maranhense Que Só e a marca Kambada",
    largura: 800,
    altura: 1067,
  },
  catEcobags: {
    arquivo: "/fotos/cat-ecobags.webp",
    alt: "Ecobag de algodão cru estampada com o Caboclo de Pena em azul e laranja",
    largura: 800,
    altura: 1067,
  },
  catNecessaires: {
    arquivo: "/fotos/cat-necessaires.webp",
    alt: "Necessaire de algodão cru com a estampa Tradição, mostrando figuras do Bumba Meu Boi",
    largura: 800,
    altura: 1067,
  },
} as const satisfies Record<string, Foto>;

/** Galeria da página Sobre — a marca vista por quem a veste e por quem a faz. */
export const GALERIA_SOBRE: Foto[] = [
  FOTOS.familiaSentados,
  FOTOS.meninaRindo,
  FOTOS.expositorFeira,
  FOTOS.kitTradicao,
  FOTOS.estampaDetalhe,
  FOTOS.mandala,
];
