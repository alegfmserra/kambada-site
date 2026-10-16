/**
 * Coreto de arraial junino: reconstrução procedural em Three.js puro, feita
 * pelo pipeline img2threejs a partir da referência
 * `docs/evidencias/gauntlet-arraial-3d/img2threejs/coreto/referencia-fundo-neutro.png`.
 * A spec que governa cada decisão é `object-sculpt-spec.json`, na mesma pasta.
 *
 * Unidades em metros, origem no chão sob o centro do octógono, escada virada
 * para +Z. Diâmetro externo do telhado 4.52 m, altura até o topo do pináculo
 * 4.55 m, piso a 0.70 m.
 *
 * Simetria radial de ordem 8 com a face plana voltada para +Z (`THETA`), que é
 * o que faz a escada cair no meio de uma face, e não num vértice.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { PALETA, caixaBisel, grupo, hash, malha, materialToon } from "./_compartilhado";

export { aplicarContorno, explodir } from "./_compartilhado";

/* ------------------------------------------------------------------ */
/* Tokens locais de cor (o resto vem da PALETA compartilhada)          */
/* ------------------------------------------------------------------ */

/** Cores que só existem nesta peça; a paleta do arraial fica intacta. */
const CORES = {
  metalLanterna: "#3E2E20",
  corda: "#E8C9A0",
  pisoMadeira: "#B96A32",
  foleVerde: "#1F6E52",
  /**
   * Verde-água da tinta desta peça. Medido: `PALETA.verdeAgua` renderiza aqui
   * como #008065, com o canal vermelho zerado pelo degrau da rampa toon, contra
   * #226055 na referência. Um verde-água um pouco menos saturado devolve o canal
   * vermelho e cai na mesma família da paleta do arraial.
   */
  verdeAguaTinta: "#31857A",
  /**
   * Branco portador: material base das malhas instanciadas que trazem cor por
   * instância. `instanceColor` multiplica a cor do material, então a base tem
   * de ser branca para a cor da instância chegar inteira.
   */
  portadorDeInstancia: "#FFFFFF",
} as const;

/* ------------------------------------------------------------------ */
/* Métrica (spec: coordinateFrame + silhouette.landmarks)              */
/* ------------------------------------------------------------------ */

/** Face centrada em +Z: o primeiro vértice do octógono fica a 22.5 graus. */
const THETA = Math.PI / 8;
const LADOS = 8;

/** Circunraio de cada anel da montagem, em metros. */
const R = {
  plinto: 2.14,
  saia: 2.04,
  deck: 2.14,
  pilar: 1.86,
  guardaCorpo: 1.92,
  lanterna: 2.32,
  varal: 1.86,
  beiral: 2.26,
  topoTelhado: 0.17,
} as const;

/** Cotas verticais, em metros. */
const Y = {
  plinto: 0.14,
  saia: 0.62,
  deck: 0.7,
  fuste: 0.8,
  travessa: 0.82,
  corrimao: 1.34,
  gancho: 2.28,
  varal: 2.41,
  capitel: 2.5,
  beiral: 2.71,
  apice: 3.78,
  pinaculo: 4.55,
} as const;

/** Escada frontal: 4 degraus de 0.30 m de piso e 0.175 m de espelho. */
const DEGRAUS = 4;
const PROFUNDIDADE_PISO = 0.3;
const ALTURA_ESPELHO = 0.175;
const LARGURA_ESCADA = 1.3;

/** Sistemas de repetição (spec: repetitionSystems). */
const TABUAS_POR_FACE = 8;
const BALAUSTRES_POR_VAO = 5;
const ROLOS_POR_AGUA = 6;
const FIADAS_POR_AGUA = 5;
const BANDEIRAS_POR_VAO = 5;

/** Índices dos pilares que recebem lanterna (os 4 dianteiros). */
const PILARES_DIANTEIROS = [7, 0, 1, 2] as const;

/** Ciclos de tinta lidos da referência. */
const CICLO_SAIA = [CORES.verdeAguaTinta, PALETA.vermelho, PALETA.amarelo, PALETA.madeiraClara, CORES.verdeAguaTinta, PALETA.amarelo] as const;
const CICLO_BALAUSTRE = [CORES.verdeAguaTinta, PALETA.vermelho, CORES.verdeAguaTinta, PALETA.madeiraClara] as const;
const CICLO_BANDEIRA = [PALETA.amarelo, PALETA.verdeAgua, PALETA.vermelho, PALETA.laranja] as const;

/** Ângulo do vértice `i` do octógono. */
function anguloVertice(i: number): number {
  return THETA + (i * Math.PI * 2) / LADOS;
}

/** Vértice `i` do octógono de circunraio `raio`, na cota `y`. */
function vertice(i: number, raio: number, y: number): THREE.Vector3 {
  const a = anguloVertice(i);
  return new THREE.Vector3(Math.sin(a) * raio, y, Math.cos(a) * raio);
}

/** Prisma octogonal com a face plana voltada para +Z. */
function prismaOctogonal(raio: number, altura: number, aberto = false): THREE.CylinderGeometry {
  return new THREE.CylinderGeometry(raio, raio, altura, LADOS, 1, aberto, THETA);
}

/** Anel octogonal de seção circular (a fascia arredondada do beiral). */
function anelOctogonal(raio: number, secao: number): THREE.BufferGeometry {
  const g = new THREE.TorusGeometry(raio, secao, 5, LADOS);
  g.rotateX(Math.PI / 2);
  g.rotateY(THETA);
  return g;
}

/* ------------------------------------------------------------------ */
/* Instanciação                                                        */
/* ------------------------------------------------------------------ */

/**
 * InstancedMesh nomeado a partir de uma lista de matrizes. Recebe sempre
 * `semContorno`: a casca de contorno do `_compartilhado` é uma malha simples,
 * que num InstancedMesh apareceria uma única vez, na origem do grupo.
 */
function instanciar(
  geometria: THREE.BufferGeometry,
  material: THREE.Material,
  matrizes: THREE.Matrix4[],
  nome: string,
  cores?: THREE.Color[],
): THREE.InstancedMesh {
  const m = new THREE.InstancedMesh(geometria, material, matrizes.length);
  matrizes.forEach((mat, i) => m.setMatrixAt(i, mat));
  if (cores) cores.forEach((c, i) => m.setColorAt(i, c));
  m.instanceMatrix.needsUpdate = true;
  if (m.instanceColor) m.instanceColor.needsUpdate = true;
  m.name = nome;
  m.userData.semContorno = true;
  return m;
}

/**
 * Mescla geometrias numa malha só. Converte tudo para não indexado antes,
 * porque `RoundedBoxGeometry` e `ExtrudeGeometry` já vêm sem índice e o
 * `mergeGeometries` recusa a mistura de indexado com não indexado.
 */
function mesclar(geometrias: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  return mergeGeometries(geometrias.map((g) => (g.index ? g.toNonIndexed() : g)));
}

/** Matriz de posição, giro em Y e escala. */
function matriz(pos: THREE.Vector3, giroY = 0, escala?: THREE.Vector3): THREE.Matrix4 {
  return new THREE.Matrix4().compose(
    pos,
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), giroY),
    escala ?? new THREE.Vector3(1, 1, 1),
  );
}

/**
 * Matriz que deita uma geometria de eixo +Y entre `de` e `para`, com a largura
 * preservada e o eixo +Z apontando para `normal`. É o que faz os rolos de telha
 * convergirem para o ápice: cada rolo é alinhado da borda do beiral até a borda
 * do anel de topo, e a convergência sai da própria geometria.
 */
function matrizEntre(de: THREE.Vector3, para: THREE.Vector3, normal: THREE.Vector3): THREE.Matrix4 {
  const eixoY = new THREE.Vector3().subVectors(para, de);
  const comprimento = eixoY.length();
  eixoY.normalize();
  const eixoX = new THREE.Vector3().crossVectors(eixoY, normal).normalize();
  const eixoZ = new THREE.Vector3().crossVectors(eixoX, eixoY).normalize();
  const m = new THREE.Matrix4().makeBasis(eixoX, eixoY, eixoZ);
  m.scale(new THREE.Vector3(1, comprimento, 1));
  m.setPosition(new THREE.Vector3().addVectors(de, para).multiplyScalar(0.5));
  return m;
}

/** Normal externa da água `k` do telhado. */
function normalDaAgua(k: number): THREE.Vector3 {
  const a = vertice(k, R.beiral, Y.beiral);
  const b = vertice(k + 1, R.beiral, Y.beiral);
  const topo = vertice(k, R.topoTelhado, Y.apice);
  const lateral = new THREE.Vector3().subVectors(b, a);
  const subida = new THREE.Vector3().subVectors(topo, a);
  const n = new THREE.Vector3().crossVectors(lateral, subida).normalize();
  const radial = new THREE.Vector3(a.x + b.x, 0, a.z + b.z).normalize();
  return n.dot(radial) < 0 ? n.negate() : n;
}

/**
 * Multiplicadores de valor por instância, em torno de 1.0. A rampa toon dá o
 * degrau de sombra, mas não a diferença de peça para peça que a referência tem
 * entre tábuas vizinhas; isto devolve essa variação, de forma determinística.
 */
function variacaoDeValor(quantidade: number, amplitude = 0.07, semente = 0): THREE.Color[] {
  const cores: THREE.Color[] = [];
  for (let i = 0; i < quantidade; i++) {
    cores.push(new THREE.Color(1, 1, 1).multiplyScalar(1 - amplitude / 2 + hash(i * 5.31 + semente) * amplitude));
  }
  return cores;
}

/** Cor de instância por ciclo determinístico (sem `Math.random`). */
function corDoCiclo(paleta: readonly string[], indice: number): THREE.Color {
  return new THREE.Color(paleta[Math.floor(hash(indice * 7.13 + 0.5) * paleta.length) % paleta.length]);
}

type Materiais = ReturnType<typeof criarMateriais>;

function criarMateriais() {
  return {
    madeira: materialToon(PALETA.madeira),
    madeiraClara: materialToon(PALETA.madeiraClara),
    madeiraEscura: materialToon(PALETA.madeiraEscura),
    madeiraSombra: materialToon(PALETA.madeiraSombra),
    tinta: materialToon(CORES.portadorDeInstancia),
    telha: materialToon(PALETA.telha),
    telhaEscura: materialToon(PALETA.telhaEscura, { ladoDuplo: true }),
    telhaEscuraOpaca: materialToon(PALETA.telhaEscura),
    amarelo: materialToon(PALETA.amarelo),
    vermelho: materialToon(PALETA.vermelho),
    verdeAgua: materialToon(PALETA.verdeAgua),
    verdeAguaTinta: materialToon(CORES.verdeAguaTinta),
    laranja: materialToon(PALETA.laranja),
    creme: materialToon(PALETA.creme),
    corda: materialToon(CORES.corda),
    tecido: materialToon(CORES.portadorDeInstancia, { ladoDuplo: true }),
    metal: materialToon(CORES.metalLanterna),
    /**
     * Vidro emissivo: único material emissivo da peça. O contrato pedia
     * `PALETA.lanterna` com intensidade 1.6, e as duas coisas foram medidas
     * contra a referência. `PALETA.lanterna` já é um amarelo pálido, então
     * qualquer intensidade que faça brilhar leva o vidro para creme e depois
     * para branco sob o tone mapping ACES da cena. Cor de chama com emissivo
     * laranja-escuro em 0.55 é o que devolve o dourado quente da referência.
     */
    vidro: materialToon(PALETA.chama, { emissivo: PALETA.chamaEscura, intensidadeEmissiva: 0.55 }),
    fole: materialToon(CORES.foleVerde),
  };
}

/* ------------------------------------------------------------------ */
/* Subconjuntos                                                        */
/* ------------------------------------------------------------------ */

function construirBase(mats: Materiais): THREE.Group {
  const g = grupo("base");

  // Molduras: duas fiadas de rodapé mais a faixa de coroamento, numa malha só.
  const molduras = mesclar([
    prismaOctogonal(R.plinto, 0.08).translate(0, 0.04, 0),
    prismaOctogonal(R.plinto - 0.05, 0.07).translate(0, 0.105, 0),
    prismaOctogonal(R.saia + 0.07, 0.09).translate(0, Y.saia - 0.045, 0),
  ]);
  if (molduras) g.add(malha(molduras, mats.madeira, { nome: "base-molduras" }));

  // Saia: casca octogonal fechada entre o plinto e o coroamento.
  g.add(
    malha(prismaOctogonal(R.saia, Y.saia - Y.plinto), mats.madeiraEscura, {
      pos: [0, (Y.plinto + Y.saia) / 2, 0],
      nome: "base-saia",
    }),
  );

  // Tábuas verticais pintadas: 8 por face, cor por instância.
  const alturaTabua = Y.saia - Y.plinto - 0.04;
  const larguraFace = 2 * R.saia * Math.sin(Math.PI / LADOS);
  const passo = larguraFace / TABUAS_POR_FACE;
  const tabua = new THREE.BoxGeometry(passo * 0.78, alturaTabua, 0.06);
  const matrizesTabua: THREE.Matrix4[] = [];
  const coresTabua: THREE.Color[] = [];
  for (let face = 0; face < LADOS; face++) {
    const a = vertice(face, R.saia, 0);
    const b = vertice(face + 1, R.saia, 0);
    const giro = Math.atan2(a.x + b.x, a.z + b.z);
    for (let j = 0; j < TABUAS_POR_FACE; j++) {
      const t = (j + 0.5) / TABUAS_POR_FACE;
      const p = new THREE.Vector3().lerpVectors(a, b, t);
      p.y = Y.plinto + alturaTabua / 2 + 0.02;
      p.addScaledVector(new THREE.Vector3(p.x, 0, p.z).normalize(), 0.022);
      matrizesTabua.push(matriz(p, giro));
      coresTabua.push(corDoCiclo(CICLO_SAIA, face * TABUAS_POR_FACE + j));
    }
  }
  g.add(instanciar(tabua, mats.tinta, matrizesTabua, "base-saia-tabuas", coresTabua));

  // Poste de canto em cada aresta, com o bloco verde-água no topo.
  const matrizesPoste: THREE.Matrix4[] = [];
  const matrizesBloco: THREE.Matrix4[] = [];
  for (let i = 0; i < LADOS; i++) {
    const a = anguloVertice(i);
    const raio = R.saia + 0.03;
    matrizesPoste.push(matriz(new THREE.Vector3(Math.sin(a) * raio, (Y.plinto + Y.saia) / 2, Math.cos(a) * raio), a));
    matrizesBloco.push(matriz(new THREE.Vector3(Math.sin(a) * raio, Y.saia - 0.11, Math.cos(a) * raio), a));
  }
  g.add(instanciar(new THREE.BoxGeometry(0.17, Y.saia - Y.plinto + 0.04, 0.17), mats.madeira, matrizesPoste, "base-postes-canto", variacaoDeValor(matrizesPoste.length, 0.08, 3.7)));
  g.add(instanciar(new THREE.BoxGeometry(0.2, 0.16, 0.2), mats.verdeAguaTinta, matrizesBloco, "base-blocos-canto"));
  return g;
}

function construirPiso(mats: Materiais): THREE.Group {
  const g = grupo("piso");
  g.add(
    // Laje escura por baixo das tábuas: é ela que faz o sulco entre elas ler
    // como vale escuro, do mesmo jeito que na referência.
    malha(prismaOctogonal(R.deck - 0.03, Y.deck - Y.saia), mats.madeiraEscura, {
      pos: [0, (Y.saia + Y.deck) / 2, 0],
      nome: "piso-deck",
    }),
  );

  // Tábuas paralelas na diagonal, recortadas pelo octógono via escala por faixa.
  const larguraTabua = 0.26;
  const faixas = Math.ceil((2 * R.deck) / larguraTabua);
  const matrizes: THREE.Matrix4[] = [];
  const cores: THREE.Color[] = [];
  const giro = Math.PI / 6;
  for (let i = 0; i < faixas; i++) {
    const desloc = (i - (faixas - 1) / 2) * larguraTabua;
    const meia = Math.sqrt(Math.max(0, (R.deck - 0.1) ** 2 - desloc ** 2));
    if (meia < 0.05) continue;
    // O eixo da tábua é (cos, 0, -sin) depois do giro em Y; o deslocamento entre
    // faixas tem de ser perpendicular a ele, senão as tábuas se enfileiram na
    // própria direção e saem do octógono.
    const p = new THREE.Vector3(Math.sin(giro) * desloc, Y.deck - 0.01, Math.cos(giro) * desloc);
    matrizes.push(matriz(p, giro, new THREE.Vector3(2 * meia, 1, 1)));
    cores.push(new THREE.Color(CORES.pisoMadeira).multiplyScalar(0.95 + hash(i * 3.7) * 0.1));
  }
  // Cor por instância multiplica a cor do material, então a base é branca e a
  // cor real vai inteira na instância.
  g.add(instanciar(new THREE.BoxGeometry(1, 0.04, larguraTabua * 0.86), mats.tinta, matrizes, "piso-tabuas", cores));
  g.add(malha(anelOctogonal(R.deck, 0.05), mats.madeiraEscura, { pos: [0, Y.deck - 0.05, 0], nome: "piso-aro" }));
  return g;
}

function construirEscada(mats: Materiais): THREE.Group {
  const apotema = R.saia * Math.cos(Math.PI / LADOS);
  const g = grupo("escada", { pos: [0, 0, apotema] });

  const pisos: THREE.Matrix4[] = [];
  const espelhos: THREE.Matrix4[] = [];
  for (let i = 0; i < DEGRAUS; i++) {
    const topo = Y.deck - i * ALTURA_ESPELHO;
    const z = (i + 0.5) * PROFUNDIDADE_PISO;
    pisos.push(matriz(new THREE.Vector3(0, topo - 0.025, z)));
    const alturaEspelho = topo - ALTURA_ESPELHO / 2;
    espelhos.push(
      matriz(
        new THREE.Vector3(0, alturaEspelho / 2, z - PROFUNDIDADE_PISO / 2 + 0.03),
        0,
        new THREE.Vector3(1, alturaEspelho, 1),
      ),
    );
  }
  g.add(instanciar(new THREE.BoxGeometry(LARGURA_ESCADA, 0.05, PROFUNDIDADE_PISO), mats.madeiraClara, pisos, "escada-pisos", variacaoDeValor(pisos.length, 0.09, 7.3)));
  g.add(instanciar(new THREE.BoxGeometry(LARGURA_ESCADA - 0.04, 1, 0.06), mats.madeiraEscura, espelhos, "escada-espelhos"));

  // Longarinas: perfil escalonado dos dois lados, numa malha mesclada.
  const partes: THREE.BufferGeometry[] = [];
  for (const lado of [-1, 1]) {
    const x = lado * (LARGURA_ESCADA / 2 + 0.08);
    for (let i = 0; i < DEGRAUS; i++) {
      const topo = Y.deck - i * ALTURA_ESPELHO;
      partes.push(new THREE.BoxGeometry(0.16, topo, PROFUNDIDADE_PISO).translate(x, topo / 2, (i + 0.5) * PROFUNDIDADE_PISO));
    }
  }
  const longarinas = mergeGeometries(partes);
  if (longarinas) g.add(malha(longarinas, mats.madeira, { nome: "escada-longarinas" }));

  // Corrimãos inclinados com montantes, espelhados em x.
  const barras: THREE.Matrix4[] = [];
  const montantes: THREE.Matrix4[] = [];
  for (const lado of [-1, 1]) {
    const x = lado * (LARGURA_ESCADA / 2 + 0.08);
    const de = new THREE.Vector3(x, Y.corrimao, 0.02);
    const para = new THREE.Vector3(x, Y.corrimao - (Y.deck - 0.18), DEGRAUS * PROFUNDIDADE_PISO);
    barras.push(matrizEntre(de, para, new THREE.Vector3(lado, 0, 0)));
    for (let j = 0; j < 2; j++) {
      const t = 0.2 + j * 0.6;
      const p = new THREE.Vector3().lerpVectors(de, para, t);
      const degrau = Math.min(DEGRAUS - 1, Math.floor((t * DEGRAUS * PROFUNDIDADE_PISO) / PROFUNDIDADE_PISO));
      const apoio = Y.deck - degrau * ALTURA_ESPELHO;
      const altura = Math.max(0.24, p.y - apoio);
      montantes.push(matriz(new THREE.Vector3(p.x, p.y - altura / 2, p.z), 0, new THREE.Vector3(1, altura, 1)));
    }
  }
  g.add(instanciar(new THREE.BoxGeometry(0.1, 1, 0.11), mats.madeira, barras, "escada-corrimaos"));
  g.add(instanciar(new THREE.BoxGeometry(0.09, 1, 0.09), mats.madeira, montantes, "escada-montantes"));
  return g;
}

function construirPilares(mats: Materiais): THREE.Group {
  const g = grupo("pilares");
  const fustes: THREE.Matrix4[] = [];
  const sapatas: THREE.Matrix4[] = [];
  const capiteis: THREE.Matrix4[] = [];
  const suportes: THREE.Matrix4[] = [];
  for (let i = 0; i < LADOS; i++) {
    const a = anguloVertice(i);
    const p = (y: number) => new THREE.Vector3(Math.sin(a) * R.pilar, y, Math.cos(a) * R.pilar);
    fustes.push(matriz(p((Y.fuste + Y.capitel) / 2), a));
    sapatas.push(matriz(p(Y.fuste - 0.03), a));
    capiteis.push(matriz(p((Y.capitel + Y.beiral) / 2), a));
  }
  for (const i of PILARES_DIANTEIROS) {
    const a = anguloVertice(i);
    const raio = (R.pilar + R.lanterna) / 2;
    suportes.push(matriz(new THREE.Vector3(Math.sin(a) * raio, Y.gancho + 0.06, Math.cos(a) * raio), a));
  }
  g.add(instanciar(caixaBisel(0.2, Y.capitel - Y.fuste, 0.2, 0.022, 1), mats.madeira, fustes, "pilares-fustes", variacaoDeValor(fustes.length, 0.08, 1.1)));
  g.add(instanciar(new THREE.BoxGeometry(0.26, 0.1, 0.26), mats.madeira, sapatas, "pilares-sapatas"));
  g.add(instanciar(caixaBisel(0.33, Y.beiral - Y.capitel, 0.33, 0.03, 1), mats.madeiraClara, capiteis, "pilares-capiteis"));
  g.add(instanciar(new THREE.BoxGeometry(0.09, 0.09, R.lanterna - R.pilar), mats.madeira, suportes, "pilares-suportes-gancho"));
  return g;
}

function construirGuardaCorpo(mats: Materiais): THREE.Group {
  const g = grupo("guarda-corpo");
  const barras: THREE.Matrix4[] = [];
  const balaustres: THREE.Matrix4[] = [];
  const coresBalaustre: THREE.Color[] = [];
  // O vão 0 é a face voltada para +Z, que fica aberta para a escada.
  for (let vao = 1; vao < LADOS; vao++) {
    const a = vertice(vao, R.guardaCorpo, 0);
    const b = vertice(vao + 1, R.guardaCorpo, 0);
    const giro = Math.atan2(a.x + b.x, a.z + b.z);
    for (const y of [Y.travessa, Y.corrimao]) {
      barras.push(matrizEntre(new THREE.Vector3(a.x, y, a.z), new THREE.Vector3(b.x, y, b.z), new THREE.Vector3(0, 1, 0)));
    }
    for (let j = 0; j < BALAUSTRES_POR_VAO; j++) {
      const t = (j + 0.5) / BALAUSTRES_POR_VAO;
      const p = new THREE.Vector3().lerpVectors(a, b, t);
      p.y = (Y.travessa + Y.corrimao) / 2;
      balaustres.push(matriz(p, giro));
      coresBalaustre.push(corDoCiclo(CICLO_BALAUSTRE, vao * BALAUSTRES_POR_VAO + j));
    }
  }
  g.add(instanciar(new THREE.BoxGeometry(0.17, 1, 0.15), mats.madeira, barras, "guarda-corpo-barras", variacaoDeValor(barras.length, 0.09, 2.3)));
  g.add(
    instanciar(
      new THREE.BoxGeometry(0.155, Y.corrimao - Y.travessa + 0.04, 0.07),
      mats.tinta,
      balaustres,
      "guarda-corpo-balaustres",
      coresBalaustre,
    ),
  );

  const montantes: THREE.Matrix4[] = [];
  const pomos: THREE.Matrix4[] = [];
  for (let i = 0; i < LADOS; i++) {
    const a = anguloVertice(i);
    const p = (y: number) => new THREE.Vector3(Math.sin(a) * R.guardaCorpo, y, Math.cos(a) * R.guardaCorpo);
    montantes.push(matriz(p((Y.deck + Y.corrimao + 0.1) / 2), a));
    pomos.push(matriz(p(Y.corrimao + 0.19), a));
  }
  g.add(
    instanciar(new THREE.BoxGeometry(0.15, Y.corrimao + 0.1 - Y.deck, 0.15), mats.madeira, montantes, "guarda-corpo-montantes"),
  );
  g.add(instanciar(new THREE.SphereGeometry(0.105, 8, 6), mats.madeira, pomos, "guarda-corpo-pomos"));
  return g;
}

function construirTelhado(mats: Materiais): THREE.Group {
  const g = grupo("telhado");

  // Arquitrave: uma viga por vão, ligando capitéis vizinhos.
  const vigas: THREE.Matrix4[] = [];
  for (let i = 0; i < LADOS; i++) {
    vigas.push(
      matrizEntre(vertice(i, R.pilar, Y.capitel + 0.07), vertice(i + 1, R.pilar, Y.capitel + 0.07), new THREE.Vector3(0, 1, 0)),
    );
  }
  g.add(instanciar(new THREE.BoxGeometry(0.26, 1, 0.17), mats.madeira, vigas, "telhado-arquitrave"));

  // Cone facetado de 8 águas, face dupla (não há forro modelado).
  g.add(
    malha(
      new THREE.CylinderGeometry(R.topoTelhado, R.beiral, Y.apice - Y.beiral, LADOS, 1, true, THETA),
      mats.telhaEscura,
      { pos: [0, (Y.beiral + Y.apice) / 2, 0], nome: "telhado-agua" },
    ),
  );

  // Rolos de telha em canaleta: alinhados da borda do beiral à borda do topo,
  // o que já produz a convergência para o ápice.
  const rolos: THREE.Matrix4[] = [];
  const frisos: THREE.Matrix4[] = [];
  for (let k = 0; k < LADOS; k++) {
    const n = normalDaAgua(k);
    const be = vertice(k, R.beiral, Y.beiral);
    const bd = vertice(k + 1, R.beiral, Y.beiral);
    const te = vertice(k, R.topoTelhado, Y.apice);
    const td = vertice(k + 1, R.topoTelhado, Y.apice);
    for (let j = 0; j < ROLOS_POR_AGUA; j++) {
      const t = (j + 0.5) / ROLOS_POR_AGUA;
      rolos.push(
        matrizEntre(
          new THREE.Vector3().lerpVectors(be, bd, t).addScaledVector(n, 0.02),
          new THREE.Vector3().lerpVectors(te, td, t).addScaledVector(n, 0.02),
          n,
        ),
      );
    }
    for (let f = 0; f < FIADAS_POR_AGUA; f++) {
      const frac = 0.12 + (f * 0.72) / (FIADAS_POR_AGUA - 1);
      frisos.push(
        matrizEntre(
          new THREE.Vector3().lerpVectors(be, te, frac).addScaledVector(n, 0.135),
          new THREE.Vector3().lerpVectors(bd, td, frac).addScaledVector(n, 0.135),
          n,
        ),
      );
    }
  }
  // Meia-cana afunilada: o topo é mais fino que a base, então os rolos vizinhos
  // continuam encostados enquanto convergem para o ápice.
  const rolo = new THREE.CylinderGeometry(0.05, 0.145, 1, 6, 1, true, 0, Math.PI);
  rolo.rotateY(Math.PI / 2);
  g.add(instanciar(rolo, mats.telha, rolos, "telhado-rolos", variacaoDeValor(rolos.length, 0.1, 4.9)));
  g.add(instanciar(new THREE.BoxGeometry(0.06, 1, 0.05), mats.telhaEscuraOpaca, frisos, "telhado-frisos"));

  // Cumeeiras nas 8 arestas e blocos de canto no beiral.
  const cumeeiras: THREE.Matrix4[] = [];
  const blocos: THREE.Matrix4[] = [];
  for (let i = 0; i < LADOS; i++) {
    const a = anguloVertice(i);
    const radial = new THREE.Vector3(Math.sin(a), 0, Math.cos(a));
    cumeeiras.push(
      matrizEntre(vertice(i, R.beiral - 0.02, Y.beiral + 0.06), vertice(i, R.topoTelhado, Y.apice + 0.03), radial),
    );
    blocos.push(matriz(vertice(i, R.beiral - 0.03, Y.beiral + 0.02), a));
  }
  g.add(instanciar(new THREE.BoxGeometry(0.09, 1, 0.17), mats.madeiraClara, cumeeiras, "telhado-cumeeiras", variacaoDeValor(cumeeiras.length, 0.07, 6.1)));
  g.add(instanciar(caixaBisel(0.22, 0.26, 0.22, 0.03, 1), mats.madeira, blocos, "telhado-blocos-beiral"));

  // Fascia arredondada do beiral.
  g.add(malha(anelOctogonal(R.beiral - 0.05, 0.075), mats.madeira, { pos: [0, Y.beiral - 0.02, 0], nome: "telhado-beiral" }));
  return g;
}

function construirPinaculo(mats: Materiais): THREE.Group {
  const g = grupo("pinaculo", { pos: [0, Y.apice, 0] });
  const pedestal = mesclar([
    prismaOctogonal(0.21, 0.26).translate(0, 0.06, 0),
    prismaOctogonal(0.15, 0.09).translate(0, 0.225, 0),
  ]);
  if (pedestal) g.add(malha(pedestal, mats.madeiraClara, { nome: "pinaculo-pedestal" }));
  g.add(malha(anelOctogonal(0.115, 0.055), mats.laranja, { pos: [0, 0.31, 0], nome: "pinaculo-anel-laranja" }));
  g.add(malha(anelOctogonal(0.105, 0.048), mats.verdeAgua, { pos: [0, 0.395, 0], nome: "pinaculo-anel-verde" }));
  g.add(
    malha(new THREE.SphereGeometry(0.16, 12, 9), mats.amarelo, {
      pos: [0, Y.pinaculo - Y.apice - 0.16, 0],
      nome: "pinaculo-esfera",
    }),
  );
  return g;
}

/** Bandeirinha retangular com recorte em V na borda inferior. */
function geometriaBandeira(): THREE.BufferGeometry {
  const l = 0.135;
  const alto = 0.34;
  const forma = new THREE.Shape();
  forma.moveTo(-l, 0);
  forma.lineTo(l, 0);
  forma.lineTo(l, -alto);
  forma.lineTo(0, -alto + 0.12);
  forma.lineTo(-l, -alto);
  forma.closePath();
  return new THREE.ShapeGeometry(forma);
}

function construirBandeirinhas(mats: Materiais): THREE.Group {
  const g = grupo("bandeirinhas");

  // Uma catenária por vão. Todos os vãos são iguais a menos de um giro em Y,
  // então a geometria é construída uma vez e reaproveitada por instância.
  const a = vertice(0, R.varal, Y.varal);
  const b = vertice(1, R.varal, Y.varal);
  const meio = new THREE.Vector3().addVectors(a, b).multiplyScalar(0.5).setY(Y.varal - 0.2);
  const curva = new THREE.QuadraticBezierCurve3(a, meio, b);

  const giros: THREE.Matrix4[] = [];
  for (let i = 0; i < LADOS; i++) giros.push(matriz(new THREE.Vector3(), (i * Math.PI * 2) / LADOS));
  g.add(instanciar(new THREE.TubeGeometry(curva, 9, 0.022, 3, false), mats.corda, giros, "bandeirinhas-corda"));

  const panos: THREE.Matrix4[] = [];
  const cores: THREE.Color[] = [];
  const eixoY = new THREE.Vector3(0, 1, 0);
  for (let i = 0; i < LADOS; i++) {
    const giro = (i * Math.PI * 2) / LADOS;
    for (let j = 0; j < BANDEIRAS_POR_VAO; j++) {
      const t = (j + 0.5) / BANDEIRAS_POR_VAO;
      const p = curva.getPoint(t).applyAxisAngle(eixoY, giro);
      const tangente = curva.getTangent(t);
      const inclinacao = Math.atan2(tangente.y, Math.hypot(tangente.x, tangente.z));
      const m = matriz(p, giro + Math.PI / 2 + (hash(i * 4 + j) - 0.5) * 0.18);
      m.multiply(new THREE.Matrix4().makeRotationX(inclinacao * 0.35));
      panos.push(m);
      cores.push(corDoCiclo(CICLO_BANDEIRA, i * BANDEIRAS_POR_VAO + j));
    }
  }
  const malhaPanos = instanciar(geometriaBandeira(), mats.tecido, panos, "bandeirinhas-panos", cores);
  // As matrizes de repouso ficam guardadas na própria malha: `animar` compõe a
  // ondulação sobre elas sem precisar recalcular a catenária a cada quadro.
  malhaPanos.userData.matrizesBase = panos;
  g.add(malhaPanos);

  // Motivo chapado no centro de cada bandeirinha, deslocado 1 mm à frente do pano.
  const motivos = panos.map((m) =>
    m.clone().multiply(new THREE.Matrix4().makeTranslation(0, -0.155, 0.002)),
  );
  const coresMotivo = cores.map((c) =>
    new THREE.Color(c.r > 0.6 && c.g > 0.6 ? PALETA.vermelho : PALETA.creme),
  );
  g.add(instanciar(new THREE.CircleGeometry(0.045, 5), mats.tecido, motivos, "bandeirinhas-motivo", coresMotivo));
  return g;
}

function construirLanterna(indice: number, mats: Materiais): THREE.Group {
  const a = anguloVertice(PILARES_DIANTEIROS[indice]);
  // A lanterna é modelada em torno do gancho (origem local no gancho, corpo
  // pendurado em -Y), e escalada em bloco: é o que a referência mostra, com a
  // lanterna maior que a seção do pilar e a borda externa além do beiral.
  const g = grupo(`lanterna-${indice + 1}`, {
    pos: [Math.sin(a) * R.lanterna, Y.gancho, Math.cos(a) * R.lanterna],
    rot: [0, a, 0],
    escala: 1.45,
  });

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
  const metal = mesclar([gancho, alca, capuz, colar, aro, base, ...barras]);
  if (metal) g.add(malha(metal, mats.metal, { nome: `lanterna-${indice + 1}-metal`, semContorno: true }));

  // Vidro bojudo: perfil revolucionado, único emissivo da peça.
  const perfil = [
    new THREE.Vector2(0.001, -0.5),
    new THREE.Vector2(0.055, -0.495),
    new THREE.Vector2(0.078, -0.45),
    new THREE.Vector2(0.082, -0.39),
    new THREE.Vector2(0.072, -0.32),
    new THREE.Vector2(0.048, -0.285),
    new THREE.Vector2(0.001, -0.28),
  ];
  g.add(malha(new THREE.LatheGeometry(perfil, 9), mats.vidro, { nome: `lanterna-${indice + 1}-vidro`, semContorno: true }));

  const foco = new THREE.Object3D();
  foco.name = `lanterna-${indice + 1}-foco`;
  foco.position.set(0, -0.39, 0);
  foco.userData.luz = { cor: PALETA.lanterna, intensidade: 1.4, distancia: 3.2, decaimento: 2 };
  g.add(foco);
  return g;
}

function construirInstrumentos(mats: Materiais): THREE.Group {
  const g = grupo("instrumentos", { pos: [0, Y.deck, 0], escala: 1.3 });

  // --- tambor ---
  const tambor = grupo("tambor", { pos: [-0.62, 0, -0.34] });
  tambor.add(
    malha(
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.001, 0),
          new THREE.Vector2(0.19, 0.02),
          new THREE.Vector2(0.215, 0.16),
          new THREE.Vector2(0.2, 0.34),
          new THREE.Vector2(0.001, 0.36),
        ],
        12,
      ),
      mats.verdeAgua,
      { nome: "tambor-corpo" },
    ),
  );
  tambor.add(malha(new THREE.CylinderGeometry(0.215, 0.215, 0.05, 12), mats.creme, { pos: [0, 0.37, 0], nome: "tambor-pele" }));
  const cordasTambor: THREE.Matrix4[] = [];
  for (let i = 0; i < 10; i++) {
    const a1 = (i * Math.PI * 2) / 10;
    const a2 = ((i + 0.5) * Math.PI * 2) / 10;
    cordasTambor.push(
      matrizEntre(
        new THREE.Vector3(Math.sin(a1) * 0.215, 0.33, Math.cos(a1) * 0.215),
        new THREE.Vector3(Math.sin(a2) * 0.205, 0.06, Math.cos(a2) * 0.205),
        new THREE.Vector3(Math.sin(a1), 0, Math.cos(a1)),
      ),
    );
  }
  tambor.add(instanciar(new THREE.BoxGeometry(0.016, 1, 0.016), mats.laranja, cordasTambor, "tambor-cordas"));
  const pes: THREE.Matrix4[] = [];
  for (let i = 0; i < 4; i++) {
    const a1 = (i * Math.PI) / 2 + Math.PI / 4;
    pes.push(matriz(new THREE.Vector3(Math.sin(a1) * 0.15, 0.03, Math.cos(a1) * 0.15), a1));
  }
  tambor.add(instanciar(new THREE.BoxGeometry(0.045, 0.08, 0.045), mats.madeira, pes, "tambor-pes"));
  g.add(tambor);

  // --- violão em suporte tripé ---
  const violao = grupo("violao", { pos: [0.02, 0, -0.3], rot: [-0.12, 0.1, 0], escala: 0.74 });
  const forma = new THREE.Shape();
  forma.moveTo(0, 0.52);
  forma.bezierCurveTo(0.14, 0.52, 0.17, 0.4, 0.14, 0.31);
  forma.bezierCurveTo(0.1, 0.24, 0.1, 0.2, 0.14, 0.13);
  forma.bezierCurveTo(0.19, 0.04, 0.17, -0.09, 0, -0.09);
  forma.bezierCurveTo(-0.17, -0.09, -0.19, 0.04, -0.14, 0.13);
  forma.bezierCurveTo(-0.1, 0.2, -0.1, 0.24, -0.14, 0.31);
  forma.bezierCurveTo(-0.17, 0.4, -0.14, 0.52, 0, 0.52);
  const caixa = new THREE.ExtrudeGeometry(forma, { depth: 0.11, bevelEnabled: false, curveSegments: 5 });
  caixa.translate(0, 0.18, -0.055);
  const corpoViolao = mesclar([
    caixa,
    new THREE.BoxGeometry(0.055, 0.42, 0.05).translate(0, 0.86, 0),
    new THREE.BoxGeometry(0.075, 0.13, 0.045).translate(0, 1.12, 0),
  ]);
  if (corpoViolao) violao.add(malha(corpoViolao, mats.madeiraClara, { nome: "violao-corpo" }));
  violao.add(
    malha(new THREE.CircleGeometry(0.058, 12), mats.madeiraSombra, {
      pos: [0, 0.5, 0.056],
      nome: "violao-boca",
      semContorno: true,
    }),
  );
  const cordas: THREE.Matrix4[] = [];
  for (let i = 0; i < 6; i++) {
    cordas.push(matriz(new THREE.Vector3(-0.02 + i * 0.008, 0.74, 0.058), 0, new THREE.Vector3(1, 0.62, 1)));
  }
  violao.add(instanciar(new THREE.BoxGeometry(0.004, 1, 0.004), mats.creme, cordas, "violao-cordas"));
  const suporte = mesclar([
    new THREE.BoxGeometry(0.035, 0.34, 0.035).translate(-0.13, 0.16, -0.1),
    new THREE.BoxGeometry(0.035, 0.34, 0.035).translate(0.13, 0.16, -0.1),
    new THREE.BoxGeometry(0.32, 0.035, 0.035).translate(0, 0.12, -0.1),
    new THREE.BoxGeometry(0.035, 0.2, 0.035).translate(0, 0.1, 0.09),
  ]);
  if (suporte) violao.add(malha(suporte, mats.madeira, { nome: "violao-suporte" }));
  g.add(violao);

  // --- banquinho ---
  const banquinho = grupo("banquinho", { pos: [0.64, 0, -0.28] });
  const bancoGeo = mesclar([
    new THREE.BoxGeometry(0.05, 0.3, 0.05).translate(-0.17, 0.15, -0.11),
    new THREE.BoxGeometry(0.05, 0.3, 0.05).translate(0.17, 0.15, -0.11),
    new THREE.BoxGeometry(0.05, 0.3, 0.05).translate(-0.17, 0.15, 0.11),
    new THREE.BoxGeometry(0.05, 0.3, 0.05).translate(0.17, 0.15, 0.11),
    new THREE.BoxGeometry(0.46, 0.05, 0.3).translate(0, 0.325, 0),
  ]);
  if (bancoGeo) banquinho.add(malha(bancoGeo, mats.madeiraClara, { nome: "banquinho-corpo" }));
  g.add(banquinho);

  // --- sanfona sobre o banquinho ---
  const sanfona = grupo("sanfona", { pos: [0.64, 0.35, -0.28], rot: [0, -0.3, 0] });
  const caixas = mesclar([
    caixaBisel(0.12, 0.28, 0.22, 0.02, 1).translate(-0.15, 0.14, 0),
    caixaBisel(0.12, 0.28, 0.22, 0.02, 1).translate(0.15, 0.14, 0),
  ]);
  if (caixas) sanfona.add(malha(caixas, mats.vermelho, { nome: "sanfona-caixas" }));
  const pregas: THREE.Matrix4[] = [];
  for (let i = 0; i < 7; i++) {
    pregas.push(
      matriz(new THREE.Vector3(-0.075 + i * 0.025, 0.14, 0), 0, new THREE.Vector3(1, 1, i % 2 ? 0.85 : 1)),
    );
  }
  sanfona.add(instanciar(new THREE.BoxGeometry(0.018, 0.25, 0.2), mats.fole, pregas, "sanfona-fole"));
  const teclas: THREE.Matrix4[] = [];
  for (let i = 0; i < 7; i++) teclas.push(matriz(new THREE.Vector3(-0.21, 0.05 + i * 0.032, 0.06)));
  sanfona.add(instanciar(new THREE.BoxGeometry(0.03, 0.024, 0.09), mats.creme, teclas, "sanfona-teclas"));
  g.add(sanfona);
  return g;
}

/* ------------------------------------------------------------------ */
/* Factory                                                             */
/* ------------------------------------------------------------------ */

export default function criarCoreto(): THREE.Group {
  const raiz = grupo("coreto");
  const mats = criarMateriais();

  raiz.add(construirBase(mats));
  raiz.add(construirEscada(mats));
  raiz.add(construirPiso(mats));
  raiz.add(construirPilares(mats));
  raiz.add(construirGuardaCorpo(mats));
  raiz.add(construirTelhado(mats));
  raiz.add(construirPinaculo(mats));
  raiz.add(construirBandeirinhas(mats));
  for (let i = 0; i < 4; i++) raiz.add(construirLanterna(i, mats));
  raiz.add(construirInstrumentos(mats));

  raiz.userData.sculptRuntime = {
    origem: "img2threejs",
    spec: "docs/evidencias/gauntlet-arraial-3d/img2threejs/coreto/object-sculpt-spec.json",
    /** Único material emissivo da peça, e onde a cena pode pendurar práticas. */
    emissivos: ["lanterna-1-vidro", "lanterna-2-vidro", "lanterna-3-vidro", "lanterna-4-vidro"],
    focos: ["lanterna-1-foco", "lanterna-2-foco", "lanterna-3-foco", "lanterna-4-foco"],
    /** Alvos de clique: grupos macro que a cena pode transformar em ponto interativo. */
    clicaveis: ["base", "piso", "escada", "pilares", "guarda-corpo", "telhado", "pinaculo", "bandeirinhas", "instrumentos"],
    /** Colisor de navegação: prisma octogonal da base mais o volume da escada. */
    colisor: {
      tipo: "prisma-octogonal",
      circunraio: R.plinto,
      altura: Y.deck,
      thetaStart: THETA,
      escada: { largura: LARGURA_ESCADA, profundidade: DEGRAUS * PROFUNDIDADE_PISO, frente: "+Z" },
    },
    separaveis: [
      "lanterna-1",
      "lanterna-2",
      "lanterna-3",
      "lanterna-4",
      "instrumentos",
      "tambor",
      "violao",
      "sanfona",
      "banquinho",
    ],
  };
  return raiz;
}

/** Referências e temporários resolvidos uma vez, na primeira chamada de `animar`. */
type CacheDeAnimacao = {
  lanternas: THREE.Object3D[];
  panos: THREE.InstancedMesh | null;
  matrizesBase: THREE.Matrix4[];
  giro: THREE.Matrix4;
  composta: THREE.Matrix4;
};

function cacheDeAnimacao(raiz: THREE.Group): CacheDeAnimacao {
  const existente = raiz.userData.cacheDeAnimacao as CacheDeAnimacao | undefined;
  if (existente) return existente;
  const panos = raiz.getObjectByName("bandeirinhas-panos");
  const cache: CacheDeAnimacao = {
    lanternas: [1, 2, 3, 4]
      .map((n) => raiz.getObjectByName(`lanterna-${n}`))
      .filter((o): o is THREE.Object3D => Boolean(o)),
    panos: panos instanceof THREE.InstancedMesh ? panos : null,
    matrizesBase: (panos?.userData.matrizesBase as THREE.Matrix4[]) ?? [],
    giro: new THREE.Matrix4(),
    composta: new THREE.Matrix4(),
  };
  raiz.userData.cacheDeAnimacao = cache;
  return cache;
}

/**
 * Balanço determinístico das lanternas (pivô no gancho, rotação em z de ±0.05
 * rad, fase distinta por índice) e ondulação sutil das bandeirinhas. Barato: as
 * referências e as matrizes temporárias são resolvidas na primeira chamada e
 * reaproveitadas, então nenhum quadro aloca.
 */
export function animar(raiz: THREE.Group, t: number, opcoes?: { menosMovimento?: boolean }): void {
  const cache = cacheDeAnimacao(raiz);
  const reduzido = opcoes?.menosMovimento === true;
  // Lanternas no período natural (~1,9 s), cada uma com ritmo e fase próprios.
  for (let i = 0; i < cache.lanternas.length; i++) {
    const ritmo = 3.1 + i * 0.22;
    const onda = Math.sin(t * ritmo + i * 1.7) + 0.25 * Math.sin(t * ritmo * 0.37 + i);
    cache.lanternas[i].rotation.z = reduzido ? 0 : onda * 0.05;
  }
  const { panos, matrizesBase, giro, composta } = cache;
  if (!panos || matrizesBase.length !== panos.count) return;
  if (reduzido) {
    if (raiz.userData.panosEmRepouso) return;
    for (let i = 0; i < panos.count; i++) panos.setMatrixAt(i, matrizesBase[i]);
    panos.instanceMatrix.needsUpdate = true;
    raiz.userData.panosEmRepouso = true;
    return;
  }
  raiz.userData.panosEmRepouso = false;
  for (let i = 0; i < panos.count; i++) {
    giro.makeRotationZ((Math.sin(t * 4.2 + i * 0.9) + 0.3 * Math.sin(t * 1.5 + i * 0.4)) * 0.055);
    composta.multiplyMatrices(matrizesBase[i], giro);
    panos.setMatrixAt(i, composta);
  }
  panos.instanceMatrix.needsUpdate = true;
}
