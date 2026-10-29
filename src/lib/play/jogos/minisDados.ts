/**
 * Dados das mini-atividades que a interface (cliente) também usa. Fica num
 * arquivo sem nenhum import: o `minis.ts` (servidor) importa `seguranca.ts`
 * (node:crypto), e o webpack não empacota isso para o navegador.
 */

export type MiniId = "fogueira" | "quadrilha";

export type ModeloMini = { id: MiniId; nome: string; instrucao: string; simbolos: string[]; tamanho: number };

/** XP da mini-atividade perfeita (uma vez por dia por atividade). */
export const XP_MINI_PERFEITA = 40;

export const MINIS: ModeloMini[] = [
  {
    id: "fogueira",
    nome: "Acenda a fogueira",
    instrucao: "Seu Chico bate o ritmo para acender o fogo. Olhe a sequência de toques e repita na mesma ordem.",
    simbolos: ["Toque curto", "Toque longo"],
    tamanho: 6,
  },
  {
    id: "quadrilha",
    nome: "Marque a quadrilha",
    instrucao: "O marcador grita os passos da quadrilha. Guarde a ordem e repita os comandos.",
    simbolos: ["Anarriê!", "Alavantu!", "Balancê!", "Caminho da roça!", "Olha a chuva!"],
    tamanho: 6,
  },
];
