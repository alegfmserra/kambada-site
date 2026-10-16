/**
 * Fogueira central do arraial.
 *
 * Reconstrução procedural (img2threejs) da referência
 * `kambada-arraial-3d-fogueira.png`. Spec e evidências em
 * `docs/evidencias/gauntlet-arraial-3d/img2threejs/fogueira/`.
 *
 * Passes concluídos: blockout, estrutura, forma, materiais, iluminação,
 * interação e otimização.
 */
import * as THREE from "three";
import { PALETA, grupo, hash, malha, materialToon, aplicarContorno, explodir } from "./_compartilhado";

export { aplicarContorno, explodir };

// ---------------------------------------------------------------------------
// Medidas (metros). Origem no chão, sob o centro do braseiro.
// ---------------------------------------------------------------------------
/**
 * Raio da linha de centro da fiada externa de seixos. Com seixo de 0.44 m de
 * largura, o anel fecha em 2.74 m de diâmetro externo.
 *
 * Medido na referência, não estimado: varrendo as colunas por cor de pedra, a
 * fiada aparece de x=231 a x=995, ou seja 764 px. A escala vem da largura total
 * da silhueta, 1036 px para os 3.72 m de vão entre pés de postes opostos, o que
 * dá 278.5 px por metro. O briefing falava em cerca de 2.2 m; a referência diz
 * 2.74 m, e as duas medidas estão amarradas, porque com 2.2 m sobraria meio
 * metro de folga radial que a referência não tem.
 */
const RAIO_ANEL_EXTERNO = 1.25;
const RAIO_ANEL_INTERNO = 0.99;
const RAIO_LEITO = 0.95;
const TOPO_LEITO = 0.12;

const TORAS = 8;
const TORA_RAIO_BASE = 0.93;
/**
 * Raio do anel de topos da tenda, medido na referência: as pontas cortadas
 * formam um anel de cerca de 1.37 m de diâmetro em volta da base da chama
 * (x de 440 a 820 px, a 278.5 px por metro), e não um ápice fechado. Com o
 * ápice em 0.2 m os troncos encostavam uns nos outros e nenhum tampo aparecia,
 * o que também tapava o leito de brasas.
 */
const TORA_RAIO_TOPO = 0.53;
const TORA_ALTURA = 1.32;

/**
 * Base da chama. Fica abaixo do topo das toras de propósito: na referência o fogo
 * nasce entre os topos dos troncos e a aresta de baixo da silhueta some. Baixado
 * de 1.05 para 0.94 m porque a altura total do render passava 5 por cento da
 * referência (418 px contra 388 no render alinhado).
 */
const CHAMA_BASE = 0.94;
/** Azimute em que a silhueta da chama foi medida na referência (35 graus). */
const AZIMUTE_AUTORAL = THREE.MathUtils.degToRad(35);
/**
 * Fase do hexágono de postes. Para um vértice ficar de frente para a câmera da
 * referência, o poste mais próximo precisa maximizar `sin(a + azimute)`, o que
 * põe o primeiro vértice em 55 graus e não em 35. Com 35 a peça saía com dois
 * postes ladeando o centro em vez de um poste centralizado, e o poste do fundo
 * deixava de se esconder atrás da chama.
 */
const FASE_POSTES = THREE.MathUtils.degToRad(55);
/** Ajuste fino de altura da chama, calibrado por síntese contra a referência. */
const ALTURA_CHAMA = 0.96;

/**
 * Raio do hexágono de postes: 1.7 m, ou 3.4 m entre postes opostos, o alvo do
 * contrato. A medição na referência confirma: a largura total da silhueta no
 * render alinhado dá 430 px contra 425 px da referência com esse raio, e cai
 * para 366 px com 1.36 m. A leitura anterior de 1.36 m vinha da altura de tela
 * do pé do poste, que depende da elevação da câmera e por isso é a medida menos
 * confiável das duas; a largura lateral não sofre encurtamento nenhum.
 */
const RAIO_POSTE = 1.7;
/**
 * Quatro postes em quadrado, e não seis em hexágono.
 *
 * A referência mostra cinco postes visíveis. Medindo o centro de cada um na
 * imagem e normalizando pelo mais afastado, dá -1.00, -0.31, -0.04, +0.33 e
 * +1.00. Nenhum anel regular produz esse conjunto sob uma projeção única: um
 * hexágono daria 0 e mais dois pares em +-0.87, um pentágono daria +-0.62 no
 * par do fundo. Os dois postes atrás do fogo (-0.31 e +0.33) são inconsistência
 * da própria referência, que é uma imagem gerada e não a projeção de um cenário
 * coerente.
 *
 * Os três postes inequívocos caem em -1, 0 e +1, que é exatamente o que um
 * quadrado entrega no azimute de 35 graus: um poste de frente centralizado, um
 * escondido atrás da chama e dois laterais nos extremos. Isso também fecha o
 * contrato, que pede quatro postes e 3.4 m entre opostos, ou seja raio de 1.7 m.
 */
const POSTES = 4;
const POSTE_ALTURA_FUSTE = 0.62;
const POSTE_PE = 0.1;
const POSTE_CAPITEL = 0.13;
const AMARRA_Y = 0.68;
const BARRIGA_CORDA = 0.17;
const BANDEIRINHAS_POR_CORDA = 8;

/** Cores locais desta peça, ausentes da PALETA compartilhada do arraial. */
const CORDA = "#D9B47E";
/**
 * Cinza do braseiro, mais escura que a terra da PALETA. Com o leito claro as
 * brasas competiam com o próprio fundo e liam como pedra; a referência põe o
 * carvão aceso contra sombra, e é o contraste que faz a brasa acender.
 */
const CINZA = "#4A2E1C";

/** Intensidade emissiva de repouso de cada camada de chama, do exterior ao núcleo. */
/**
 * Intensidade emissiva de repouso de cada camada de chama, do exterior ao
 * núcleo. O contrato pedia 1.4, 2.0 e 2.6; nessa faixa, com `MeshToonMaterial`
 * mais tone mapping ACES, as três camadas saturam para o mesmo pêssego e a
 * chama vira uma mancha chapada, o que está registrado no render do primeiro
 * pass completo. Os valores aqui mantêm a mesma ordem e a mesma razão entre as
 * camadas, multiplicados por 0.36, que é onde as três voltam a se distinguir
 * por valor.
 */
const BASE_EMISSIVA = [0.32, 0.5, 0.94] as const;
/** Emissivo de repouso das brasas, pela mesma razão de escala. */
/**
 * Emissivo de repouso das brasas. Calibrado por render: acima de 0.6 o material
 * toon somado ao tone mapping ACES estoura o pedaço para quase branco e a brasa
 * lê como pedra clara, não como carvão aceso.
 */
const EMISSIVA_BRASA = 0.35;

/**
 * Contornos das três camadas de chama, já em METROS, num referencial comum:
 * x=0 no eixo do braseiro, y=0 na base da chama (que fica escondida entre os
 * topos das toras). Cada entrada é `[controleX, controleY, pontoX, pontoY]` de
 * uma bezier quadrática: o ponto de controle é a amostra medida e o ponto final
 * é o meio do caminho até a amostra seguinte, o que mantém a ponta da língua
 * afiada e suaviza o vale.
 *
 * A escolha das amostras é por simplificação de Douglas-Peucker sobre a fronteira
 * inteira, e não por passo uniforme: passo uniforme escolhe sempre a ponta mais
 * saliente da janela e apaga os vales, o que devolveu uma massa lisa sem língua
 * nenhuma na primeira tentativa. Douglas-Peucker guarda ponta e vale pelo mesmo
 * critério de desvio (tolerância de 2.93 px na externa, 1.88 na média, 1.5 na
 * interna, para 26, 23 e 13 pontos).
 *
 * Os valores vêm de medição na referência, não de estimativa a olho: a fronteira
 * superior de cada camada foi extraída por varredura de coluna, classificando o
 * pixel por faixa de cor (externa vermelho-alaranjada, média laranja, interna
 * amarelo-clara) e exigindo corrida contígua mínima para descartar o realce de
 * bisel e a faísca solta. Escala de 265.93 px por metro, obtida dos 359 px de
 * altura da camada externa contra o alvo de 1.35 m.
 *
 * Escalas separadas por eixo, porque a chama é um cartaz vertical numa vista de
 * elevação 22 graus: no eixo horizontal 278.5 px por metro (sem encurtamento),
 * no vertical 258.2, que é o horizontal vezes cos(22 graus). Origem x no eixo do
 * braseiro em x=627 px, entre o centro medido da fiada de seixos (613) e o centro
 * da própria chama (641): 613 puxava a chama 8 px à direita da referência no
 * render alinhado, e 641 puxava a mesma coisa à esquerda. Não é
 * centro da própria chama.
 *
 * Medidas resultantes: externa 1.124 m de largura por 1.388 m de altura, centro
 * em x=+0.110; média 0.679 por 1.013, centro em x=+0.045; interna 0.420 por
 * 0.661, centro em x=+0.056. As três camadas ficam à direita do eixo do
 * braseiro, o que é o tombo do fogo no original e é o que impede a leitura de
 * três cópias concêntricas
 */
type Contorno = readonly (readonly [number, number, number, number])[];

const CONTORNO_EXTERNA: Contorno = [
  [-0.503, 0.403, -0.494, 0.394],
  [-0.485, 0.385, -0.481, 0.390],
  [-0.478, 0.396, -0.463, 0.513],
  [-0.449, 0.631, -0.424, 0.683],
  [-0.399, 0.734, -0.386, 0.804],
  [-0.373, 0.875, -0.357, 0.835],
  [-0.341, 0.796, -0.332, 0.796],
  [-0.323, 0.796, -0.303, 0.899],
  [-0.284, 1.002, -0.255, 0.974],
  [-0.226, 0.946, -0.208, 0.887],
  [-0.190, 0.829, -0.171, 1.016],
  [-0.151, 1.203, -0.113, 1.260],
  [-0.075, 1.317, -0.023, 1.352],
  [0.029, 1.388, 0.045, 1.276],
  [0.061, 1.165, 0.084, 1.134],
  [0.108, 1.103, 0.169, 1.053],
  [0.230, 1.003, 0.259, 0.957],
  [0.287, 0.910, 0.305, 0.773],
  [0.323, 0.637, 0.332, 0.617],
  [0.341, 0.596, 0.354, 0.667],
  [0.366, 0.737, 0.382, 0.759],
  [0.399, 0.781, 0.456, 0.630],
  [0.513, 0.479, 0.544, 0.495],
  [0.575, 0.510, 0.582, 0.383],
  [0.589, 0.257, 0.605, 0.253],
  [0.621, 0.249, 0.621, 0.249],
];

const CONTORNO_MEDIA: Contorno = [
  [-0.345, 0.333, -0.330, 0.399],
  [-0.316, 0.465, -0.285, 0.419],
  [-0.255, 0.373, -0.241, 0.502],
  [-0.226, 0.630, -0.212, 0.659],
  [-0.197, 0.688, -0.135, 0.762],
  [-0.072, 0.837, -0.065, 0.853],
  [-0.057, 0.869, -0.045, 0.941],
  [-0.032, 1.013, -0.004, 0.986],
  [0.025, 0.959, 0.043, 0.925],
  [0.061, 0.891, 0.075, 0.782],
  [0.090, 0.673, 0.122, 0.631],
  [0.154, 0.589, 0.167, 0.640],
  [0.180, 0.690, 0.185, 0.697],
  [0.190, 0.704, 0.196, 0.700],
  [0.201, 0.697, 0.214, 0.609],
  [0.226, 0.522, 0.230, 0.528],
  [0.233, 0.535, 0.237, 0.527],
  [0.241, 0.520, 0.251, 0.463],
  [0.262, 0.406, 0.275, 0.426],
  [0.287, 0.447, 0.293, 0.433],
  [0.298, 0.419, 0.305, 0.429],
  [0.312, 0.439, 0.323, 0.422],
  [0.334, 0.406, 0.334, 0.406],
];

const CONTORNO_INTERNA: Contorno = [
  [-0.205, 0.229, -0.178, 0.278],
  [-0.151, 0.328, -0.144, 0.366],
  [-0.136, 0.403, -0.131, 0.402],
  [-0.126, 0.401, -0.118, 0.367],
  [-0.111, 0.334, -0.092, 0.357],
  [-0.072, 0.381, -0.059, 0.502],
  [-0.047, 0.622, -0.032, 0.642],
  [-0.018, 0.661, 0.005, 0.615],
  [0.029, 0.569, 0.090, 0.505],
  [0.151, 0.440, 0.162, 0.419],
  [0.172, 0.398, 0.185, 0.344],
  [0.197, 0.289, 0.206, 0.288],
  [0.215, 0.288, 0.215, 0.288],
];

function silhuetaChama(contorno: Contorno): THREE.Shape {
  const s = new THREE.Shape();
  const inicio = contorno[0];
  const fim = contorno[contorno.length - 1];
  s.moveTo(inicio[0], 0);
  for (const [cx, cy, px, py] of contorno) s.quadraticCurveTo(cx, cy, px, py);
  s.lineTo(fim[0], 0);
  s.lineTo(inicio[0], 0);
  return s;
}

function geometriaChama(profundidade: number, bisel: number, contorno: Contorno, segmentos: number): THREE.BufferGeometry {
  const g = new THREE.ExtrudeGeometry(silhuetaChama(contorno), {
    depth: profundidade,
    bevelEnabled: true,
    bevelThickness: bisel,
    bevelSize: bisel,
    bevelSegments: 1,
    curveSegments: segmentos,
  });
  g.translate(0, 0, -profundidade / 2);
  return g;
}

/** Pontos de uma catenária aproximada entre dois postes vizinhos. */
function pontosCatenaria(a: THREE.Vector3, b: THREE.Vector3, barriga: number, amostras = 6): THREE.Vector3[] {
  const pontos: THREE.Vector3[] = [];
  for (let i = 0; i <= amostras; i++) {
    const t = i / amostras;
    const p = new THREE.Vector3().lerpVectors(a, b, t);
    p.y -= barriga * Math.sin(Math.PI * t) ** 0.8;
    pontos.push(p);
  }
  return pontos;
}

/**
 * Tubo centrado na própria origem, com o deslocamento devolvido na posição da
 * malha. A casca de contorno por inverted hull escala em torno da origem local:
 * uma `TubeGeometry` construída em coordenadas de mundo tem a origem longe do
 * próprio centro, e a casca era arremessada para fora do quadro.
 */
function tuboCentrado(curva: THREE.Curve<THREE.Vector3>, tubulares: number, raio: number, radiais: number, nome: string, material: THREE.Material): THREE.Mesh {
  const geo = new THREE.TubeGeometry(curva, tubulares, raio, radiais, false);
  geo.computeBoundingBox();
  const centro = new THREE.Vector3();
  geo.boundingBox?.getCenter(centro);
  geo.translate(-centro.x, -centro.y, -centro.z);
  return malha(geo, material, { pos: [centro.x, centro.y, centro.z], nome, semContorno: true });
}

/**
 * Uma fiada de seixos em anel, como `InstancedMesh`. A variação de escala e de
 * giro vem de `hash` determinístico por índice, nunca de `Math.random`: assim a
 * distribuição é a mesma entre remontagens e a depuração visual é estável.
 *
 * A esfera de 7 por 5 segmentos com sombreamento plano é o que devolve o painel
 * poligonal claro visto na referência, sem textura e por 56 triângulos.
 */
function fiadaDeSeixos(
  nome: string,
  quantidade: number,
  raio: number,
  altura: number,
  largura: number,
  profundidade: number,
  espessura: number,
  faseGraus: number,
  material: THREE.Material,
): THREE.InstancedMesh {
  const geo = new THREE.SphereGeometry(0.5, 7, 5);
  const inst = new THREE.InstancedMesh(geo, material, quantidade);
  inst.name = nome;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const pos = new THREE.Vector3();
  const esc = new THREE.Vector3();
  const fase = THREE.MathUtils.degToRad(faseGraus);
  for (let i = 0; i < quantidade; i++) {
    const a = fase + (i / quantidade) * Math.PI * 2;
    const v = hash(i * 3 + 7);
    const w = hash(i * 3 + 8);
    const u = hash(i * 3 + 9);
    pos.set(Math.cos(a) * raio, altura + (v - 0.5) * 0.05, Math.sin(a) * raio);
    e.set((v - 0.5) * 0.3, a + (w - 0.5) * 0.9, (u - 0.5) * 0.34);
    q.setFromEuler(e);
    const k = 0.86 + w * 0.28;
    esc.set(largura * k, espessura * (0.9 + u * 0.2), profundidade * k);
    inst.setMatrixAt(i, m.compose(pos, q, esc));
  }
  inst.instanceMatrix.needsUpdate = true;
  return inst;
}

/** Pedaços poligonais do leito, quentes ou apagados, espalhados por hash. */
function pedacosDoLeito(nome: string, quantidade: number, semente: number, material: THREE.Material): THREE.InstancedMesh {
  const inst = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.5, 0), material, quantidade);
  inst.name = nome;
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const pos = new THREE.Vector3();
  const esc = new THREE.Vector3();
  for (let i = 0; i < quantidade; i++) {
    const v = hash(i * 5 + semente);
    const w = hash(i * 5 + semente + 1);
    const u = hash(i * 5 + semente + 2);
    const a = v * Math.PI * 2;
    const r = 0.34 + w * 0.44;
    const tam = 0.15 + u * 0.12;
    // Altura calibrada contra o gate de fidelidade do leito: com o topo da
    // fiada interna de pedras em 0.44 m e a camera a 22 graus de elevacao,
    // brasa abaixo disso fica no fundo do poco e some. Aqui o pedaco nasce
    // acima da borda e aparece pelo vao entre os troncos.
    // Sobre a encosta do montículo: a brasa acompanha a superfície de cinza em
    // vez de flutuar no meio do poço, e é aí que ela aparece pelo vão entre os
    // troncos numa câmera de 22 graus de elevação.
    pos.set(Math.cos(a) * r, 0.62 - (r - 0.34) * 0.72 + u * 0.06, Math.sin(a) * r);
    e.set(v * 3, w * 3, u * 3);
    q.setFromEuler(e);
    esc.set(tam, tam * (0.7 + v * 0.4), tam);
    inst.setMatrixAt(i, m.compose(pos, q, esc));
  }
  inst.instanceMatrix.needsUpdate = true;
  return inst;
}


/**
 * Contorno cartoon para `InstancedMesh`.
 *
 * O `aplicarContorno` compartilhado pendura a casca como filha da malha. Isso
 * funciona para malha comum, e não funciona para malha instanciada: um filho
 * comum de um `InstancedMesh` é desenhado uma vez só, na transformação do pai,
 * e não uma vez por instância. O resultado é que toda a parte instanciada da
 * peça (seixos, toras, postes, bandeirinhas) ficava sem contorno nenhum.
 *
 * Aqui a casca é uma malha instanciada irmã, com a mesma lista de matrizes de
 * instância e a geometria inflada por eixo, para a espessura de mundo ficar
 * próxima da constante da praça. As duas ficam marcadas em `userData` para a
 * rotina compartilhada não tentar contorná-las de novo.
 */
const ESPESSURA_CASCA = 0.022;

function cascaInstanciada(inst: THREE.InstancedMesh): THREE.InstancedMesh {
  const geo = inst.geometry.clone();
  geo.computeBoundingBox();
  const tam = new THREE.Vector3();
  geo.boundingBox?.getSize(tam);
  const eixo = (t: number) => 1 + (2 * ESPESSURA_CASCA) / Math.max(t, 0.05);
  geo.scale(eixo(tam.x), eixo(tam.y), eixo(tam.z));
  const casca = new THREE.InstancedMesh(
    geo,
    new THREE.MeshBasicMaterial({ color: PALETA.tinta, side: THREE.BackSide }),
    inst.count,
  );
  casca.name = `${inst.name}-casca`;
  casca.instanceMatrix.copy(inst.instanceMatrix);
  casca.instanceMatrix.needsUpdate = true;
  casca.userData.contorno = true;
  casca.renderOrder = -1;
  inst.userData.semContorno = true;
  return casca;
}

/** Aplica `cascaInstanciada` em toda malha instanciada de um grupo. */
function contornarInstanciadas(raiz: THREE.Object3D): void {
  const alvos: THREE.InstancedMesh[] = [];
  raiz.traverse((o) => {
    if ((o as THREE.InstancedMesh).isInstancedMesh && !o.userData.contorno && !o.userData.semContorno) {
      alvos.push(o as THREE.InstancedMesh);
    }
  });
  for (const alvo of alvos) alvo.parent?.add(cascaInstanciada(alvo));
}

/** Estado em cache para `animar` não alocar nada por quadro. */
type EstadoAnimacao = {
  camadas: THREE.Group[];
  brasas: THREE.InstancedMesh | null;
  materialBrasa: THREE.MeshToonMaterial | null;
  materiaisChama: THREE.MeshToonMaterial[];
  faiscas: THREE.Points | null;
  faiscasBase: Float32Array | null;
};

export default function criarFogueira(): THREE.Group {
  const raiz = grupo("fogueira");

  // --- materiais (todos toon, sem textura; emissivo só na chama e nas brasas) ---
  const mPedra = materialToon(PALETA.pedra);
  const mCinza = materialToon(CINZA);
  const mCarvao = materialToon(PALETA.madeiraSombra);
  const mBrasa = materialToon(PALETA.laranja, { emissivo: PALETA.chama, intensidadeEmissiva: EMISSIVA_BRASA });
  const mCasca = materialToon(PALETA.madeira);
  const mTampo = materialToon(PALETA.madeiraClara);
  const mAnelTampo = materialToon(PALETA.madeiraSombra);
  const mPoste = materialToon(PALETA.madeira);
  const mCapitel = materialToon(PALETA.madeiraClara);
  const mCorda = materialToon(CORDA);
  const mBandeira = materialToon("#FFFFFF");
  const mChamaExterna = materialToon(PALETA.chamaEscura, { emissivo: PALETA.chamaEscura, intensidadeEmissiva: BASE_EMISSIVA[0] });
  const mChamaMedia = materialToon(PALETA.chama, { emissivo: PALETA.chama, intensidadeEmissiva: BASE_EMISSIVA[1] });
  const mChamaInterna = materialToon(PALETA.chamaClara, { emissivo: PALETA.chamaClara, intensidadeEmissiva: BASE_EMISSIVA[2] });

  // --- anel de pedras: duas fiadas de seixos instanciados ---
  const pedras = grupo("pedras");
  pedras.add(fiadaDeSeixos("anel-externo", 18, RAIO_ANEL_EXTERNO, 0.15, 0.5, 0.4, 0.32, 0, mPedra));
  pedras.add(fiadaDeSeixos("anel-interno", 16, RAIO_ANEL_INTERNO, 0.3, 0.41, 0.34, 0.28, 11, mPedra));
  raiz.add(pedras);

  // --- leito de brasas ---
  const brasas = grupo("brasas");
  // Montículo, e não disco raso: com o leito baixo o fundo da cena aparecia
  // pelos vãos entre as toras, e a referência tem cinza e pedra preenchendo
  // tudo o que está atrás dos troncos. O topo em 0.62 m fica logo abaixo do
  // meio do vão, então fecha o buraco sem esconder as brasas.
  brasas.add(malha(new THREE.CylinderGeometry(RAIO_LEITO * 0.6, RAIO_LEITO, 0.62, 16), mCinza, { pos: [0, 0.31, 0], nome: "leito" }));
  const brasasQuentes = pedacosDoLeito("brasas-quentes", 13, 3, mBrasa);
  brasas.add(brasasQuentes);
  const brasasFrias = pedacosDoLeito("brasas-frias", 8, 41, mCarvao);
  // Sem casca: um carvão pequeno dentro do braseiro fica todo engolido pela
  // própria linha de contorno e lê como buraco preto no meio do fogo.
  brasasFrias.userData.semContorno = true;
  brasas.add(brasasFrias);
  raiz.add(brasas);

  // --- tenda de toras ---
  const toras = grupo("toras");
  const inclinacao = Math.atan2(TORA_RAIO_BASE - TORA_RAIO_TOPO, TORA_ALTURA - TOPO_LEITO);
  const comprimento = Math.hypot(TORA_RAIO_BASE - TORA_RAIO_TOPO, TORA_ALTURA - TOPO_LEITO);
  const geoCorpo = new THREE.CylinderGeometry(0.13, 0.155, 1, 10);
  geoCorpo.translate(0, 0.5, 0);
  const geoTampo = new THREE.CircleGeometry(0.128, 10);
  geoTampo.rotateX(-Math.PI / 2);
  const geoAnelTampo = new THREE.RingGeometry(0.044, 0.078, 10, 1);
  geoAnelTampo.rotateX(-Math.PI / 2);
  const iCorpo = new THREE.InstancedMesh(geoCorpo, mCasca, TORAS);
  const iTampo = new THREE.InstancedMesh(geoTampo, mTampo, TORAS);
  const iAnel = new THREE.InstancedMesh(geoAnelTampo, mAnelTampo, TORAS);
  iCorpo.name = "tora-corpo";
  iTampo.name = "tora-tampo";
  iAnel.name = "tora-anel";
  iTampo.userData.semContorno = true;
  iAnel.userData.semContorno = true;
  {
    const m = new THREE.Matrix4();
    const base = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const esc = new THREE.Vector3();
    const topo = new THREE.Matrix4();
    const giro = new THREE.Matrix4();
    const deslocamento = new THREE.Matrix4();
    for (let i = 0; i < TORAS; i++) {
      const v = hash(i * 7 + 13);
      const w = hash(i * 7 + 14);
      const a = (i / TORAS) * Math.PI * 2 + (v - 0.5) * 0.18;
      const comp = comprimento * (0.92 + w * 0.14);
      pos.set(Math.cos(a) * TORA_RAIO_BASE, TOPO_LEITO - 0.06, Math.sin(a) * TORA_RAIO_BASE);
      e.set(0, -a + (v - 0.5) * 0.5, 0);
      q.setFromEuler(e);
      esc.set(1, 1, 1);
      base.compose(pos, q, esc);
      e.set(0, 0, inclinacao + (w - 0.5) * 0.06);
      q.setFromEuler(e);
      pos.set(0, 0, 0);
      esc.set(1, comp, 1);
      m.copy(base).multiply(new THREE.Matrix4().compose(pos, q, esc));
      iCorpo.setMatrixAt(i, m);
      // Tampo e anel na ponta de cima do tronco, na mesma inclinação. A ordem
      // importa: `compose` monta T·R·S, que translada no referencial NÃO girado
      // e jogava o tampo para cima na vertical, solto do tronco inclinado. O
      // certo é girar primeiro e só então subir ao longo do eixo já inclinado.
      giro.makeRotationFromQuaternion(q);
      topo.copy(giro).multiply(deslocamento.makeTranslation(0, comp, 0)).premultiply(base);
      iTampo.setMatrixAt(i, topo);
      topo.copy(giro).multiply(deslocamento.makeTranslation(0, comp + 0.004, 0)).premultiply(base);
      iAnel.setMatrixAt(i, topo);
    }
  }
  iCorpo.instanceMatrix.needsUpdate = true;
  iTampo.instanceMatrix.needsUpdate = true;
  iAnel.instanceMatrix.needsUpdate = true;
  toras.add(iCorpo, iTampo, iAnel);
  raiz.add(toras);

  // --- chama em três camadas ---
  const chama = grupo("chama", { pos: [0, CHAMA_BASE, 0], escala: [1, ALTURA_CHAMA, 1] });
  /**
   * Profundidade de extrusão CRESCENTE do exterior para o núcleo, ao contrário
   * da largura. Com a extrusão mais funda na camada externa, as duas de dentro
   * ficam soterradas no volume dela e a chama sai como uma mancha laranja
   * chapada, sem as três camadas: está registrado no render do primeiro pass
   * completo. Invertendo a ordem, cada camada interna atravessa a anterior e
   * aparece pelas duas faces, então a leitura de três valores se mantém de
   * frente e de costas, sem depender do ângulo da câmera.
   *
   * As seis placas vão com `semContorno`. As duas opções foram renderizadas lado
   * a lado com a referência em `comparacoes/chama-contorno-ab.png`: com a casca
   * de contorno a chama ganha uma borda preta grossa que apaga o brilho e ainda
   * deixa artefato dentro da silhueta, onde as cascas das placas cruzadas se
   * atravessam. A referência também não tem linha na chama.
   */
  const camadas: Array<[string, number, number, Contorno, THREE.MeshToonMaterial]> = [
    ["chama-externa", 0.09, 0.03, CONTORNO_EXTERNA, mChamaExterna],
    ["chama-media", 0.18, 0.024, CONTORNO_MEDIA, mChamaMedia],
    ["chama-interna", 0.27, 0.018, CONTORNO_INTERNA, mChamaInterna],
  ];
  const gruposChama: THREE.Group[] = [];
  for (const [nome, profundidade, bisel, contorno, material] of camadas) {
    const g = grupo(nome);
    // Duas placas cruzadas por camada. Uma silhueta extrudada sozinha vira uma
    // lasca fina a 90 graus do ângulo autoral, e o gate de múltiplos ângulos
    // reprova isso como vista degenerada. A placa da frente fica alinhada com o
    // azimute em que a silhueta foi medida; a lateral é a mesma silhueta girada
    // 90 graus, estreitada em 22 por cento e com menos segmentos de curva, para
    // o cruzamento não engordar a leitura na diagonal nem o orçamento.
    g.add(malha(geometriaChama(profundidade, bisel, contorno, 2), material, { rot: [0, AZIMUTE_AUTORAL, 0], nome: `${nome}-frente`, semContorno: true }));
    g.add(malha(geometriaChama(profundidade * 0.35, bisel, contorno, 1), material, { rot: [0, AZIMUTE_AUTORAL + Math.PI / 2, 0], escala: [0.62, 1, 1], nome: `${nome}-lado`, semContorno: true }));
    chama.add(g);
    gruposChama.push(g);
  }
  raiz.add(chama);

  // --- faíscas: um único THREE.Points, sem sistema de partículas ---
  const faiscas = grupo("faiscas");
  const totalFaiscas = 18;
  const posFaiscas = new Float32Array(totalFaiscas * 3);
  const baseFaiscas = new Float32Array(totalFaiscas * 3);
  for (let i = 0; i < totalFaiscas; i++) {
    const v = hash(i * 11 + 5);
    const w = hash(i * 11 + 6);
    const a = v * Math.PI * 2;
    const r = 0.05 + w * 0.4;
    baseFaiscas[i * 3] = Math.cos(a) * r;
    baseFaiscas[i * 3 + 1] = v;
    baseFaiscas[i * 3 + 2] = Math.sin(a) * r;
    posFaiscas[i * 3] = baseFaiscas[i * 3];
    posFaiscas[i * 3 + 1] = 1.4 + baseFaiscas[i * 3 + 1] * 0.55;
    posFaiscas[i * 3 + 2] = baseFaiscas[i * 3 + 2];
  }
  const geoFaiscas = new THREE.BufferGeometry();
  geoFaiscas.setAttribute("position", new THREE.BufferAttribute(posFaiscas, 3));
  const pontosFaiscas = new THREE.Points(
    geoFaiscas,
    new THREE.PointsMaterial({ color: PALETA.chamaClara, size: 0.045, sizeAttenuation: true, transparent: true, opacity: 0.9 }),
  );
  pontosFaiscas.name = "faiscas-pontos";
  faiscas.add(pontosFaiscas);
  raiz.add(faiscas);

  // --- postes ---
  const postes = grupo("postes");
  const ancoras: THREE.Vector3[] = [];
  const geoFuste = new THREE.CylinderGeometry(0.085, 0.085, POSTE_ALTURA_FUSTE, 8);
  const geoCapitel = new THREE.CylinderGeometry(0.115, 0.115, POSTE_CAPITEL, 8);
  const geoPe = new THREE.CylinderGeometry(0.105, 0.185, POSTE_PE, 8);
  const iFuste = new THREE.InstancedMesh(geoFuste, mPoste, POSTES);
  const iCapitel = new THREE.InstancedMesh(geoCapitel, mCapitel, POSTES);
  const iPe = new THREE.InstancedMesh(geoPe, mPoste, POSTES);
  iFuste.name = "poste-fuste";
  iCapitel.name = "poste-capitel";
  iPe.name = "poste-pe";
  const cordasDoPoste = grupo("poste-corda");
  {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const pos = new THREE.Vector3();
    const esc = new THREE.Vector3(1, 1, 1);
    for (let i = 0; i < POSTES; i++) {
      const a = (i / POSTES) * Math.PI * 2 + FASE_POSTES;
      const x = Math.cos(a) * RAIO_POSTE;
      const z = Math.sin(a) * RAIO_POSTE;
      pos.set(x, POSTE_PE + POSTE_ALTURA_FUSTE / 2, z);
      iFuste.setMatrixAt(i, m.compose(pos, q, esc));
      pos.set(x, POSTE_PE + POSTE_ALTURA_FUSTE + POSTE_CAPITEL / 2, z);
      iCapitel.setMatrixAt(i, m.compose(pos, q, esc));
      pos.set(x, POSTE_PE / 2, z);
      iPe.setMatrixAt(i, m.compose(pos, q, esc));
      // enrolamento helicoidal de três voltas logo abaixo do capitel
      const voltas: THREE.Vector3[] = [];
      const passos = 15;
      for (let k = 0; k <= passos; k++) {
        const t = k / passos;
        const ang = t * Math.PI * 6;
        voltas.push(new THREE.Vector3(x + Math.cos(ang) * 0.1, AMARRA_Y - 0.07 + t * 0.14, z + Math.sin(ang) * 0.1));
      }
      cordasDoPoste.add(tuboCentrado(new THREE.CatmullRomCurve3(voltas), passos, 0.018, 3, `poste-corda-${i}`, mCorda));
      ancoras.push(new THREE.Vector3(x, AMARRA_Y, z));
    }
  }
  iFuste.instanceMatrix.needsUpdate = true;
  iCapitel.instanceMatrix.needsUpdate = true;
  iPe.instanceMatrix.needsUpdate = true;
  postes.add(iFuste, iCapitel, iPe, cordasDoPoste);
  raiz.add(postes);

  // --- cordas e bandeirinhas ---
  const cordas = grupo("cordas");
  const bandeirinhas = grupo("bandeirinhas");
  const triangulo = new THREE.Shape();
  triangulo.moveTo(-0.09, 0);
  triangulo.lineTo(0.09, 0);
  triangulo.lineTo(0, -0.24);
  triangulo.lineTo(-0.09, 0);
  const geoBandeira = new THREE.ExtrudeGeometry(triangulo, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.006, bevelSegments: 1, curveSegments: 1 });
  const totalBandeiras = POSTES * BANDEIRINHAS_POR_CORDA;
  const iBandeira = new THREE.InstancedMesh(geoBandeira, mBandeira, totalBandeiras);
  iBandeira.name = "bandeirinha";
  const cicloDeCores = [PALETA.amarelo, PALETA.verdeAgua, PALETA.vermelho, PALETA.laranja];
  {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const pos = new THREE.Vector3();
    const esc = new THREE.Vector3(1, 1, 1);
    const cor = new THREE.Color();
    let n = 0;
    for (let i = 0; i < POSTES; i++) {
      const curva = new THREE.CatmullRomCurve3(pontosCatenaria(ancoras[i], ancoras[(i + 1) % POSTES], BARRIGA_CORDA));
      cordas.add(tuboCentrado(curva, 12, 0.018, 3, `corda-${i}`, mCorda));
      for (let j = 0; j < BANDEIRINHAS_POR_CORDA; j++) {
        const t = 0.08 + (j / (BANDEIRINHAS_POR_CORDA - 1)) * 0.84;
        const p = curva.getPointAt(t);
        const tangente = curva.getTangentAt(t);
        pos.set(p.x, p.y + 0.012, p.z);
        e.set(0, Math.atan2(tangente.x, tangente.z) + Math.PI / 2, 0);
        q.setFromEuler(e);
        iBandeira.setMatrixAt(n, m.compose(pos, q, esc));
        iBandeira.setColorAt(n, cor.set(cicloDeCores[n % cicloDeCores.length]));
        n++;
      }
    }
  }
  iBandeira.instanceMatrix.needsUpdate = true;
  if (iBandeira.instanceColor) iBandeira.instanceColor.needsUpdate = true;
  bandeirinhas.add(iBandeira);
  raiz.add(cordas);
  raiz.add(bandeirinhas);

  // Contorno das partes instanciadas antes de devolver: a rotina compartilhada
  // não alcança InstancedMesh, e sem isso metade da peça sai sem linha.
  contornarInstanciadas(raiz);

  const estado: EstadoAnimacao = {
    camadas: gruposChama,
    brasas: brasasQuentes,
    materialBrasa: mBrasa,
    materiaisChama: [mChamaExterna, mChamaMedia, mChamaInterna],
    faiscas: pontosFaiscas,
    faiscasBase: baseFaiscas,
  };
  raiz.userData.animacao = estado;
  raiz.userData.sculptRuntime = {
    spec: "docs/evidencias/gauntlet-arraial-3d/img2threejs/fogueira/object-sculpt-spec.json",
    partes: ["pedras", "brasas", "toras", "chama", "faiscas", "postes", "cordas", "bandeirinhas"],
    colisor: { tipo: "cilindro", raio: RAIO_ANEL_EXTERNO + 0.25, altura: TORA_ALTURA },
  };
  return raiz;
}

/**
 * Tremulação determinística das três camadas, pulso das brasas e faíscas subindo
 * em laço. Sem alocação por quadro: tudo o que a função toca já está em cache no
 * `userData` da raiz desde a montagem.
 *
 * Com `menosMovimento` a peça troca escala e rotação por um pulso lento de
 * emissivo. Chama tremulando e faísca subindo são exatamente o tipo de movimento
 * periférico que adoece quem tem distúrbio vestibular, então a alternativa
 * preserva a informação (o fogo continua aceso e vivo) sem o deslocamento.
 */
export function animar(raiz: THREE.Group, t: number, opcoes?: { menosMovimento?: boolean }): void {
  const e = raiz.userData.animacao as EstadoAnimacao | undefined;
  if (!e) return;
  const reduzido = opcoes?.menosMovimento === true;

  if (reduzido) {
    const pulso = 0.5 + 0.5 * Math.sin(t * 0.9);
    for (let i = 0; i < e.camadas.length; i++) {
      const g = e.camadas[i];
      g.scale.set(1, 1, 1);
      g.rotation.z = 0;
      e.materiaisChama[i].emissiveIntensity = BASE_EMISSIVA[i] * (0.9 + pulso * 0.12);
    }
    if (e.materialBrasa) e.materialBrasa.emissiveIntensity = EMISSIVA_BRASA * (0.9 + pulso * 0.15);
    return;
  }

  // A silhueta muda de verdade: cada camada estica e encolhe em frequências
  // diferentes (soma de dois senos, sem período comum), inclina pra um lado e
  // pro outro e a interna lambe mais alto que a externa.
  for (let i = 0; i < e.camadas.length; i++) {
    const g = e.camadas[i];
    const fase = i * 1.7;
    const lamber = Math.sin(t * (3.4 + i * 0.7) + fase) * 0.6 + Math.sin(t * (5.3 + i * 0.9) + fase * 2) * 0.4;
    // Camada externa com picos maiores; o núcleo claro fica mais estreito (0,78)
    // pra a chama ler em três línguas e não em blob branco.
    const base = i === 2 ? 0.78 : i === 1 ? 0.92 : 1;
    g.scale.y = (i === 2 ? 0.9 : 1) + (0.22 - i * 0.05) * lamber;
    g.scale.x = base * (1 - 0.07 * lamber + 0.05 * Math.sin(t * (2.2 + i * 0.4) + fase * 1.3));
    g.scale.z = g.scale.x;
    g.rotation.z = (0.05 + i * 0.02) * (Math.sin(t * (1.9 + i * 0.35) + fase) + 0.4 * Math.sin(t * 4.7 + fase));
    e.materiaisChama[i].emissiveIntensity = BASE_EMISSIVA[i] * (1 + 0.1 * Math.sin(t * 3.1 + fase) + 0.05 * Math.sin(t * 7.3));
  }
  if (e.materialBrasa) e.materialBrasa.emissiveIntensity = EMISSIVA_BRASA * (1 + 0.21 * Math.sin(t * 1.6));

  const p = e.faiscas;
  const base = e.faiscasBase;
  if (p && base) {
    const atributo = p.geometry.getAttribute("position") as THREE.BufferAttribute;
    const arr = atributo.array as Float32Array;
    for (let i = 0; i < base.length; i += 3) {
      const fase = base[i + 1];
      // Faixa curta de propósito: com a subida indo até 2.8 m as faíscas
      // esticavam a caixa envolvente da peça em 8 por cento e desalinhavam o
      // enquadramento contra a referência, que tem uma faísca só e baixa.
      // Velocidade e alcance próprios por faísca (derivados da fase), pra
      // não subirem em esteira.
      const velocidade = 0.3 + fase * 0.35;
      const alcance = 0.45 + fase * 0.5;
      const subida = (t * velocidade + fase) % 1;
      arr[i] = base[i] + Math.sin(t * 1.4 + fase * 6) * (0.04 + subida * 0.08);
      arr[i + 1] = 1.35 + subida * alcance;
      arr[i + 2] = base[i + 2] + Math.cos(t * 1.1 + fase * 5) * (0.04 + subida * 0.08);
    }
    atributo.needsUpdate = true;
  }
}
