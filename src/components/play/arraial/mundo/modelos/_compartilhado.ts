/**
 * Utilitários compartilhados pelos modelos procedurais do arraial (Three.js
 * puro, sem React): cada modelo é uma factory que devolve um `THREE.Group`
 * nomeado, action-ready (pivôs úteis, nomes estáveis pra click targets e
 * pra o modo explodido de debug). A Scene monta o grupo via `<primitive>`
 * e aplica o mesmo contorno por inverted hull da praça.
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { rampaToon } from "../../../../../lib/play/toon";
import { hashDeterministico } from "../../../../../lib/play/hash";

/** Paleta do arraial (lida das referências, ver docs/evidencias/gauntlet-arraial-3d/referencias-analise.md). */
export const PALETA = {
  madeiraClara: "#C8763A",
  madeira: "#A85A28",
  madeiraEscura: "#7A3E1C",
  madeiraSombra: "#5A2C12",
  telha: "#D2672C",
  telhaEscura: "#A84A1E",
  amarelo: "#E9B93E",
  vermelho: "#D9453A",
  verdeAgua: "#2E9B8F",
  azul: "#2F5FA8",
  azulClaro: "#3E86C8",
  creme: "#F3E4C2",
  laranja: "#F08A2E",
  chamaClara: "#FFE27A",
  chama: "#FFA630",
  chamaEscura: "#F0562A",
  lanterna: "#FFD27A",
  metal: "#5F4A32",
  pedra: "#8B7565",
  pedraEscura: "#5E4C40",
  terra: "#8C5A33",
  milho: "#F2C23A",
  folhaMilho: "#7FB24A",
  ceramica: "#2A8D86",
  tinta: "#1F160F",
} as const;

export type OpcoesMaterial = {
  emissivo?: string;
  intensidadeEmissiva?: number;
  ladoDuplo?: boolean;
  transparente?: boolean;
  opacidade?: number;
};

/** Material toon padrão da praça (rampa de 3 degraus, leitura de xilogravura). */
export function materialToon(cor: string, opcoes: OpcoesMaterial = {}): THREE.MeshToonMaterial {
  return new THREE.MeshToonMaterial({
    color: cor,
    gradientMap: rampaToon(3),
    emissive: opcoes.emissivo ?? "#000000",
    emissiveIntensity: opcoes.intensidadeEmissiva ?? 1,
    side: opcoes.ladoDuplo ? THREE.DoubleSide : THREE.FrontSide,
    transparent: opcoes.transparente ?? false,
    opacity: opcoes.opacidade ?? 1,
  });
}

/** Caixa com bisel legível (a linguagem "chunky" das referências). */
export function caixaBisel(l: number, a: number, p: number, raio = 0.03, segmentos = 2): THREE.BufferGeometry {
  const r = Math.min(raio, l / 2, a / 2, p / 2);
  return new RoundedBoxGeometry(l, a, p, segmentos, r);
}

export type Transformacao = {
  pos?: [number, number, number];
  rot?: [number, number, number];
  escala?: number | [number, number, number];
  nome?: string;
  semContorno?: boolean;
  /** Casca de contorno mais fina (membros de personagem), em vez da espessura padrão. */
  contornoFino?: boolean;
};

/** Cria uma malha já posicionada e nomeada. */
export function malha(geometria: THREE.BufferGeometry, material: THREE.Material, t: Transformacao = {}): THREE.Mesh {
  const m = new THREE.Mesh(geometria, material);
  if (t.pos) m.position.set(...t.pos);
  if (t.rot) m.rotation.set(...t.rot);
  if (t.escala !== undefined) {
    if (typeof t.escala === "number") m.scale.setScalar(t.escala);
    else m.scale.set(...t.escala);
  }
  if (t.nome) m.name = t.nome;
  if (t.semContorno) m.userData.semContorno = true;
  if (t.contornoFino) m.userData.contornoEspessura = ESPESSURA_CASCA_FINA;
  return m;
}

/** Grupo nomeado e posicionado (pivô útil pra animação e modo explodido). */
export function grupo(nome: string, t: Omit<Transformacao, "nome"> = {}): THREE.Group {
  const g = new THREE.Group();
  g.name = nome;
  if (t.pos) g.position.set(...t.pos);
  if (t.rot) g.rotation.set(...t.rot);
  if (t.escala !== undefined) {
    if (typeof t.escala === "number") g.scale.setScalar(t.escala);
    else g.scale.set(...t.escala);
  }
  return g;
}

/** Hash 0..1 determinístico (sem Math.random: variação estável entre remounts). */
export const hash = hashDeterministico;

/** Espessura de mundo alvo da casca de contorno, igual à do Contorno.tsx. */
const ESPESSURA_CASCA = 0.022;
/** Casca fina pra peças delgadas (braços e pernas dos bonecos). */
export const ESPESSURA_CASCA_FINA = 0.008;

/** Escala por eixo pra casca ter espessura ~constante (mesma regra do Contorno.tsx). */
function escalaCasca(geometria: THREE.BufferGeometry, espessura = ESPESSURA_CASCA): THREE.Vector3 {
  if (!geometria.boundingBox) geometria.computeBoundingBox();
  const tamanho = new THREE.Vector3();
  geometria.boundingBox?.getSize(tamanho);
  const eixo = (t: number) => 1 + (2 * espessura) / Math.max(t, 0.05);
  return new THREE.Vector3(eixo(tamanho.x), eixo(tamanho.y), eixo(tamanho.z));
}

/**
 * Contorno cartoon por inverted hull num grupo pronto (usado pelo harness da
 * forja e por quem monta o modelo fora do R3F). Na Scene, o `useContorno`
 * faz o mesmo na montagem; as duas rotinas respeitam `userData.semContorno`.
 */
export function aplicarContorno(alvo: THREE.Object3D): void {
  const cascas: THREE.Mesh[] = [];
  alvo.traverse((filho) => {
    if (!(filho instanceof THREE.Mesh) || filho.userData.contorno || filho.userData.semContorno) return;
    if (filho.geometry instanceof THREE.PlaneGeometry || filho.geometry instanceof THREE.CircleGeometry) return;
    const casca = new THREE.Mesh(filho.geometry, new THREE.MeshBasicMaterial({ color: PALETA.tinta, side: THREE.BackSide }));
    casca.scale.copy(escalaCasca(filho.geometry, filho.userData.contornoEspessura));
    casca.userData.contorno = true;
    cascas.push(casca);
    filho.add(casca);
  });
}

/**
 * Modo explodido de debug: afasta cada filho direto do grupo raiz ao longo
 * da direção do seu centro, proporcional a `fator` (0 = montado).
 */
export function explodir(raiz: THREE.Object3D, fator: number): void {
  const centroRaiz = new THREE.Box3().setFromObject(raiz).getCenter(new THREE.Vector3());
  for (const filho of raiz.children) {
    const c = new THREE.Box3().setFromObject(filho).getCenter(new THREE.Vector3());
    const dir = c.sub(centroRaiz);
    if (dir.lengthSq() < 1e-6) dir.set(0, 1, 0);
    filho.position.add(dir.multiplyScalar(fator * 0.8));
  }
}

/** Libera geometrias e materiais de um grupo inteiro (contrapartida do `dispose` do R3F). */
export function descartar(raiz: THREE.Object3D): void {
  raiz.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      // Geometrias de cache compartilhado (personagem.ts) vivem a sessão inteira.
      if (!o.geometry.userData.compartilhado) o.geometry.dispose();
      const m = o.material as THREE.Material | THREE.Material[];
      // Materiais compartilhados entre instâncias (ver criarLanterna) vivem a sessão inteira.
      const solto = (x: THREE.Material) => {
        if (!x.userData.compartilhado) x.dispose();
      };
      if (Array.isArray(m)) m.forEach(solto);
      else solto(m);
    }
  });
}

/**
 * Lanterna de latão pendurada (a mesma do coreto e das barracas), com origem
 * no gancho e corpo em -Y, pra pendurar em postes e beirais com o mesmo
 * acabamento em toda a praça. Materiais compartilhados entre chamadas.
 */
let materiaisLanterna: { metal: THREE.MeshToonMaterial; vidro: THREE.MeshToonMaterial } | null = null;
export function criarLanterna(nome = "lanterna", escala = 1.45): THREE.Group {
  if (!materiaisLanterna) {
    materiaisLanterna = {
      metal: materialToon("#3E2E20"),
      vidro: materialToon(PALETA.chama, { emissivo: PALETA.chamaEscura, intensidadeEmissiva: 0.55 }),
    };
    // Um único par de materiais pra todas as lanternas: `descartar` não os libera.
    materiaisLanterna.metal.userData.compartilhado = true;
    materiaisLanterna.vidro.userData.compartilhado = true;
  }
  const g = grupo(nome, { escala });
  const gancho = new THREE.TorusGeometry(0.05, 0.013, 3, 8, Math.PI * 1.5);
  gancho.rotateY(Math.PI / 2);
  gancho.translate(0, -0.05, 0);
  const alca = new THREE.TorusGeometry(0.075, 0.011, 3, 8, Math.PI);
  alca.rotateY(Math.PI / 2);
  alca.translate(0, -0.19, 0);
  const capuz = new THREE.ConeGeometry(0.105, 0.09, 8).translate(0, -0.235, 0);
  const colar = new THREE.CylinderGeometry(0.04, 0.055, 0.035, 8).translate(0, -0.19, 0);
  const aro = new THREE.TorusGeometry(0.084, 0.011, 3, 8);
  aro.rotateX(Math.PI / 2);
  aro.translate(0, -0.39, 0);
  const base = new THREE.CylinderGeometry(0.078, 0.095, 0.055, 8).translate(0, -0.515, 0);
  const barras: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    const ang = (i * Math.PI) / 2 + Math.PI / 4;
    barras.push(new THREE.BoxGeometry(0.016, 0.23, 0.016).translate(Math.sin(ang) * 0.082, -0.39, Math.cos(ang) * 0.082));
  }
  const metal = mergeGeometries([gancho, alca, capuz, colar, aro, base, ...barras]);
  if (metal) g.add(malha(metal, materiaisLanterna.metal, { nome: `${nome}-metal`, semContorno: true }));
  const perfil = [
    new THREE.Vector2(0.001, -0.5),
    new THREE.Vector2(0.055, -0.495),
    new THREE.Vector2(0.078, -0.45),
    new THREE.Vector2(0.082, -0.39),
    new THREE.Vector2(0.072, -0.32),
    new THREE.Vector2(0.048, -0.285),
    new THREE.Vector2(0.001, -0.28),
  ];
  g.add(malha(new THREE.LatheGeometry(perfil, 9), materiaisLanterna.vidro, { nome: `${nome}-vidro`, semContorno: true }));
  return g;
}
