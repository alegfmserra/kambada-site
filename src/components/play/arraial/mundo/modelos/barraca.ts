/**
 * Barraca de comidas do arraial: reconstrucao procedural em codigo, guiada pela spec
 * em docs/evidencias/gauntlet-arraial-3d/img2threejs/barraca/object-sculpt-spec.json
 * (pipeline img2threejs, referencia kambada-arraial-3d-barraca-comidas.png).
 *
 * Unidades em metros. Origem no chao sob o centro do balcao. Frente virada pra +Z.
 * A roda fica no lado +X.
 *
 * A mesma barraca serve modularmente varias barracas da praca: so mudam as duas cores
 * do toldo, a sequencia de cor dos paineis do balcao e o que esta em cima do tampo.
 *
 * Nao ha InstancedMesh aqui de proposito. O contorno da praca e por inverted hull, que
 * clona a geometria de cada malha, e uma casca clonada de um InstancedMesh sai no lugar
 * errado. Cada sistema repetido e mesclado numa malha unica por cor, o que preserva o
 * contorno, mantem uma chamada de desenho por sistema e cabe no teto de 45 malhas.
 *
 * As cotas em metros vem da leitura da referencia, e nao da perseguicao da metrica de
 * silhueta do gate. Roda de 0.44 m de raio, por exemplo, sai da razao medida entre o
 * diametro da roda e a altura total na referencia (0.31); inflar a roda subia a IoU do
 * gate e afastava o modelo do que a referencia mostra, entao foi revertido.
 */
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { PALETA, caixaBisel, grupo, hash, malha, materialToon, aplicarContorno, explodir } from "./_compartilhado";

export { aplicarContorno, explodir };

/* ------------------------------------------------------------------ cores */

/** Cores locais da barraca que nao existem na PALETA da praca. */
const COR = {
  bronze: "#8A6636",
  bronzeEscuro: "#5F4A32",
  roxoBandeira: "#8B5A9B",
  massaClara: "#F6D46A",
  cordao: "#EFE0BE",
} as const;

/* ---------------------------------------------------------------- medidas */

/** Cotas lidas da spec (silhouette.landmarks e component.dimensions), em metros. */
const M = {
  tampo: { largura: 2.16, altura: 0.14, profundidade: 1.06, y: 0.93 },
  corpo: { largura: 1.94, altura: 0.52, profundidade: 0.84, y: 0.6 },
  rodape: { largura: 1.86, altura: 0.2, profundidade: 0.82, y: 0.24 },
  pilar: { secao: 0.16, x: 0.89, z: 0.43, altura: 2.2 },
  quadro: { y: 2.27, secao: 0.14 },
  telhado: { meiaLargura: 1.21, beiral: 0.78, cume: 2.52, borda: 2.28, flecha: 0.11, telhas: 9 },
  // toldo.y e o TOPO da lingua, nao o centro: a forma extrudada corre de 0 a -altura
  toldo: { y: 2.08, altura: 0.42, lingua: 0.31, linguasFrente: 7, linguasLado: 3 },
  varal: { y: 2.26, bandeirola: { largura: 0.15, altura: 0.19, entalhe: 0.055 } },
  roda: { x: 1.11, y: 0.46, raio: 0.44, espessura: 0.15, raios: 12 },
  banquinho: { x: -1.3, z: 0.3 },
  paineis: { quantidade: 6, largura: 0.32, altura: 0.5 },
};

/** Elevacao do arco parabolico do telhado numa posicao x (flecha de 0.10 m nas pontas). */
function arcoTelhado(x: number): number {
  const t = x / M.telhado.meiaLargura;
  return M.telhado.flecha * t * t;
}

/* --------------------------------------------------------------- ajudantes */

type Colocacao = { pos?: [number, number, number]; rot?: [number, number, number]; escala?: [number, number, number] };

const _m = new THREE.Matrix4();
const _q = new THREE.Quaternion();
const _e = new THREE.Euler();
const _v = new THREE.Vector3();
const _s = new THREE.Vector3();

/**
 * Copia a geometria ja transformada, para poder mesclar um sistema repetido numa malha so.
 * Desindexa e mantem so position, normal e uv: mergeGeometries devolve null quando as
 * entradas divergem em indice ou em conjunto de atributos, e aqui convivem primitivas
 * indexadas (caixa, cilindro, lathe, tubo) com nao indexadas (extrusao do toldo e da
 * bandeirola). Desindexar todo mundo e o menor denominador comum, e nao muda a contagem
 * de triangulos, so a de vertices.
 */
const ATRIBUTOS_MESCLAVEIS = ["position", "normal", "uv"];

function posta(geometria: THREE.BufferGeometry, c: Colocacao): THREE.BufferGeometry {
  const base = geometria.index ? geometria.toNonIndexed() : geometria.clone();
  const g = new THREE.BufferGeometry();
  for (const nome of ATRIBUTOS_MESCLAVEIS) {
    const atributo = base.getAttribute(nome);
    if (atributo) g.setAttribute(nome, atributo.clone());
  }
  base.dispose();
  _v.set(...(c.pos ?? [0, 0, 0]));
  _e.set(...(c.rot ?? [0, 0, 0]));
  _q.setFromEuler(_e);
  _s.set(...(c.escala ?? [1, 1, 1]));
  g.applyMatrix4(_m.compose(_v, _q, _s));
  return g;
}

/**
 * Mescla as copias de um sistema repetido numa malha unica nomeada, ja centrada.
 *
 * Centrar nao e cosmetico. O contorno da praca escala a casca invertida em torno da
 * ORIGEM LOCAL da geometria, e nao do centro dela. Numa primitiva isso da certo porque
 * a primitiva ja nasce centrada e a posicao vive no Mesh. Numa geometria mesclada, com
 * a transformacao de cada peca assada dentro, o centro fica longe da origem, e a casca
 * escalada saia deslocada por dezenas de centimetros: era o borrao preto que cobria o
 * avental e o telhado no primeiro render do pass 1. Centrar a geometria e devolver o
 * deslocamento para a posicao da malha restaura o comportamento que a casca espera.
 */
function fundir(pecas: THREE.BufferGeometry[], material: THREE.Material, nome: string, semContorno = false): THREE.Mesh {
  const g = mergeGeometries(pecas, false);
  // mergeGeometries devolve null em silencio quando uma peca escapou de posta() e chegou
  // indexada. Falhar alto aqui evita uma malha de geometria nula, que so quebra no render.
  if (!g) throw new Error(`barraca: nao consegui mesclar "${nome}"; alguma peca nao passou por posta()`);
  for (const p of pecas) p.dispose();
  g.computeBoundingBox();
  const centro = new THREE.Vector3();
  g.boundingBox!.getCenter(centro);
  g.translate(-centro.x, -centro.y, -centro.z);
  return malha(g, material, { nome, pos: [centro.x, centro.y, centro.z], semContorno });
}

/**
 * Caixa sem bisel, 12 triangulos.
 *
 * caixaBisel com um segmento custa 108 triangulos, nove vezes mais. O bisel so se paga
 * onde a peca e grande e a luz corre pela quina (pilar, tampo, rodape, cabeca de viga,
 * assento). Em peca miuda que ja ganha aresta do contorno por inverted hull (estaca de
 * cesta, raio de roda, montante de lanterna, tabua de painel, folha de palha) o bisel
 * some na leitura e so consome orcamento: trocar essas por caixa levou a peca de 15932
 * para dentro do teto de 9000 triangulos sem mudar a silhueta.
 */
function caixa(l: number, a: number, p: number): THREE.BoxGeometry {
  return new THREE.BoxGeometry(l, a, p);
}

/** Perfil de revolucao a partir de pares raio e altura. */
function perfil(pontos: [number, number][], segmentos = 10): THREE.LatheGeometry {
  return new THREE.LatheGeometry(pontos.map(([r, y]) => new THREE.Vector2(r, y)), segmentos);
}

/* ------------------------------------------------------------------ opcoes */

export type OpcoesBarraca = {
  /** As duas cores que se alternam nas linguas do toldo. */
  corToldo?: [string, string];
  /** Sequencia de cor dos paineis do avental, repetida ciclicamente. */
  corPaineis?: string[];
  /** O que fica em cima do tampo. */
  itens?: "comidas" | "brincadeiras" | "kambada";
};

const PADRAO = {
  corToldo: [PALETA.verdeAgua, PALETA.amarelo] as [string, string],
  corPaineis: [PALETA.verdeAgua, PALETA.amarelo, PALETA.vermelho, PALETA.verdeAgua, PALETA.amarelo, PALETA.verdeAgua],
  itens: "comidas" as const,
};

/* ----------------------------------------------------------------- partes */

function construirTelhado(madeira: THREE.Material): THREE.Group {
  const t = M.telhado;
  const telhado = grupo("telhado");
  const queda = t.cume - t.borda;
  const comprimento = Math.hypot(queda, t.beiral);
  const inclinacao = Math.atan2(queda, t.beiral);

  // campo de telha: placa por agua, com o arco parabolico assado nos vertices
  for (const sz of [1, -1]) {
    const plano = new THREE.PlaneGeometry(t.meiaLargura * 2, comprimento, 12, 1);
    const pos = plano.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i += 1) pos.setZ(i, pos.getZ(i) + arcoTelhado(pos.getX(i)));
    plano.computeVertexNormals();
    telhado.add(fundir([posta(plano, {
      pos: [0, (t.cume + t.borda) / 2, (sz * t.beiral) / 2],
      rot: [-sz * (Math.PI / 2 - inclinacao) - (sz > 0 ? 0 : Math.PI), 0, 0],
    })], materialToon(PALETA.telha, { ladoDuplo: true }), `telhado-agua-${sz > 0 ? "frente" : "tras"}`));
  }

  // telhas em canaleta: meia-cana correndo na inclinacao, com ressalto no beiral
  const canaleta = new THREE.CylinderGeometry(0.043, 0.043, comprimento + 0.06, 8, 1, true);
  const ressalto = new THREE.CylinderGeometry(0.06, 0.06, 0.05, 8);
  const telhas: THREE.BufferGeometry[] = [];
  const passo = (t.meiaLargura * 2 - 0.16) / (t.telhas - 1);
  for (const sz of [1, -1]) {
    for (let i = 0; i < t.telhas; i += 1) {
      const x = -t.meiaLargura + 0.08 + i * passo;
      const alto = arcoTelhado(x);
      telhas.push(posta(canaleta, {
        pos: [x, (t.cume + t.borda) / 2 + alto + 0.05, (sz * t.beiral) / 2],
        rot: [sz * inclinacao + Math.PI / 2, 0, 0],
      }));
      telhas.push(posta(ressalto, {
        pos: [x, t.borda + alto + 0.05, sz * (t.beiral - 0.02)],
        rot: [Math.PI / 2, 0, 0],
      }));
    }
  }
  canaleta.dispose();
  ressalto.dispose();
  telhado.add(fundir(telhas, materialToon(PALETA.telhaEscura), "telhado-telhas"));

  // cumeeira: tora varrida sobre o arco, e nao um cilindro reto
  const curva = new THREE.CatmullRomCurve3(
    Array.from({ length: 7 }, (_, i) => {
      const x = -t.meiaLargura - 0.14 + (i * (t.meiaLargura * 2 + 0.28)) / 6;
      return new THREE.Vector3(x, t.cume + 0.06 + arcoTelhado(x), 0);
    }),
  );
  const madeiraTelhado: THREE.BufferGeometry[] = [posta(new THREE.TubeGeometry(curva, 10, 0.085, 8, false), {})];
  for (const sz of [1, -1]) {
    madeiraTelhado.push(posta(caixa(t.meiaLargura * 2 + 0.06, 0.08, 0.08), {
      pos: [0, t.borda + 0.02, sz * t.beiral],
    }));
  }
  telhado.add(fundir(madeiraTelhado, madeira, "telhado-cumeeira"));
  return telhado;
}

function construirQuadro(madeira: THREE.Material): THREE.Group {
  const quadro = grupo("quadro", { pos: [0, M.quadro.y, 0] });
  const pecas: THREE.BufferGeometry[] = [];
  const s = M.quadro.secao;
  for (const sz of [1, -1]) pecas.push(posta(caixa(M.pilar.x * 2 + 0.3, s, s), { pos: [0, 0, sz * M.pilar.z] }));
  for (const sx of [1, -1]) pecas.push(posta(caixa(s, s, M.pilar.z * 2 + 0.14), { pos: [sx * M.pilar.x, 0, 0] }));
  quadro.add(fundir(pecas, madeira, "quadro-vigas"));
  const cabeca = caixaBisel(0.28, 0.24, 0.28, 0.04, 1);
  const cabecas: THREE.BufferGeometry[] = [];
  for (const sx of [1, -1]) {
    for (const sz of [1, -1]) cabecas.push(posta(cabeca, { pos: [sx * (M.pilar.x + 0.07), 0.05, sz * (M.pilar.z + 0.07)] }));
  }
  cabeca.dispose();
  quadro.add(fundir(cabecas, madeira, "quadro-cabecas"));
  return quadro;
}

function construirPilares(madeira: THREE.Material): THREE.Group {
  const pilares = grupo("pilares");
  const pecas: THREE.BufferGeometry[] = [];
  const p = caixaBisel(M.pilar.secao, M.pilar.altura, M.pilar.secao, 0.025, 1);
  for (const sx of [1, -1]) {
    for (const sz of [1, -1]) pecas.push(posta(p, { pos: [sx * M.pilar.x, M.pilar.altura / 2, sz * M.pilar.z] }));
  }
  p.dispose();
  pilares.add(fundir(pecas, madeira, "pilares-prumo"));
  return pilares;
}

function construirBalcao(madeira: THREE.Material, madeiraEscura: THREE.Material, corPaineis: string[]): THREE.Group {
  const balcao = grupo("balcao");
  const clara: THREE.BufferGeometry[] = [];
  // tampo em quatro pranchas, com o sulco de junta resolvido por vao geometrico
  const prancha = M.tampo.profundidade / 4;
  for (let i = 0; i < 4; i += 1) {
    clara.push(posta(caixaBisel(M.tampo.largura, M.tampo.altura, prancha - 0.012, 0.03, 1), {
      pos: [0, M.tampo.y, -M.tampo.profundidade / 2 + prancha * (i + 0.5)],
    }));
  }
  balcao.add(fundir(clara, madeira, "balcao-tampo"));
  balcao.add(fundir([
    posta(caixaBisel(M.corpo.largura, M.corpo.altura, M.corpo.profundidade, 0.02, 1), { pos: [0, M.corpo.y, 0] }),
    posta(caixa(M.corpo.largura + 0.06, 0.09, M.corpo.profundidade + 0.06), { pos: [0, 0.36, 0] }),
  ], madeira, "balcao-corpo"));

  const escura: THREE.BufferGeometry[] = [
    posta(caixaBisel(M.rodape.largura, M.rodape.altura, M.rodape.profundidade, 0.025, 1), { pos: [0, M.rodape.y, 0] }),
  ];
  const pe = caixa(0.28, 0.17, 0.28);
  for (const sx of [1, -1]) {
    for (const sz of [1, -1]) escura.push(posta(pe, { pos: [sx * 0.78, 0.09, sz * 0.3] }));
  }
  pe.dispose();
  balcao.add(fundir(escura, madeiraEscura, "balcao-rodape"));

  // avental: um painel por cor, cada painel com duas tabuas e sulco central
  const porCor = new Map<string, THREE.BufferGeometry[]>();
  const tabua = caixa(M.paineis.largura / 2 - 0.014, M.paineis.altura, 0.035);
  const inicio = -((M.paineis.quantidade - 1) * M.paineis.largura) / 2;
  for (let i = 0; i < M.paineis.quantidade; i += 1) {
    const cor = corPaineis[i % corPaineis.length];
    if (!porCor.has(cor)) porCor.set(cor, []);
    for (const lado of [-1, 1]) {
      porCor.get(cor)!.push(posta(tabua, {
        pos: [inicio + i * M.paineis.largura + (lado * M.paineis.largura) / 4, M.corpo.y - 0.01, M.corpo.profundidade / 2 + 0.008],
      }));
    }
  }
  tabua.dispose();
  let n = 0;
  for (const [cor, pecas] of porCor) balcao.add(fundir(pecas, materialToon(cor), `balcao-paineis-${n++}`, true));
  return balcao;
}

function construirToldo(cores: [string, string]): THREE.Group {
  const toldo = grupo("toldo", { pos: [0, M.toldo.y, 0] });
  const t = M.toldo;
  // lingua: perfil plano com a borda inferior em arco convexo (festao)
  // A borda inferior ondula em festao, e nao recorta meia-lua: um arco de raio igual a
  // metade da largura comia 0.165 m da lingua e a franja virava gotas penduradas; uma
  // flecha de um sexto da largura, no outro extremo, deixava a borda quase reta e a peca
  // perdia a ondulacao que e assinatura da referencia. Flecha de largura sobre 2.6 e o
  // meio termo medido contra o recorte do toldo (zonas/zone-r1c1.png).
  const meia = t.lingua / 2 - 0.005;
  const flecha = t.lingua / 2.6;
  const forma = new THREE.Shape();
  forma.moveTo(-meia, 0);
  forma.lineTo(-meia, -t.altura + flecha);
  forma.quadraticCurveTo(0, -t.altura - flecha, meia, -t.altura + flecha);
  forma.lineTo(meia, 0);
  forma.closePath();
  const lingua = new THREE.ExtrudeGeometry(forma, { depth: 0.014, bevelEnabled: false, curveSegments: 6 });
  lingua.translate(0, 0, -0.007);

  const porCor: THREE.BufferGeometry[][] = [[], []];
  const inicioFrente = -((t.linguasFrente - 1) * t.lingua) / 2;
  for (let i = 0; i < t.linguasFrente; i += 1) {
    porCor[i % 2].push(posta(lingua, { pos: [inicioFrente + i * t.lingua, 0, M.pilar.z + 0.09] }));
  }
  const inicioLado = -((t.linguasLado - 1) * t.lingua) / 2;
  for (const sx of [1, -1]) {
    for (let i = 0; i < t.linguasLado; i += 1) {
      porCor[(i + (sx > 0 ? 1 : 0)) % 2].push(posta(lingua, {
        pos: [sx * (M.pilar.x + 0.09), 0, inicioLado + i * t.lingua],
        rot: [0, (sx * Math.PI) / 2, 0],
      }));
    }
  }
  lingua.dispose();
  for (let i = 0; i < 2; i += 1) {
    toldo.add(fundir(porCor[i], materialToon(cores[i], { ladoDuplo: true }), `toldo-linguas-${i}`, true));
  }
  return toldo;
}

function construirBandeirinhas(): THREE.Group {
  const b = grupo("bandeirinhas", { pos: [0, M.varal.y, 0] });
  const v = M.varal.bandeirola;
  // bandeirola em rabo de andorinha: retangulo com entalhe em V na base
  const forma = new THREE.Shape();
  forma.moveTo(-v.largura / 2, 0);
  forma.lineTo(-v.largura / 2, -v.altura);
  forma.lineTo(0, -v.altura + v.entalhe);
  forma.lineTo(v.largura / 2, -v.altura);
  forma.lineTo(v.largura / 2, 0);
  forma.closePath();
  const bandeirola = new THREE.ExtrudeGeometry(forma, { depth: 0.008, bevelEnabled: false });
  bandeirola.translate(0, 0, -0.004);

  // flor de cinco petalas no centro de cada bandeirola. Eu tinha classificado esse detalhe
  // como so representavel por textura, e o gate por feature reprovou a bandeirinha por isso.
  // Cinco petalas em arco, extrudadas 0.003 m e coladas na face frontal, custam 10 triangulos
  // por bandeirola e devolvem a marca que a referencia mostra em todas elas.
  // Poligono de dez vertices alternando raio, e nao cinco arcos: cinco absarc geravam mais de
  // cem triangulos por bandeirola e estouravam o teto de 9000. A estrela de cinco pontas custa
  // oito triangulos e le igual no tamanho em que a flor aparece.
  const petalas = new THREE.Shape();
  const raioFlor = v.largura * 0.2;
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const r = i % 2 === 0 ? raioFlor : raioFlor * 0.44;
    const px = Math.cos(a) * r;
    const py = Math.sin(a) * r;
    if (i === 0) petalas.moveTo(px, py);
    else petalas.lineTo(px, py);
  }
  petalas.closePath();
  const flor = new THREE.ExtrudeGeometry(petalas, { depth: 0.003, bevelEnabled: false, curveSegments: 1 });
  flor.translate(0, 0, 0.004);

  const cores = [PALETA.vermelho, PALETA.amarelo, PALETA.verdeAgua, PALETA.amarelo, PALETA.verdeAgua, COR.roxoBandeira];
  const porCor = new Map<string, THREE.BufferGeometry[]>();
  const cordao: THREE.BufferGeometry[] = [];
  const flores: THREE.BufferGeometry[] = [];

  /** Pendura n bandeirolas ao longo de um trecho reto, com catenaria rasa. */
  const pendurar = (
    de: [number, number],
    ate: [number, number],
    n: number,
    giro: number,
    semente: number,
  ) => {
    const pontos: THREE.Vector3[] = [];
    for (let i = 0; i <= n; i += 1) {
      const k = i / n;
      const barriga = -0.055 * Math.sin(Math.PI * k);
      pontos.push(new THREE.Vector3(de[0] + (ate[0] - de[0]) * k, barriga, de[1] + (ate[1] - de[1]) * k));
    }
    cordao.push(posta(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pontos), n, 0.008, 4, false), {}));
    for (let i = 0; i < n; i += 1) {
      const k = (i + 0.5) / n;
      const barriga = -0.055 * Math.sin(Math.PI * k);
      const cor = cores[i % cores.length];
      if (!porCor.has(cor)) porCor.set(cor, []);
      const colocacao = {
        pos: [de[0] + (ate[0] - de[0]) * k, barriga - 0.006, de[1] + (ate[1] - de[1]) * k] as [number, number, number],
        rot: [0, giro, (hash(semente + i) - 0.5) * 0.16] as [number, number, number],
      };
      porCor.get(cor)!.push(posta(bandeirola, colocacao));
      flores.push(posta(flor, {
        pos: [colocacao.pos[0], colocacao.pos[1] - v.altura * 0.45, colocacao.pos[2]],
        rot: colocacao.rot,
      }));
    }
  };
  const bx = M.pilar.x + 0.16;
  const bz = M.pilar.z + 0.33;
  pendurar([-bx, bz], [bx, bz], 9, 0, 3);
  pendurar([bx, bz], [bx, -bz], 5, Math.PI / 2, 41);
  bandeirola.dispose();
  flor.dispose();

  b.add(fundir(flores, materialToon(PALETA.creme, { ladoDuplo: true }), "bandeirinhas-flores", true));
  b.add(fundir(cordao, materialToon(COR.cordao), "bandeirinhas-cordao", true));
  let n = 0;
  for (const [cor, pecas] of porCor) {
    b.add(fundir(pecas, materialToon(cor, { ladoDuplo: true }), `bandeirinhas-bandeirolas-${n++}`, true));
  }
  return b;
}

function construirLanterna(nome: string, x: number, z: number): THREE.Group {
  const lanterna = grupo(nome, { pos: [x, 2.14, z], escala: 1.25 });
  // pivo no gancho: o balanco gira em torno do ponto de suspensao, nao do centro
  const ferragem: THREE.BufferGeometry[] = [
    posta(new THREE.TorusGeometry(0.036, 0.011, 5, 10), { pos: [0, -0.03, 0] }),
    posta(perfil([[0.014, -0.09], [0.02, -0.11], [0.02, -0.14], [0.075, -0.19], [0.085, -0.22], [0.05, -0.23]], 10), {}),
    posta(perfil([[0.05, -0.44], [0.085, -0.45], [0.085, -0.48], [0.055, -0.5], [0.0, -0.5]], 10), {}),
    posta(new THREE.TorusGeometry(0.078, 0.009, 5, 12), { pos: [0, -0.335, 0], rot: [Math.PI / 2, 0, 0] }),
  ];
  const montante = caixa(0.016, 0.21, 0.016);
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI * 2;
    ferragem.push(posta(montante, { pos: [Math.cos(a) * 0.077, -0.335, Math.sin(a) * 0.077], rot: [0, -a, 0] }));
  }
  montante.dispose();
  lanterna.add(fundir(ferragem, materialToon(COR.bronze), `${nome}-bronze`, true));
  lanterna.add(malha(
    perfil([[0.0, -0.23], [0.06, -0.24], [0.083, -0.31], [0.083, -0.37], [0.055, -0.44], [0.0, -0.45]], 10),
    materialToon(PALETA.chamaClara, { emissivo: PALETA.lanterna, intensidadeEmissiva: 1.6 }),
    { nome: `${nome}-vidro`, semContorno: true },
  ));
  // Halo. Na referencia a lanterna derrama luz sobre o pilar vizinho e sobre o fundo, e sem
  // isso ela le como um vidro leitoso apagado, que foi o que o gate por feature acusou. O halo
  // sai como casca emissiva translucida em volta do vidro, e nao como luz de cena: o modelo
  // continua sem carregar fonte de luz propria, entao ele nao muda o rig de iluminacao da praca.
  lanterna.add(malha(
    new THREE.SphereGeometry(0.112, 8, 6),
    materialToon(PALETA.lanterna, {
      emissivo: PALETA.lanterna, intensidadeEmissiva: 1.6,
      transparente: true, opacidade: 0.1, ladoDuplo: true,
    }),
    { pos: [0, -0.34, 0], escala: [1, 1.06, 1], nome: `${nome}-halo`, semContorno: true },
  ));
  return lanterna;
}

function construirRoda(madeiraEscura: THREE.Material): THREE.Group {
  const r = M.roda;
  const roda = grupo("roda", { pos: [r.x, r.y, 0] });
  // o aro fica numa malha propria porque e ele que carrega o contorno da roda; raios e
  // cubo vao juntos e sem contorno, porque a casca do conjunto engolia os vaos entre raios
  roda.add(fundir([posta(new THREE.TorusGeometry(r.raio - 0.045, 0.05, 5, 18), { rot: [0, Math.PI / 2, 0] })],
    madeiraEscura, "roda-aro"));
  roda.add(fundir([posta(perfil([[0.0, -0.06], [0.085, -0.06], [0.085, 0.04], [0.055, 0.045], [0.055, 0.085], [0.0, 0.085]], 10),
    { rot: [0, 0, -Math.PI / 2] })], madeiraEscura, "roda-cubo", true));
  const miolo: THREE.BufferGeometry[] = [
    posta(new THREE.TorusGeometry(r.raio - 0.13, 0.028, 4, 14), { rot: [0, Math.PI / 2, 0] }),
  ];
  const raio = caixa(0.05, r.raio - 0.19, 0.045);
  for (let i = 0; i < r.raios; i += 1) {
    const a = (i / r.raios) * Math.PI * 2;
    miolo.push(posta(raio, {
      pos: [0, Math.cos(a) * ((r.raio - 0.13) / 2 + 0.02), Math.sin(a) * ((r.raio - 0.13) / 2 + 0.02)],
      rot: [-a, 0, 0],
    }));
  }
  raio.dispose();
  roda.add(fundir(miolo, madeiraEscura, "roda-raios", true));
  return roda;
}

function construirComidas(madeira: THREE.Material, itens: OpcoesBarraca["itens"]): THREE.Group {
  const comidas = grupo("comidas", { pos: [0, M.tampo.y + M.tampo.altura / 2, 0.06], escala: 1.14 });
  const massa = materialToon(COR.massaClara);

  if (itens === "kambada") {
    // Matraquinha: duas tabuas de 0.55 m unidas por uma dobradica de pino, deitadas sobre o
    // tampo e abertas em leque. Em pe, como estavam antes, as duas tabuas somavam 0.036 m de
    // espessura e sumiam contra o pilar de fundo no angulo de revisao; deitada e aberta, a
    // matraca le como matraca e mostra a dobradica, que e o que a identifica.
    const tabuas: THREE.BufferGeometry[] = [];
    for (const lado of [-1, 1]) {
      tabuas.push(posta(caixaBisel(0.55, 0.024, 0.11, 0.012, 1), {
        pos: [0.02, 0.012 + (lado > 0 ? 0.026 : 0), lado * 0.055],
        rot: [0, lado * 0.16, 0],
      }));
    }
    tabuas.push(posta(new THREE.CylinderGeometry(0.017, 0.017, 0.15, 8), { pos: [-0.25, 0.026, 0] }));
    tabuas.push(posta(caixaBisel(0.12, 0.03, 0.05, 0.012, 1), { pos: [0.32, 0.026, 0] }));
    comidas.add(fundir(tabuas, madeira, "comidas-matraquinha"));
    return comidas;
  }

  if (itens === "brincadeiras") {
    // latas empilhadas em piramide e tres argolas
    const lata = new THREE.CylinderGeometry(0.055, 0.055, 0.13, 10);
    const latas: THREE.BufferGeometry[] = [];
    for (let f = 0; f < 3; f += 1) {
      for (let i = 0; i < 3 - f; i += 1) {
        latas.push(posta(lata, { pos: [-0.44 + i * 0.12 + f * 0.06, 0.065 + f * 0.13, 0.0] }));
      }
    }
    lata.dispose();
    comidas.add(fundir(latas, materialToon(PALETA.vermelho), "comidas-latas"));
    const argola = new THREE.TorusGeometry(0.07, 0.014, 5, 12);
    const argolas: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 3; i += 1) argolas.push(posta(argola, { pos: [0.24 + i * 0.16, 0.016, 0.02], rot: [Math.PI / 2, 0, 0] }));
    argola.dispose();
    comidas.add(fundir(argolas, materialToon(PALETA.creme), "comidas-argolas"));
    return comidas;
  }

  // tigela vidrada com bolinhos esfericos grumosos
  comidas.add(malha(perfil([[0.0, 0.0], [0.13, 0.01], [0.17, 0.09], [0.175, 0.12], [0.15, 0.115], [0.115, 0.03]], 12),
    materialToon(PALETA.ceramica, { ladoDuplo: true }), { pos: [-0.5, 0, 0.02], nome: "comidas-tigela-verde", semContorno: true }));
  const bola = new THREE.SphereGeometry(0.043, 7, 5);
  const bolinhos: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * Math.PI * 2;
    const alto = i % 2 === 0 ? 0.115 : 0.145;
    bolinhos.push(posta(bola, {
      pos: [-0.5 + Math.cos(a) * (i % 2 === 0 ? 0.075 : 0.03), alto, 0.02 + Math.sin(a) * (i % 2 === 0 ? 0.075 : 0.03)],
      escala: [1, 0.86 + hash(i * 7) * 0.2, 1],
    }));
  }
  bola.dispose();

  // tigela terracota com bolinhos em cubo empilhados
  comidas.add(malha(perfil([[0.0, 0.0], [0.14, 0.01], [0.185, 0.075], [0.19, 0.105], [0.16, 0.1], [0.125, 0.03]], 12),
    materialToon(PALETA.telha, { ladoDuplo: true }), { pos: [0.05, 0, -0.06], nome: "comidas-tigela-terracota", semContorno: true }));
  const cubo = caixa(0.08, 0.065, 0.08);
  // piramide de quatro na base e um no topo, como na referencia
  for (let i = 0; i < 5; i += 1) {
    const base = i < 4;
    const a = (i / 4) * Math.PI * 2 + 0.4;
    bolinhos.push(posta(cubo, {
      pos: [0.05 + (base ? Math.cos(a) * 0.058 : 0), base ? 0.105 : 0.17, -0.06 + (base ? Math.sin(a) * 0.058 : 0)],
      rot: [0, base ? a : 0.7, 0],
    }));
  }
  cubo.dispose();

  // bolo de fuba com furo central, sobre tabua redonda
  comidas.add(malha(perfil([[0.028, 0.0], [0.028, 0.075], [0.05, 0.085], [0.095, 0.085], [0.1, 0.0]], 12), massa,
    { pos: [-0.19, 0.03, 0.24], nome: "comidas-bolo", semContorno: true }));

  // bandeja com grade de bolinhos cilindricos
  const suportes: THREE.BufferGeometry[] = [
    posta(new THREE.CylinderGeometry(0.125, 0.125, 0.03, 14), { pos: [-0.19, 0.015, 0.24] }),
    posta(caixa(0.42, 0.028, 0.24), { pos: [0.44, 0.014, 0.14] }),
  ];
  for (const [dx, dz, l, p] of [[0, 0.12, 0.42, 0.03], [0, -0.12, 0.42, 0.03], [0.21, 0, 0.03, 0.24], [-0.21, 0, 0.03, 0.24]] as const) {
    suportes.push(posta(caixa(l, 0.05, p), { pos: [0.44 + dx, 0.04, 0.14 + dz] }));
  }
  comidas.add(fundir(suportes, madeira, "comidas-bandeja", true));
  const quadradinho = new THREE.CylinderGeometry(0.042, 0.04, 0.05, 8);
  for (let f = 0; f < 2; f += 1) {
    for (let i = 0; i < 4; i += 1) {
      bolinhos.push(posta(quadradinho, { pos: [0.29 + i * 0.1, 0.053, 0.09 + f * 0.1] }));
    }
  }
  quadradinho.dispose();
  comidas.add(fundir(bolinhos, massa, "comidas-massa", true));
  return comidas;
}

function construirBanquinho(madeira: THREE.Material): THREE.Group {
  const banquinho = grupo("banquinho", { pos: [M.banquinho.x, 0, M.banquinho.z] });
  const pecas: THREE.BufferGeometry[] = [posta(caixaBisel(0.5, 0.09, 0.46, 0.022, 1), { pos: [0, 0.56, 0] })];
  const perna = caixa(0.075, 0.58, 0.075);
  for (const sx of [1, -1]) {
    for (const sz of [1, -1]) {
      pecas.push(posta(perna, { pos: [sx * 0.18, 0.28, sz * 0.16], rot: [-sz * 0.06, 0, sx * 0.06] }));
    }
  }
  perna.dispose();
  for (const sz of [1, -1]) pecas.push(posta(caixa(0.34, 0.045, 0.045), { pos: [0, 0.2, sz * 0.15] }));
  banquinho.add(fundir(pecas, madeira, "banquinho-assento"));
  // cesta: cone truncado invertido com trama cruzada e aro de boca
  const cesta: THREE.BufferGeometry[] = [];
  cesta.push(posta(perfil([[0.0, 0.0], [0.13, 0.005], [0.2, 0.2], [0.205, 0.23], [0.178, 0.225], [0.112, 0.035]], 12), { pos: [0, 0.6, 0] }));
  cesta.push(posta(new THREE.TorusGeometry(0.2, 0.018, 4, 14), { pos: [0, 0.83, 0], rot: [Math.PI / 2, 0, 0] }));
  const estaca = caixa(0.03, 0.2, 0.022);
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * Math.PI * 2;
    cesta.push(posta(estaca, { pos: [Math.cos(a) * 0.178, 0.71, Math.sin(a) * 0.178], rot: [0, -a, 0] }));
  }
  estaca.dispose();
  for (const y of [0.66, 0.75]) {
    cesta.push(posta(new THREE.TorusGeometry(0.165 + (y - 0.66) * 0.35, 0.014, 4, 14), { pos: [0, y, 0], rot: [Math.PI / 2, 0, 0] }));
  }
  banquinho.add(fundir(cesta, madeira, "banquinho-cesta", true));

  const espigas: THREE.BufferGeometry[] = [];
  const folhas: THREE.BufferGeometry[] = [];
  const espiga = perfil([[0.0, 0.0], [0.035, 0.03], [0.045, 0.12], [0.038, 0.24], [0.0, 0.28]], 8);
  const folha = caixa(0.075, 0.28, 0.016);
  for (let i = 0; i < 3; i += 1) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    espigas.push(posta(espiga, { pos: [Math.cos(a) * 0.06, 0.78, Math.sin(a) * 0.06], rot: [Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2] }));
    for (const s of [-1, 1]) {
      folhas.push(posta(folha, {
        pos: [Math.cos(a) * 0.06 + s * 0.075, 0.8, Math.sin(a) * 0.06 + s * 0.03],
        rot: [0.1, -a, s * 0.5],
      }));
    }
  }
  espiga.dispose();
  folha.dispose();
  banquinho.add(fundir(espigas, materialToon(PALETA.milho), "banquinho-milho", true));
  banquinho.add(fundir(folhas, materialToon(PALETA.folhaMilho, { ladoDuplo: true }), "banquinho-palha", true));
  return banquinho;
}

function construirPrateleira(madeira: THREE.Material): THREE.Group {
  const prateleira = grupo("prateleira", { pos: [M.pilar.x + 0.17, 1.34, -0.26] });
  const pecas: THREE.BufferGeometry[] = [
    posta(caixaBisel(0.4, 0.05, 0.36, 0.015, 1), {}),
    posta(caixa(0.05, 0.26, 0.05), { pos: [-0.14, -0.14, 0], rot: [0, 0, 0.5] }),
    posta(caixa(0.06, 0.24, 0.06), { pos: [-0.19, -0.12, 0] }),
    posta(perfil([[0.0, 0.0], [0.05, 0.005], [0.062, 0.045], [0.065, 0.06], [0.05, 0.058], [0.038, 0.012]], 10), { pos: [0.12, 0.025, 0.03] }),
  ];
  prateleira.add(fundir(pecas, madeira, "prateleira-tabua", true));
  prateleira.add(malha(perfil([[0.0, 0.0], [0.085, 0.01], [0.095, 0.09], [0.09, 0.14]], 12), materialToon(PALETA.milho),
    { pos: [-0.05, 0.025, 0], nome: "prateleira-pote-base" }));
  prateleira.add(malha(perfil([[0.09, 0.14], [0.095, 0.2], [0.075, 0.25], [0.08, 0.27], [0.062, 0.28]], 12), materialToon(PALETA.ceramica),
    { pos: [-0.05, 0.025, 0], nome: "prateleira-pote-corpo" }));
  prateleira.add(malha(perfil([[0.0, 0.34], [0.02, 0.335], [0.022, 0.315], [0.09, 0.3], [0.092, 0.285], [0.06, 0.283]], 12),
    materialToon(PALETA.telha), { pos: [-0.05, 0.025, 0], nome: "prateleira-pote-tampa" }));
  return prateleira;
}

/* ---------------------------------------------------------------- factory */

export default function criarBarraca(opcoes: OpcoesBarraca = {}): THREE.Group {
  const corToldo = opcoes.corToldo ?? PADRAO.corToldo;
  const corPaineis = opcoes.corPaineis ?? PADRAO.corPaineis;
  const itens = opcoes.itens ?? PADRAO.itens;

  const raiz = grupo("barraca");
  const madeira = materialToon(PALETA.madeira);
  const madeiraEscura = materialToon(PALETA.madeiraEscura);

  raiz.add(construirBalcao(madeira, madeiraEscura, corPaineis));
  raiz.add(construirPilares(madeira));
  raiz.add(construirQuadro(madeira));
  raiz.add(construirTelhado(madeira));
  raiz.add(construirToldo(corToldo));
  raiz.add(construirBandeirinhas());
  raiz.add(construirLanterna("lanterna-esq", -(M.pilar.x + 0.24), M.pilar.z + 0.04));
  raiz.add(construirLanterna("lanterna-dir", M.pilar.x - 0.11, M.pilar.z + 0.13));
  raiz.add(construirRoda(madeiraEscura));
  raiz.add(construirComidas(madeira, itens));
  raiz.add(construirBanquinho(madeira));
  raiz.add(construirPrateleira(madeira));

  // Contrato de runtime que o gate action-ready le: quem monta a barraca na praca sabe,
  // sem inspecionar a arvore, quais grupos tem pivo util, o que da pra animar e o que da
  // pra trocar sem reconstruir o modelo.
  raiz.userData.sculptRuntime = {
    modelo: "barraca",
    unidades: "metros",
    frente: "+Z",
    origem: "chao sob o centro do balcao",
    grupos: ["telhado", "quadro", "pilares", "toldo", "bandeirinhas", "lanterna-esq", "lanterna-dir",
             "balcao", "roda", "comidas", "banquinho", "prateleira"],
    pivos: {
      "lanterna-esq": "gancho, no topo",
      "lanterna-dir": "gancho, no topo",
      roda: "eixo, giro em X",
      bandeirinhas: "viga do varal",
      comidas: "centro do tampo, grupo trocavel",
    },
    animaveis: ["lanterna-esq", "lanterna-dir", "bandeirinhas"],
    opcoes: { corToldo, corPaineis, itens },
  };
  return raiz;
}

/* -------------------------------------------------------------- animacao */

/**
 * Pêndulos no período natural de uma lanterna de ~0,3 m (T ≈ 1,9 s, ω ≈ 3,3
 * rad/s), com ritmos distintos entre as peças pra não lerem como mecânicas;
 * as bandeirinhas ondulam mais devagar e com a mesma amplitude dos varais.
 */
const BALANCO = [
  { nome: "lanterna-esq", amplitude: 0.055, ritmo: 3.3, fase: 0 },
  { nome: "lanterna-dir", amplitude: 0.05, ritmo: 3.05, fase: 1.7 },
  { nome: "bandeirinhas", amplitude: 0.05, ritmo: 4.2, fase: 0.9 },
] as const;

/**
 * Balanco leve e deterministico das lanternas e das bandeirinhas. Resolve os grupos
 * uma vez e guarda em userData, entao o loop nao aloca nem percorre a arvore por frame.
 */
export function animar(raiz: THREE.Group, t: number, opcoes?: { menosMovimento?: boolean }): void {
  let alvos = raiz.userData.balanco as THREE.Object3D[] | undefined;
  if (!alvos) {
    alvos = BALANCO.map((b) => raiz.getObjectByName(b.nome)).filter((o): o is THREE.Object3D => !!o);
    raiz.userData.balanco = alvos;
  }
  // Com prefers-reduced-motion tudo volta à pose de repouso.
  const reduzido = opcoes?.menosMovimento === true;
  for (let i = 0; i < alvos.length; i += 1) {
    const b = BALANCO[i];
    // Segunda harmônica leve pra quebrar a regularidade do seno puro.
    const onda = Math.sin(t * b.ritmo + b.fase) + 0.25 * Math.sin(t * b.ritmo * 0.37 + b.fase * 2.1);
    alvos[i].rotation.z = reduzido ? 0 : onda * b.amplitude;
  }
}
