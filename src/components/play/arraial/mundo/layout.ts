/**
 * Fonte única do layout da clareira (unidades em metros, fogueira na origem,
 * x pra direita, +z na direção da câmera). Posições vêm da análise da
 * referência geral (docs/evidencias/gauntlet-arraial-3d/referencias-analise.md,
 * seção "Layout espacial"). Tudo que precisa de posição (cena, colisores,
 * pontos interativos, e2e) lê daqui pra não driftar.
 */
import * as THREE from "three";
import type { Colisor } from "../Player";

/**
 * Fator de expansão da praça (fase 2): as construções se afastam da fogueira
 * pra haver espaço de passeio entre elas, sem mudar o tamanho de cada peça.
 */
export const EXPANSAO = 1.25;
/** Raio da pavimentação de pedra ao redor da fogueira. */
export const RAIO_PAVIMENTO = 5.2;
/** Raio do disco de terra batida da praça (depois vira grama). */
export const RAIO_TERRA = 7.6;
/** Raio da clareira: além daqui começa a floresta. */
export const RAIO_CLAREIRA = 18.5;
/** Até onde o jogador anda (um pouco antes das primeiras árvores). */
export const RAIO_ANDAVEL = 17;

/** Aplica a expansão a uma posição base (x, z). */
function exp2([x, z]: Ponto2): Ponto2 {
  return [x * EXPANSAO, z * EXPANSAO];
}

export type Ponto2 = [number, number];

/** Rotação Y que vira um objeto em (x, z) pra encarar a fogueira. */
export function encararCentro([x, z]: Ponto2): number {
  return Math.atan2(-x, -z);
}

export const CAPELA = { pos: exp2([0.5, -8.6]), rotY: 0 };
export const CORETO = {
  pos: exp2([-6.4, -3.2]),
  rotY: encararCentro(exp2([-6.4, -3.2])),
};

export type BarracaLayout = {
  id: string;
  /** Lugar do mapa da festa aberto ao tocar nesta barraca (content/arraial.ts). */
  lugarId: string;
  pos: Ponto2;
  rotY: number;
  corToldo: [string, string];
  corPaineis: string[];
  itens: "comidas" | "brincadeiras" | "kambada";
};

/** As quatro barracas da referência mais a pescaria (reaproveita o módulo). */
export const BARRACAS: BarracaLayout[] = [
  {
    id: "canjica",
    lugarId: "canjica",
    pos: exp2([-4.6, 3.4]),
    rotY: encararCentro(exp2([-4.6, 3.4])),
    corToldo: ["#D9453A", "#F3E4C2"],
    corPaineis: ["#2E9B8F", "#E9B93E", "#D9453A", "#2E9B8F"],
    itens: "comidas",
  },
  {
    id: "kambada",
    lugarId: "barraca",
    pos: exp2([-2.0, 6.6]),
    rotY: encararCentro(exp2([-2.0, 6.6])),
    corToldo: ["#2F5FA8", "#F3E4C2"],
    corPaineis: ["#E9B93E", "#2F5FA8", "#F3E4C2", "#E9B93E"],
    itens: "kambada",
  },
  {
    id: "milho",
    lugarId: "milho",
    pos: exp2([5.2, 2.2]),
    rotY: encararCentro(exp2([5.2, 2.2])),
    corToldo: ["#2E9B8F", "#E9B93E"],
    corPaineis: ["#D9453A", "#2E9B8F", "#E9B93E", "#D9453A"],
    itens: "comidas",
  },
  {
    id: "maca",
    lugarId: "maca",
    pos: exp2([7.2, -2.4]),
    rotY: encararCentro(exp2([7.2, -2.4])),
    corToldo: ["#E9B93E", "#2E9B8F"],
    corPaineis: ["#2E9B8F", "#E9B93E", "#D9453A", "#2E9B8F"],
    itens: "comidas",
  },
  {
    id: "pescaria",
    lugarId: "pescaria",
    pos: exp2([-5.2, -7.6]),
    rotY: encararCentro(exp2([-5.2, -7.6])),
    corToldo: ["#3E86C8", "#F3E4C2"],
    corPaineis: ["#3E86C8", "#F3E4C2", "#E9B93E", "#3E86C8"],
    itens: "brincadeiras",
  },
];

/** Postes de lanterna na borda da praça (6, como na referência). */
export const POSTES_LANTERNA: Ponto2[] = (
  [
    [2.6, -3.4],
    [-2.8, -3.6],
    [5.0, 4.6],
    [-6.2, 0.6],
    [1.4, 6.2],
    [-2.2, 4.9],
  ] as Ponto2[]
).map(exp2);

/** Varais de bandeirinhas cruzando a praça: pares de âncoras [x, y, z]. */
const VARAIS_BASE: [THREE.Vector3Tuple, THREE.Vector3Tuple][] = [
  [
    [-5.2, 3.9, -4.2],
    [-0.6, 5.0, -7.2],
  ], // coreto -> capela
  [
    [1.6, 5.0, -7.2],
    [6.6, 3.2, -3.4],
  ], // capela -> barraca da maçã
  [
    [-2.8, 3.1, -3.6],
    [2.6, 3.1, -3.4],
  ], // entre os postes de trás
  [
    [-6.2, 3.1, 0.6],
    [-2.2, 3.1, 4.9],
  ], // poste da esquerda -> poste da frente
  [
    [5.0, 3.1, 4.6],
    [1.4, 3.1, 6.2],
  ], // poste da direita -> poste da frente
  [
    [-2.8, 3.1, -3.6],
    [-6.2, 3.1, 0.6],
  ], // fecha o lado esquerdo
  [
    [2.6, 3.1, -3.4],
    [5.0, 3.1, 4.6],
  ], // fecha o lado direito
];
export const VARAIS: [THREE.Vector3Tuple, THREE.Vector3Tuple][] =
  VARAIS_BASE.map(([a, b]) => [
    [a[0] * EXPANSAO, a[1], a[2] * EXPANSAO],
    [b[0] * EXPANSAO, b[1], b[2] * EXPANSAO],
  ]);

/** Trechos de cerca baixa (início, fim), decorativos, perto da entrada e da barraca da direita. */
export const CERCAS: [Ponto2, Ponto2][] = (
  [
    [
      [3.6, 7.4],
      [6.2, 8.6],
    ],
    [
      [8.4, 0.8],
      [9.6, 3.4],
    ],
    [
      [-8.6, 5.2],
      [-6.9, 7.4],
    ],
  ] as [Ponto2, Ponto2][]
).map(([a, b]) => [exp2(a), exp2(b)]);

/** Bancos voltados pra fogueira. */
export const BANCOS: Ponto2[] = (
  [
    [-2.6, 3.8],
    [3.8, -1.2],
    [0.6, 3.8],
    [-3.6, -3.0],
    [4.2, 4.4],
  ] as Ponto2[]
).map(exp2);

/** Rodas e grupos de figurantes (Figurantes.tsx lê daqui). */
export const QUADRILHA: Ponto2 = exp2([-2.6, -1.4]);
export const TAMBOR_DE_CRIOULA: Ponto2 = exp2([5.2, 3.0]);
/**
 * Passeantes: figurantes parados ou conversando em anel ao redor da fogueira
 * (2,5 a 3,5 m) e entre as barracas, pra praça expandida continuar cheia.
 */
export const PASSEANTES: {
  pos: Ponto2;
  rotY: number;
  traje:
    | "quadrilheiro"
    | "quadrilheira"
    | "aquecedor"
    | "vendedora"
    | "tocador-tambor";
  variante: number;
}[] = (
  [
    { b: [2.9, -1.6], traje: "quadrilheiro", variante: 2 },
    { b: [3.3, -0.4], traje: "quadrilheira", variante: 2 },
    { b: [-1.2, 3.1], traje: "quadrilheiro", variante: 2 },
    { b: [-2.4, -2.9], traje: "quadrilheira", variante: 0 },
    { b: [1.2, 3.4], traje: "tocador-tambor", variante: 0 },
    { b: [5.4, 5.6], traje: "quadrilheira", variante: 3 },
    { b: [-7.2, 5.4], traje: "quadrilheiro", variante: 1 },
    { b: [7.4, -4.6], traje: "quadrilheira", variante: 1 },
    { b: [3.4, 3.0], traje: "quadrilheiro", variante: 2 },
    { b: [4.9, 2.2], traje: "quadrilheira", variante: 2 },
  ] as {
    b: Ponto2;
    traje:
      | "quadrilheiro"
      | "quadrilheira"
      | "aquecedor"
      | "vendedora"
      | "tocador-tambor";
    variante: number;
  }[]
).map(({ b, traje, variante }) => ({
  pos: exp2(b),
  rotY: encararCentro(exp2(b)) + (variante - 1.5) * 0.5,
  traje,
  variante,
}));

/** O trio de forró toca em cima do coreto (piso a ~0.7 m), na beira da frente, com os instrumentos do coreto atrás. */
export const TRIO_FORRO = {
  pos: [
    CORETO.pos[0] + Math.sin(CORETO.rotY) * 1.05,
    CORETO.pos[1] + Math.cos(CORETO.rotY) * 1.05,
  ] as Ponto2,
  y: 0.72,
  rotY: CORETO.rotY,
};

/** Pontos de conversa (NPCs) e o "!" que flutua sobre cada um. */
export const PONTOS_NPC: Record<
  string,
  { x: number; z: number; alturaMarcador: number }
> = {
  noivos: { x: 0.2 * EXPANSAO, z: -5.0 * EXPANSAO - 1.2, alturaMarcador: 2.5 },
  fogueira: { x: 2.6 * EXPANSAO, z: 1.6 * EXPANSAO, alturaMarcador: 2.3 },
  boi: { x: 4.6 * EXPANSAO, z: -5.4 * EXPANSAO, alturaMarcador: 2.6 },
  brincante: { x: -4.4 * EXPANSAO, z: 1.6 * EXPANSAO, alturaMarcador: 2.4 },
  barraca: { x: -1.7 * EXPANSAO, z: 5.0 * EXPANSAO - 0.4, alturaMarcador: 3.4 },
};

/** Ponto do minigame de pescaria: na frente da barraca da pescaria. */
export const PONTO_PESCARIA = (() => {
  const b = BARRACAS.find((x) => x.id === "pescaria")!;
  const dx = -b.pos[0];
  const dz = -b.pos[1];
  const d = Math.hypot(dx, dz);
  return {
    x: b.pos[0] + (dx / d) * 1.7,
    z: b.pos[1] + (dz / d) * 1.7,
    alturaMarcador: 2.2,
  };
})();

/** Caminho de terra: do primeiro plano (canto inferior esquerdo) até a praça. */
export const CAMINHO = new THREE.CatmullRomCurve3(
  [
    [-11.5, 24],
    [-9.8, 17],
    [-7.4, 11.2],
    [-4.6, 7.6],
    [-2.2, 5.2],
  ].map(([x, z]) => new THREE.Vector3(x * EXPANSAO, 0, z * EXPANSAO)),
);

/** Ponto de entrada do jogador: no fim do caminho, já dentro da clareira. */
export const ENTRADA: Ponto2 = exp2([-4.2, 8.2]);

/** Colisores derivados do layout (fogueira, capela, coreto, barracas, postes, bancos, cercas). */
export function colisoresDoLayout(): Colisor[] {
  const lista: Colisor[] = [
    { x: 0, z: 0, r: 1.9 },
    { x: CAPELA.pos[0], z: CAPELA.pos[1], r: 3.0 },
    { x: CORETO.pos[0], z: CORETO.pos[1], r: 2.6 },
    ...BARRACAS.map((b) => ({ x: b.pos[0], z: b.pos[1], r: 1.5 })),
    ...POSTES_LANTERNA.map(([x, z]) => ({ x, z, r: 0.28 })),
    ...BANCOS.map(([x, z]) => ({ x, z, r: 0.55 })),
    { x: QUADRILHA[0], z: QUADRILHA[1], r: 2.4 },
    ...PASSEANTES.map((p) => ({ x: p.pos[0], z: p.pos[1], r: 0.45 })),
    { x: TAMBOR_DE_CRIOULA[0], z: TAMBOR_DE_CRIOULA[1], r: 2.2 },
  ];
  for (const [a, b] of CERCAS) {
    const n = 4;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      lista.push({
        x: a[0] + (b[0] - a[0]) * t,
        z: a[1] + (b[1] - a[1]) * t,
        r: 0.3,
      });
    }
  }
  return lista;
}

/**
 * Onde o personagem para ao "ir até" cada lugar do mapa da festa: pontos de
 * NPC/minigame usam a própria posição; capela e coreto param na frente,
 * do lado da praça.
 */
export function pontoDeParada(id: string): Ponto2 | null {
  if (id in PONTOS_NPC) return [PONTOS_NPC[id].x, PONTOS_NPC[id].z];
  if (id === "pescaria") return [PONTO_PESCARIA.x, PONTO_PESCARIA.z];
  const alvo =
    id === "capela"
      ? CAPELA.pos
      : id === "coreto"
        ? CORETO.pos
        : BARRACAS.find((b) => b.id === id)?.pos;
  if (!alvo) return null;
  const dx = -alvo[0];
  const dz = -alvo[1];
  const d = Math.hypot(dx, dz);
  const recuo = id === "capela" ? 4.6 : id === "coreto" ? 3.8 : 2.4;
  return [alvo[0] + (dx / d) * recuo, alvo[1] + (dz / d) * recuo];
}
