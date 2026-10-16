/**
 * Personagens do arraial no estilo "boneco cartoon" das referências
 * (docs/evidencias/gauntlet-arraial-3d/referencias-personagens/): cabeça
 * esférica lisa com dois olhos de bolinha, tronco em cápsula, membros em
 * tubos arredondados, pés grandes e trajes como volumes sólidos por cima do
 * corpo. Proporções da spec do Rohan (altura total H): cabeça 0,19 H,
 * tronco 0,30 H, pernas 0,40 H, pés 0,14 × 0,07 × 0,05 H.
 *
 * Hierarquia (pivôs úteis pra animação):
 * personagem
 * ├── quadril (translação do quica)
 * │   ├── tronco (+ roupa de tronco)
 * │   ├── cabeca (pivô no pescoço) → esfera, olhos, chapéu
 * │   ├── braco-esq / braco-dir (pivô no ombro) → tubo, mão, "mao-esq/dir" (encaixe do acessório)
 * └── perna-esq / perna-dir (pivô no quadril) → tubo, pé
 */
import * as THREE from "three";
import { PALETA, caixaBisel, grupo, malha, materialToon as criarMaterialToon, aplicarContorno, explodir, hash, type OpcoesMaterial } from "./_compartilhado";

export { aplicarContorno, explodir };

/**
 * Materiais por cor (e opções) compartilhados entre todos os bonecos: uma
 * praça com 25 personagens repete as mesmas dezenas de cores. Marcados como
 * compartilhados, `descartar` não os libera.
 */
const cacheMat = new Map<string, THREE.MeshToonMaterial>();
function materialToon(cor: string, opcoes: OpcoesMaterial = {}): THREE.MeshToonMaterial {
  const chave = cor + JSON.stringify(opcoes);
  let m = cacheMat.get(chave);
  if (!m) {
    m = criarMaterialToon(cor, opcoes);
    m.userData.compartilhado = true;
    cacheMat.set(chave, m);
  }
  return m;
}

export type Traje =
  | "jogador"
  | "ze"
  | "francisca"
  | "padre"
  | "chico"
  | "ritinha"
  | "vendedora"
  | "quadrilheiro"
  | "quadrilheira"
  | "sanfoneiro"
  | "zabumbeiro"
  | "triangulo"
  | "coreira"
  | "tocador-tambor"
  | "aquecedor";

export type OpcoesPersonagem = {
  traje: Traje;
  /** Índice de variação (cores de roupa em famílias). */
  variante?: number;
  corPele?: string;
  /** Altura total em metros (padrão 1,5 m). */
  altura?: number;
};

/** Paleta da spec de personagens (seção A.9 e B). */
export const CORES = {
  peleClara: "#F2C9A0",
  peleMedia: "#D9A066",
  peleEscura: "#8A5A3B",
  olho: "#1A1A1A",
  branco: "#F5F1E6",
  palha: "#D9B86C",
  couro: "#5A3A24",
  couroClaro: "#8A6A44",
  jeans: "#3E5C8A",
  vermelho: "#C73E2C",
  amarelo: "#F5D142",
  verde: "#5BAE6B",
  azulClaro: "#8FC8E8",
  preto: "#1A1A1A",
  sola: "#2A2A2A",
  marromEscuro: "#3E2A18",
  metal: "#C9C9C9",
} as const;

const PELES = [CORES.peleMedia, CORES.peleClara, CORES.peleEscura];

/* -------------------------------------------------------------- geometrias */

const cacheGeo = new Map<string, THREE.BufferGeometry>();
function geo(chave: string, criar: () => THREE.BufferGeometry): THREE.BufferGeometry {
  let g = cacheGeo.get(chave);
  if (!g) {
    g = criar();
    // Compartilhada entre todos os bonecos: `descartar` não a libera.
    g.userData.compartilhado = true;
    cacheGeo.set(chave, g);
  }
  return g;
}

/** Cápsula vertical com afinamento (topo mais largo): LatheGeometry suave. */
function capsulaAfinada(rTopo: number, rBase: number, altura: number, segs = 14): THREE.BufferGeometry {
  const pontos: THREE.Vector2[] = [];
  const n = 10;
  // Calota inferior
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    pontos.push(new THREE.Vector2(rBase * Math.sin(a), rBase - rBase * Math.cos(a)));
  }
  // Lateral com afinamento
  pontos.push(new THREE.Vector2(rTopo, altura - rTopo));
  // Calota superior
  for (let i = 1; i <= n; i++) {
    const a = (i / n) * (Math.PI / 2);
    pontos.push(new THREE.Vector2(rTopo * Math.cos(a), altura - rTopo + rTopo * Math.sin(a)));
  }
  return new THREE.LatheGeometry(pontos, segs);
}

/** Tubo arredondado (membro), origem no topo (pivô), corpo em -Y. */
function membro(rTopo: number, rBase: number, comprimento: number): THREE.BufferGeometry {
  const g = capsulaAfinada(rTopo, rBase, comprimento, 12);
  g.rotateX(Math.PI);
  return g;
}

/** Pé tipo "pão": caixa arredondada. */
function pe(comp: number, larg: number, alt: number): THREE.BufferGeometry {
  return caixaBisel(larg, alt, comp, alt * 0.45, 2);
}

/** Saia/vestido rodado: cone invertido com babados (tori). */
function saia(rCintura: number, rBarra: number, altura: number, segs = 18): THREE.BufferGeometry {
  const pontos = [
    new THREE.Vector2(rCintura * 0.6, altura),
    new THREE.Vector2(rCintura, altura),
    new THREE.Vector2(rCintura * 1.15, altura * 0.72),
    new THREE.Vector2(rBarra * 0.85, altura * 0.3),
    new THREE.Vector2(rBarra, 0.02),
    new THREE.Vector2(rBarra * 0.92, 0),
    new THREE.Vector2(0.001, 0),
  ];
  return new THREE.LatheGeometry(pontos, segs);
}

/* -------------------------------------------------------------- corpo base */

type Corpo = {
  raiz: THREE.Group;
  quadril: THREE.Group;
  tronco: THREE.Mesh;
  cabeca: THREE.Group;
  bracos: [THREE.Group, THREE.Group];
  maos: [THREE.Group, THREE.Group];
  pernas: [THREE.Group, THREE.Group];
  H: number;
  medidas: { cabeca: number; ombro: number; quadril: number; tronco: number; braco: number; perna: number; pe: number; yQuadril: number; yOmbro: number; yPescoco: number };
};

function construirCorpo(H: number, corPele: string, corPernas: string, corPes: string, corSola: string | null): Corpo {
  const raiz = grupo("personagem");
  // Silhueta esguia das referências: ombros estreitos, membros finos e
  // compridos, cabeça grande e lisa, pés graúdos.
  const m = {
    cabeca: 0.21 * H,
    ombro: 0.3 * H,
    quadril: 0.21 * H,
    tronco: 0.3 * H,
    braco: 0.36 * H,
    perna: 0.4 * H,
    pe: 0.16 * H,
    yQuadril: 0.5 * H,
    yOmbro: 0.78 * H,
    yPescoco: 0.79 * H,
  };
  const pele = materialToon(corPele);

  const quadril = grupo("quadril", { pos: [0, m.yQuadril, 0] });
  raiz.add(quadril);

  // Tronco: cápsula afinada (ombro largo, quadril estreito), origem no quadril.
  const tronco = malha(geo(`tronco-${H}`, () => capsulaAfinada(m.ombro / 2, m.quadril / 2, m.tronco + m.quadril / 2, 16)), pele, {
    pos: [0, -m.quadril / 2 + 0.005, 0],
    nome: "tronco",
  });
  quadril.add(tronco);

  // Cabeça: esfera com dois olhos.
  const cabeca = grupo("cabeca", { pos: [0, m.yPescoco - m.yQuadril, 0] });
  cabeca.add(malha(geo(`cabeca-${H}`, () => new THREE.SphereGeometry(m.cabeca / 2, 20, 16)), pele, { pos: [0, m.cabeca / 2 - 0.01, 0], nome: "cranio" }));
  const olho = geo(`olho-${H}`, () => new THREE.SphereGeometry(0.011 * H, 8, 6));
  const matOlho = materialToon(CORES.olho);
  for (const lado of [-1, 1]) {
    cabeca.add(
      malha(olho, matOlho, {
        pos: [lado * 0.03 * H, m.cabeca * 0.42, m.cabeca / 2 - 0.004 * H],
        nome: lado < 0 ? "olho-esq" : "olho-dir",
        semContorno: true,
      })
    );
  }
  quadril.add(cabeca);

  // Braços: pivô no ombro.
  const bracos: THREE.Group[] = [];
  const maos: THREE.Group[] = [];
  const geoBraco = geo(`braco-${H}`, () => membro(0.044 * H, 0.038 * H, m.braco));
  const geoMao = geo(`mao-${H}`, () => new THREE.SphereGeometry(0.034 * H, 10, 8));
  for (const lado of [-1, 1]) {
    const b = grupo(lado < 0 ? "braco-esq" : "braco-dir", {
      pos: [lado * (m.ombro / 2 - 0.01 * H), m.yOmbro - m.yQuadril, 0],
      rot: [0, 0, -lado * 0.12],
    });
    b.add(malha(geoBraco, pele, { nome: "tubo", contornoFino: true }));
    const mao = grupo(lado < 0 ? "mao-esq" : "mao-dir", { pos: [0, -m.braco - 0.01 * H, 0] });
    mao.add(malha(geoMao, pele, { nome: "mao", semContorno: true }));
    b.add(mao);
    quadril.add(b);
    bracos.push(b);
    maos.push(mao);
  }

  // Pernas: pivô no quadril (na raiz, não no grupo do quica).
  const pernas: THREE.Group[] = [];
  const geoPerna = geo(`perna-${H}`, () => membro(0.052 * H, 0.046 * H, m.perna - 0.03 * H));
  const geoPe = geo(`pe-${H}`, () => pe(m.pe, 0.08 * H, 0.06 * H));
  const matPerna = materialToon(corPernas);
  const matPe = materialToon(corPes);
  for (const lado of [-1, 1]) {
    const p = grupo(lado < 0 ? "perna-esq" : "perna-dir", { pos: [lado * 0.045 * H, m.yQuadril, 0] });
    p.add(malha(geoPerna, matPerna, { nome: "tubo", contornoFino: true }));
    const pes = grupo("pe", { pos: [0, -m.yQuadril + 0.025 * H, 0.02 * H] });
    pes.add(malha(geoPe, matPe, { nome: "sapato" }));
    if (corSola) {
      pes.add(malha(geo(`sola-${H}`, () => caixaBisel(0.072 * H, 0.012 * H, 0.142 * H, 0.004, 1)), materialToon(corSola), { pos: [0, -0.022 * H, 0], nome: "sola", semContorno: true }));
    }
    p.add(pes);
    raiz.add(p);
    pernas.push(p);
  }

  return { raiz, quadril, tronco, cabeca, bracos: [bracos[0], bracos[1]], maos: [maos[0], maos[1]], pernas: [pernas[0], pernas[1]], H, medidas: m };
}

/* -------------------------------------------------------------- peças de traje */

function camisa(c: Corpo, cor: string, mangas = true): void {
  const { H, medidas: m } = c;
  c.quadril.add(
    malha(geo(`camisa-${H}`, () => capsulaAfinada(m.ombro / 2 + 0.015 * H, m.quadril / 2 + 0.012 * H, m.tronco + m.quadril / 2 + 0.01 * H, 16)), materialToon(cor), {
      pos: [0, -m.quadril / 2 - 0.005 * H, 0],
      nome: "camisa",
    })
  );
  if (mangas) {
    for (const b of c.bracos) {
      b.add(malha(geo(`manga-${H}`, () => membro(0.054 * H, 0.048 * H, 0.14 * H)), materialToon(cor), { pos: [0, 0.005 * H, 0], nome: "manga", contornoFino: true }));
    }
  }
}

/** Camisa xadrez: base + 3 faixas finas em relevo baixo (o xadrez lê de longe como listras). */
function camisaXadrez(c: Corpo, base: string, listra: string): void {
  camisa(c, base);
  const { H } = c;
  const mat = materialToon(listra);
  // Raios seguem o afinamento da camisa (quadril estreito, ombro largo).
  const raios = [0.115, 0.135, 0.155];
  raios.forEach((r, i) => {
    c.quadril.add(
      malha(geo(`listra-${H}-${i}`, () => new THREE.TorusGeometry(r * H, 0.009 * H, 5, 22)), mat, {
        pos: [0, 0.02 * H + i * 0.075 * H, 0],
        rot: [Math.PI / 2, 0, 0],
        nome: "listra",
        semContorno: true,
      })
    );
  });
}

function chapeuPalha(c: Corpo, aba = 1): void {
  const { H, cabeca, medidas: m } = c;
  const mat = materialToon(CORES.palha);
  cabeca.add(malha(geo(`aba-${H}-${aba}`, () => new THREE.CylinderGeometry(m.cabeca * 0.72 * aba, m.cabeca * 0.76 * aba, 0.012 * H, 20)), mat, { pos: [0, m.cabeca * 0.78, 0], nome: "aba-chapeu", semContorno: true }));
  cabeca.add(malha(geo(`copa-${H}`, () => new THREE.ConeGeometry(m.cabeca * 0.42, m.cabeca * 0.5, 16)), mat, { pos: [0, m.cabeca * 1.0, 0], nome: "copa-chapeu" }));
  cabeca.add(malha(geo(`fita-chapeu-${H}`, () => new THREE.TorusGeometry(m.cabeca * 0.4, 0.008 * H, 6, 20)), materialToon(CORES.couro), { pos: [0, m.cabeca * 0.8, 0], rot: [Math.PI / 2, 0, 0], nome: "fita-chapeu", semContorno: true }));
}

function chapeuCouro(c: Corpo): void {
  const { H, cabeca, medidas: m } = c;
  const mat = materialToon(CORES.couro);
  cabeca.add(malha(geo(`aba-couro-${H}`, () => new THREE.CylinderGeometry(m.cabeca * 0.64, m.cabeca * 0.7, 0.014 * H, 18)), mat, { pos: [0, m.cabeca * 0.8, 0], nome: "aba-chapeu", semContorno: true }));
  cabeca.add(malha(geo(`copa-couro-${H}`, () => new THREE.CylinderGeometry(m.cabeca * 0.36, m.cabeca * 0.42, m.cabeca * 0.4, 16)), mat, { pos: [0, m.cabeca * 1.0, 0], nome: "copa-chapeu" }));
}

function turbante(c: Corpo, cor: string, corDetalhe: string): void {
  const { H, cabeca, medidas: m } = c;
  cabeca.add(malha(geo(`turbante-${H}`, () => new THREE.TorusGeometry(m.cabeca * 0.42, m.cabeca * 0.16, 10, 18)), materialToon(cor), { pos: [0, m.cabeca * 0.82, 0], rot: [Math.PI / 2, 0, 0], nome: "turbante" }));
  cabeca.add(malha(geo(`turbante-topo-${H}`, () => new THREE.SphereGeometry(m.cabeca * 0.38, 14, 10)), materialToon(cor), { pos: [0, m.cabeca * 0.9, 0], nome: "turbante-topo" }));
  cabeca.add(malha(geo(`ponta-turbante-${H}`, () => caixaBisel(0.05 * H, 0.09 * H, 0.02 * H, 0.008, 1)), materialToon(corDetalhe), { pos: [m.cabeca * 0.5, m.cabeca * 0.72, 0], rot: [0, 0, 0.5], nome: "ponta-turbante", semContorno: true }));
}

function veu(c: Corpo): void {
  const { H, cabeca, medidas: m } = c;
  const mat = materialToon(CORES.branco, { transparente: true, opacidade: 0.72, ladoDuplo: true });
  cabeca.add(malha(geo(`veu-${H}`, () => new THREE.ConeGeometry(m.cabeca * 0.7, 0.42 * H, 14, 1, true)), mat, { pos: [0, m.cabeca * 0.95 - 0.21 * H, -0.03 * H], nome: "veu", semContorno: true }));
  cabeca.add(malha(geo(`tiara-${H}`, () => new THREE.TorusGeometry(m.cabeca * 0.44, 0.008 * H, 6, 18)), materialToon(CORES.amarelo), { pos: [0, m.cabeca * 0.85, 0], rot: [Math.PI / 2, 0, 0], nome: "tiara", semContorno: true }));
}

function vestido(c: Corpo, cor: string, corBabado: string, altura: number): void {
  const { H, quadril, medidas: m } = c;
  quadril.add(malha(geo(`saia-${H}-${altura}`, () => saia(m.quadril / 2 + 0.01 * H, 0.2 * H, altura)), materialToon(cor), { pos: [0, -altura + 0.02 * H, 0], nome: "saia" }));
  const mat = materialToon(corBabado);
  for (const f of [0.28, 0.6]) {
    const r = (0.2 * H) * (1 - f * 0.55) + 0.01 * H;
    quadril.add(malha(geo(`babado-${H}-${f}`, () => new THREE.TorusGeometry(r, 0.012 * H, 6, 24)), mat, { pos: [0, -altura + 0.02 * H + altura * f, 0], rot: [Math.PI / 2, 0, 0], nome: "babado", semContorno: true }));
  }
}

function batina(c: Corpo): void {
  const { H, quadril, medidas: m } = c;
  quadril.add(malha(geo(`batina-${H}`, () => capsulaAfinada(m.ombro / 2 + 0.008 * H, 0.15 * H, m.tronco + m.quadril / 2 + 0.42 * H, 16)), materialToon(CORES.preto), { pos: [0, -0.44 * H, 0], nome: "batina" }));
  // Colarinho creme largo: o ponto de leitura do padre a distância.
  quadril.add(malha(geo(`colarinho-${H}`, () => new THREE.TorusGeometry(0.075 * H, 0.02 * H, 6, 18)), materialToon(CORES.branco), { pos: [0, m.yPescoco - m.yQuadril - 0.006 * H, 0], rot: [Math.PI / 2, 0, 0], nome: "colarinho", semContorno: true }));
  // Mangas em grafite (separam do corpo da batina) com punho creme; as mãos ficam à mostra.
  for (const b of c.bracos) {
    b.add(malha(geo(`manga-batina-${H}`, () => membro(0.058 * H, 0.052 * H, 0.3 * H)), materialToon("#2E2E2E"), { nome: "manga", contornoFino: true }));
    b.add(malha(geo(`punho-${H}`, () => new THREE.TorusGeometry(0.05 * H, 0.012 * H, 6, 14)), materialToon(CORES.branco), { pos: [0, -0.3 * H, 0], rot: [Math.PI / 2, 0, 0], nome: "punho", semContorno: true }));
  }
}

function colete(c: Corpo, cor: string, corCamisa: string = CORES.branco): void {
  const { H, quadril, medidas: m } = c;
  quadril.add(malha(geo(`colete-${H}`, () => capsulaAfinada(m.ombro / 2 + 0.028 * H, m.quadril / 2 + 0.02 * H, m.tronco * 0.72, 16, )), materialToon(cor), { pos: [0, m.tronco * 0.16, 0], nome: "colete" }));
  // Abertura central: faixa da camisa aparece
  quadril.add(malha(geo(`abertura-${H}`, () => caixaBisel(0.05 * H, m.tronco * 0.6, 0.02 * H, 0.006, 1)), materialToon(corCamisa), { pos: [0, m.tronco * 0.5, m.ombro / 2 + 0.02 * H], nome: "abertura-colete", semContorno: true }));
}

function paleto(c: Corpo, cor: string, remendos: string[]): void {
  camisa(c, cor);
  const { H, quadril, medidas: m } = c;
  remendos.forEach((r, i) => {
    const h = hash(i + 11);
    quadril.add(malha(geo(`remendo-${H}`, () => caixaBisel(0.05 * H, 0.05 * H, 0.012 * H, 0.006, 1)), materialToon(r), { pos: [(h - 0.5) * 0.2 * H, 0.04 * H + i * 0.06 * H, m.ombro / 2 + 0.008 * H], rot: [0, 0, (h - 0.5) * 0.6], nome: "remendo", semContorno: true }));
  });
  // Gravata torta
  quadril.add(malha(geo(`gravata-${H}`, () => caixaBisel(0.03 * H, 0.16 * H, 0.012 * H, 0.008, 1)), materialToon(CORES.vermelho), { pos: [0.01 * H, m.tronco * 0.55, m.ombro / 2 + 0.014 * H], rot: [0, 0, 0.3], nome: "gravata", semContorno: true }));
}

function avental(c: Corpo): void {
  const { H, quadril, medidas: m } = c;
  // Avental de cintura: peça estreita e arredondada, com alças finas e bolso,
  // pra ler como pano amarrado ao corpo (e não como placa segurada).
  quadril.add(malha(geo(`avental-${H}`, () => caixaBisel(0.15 * H, 0.2 * H, 0.014 * H, 0.03, 2)), materialToon(CORES.branco), { pos: [0, m.tronco * 0.28, m.quadril / 2 + 0.03 * H], rot: [0.08, 0, 0], nome: "avental", semContorno: true }));
  quadril.add(malha(geo(`bolso-${H}`, () => caixaBisel(0.08 * H, 0.06 * H, 0.01 * H, 0.012, 1)), materialToon(CORES.vermelho), { pos: [0, m.tronco * 0.22, m.quadril / 2 + 0.042 * H], nome: "bolso", semContorno: true }));
  const matAlca = materialToon(CORES.branco);
  for (const lado of [-1, 1]) {
    quadril.add(malha(geo(`alca-${H}`, () => new THREE.CylinderGeometry(0.008 * H, 0.008 * H, 0.26 * H, 6)), matAlca, { pos: [lado * 0.055 * H, m.tronco * 0.62, m.ombro / 2 - 0.01 * H], rot: [0.12, 0, lado * 0.15], nome: "alca", semContorno: true }));
  }
  // Estrela da Kambada (dois triângulos) no bolso.
  const mat = materialToon(CORES.amarelo);
  for (const r of [0, Math.PI]) {
    quadril.add(malha(geo(`estrela-${H}`, () => new THREE.ConeGeometry(0.024 * H, 0.008 * H, 3)), mat, { pos: [0, m.tronco * 0.22, m.quadril / 2 + 0.05 * H], rot: [Math.PI / 2, r, 0], nome: "estrela-avental", semContorno: true }));
  }
}

function lenco(c: Corpo, cor: string): void {
  const { H, quadril, medidas: m } = c;
  // Lenço no pescoço, abaixo da linha do queixo (pra não ler como boca ou bigode).
  quadril.add(malha(geo(`lenco-${H}`, () => new THREE.ConeGeometry(0.045 * H, 0.08 * H, 3)), materialToon(cor), { pos: [0, m.yPescoco - m.yQuadril - 0.1 * H, m.ombro / 2 + 0.01 * H], rot: [Math.PI, 0, 0], nome: "lenco", semContorno: true }));
}

function bigode(c: Corpo): void {
  const { H, cabeca, medidas: m } = c;
  const mat = materialToon(CORES.olho);
  for (const lado of [-1, 1]) {
    cabeca.add(malha(geo(`bigode-${H}`, () => new THREE.TorusGeometry(0.02 * H, 0.005 * H, 5, 10, Math.PI)), mat, { pos: [lado * 0.02 * H, m.cabeca * 0.28, m.cabeca / 2 - 0.004 * H], rot: [0, 0, lado > 0 ? 0 : 0], nome: "bigode", semContorno: true }));
  }
}

function tranca(c: Corpo, cor: string): void {
  const { H, cabeca, medidas: m } = c;
  cabeca.add(malha(geo(`tranca-${H}`, () => new THREE.CapsuleGeometry(0.02 * H, 0.22 * H, 4, 8)), materialToon(cor), { pos: [0, m.cabeca * 0.35, -m.cabeca / 2 + 0.01 * H], rot: [0.25, 0, 0], nome: "tranca" }));
  cabeca.add(malha(geo(`laco-${H}`, () => new THREE.SphereGeometry(0.02 * H, 8, 6)), materialToon(CORES.vermelho), { pos: [0, m.cabeca * 0.15, -m.cabeca / 2 - 0.03 * H], nome: "laco", semContorno: true }));
}

function bone(c: Corpo, cor: string): void {
  const { H, cabeca, medidas: m } = c;
  cabeca.add(malha(geo(`bone-${H}`, () => new THREE.SphereGeometry(m.cabeca * 0.53, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2)), materialToon(cor), { pos: [0, m.cabeca * 0.55, 0], nome: "bone" }));
  cabeca.add(malha(geo(`pala-${H}`, () => new THREE.CylinderGeometry(m.cabeca * 0.5, m.cabeca * 0.5, 0.01 * H, 12, 1, false, -Math.PI / 3, Math.PI * 0.66)), materialToon(cor), { pos: [0, m.cabeca * 0.6, m.cabeca * 0.1], nome: "pala", semContorno: true }));
}

/* -------------------------------------------------------------- acessórios de mão */

function acessorio(c: Corpo, lado: 0 | 1, obj: THREE.Object3D): void {
  c.maos[lado].add(obj);
}

function matraca(c: Corpo, escala = 1): void {
  const { H } = c;
  for (const lado of [0, 1] as const) {
    const g = grupo("matraca", { escala });
    g.add(malha(geo(`tabua-${H}`, () => caixaBisel(0.06 * H, 0.2 * H, 0.024 * H, 0.006, 1)), materialToon(CORES.couroClaro), { pos: [0, -0.04 * H, 0.03 * H], rot: [-0.3, 0, 0], nome: "tabua" }));
    g.add(malha(geo(`fita-tabua-${H}`, () => caixaBisel(0.062 * H, 0.024 * H, 0.026 * H, 0.004, 1)), materialToon(CORES.vermelho), { pos: [0, 0.0 * H, 0.03 * H], rot: [-0.3, 0, 0], nome: "fita", semContorno: true }));
    acessorio(c, lado, g);
  }
}

function buque(c: Corpo): void {
  const { H } = c;
  const g = grupo("buque");
  g.add(malha(geo(`haste-${H}`, () => new THREE.CylinderGeometry(0.006 * H, 0.006 * H, 0.1 * H, 6)), materialToon(CORES.verde), { pos: [0, -0.02 * H, 0], nome: "haste", semContorno: true }));
  const cores = [CORES.amarelo, CORES.vermelho, CORES.branco, CORES.amarelo, CORES.vermelho];
  cores.forEach((cor, i) => {
    const a = (i / cores.length) * Math.PI * 2;
    g.add(malha(geo(`flor-${H}`, () => new THREE.SphereGeometry(0.018 * H, 8, 6)), materialToon(cor), { pos: [Math.cos(a) * 0.02 * H, 0.04 * H, Math.sin(a) * 0.02 * H], nome: "flor", semContorno: true }));
  });
  acessorio(c, 1, g);
}

function livro(c: Corpo): void {
  const { H } = c;
  const g = grupo("livro", { pos: [-0.04 * H, 0, 0.02 * H], rot: [0.9, 0, 0] });
  g.add(malha(geo(`capa-${H}`, () => caixaBisel(0.08 * H, 0.1 * H, 0.02 * H, 0.004, 1)), materialToon(CORES.couro), { nome: "capa" }));
  g.add(malha(geo(`paginas-${H}`, () => caixaBisel(0.074 * H, 0.094 * H, 0.014 * H, 0.002, 1)), materialToon(CORES.branco), { pos: [0, 0, 0.006 * H], nome: "paginas", semContorno: true }));
  acessorio(c, 1, g);
}

function ticao(c: Corpo): void {
  const { H } = c;
  const g = grupo("ticao", { rot: [0.9, 0, 0] });
  g.add(malha(geo(`cabo-ticao-${H}`, () => new THREE.CylinderGeometry(0.008 * H, 0.01 * H, 0.22 * H, 7)), materialToon(CORES.marromEscuro), { pos: [0, 0.06 * H, 0], nome: "cabo" }));
  g.add(malha(geo(`brasa-${H}`, () => new THREE.SphereGeometry(0.02 * H, 8, 6)), materialToon(PALETA.chama, { emissivo: PALETA.laranja, intensidadeEmissiva: 1.6 }), { pos: [0, 0.18 * H, 0], nome: "brasa", semContorno: true }));
  acessorio(c, 1, g);
}

function bandeirinhaDeMao(c: Corpo): void {
  const { H } = c;
  const g = grupo("bandeirinha", { rot: [0.2, 0, 0] });
  g.add(malha(geo(`haste-b-${H}`, () => new THREE.CylinderGeometry(0.005 * H, 0.005 * H, 0.22 * H, 5)), materialToon(CORES.couroClaro), { pos: [0, 0.08 * H, 0], nome: "haste", semContorno: true }));
  [CORES.vermelho, CORES.amarelo, CORES.jeans].forEach((cor, i) => {
    g.add(malha(geo(`bandeira-mao-${H}`, () => new THREE.ConeGeometry(0.02 * H, 0.04 * H, 3)), materialToon(cor, { ladoDuplo: true }), { pos: [0.02 * H, 0.18 * H - i * 0.045 * H, 0], rot: [0, 0, -Math.PI / 2], nome: "bandeira", semContorno: true }));
  });
  acessorio(c, 1, g);
}

function sanfona(c: Corpo): void {
  const { H } = c;
  // Sanfona bimanual: dois blocos nas mãos e um fole entre eles (animado por escala).
  const fole = grupo("fole", { pos: [0, 0.34 * H, 0.13 * H] });
  const cores = [CORES.vermelho, CORES.amarelo];
  for (let i = 0; i < 7; i++) {
    fole.add(malha(geo(`prega-${H}`, () => caixaBisel(0.026 * H, 0.13 * H, 0.11 * H, 0.005, 1)), materialToon(cores[i % 2]), { pos: [(i - 3) * 0.03 * H, 0, 0], nome: "prega", semContorno: true }));
  }
  c.quadril.add(fole);
  for (const lado of [0, 1] as const) {
    const bloco = grupo("bloco-sanfona");
    bloco.add(malha(geo(`bloco-sanfona-${H}`, () => caixaBisel(0.05 * H, 0.15 * H, 0.12 * H, 0.008, 1)), materialToon(CORES.couroClaro), { pos: [0, 0.02 * H, 0.03 * H], nome: "bloco" }));
    if (lado === 1) {
      for (let i = 0; i < 5; i++) bloco.add(malha(geo(`tecla-${H}`, () => caixaBisel(0.012 * H, 0.02 * H, 0.01 * H, 0.002, 1)), materialToon(CORES.branco), { pos: [0.03 * H, 0.08 * H - i * 0.028 * H, 0.03 * H], nome: "tecla", semContorno: true }));
    }
    acessorio(c, lado, bloco);
  }
}

function zabumba(c: Corpo): void {
  const { H, quadril } = c;
  const g = grupo("zabumba", { pos: [0, -0.02 * H, 0.17 * H], rot: [Math.PI / 2, 0, 0] });
  g.add(malha(geo(`zabumba-${H}`, () => new THREE.CylinderGeometry(0.11 * H, 0.11 * H, 0.14 * H, 18)), materialToon(CORES.couro), { nome: "corpo" }));
  g.add(malha(geo(`pele-zabumba-${H}`, () => new THREE.CylinderGeometry(0.105 * H, 0.105 * H, 0.01 * H, 18)), materialToon(CORES.branco), { pos: [0, 0.075 * H, 0], nome: "pele", semContorno: true }));
  g.add(malha(geo(`aro-zabumba-${H}`, () => new THREE.TorusGeometry(0.11 * H, 0.01 * H, 6, 20)), materialToon(CORES.amarelo), { pos: [0, 0.075 * H, 0], rot: [Math.PI / 2, 0, 0], nome: "aro", semContorno: true }));
  quadril.add(g);
  const baqueta = grupo("baqueta", { rot: [1.2, 0, 0] });
  baqueta.add(malha(geo(`baqueta-${H}`, () => new THREE.CylinderGeometry(0.006 * H, 0.006 * H, 0.16 * H, 6)), materialToon(CORES.couroClaro), { pos: [0, 0.04 * H, 0], nome: "vara", semContorno: true }));
  baqueta.add(malha(geo(`cabeca-baqueta-${H}`, () => new THREE.SphereGeometry(0.014 * H, 8, 6)), materialToon(CORES.branco), { pos: [0, 0.12 * H, 0], nome: "ponta", semContorno: true }));
  acessorio(c, 1, baqueta);
}

function triangulo(c: Corpo): void {
  const { H } = c;
  const pontos = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05 * H, -0.09 * H, 0), new THREE.Vector3(-0.05 * H, -0.09 * H, 0), new THREE.Vector3(0, 0, 0)];
  const curva = new THREE.CatmullRomCurve3(pontos, true, "catmullrom", 0.0);
  const g = grupo("triangulo", { pos: [0, -0.02 * H, 0] });
  g.add(malha(geo(`triangulo-${H}`, () => new THREE.TubeGeometry(curva, 30, 0.005 * H, 6, true)), materialToon(CORES.metal), { nome: "aro", semContorno: true }));
  acessorio(c, 0, g);
  const baqueta = grupo("baqueta", { rot: [0, 0, 1.2] });
  baqueta.add(malha(geo(`baqueta-tri-${H}`, () => new THREE.CylinderGeometry(0.004 * H, 0.004 * H, 0.12 * H, 6)), materialToon(CORES.metal), { pos: [0, 0.03 * H, 0], nome: "vara", semContorno: true }));
  acessorio(c, 1, baqueta);
}

function tamborAlto(c: Corpo): void {
  const { H, raiz } = c;
  const g = grupo("tambor", { pos: [0, 0.26 * H, 0.2 * H], rot: [0.3, 0, 0] });
  g.add(malha(geo(`tambor-alto-${H}`, () => new THREE.CylinderGeometry(0.07 * H, 0.06 * H, 0.42 * H, 14)), materialToon(CORES.couro), { nome: "corpo" }));
  g.add(malha(geo(`aro-tambor-${H}`, () => new THREE.TorusGeometry(0.07 * H, 0.012 * H, 6, 16)), materialToon(CORES.amarelo), { pos: [0, 0.21 * H, 0], rot: [Math.PI / 2, 0, 0], nome: "aro", semContorno: true }));
  g.add(malha(geo(`pele-tambor-${H}`, () => new THREE.CylinderGeometry(0.066 * H, 0.066 * H, 0.008 * H, 14)), materialToon(CORES.branco), { pos: [0, 0.21 * H, 0], nome: "pele", semContorno: true }));
  raiz.add(g);
}

function pandeirao(c: Corpo): void {
  const { H } = c;
  const g = grupo("pandeirao", { pos: [0, -0.02 * H, 0.06 * H], rot: [0.3, 0, 0.6] });
  g.add(malha(geo(`pandeirao-${H}`, () => new THREE.CylinderGeometry(0.11 * H, 0.11 * H, 0.035 * H, 18)), materialToon(CORES.couro), { nome: "aro" }));
  g.add(malha(geo(`pele-pandeirao-${H}`, () => new THREE.CylinderGeometry(0.1 * H, 0.1 * H, 0.008 * H, 18)), materialToon(CORES.branco), { pos: [0, 0.018 * H, 0], nome: "pele", semContorno: true }));
  acessorio(c, 0, g);
}

/* -------------------------------------------------------------- presets */

const TONS_XADREZ: [string, string][] = [
  [CORES.vermelho, CORES.branco],
  [CORES.jeans, CORES.branco],
  [CORES.verde, CORES.branco],
];
const TONS_VESTIDO = [CORES.amarelo, CORES.verde, CORES.azulClaro, CORES.vermelho];

export default function criarPersonagem(op: OpcoesPersonagem): THREE.Group {
  const H = op.altura ?? 1.5;
  const v = op.variante ?? 0;
  const pele = op.corPele ?? PELES[v % PELES.length];
  let corPernas: string = CORES.jeans;
  let corPes: string = CORES.marromEscuro;
  let sola: string | null = CORES.sola;

  switch (op.traje) {
    case "francisca":
    case "quadrilheira":
    case "coreira":
    case "ritinha":
      corPernas = pele;
      corPes = op.traje === "francisca" ? CORES.branco : CORES.couro;
      sola = null;
      break;
    case "padre":
      corPernas = CORES.preto;
      corPes = CORES.preto;
      sola = null;
      break;
    case "chico":
      corPernas = CORES.marromEscuro;
      corPes = "#2A1A0E";
      break;
    case "ze":
    case "quadrilheiro":
    case "triangulo":
      corPernas = CORES.couroClaro;
      break;
    case "tocador-tambor":
      corPernas = CORES.preto;
      break;
    case "sanfoneiro":
    case "aquecedor":
      corPernas = CORES.marromEscuro;
      break;
  }

  const c = construirCorpo(H, pele, corPernas, corPes, sola);
  const raiz = c.raiz;
  raiz.userData.traje = op.traje;

  switch (op.traje) {
    case "jogador":
      camisaXadrez(c, ...TONS_XADREZ[0]);
      chapeuPalha(c);
      bandeirinhaDeMao(c);
      break;
    case "ze":
      paleto(c, CORES.couro, [CORES.couroClaro, CORES.vermelho, CORES.jeans]);
      chapeuPalha(c, 1.35);
      bigode(c);
      break;
    case "francisca":
      camisa(c, CORES.branco);
      vestido(c, CORES.branco, CORES.vermelho, 0.44 * H);
      veu(c);
      buque(c);
      break;
    case "padre":
      batina(c);
      livro(c);
      break;
    case "chico":
      camisa(c, CORES.branco);
      colete(c, CORES.couroClaro);
      chapeuCouro(c);
      lenco(c, CORES.vermelho);
      ticao(c);
      break;
    case "ritinha":
      camisa(c, CORES.jeans);
      vestido(c, CORES.vermelho, CORES.amarelo, 0.3 * H);
      turbante(c, CORES.amarelo, CORES.vermelho);
      matraca(c);
      break;
    case "vendedora":
      camisa(c, CORES.jeans);
      avental(c);
      bone(c, CORES.vermelho);
      matraca(c, 0.7);
      break;
    case "quadrilheiro":
      camisaXadrez(c, ...TONS_XADREZ[v % TONS_XADREZ.length]);
      chapeuPalha(c);
      break;
    case "quadrilheira":
      camisa(c, TONS_VESTIDO[v % TONS_VESTIDO.length]);
      vestido(c, TONS_VESTIDO[v % TONS_VESTIDO.length], CORES.vermelho, 0.32 * H);
      tranca(c, v % 2 ? CORES.couro : CORES.olho);
      // Metade das quadrilheiras de lenço na cabeça: silhueta distinta na multidão.
      if (v % 2 === 0) turbante(c, CORES.vermelho, CORES.amarelo);
      break;
    case "sanfoneiro":
      camisa(c, CORES.branco);
      chapeuCouro(c);
      sanfona(c);
      break;
    case "zabumbeiro":
      camisaXadrez(c, ...TONS_XADREZ[1]);
      chapeuPalha(c);
      zabumba(c);
      break;
    case "triangulo":
      camisaXadrez(c, ...TONS_XADREZ[2]);
      chapeuPalha(c);
      triangulo(c);
      break;
    case "coreira":
      camisa(c, v % 2 ? CORES.branco : TONS_VESTIDO[(v + 2) % TONS_VESTIDO.length]);
      vestido(c, TONS_VESTIDO[v % TONS_VESTIDO.length], CORES.branco, 0.32 * H);
      turbante(c, TONS_VESTIDO[(v + 1) % TONS_VESTIDO.length], CORES.branco);
      break;
    case "tocador-tambor":
      camisa(c, CORES.branco);
      chapeuPalha(c, 0.9);
      tamborAlto(c);
      break;
    case "aquecedor":
      camisa(c, CORES.jeans);
      colete(c, CORES.couroClaro, CORES.jeans);
      chapeuPalha(c, 0.95);
      pandeirao(c);
      break;
  }

  // Cache de referências pra animação sem traverse por quadro; semente por
  // boneco (pose de repouso própria) e acumuladores do passo.
  raiz.userData.semente = hash((op.variante ?? 0) * 7 + op.traje.length * 13);
  raiz.userData.passo = { fase: 0, tAnterior: -1 };
  raiz.userData.animacao = {
    quadril: c.quadril,
    tronco: c.tronco,
    cabeca: c.cabeca,
    bracos: c.bracos,
    pernas: c.pernas,
    saia: raiz.getObjectByName("saia") ?? null,
    fole: raiz.getObjectByName("fole") ?? null,
    H,
  };
  return raiz;
}

/* -------------------------------------------------------------- animação */

export type ModoPersonagem = "parado" | "andando" | "dancando" | "coreira" | "tocando";

export type OpcoesAnimacao = {
  modo?: ModoPersonagem;
  /** 0..1: quanto da velocidade máxima (andando). */
  velocidade?: number;
  /** Deslocamento de fase (segundos) pra figurantes não moverem em uníssono. */
  fase?: number;
  menosMovimento?: boolean;
};

type Cache = {
  quadril: THREE.Group;
  tronco: THREE.Mesh;
  cabeca: THREE.Group;
  bracos: [THREE.Group, THREE.Group];
  pernas: [THREE.Group, THREE.Group];
  saia: THREE.Object3D | null;
  fole: THREE.Object3D | null;
  H: number;
};

/** Pico rápido e retorno lento (toque percussivo), 0..1, período em segundos. */
function batida(t: number, periodo: number): number {
  const f = (t % periodo) / periodo;
  return f < 0.12 ? f / 0.12 : Math.exp(-(f - 0.12) * 6);
}

export function animar(raiz: THREE.Group, t: number, op: OpcoesAnimacao = {}): void {
  const a = raiz.userData.animacao as Cache | undefined;
  if (!a) return;
  const traje = raiz.userData.traje as Traje;
  const modo = op.modo ?? "parado";
  const tt = t + (op.fase ?? 0);
  const H = a.H;

  const semente = (raiz.userData.semente as number) ?? 0.5;
  // Pose de repouso própria de cada boneco em três eixos: abertura dos braços
  // (±0,05 rad), torção leve do tronco (±0,1 rad) e abertura dos pés (±0,08 rad).
  const abertura = 0.12 + (semente - 0.5) * 0.1;
  const torcao = (semente - 0.5) * 0.2;
  const pes = (hash(semente * 97) - 0.5) * 0.16;

  if (op.menosMovimento) {
    // Repouso total, incluindo giro de corpo, saia e fole.
    a.quadril.position.y = 0.5 * H;
    a.quadril.rotation.y = torcao;
    raiz.rotation.y = 0;
    a.tronco.scale.set(1, 1, 1);
    a.cabeca.rotation.set(0, 0, 0);
    a.bracos[0].rotation.set(0, 0, abertura);
    a.bracos[1].rotation.set(0, 0, -abertura);
    a.pernas[0].rotation.set(0, -pes, 0);
    a.pernas[1].rotation.set(0, pes, 0);
    if (a.saia) a.saia.rotation.y = 0;
    if (a.fole) a.fole.scale.x = 1;
    return;
  }

  // Idle: respiração 0,28 Hz (±4%, visível a 25 m), braços em contrafase,
  // cabeça com "tique" de ataque rápido e retorno lento.
  // Frequência e fase por semente: 25 bonecos nunca respiram em uníssono.
  const respira = 1 + 0.04 * Math.sin(tt * (1.6 + semente * 0.4) + semente * 6.28);
  a.tronco.scale.set(1, respira, 1);
  const cicloTique = 6.5;
  const fTique = ((tt + semente * cicloTique) % cicloTique) / cicloTique;
  a.cabeca.rotation.y = fTique < 0.2 ? 0.16 * (fTique < 0.03 ? fTique / 0.03 : Math.exp(-(fTique - 0.03) * 12)) * (semente > 0.5 ? 1 : -1) : 0;
  a.cabeca.rotation.x = 0;
  let quica = 0;
  const wBraco = 1.25 + semente * 0.35;
  let bracoEsq = 0.05 * Math.sin(tt * wBraco + semente * 6);
  let bracoDir = -0.05 * Math.sin(tt * wBraco + semente * 6);
  let pernaEsq = 0;
  let pernaDir = 0;
  let giroCorpo = 0;

  if (modo === "parado" && traje === "vendedora") {
    // Matraquinha nas mãos, na altura do quadril.
    bracoEsq = -0.4 + 0.03 * Math.sin(tt * 1.3);
    bracoDir = -0.4 + 0.03 * Math.sin(tt * 1.3 + 1);
  }
  if (modo === "parado" && traje === "padre") {
    // Mãos à frente da cintura, segurando o livro.
    bracoEsq = -0.95 + 0.03 * Math.sin(tt * 1.4);
    bracoDir = -0.95 + 0.03 * Math.sin(tt * 1.4 + 1);
  }

  if (modo === "andando") {
    const v = Math.min(1, Math.max(0, op.velocidade ?? 1));
    // Cadência cresce com a velocidade (0,9 Hz devagar, 1,45 Hz no máximo) e a
    // fase é integrada, pra não pular quando a velocidade muda.
    const passo = raiz.userData.passo as { fase: number; tAnterior: number };
    const dt = passo.tAnterior < 0 ? 0 : Math.min(0.1, t - passo.tAnterior);
    passo.tAnterior = t;
    passo.fase += dt * Math.PI * 2 * (0.9 + 0.55 * v);
    const w = passo.fase;
    const amp = 0.44 * v; // ±25°
    pernaEsq = Math.sin(w) * amp;
    pernaDir = -Math.sin(w) * amp;
    bracoEsq = -Math.sin(w) * 0.35 * v;
    bracoDir = Math.sin(w) * 0.35 * v;
    // Quica no apoio de cada pé (duas vezes por ciclo), em fase com o passo.
    quica = Math.abs(Math.cos(w)) * 0.015 * H * v;
    a.cabeca.rotation.x = -quica * 0.3;
  } else if (modo === "dancando") {
    const w = tt * Math.PI * 2 * 2.0; // passo de 0,5 s
    pernaEsq = Math.sin(w) * 0.3;
    pernaDir = -Math.sin(w) * 0.3;
    quica = Math.max(0, Math.sin(w * 1)) * 0.02 * H;
    // Braços à frente na altura do quadril, balançando em oposição leve (par de mãos dadas).
    bracoEsq = -0.35 + Math.sin(w) * 0.22;
    bracoDir = -0.35 - Math.sin(w) * 0.22;
  } else if (modo === "coreira") {
    // Giro de saia: o corpo inteiro (pernas incluídas) gira ±90° em 1,2 s e a
    // saia segue com atraso de ~0,1 s.
    const w = tt * Math.PI * 2 * (1 / 1.2);
    giroCorpo = Math.sin(w) * Math.PI * 0.5;
    if (a.saia) a.saia.rotation.y = Math.sin(w - 0.55) * 0.35;
    bracoEsq = -0.3 + Math.sin(tt * 10.5) * 0.12;
    bracoDir = -0.3 - Math.sin(tt * 10.5 + 1) * 0.12;
    quica = Math.abs(Math.sin(w)) * 0.012 * H;
    pernaEsq = Math.sin(w * 2) * 0.12;
    pernaDir = -Math.sin(w * 2) * 0.12;
  } else if (modo === "tocando") {
    if (traje === "sanfoneiro" && a.fole) {
      const abre = 0.7 + 0.6 * (0.5 + 0.5 * Math.sin(tt * Math.PI * 2 * 2));
      a.fole.scale.x = abre;
      bracoEsq = -0.85 + (abre - 1) * 0.4;
      bracoDir = -0.85 + (abre - 1) * 0.4;
    } else if (traje === "zabumbeiro") {
      const b = batida(tt, 0.5);
      bracoDir = -0.95 - b * 0.45;
      bracoEsq = -0.6;
      quica = b * 0.005 * H;
    } else if (traje === "triangulo") {
      bracoEsq = -0.9;
      bracoDir = -0.75 - batida(tt, 0.3) * 0.3;
    } else if (traje === "tocador-tambor") {
      const b1 = batida(tt, 0.9);
      const b2 = batida(tt + 0.45, 0.9);
      // Mãos sobre o couro do tambor (à frente, na altura da cintura).
      bracoEsq = -0.55 - b1 * 0.35;
      bracoDir = -0.55 - b2 * 0.35;
    } else if (traje === "aquecedor") {
      const b = batida(tt, 0.4);
      bracoEsq = -0.75 + Math.sin(tt * 6) * 0.1;
      bracoDir = -0.7 - b * 0.4;
    } else if (traje === "ritinha") {
      // Matraca: as duas mãos batem uma na outra à frente do corpo (2 batidas/s).
      const b = batida(tt, 0.5);
      bracoEsq = -0.7 - b * 0.25;
      bracoDir = -0.7 - b * 0.25;
    }
  }

  a.quadril.position.y = 0.5 * H + quica;
  a.bracos[0].rotation.x = bracoEsq;
  a.bracos[1].rotation.x = bracoDir;
  const lateral = modo === "coreira" ? 0.75 : abertura;
  a.bracos[0].rotation.z = lateral;
  a.bracos[1].rotation.z = -lateral;
  a.pernas[0].rotation.x = pernaEsq;
  a.pernas[1].rotation.x = pernaDir;
  // Abertura dos pés e torção do tronco só no repouso/idle (andando e dançando ficam retos).
  const parado = modo === "parado" || modo === "tocando";
  a.pernas[0].rotation.y = parado ? -pes : 0;
  a.pernas[1].rotation.y = parado ? pes : 0;
  a.quadril.rotation.y = parado ? torcao : 0;
  raiz.rotation.y = giroCorpo;
  if (modo !== "coreira" && a.saia) a.saia.rotation.y = 0;
  if (modo !== "tocando" && a.fole) a.fole.scale.x = 1;
}
