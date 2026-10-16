/**
 * Boi Estrela: bumba meu boi maranhense com o brincante ("miolo") por baixo,
 * na linguagem de boneco cartoon "bean" das referências de personagem
 * (docs/evidencias/gauntlet-arraial-3d/referencias-personagens/, spec B.8).
 *
 * Tudo em volume liso e macio: cápsulas, esferas escaladas, lathe e caixas
 * biseladas, cores chapadas, sem textura. Origem no chão sob o centro do
 * conjunto, cabeça virada pra +Z. Altura ~1,9 m, comprimento ~2,2 m.
 */
import * as THREE from "three";
import { caixaBisel, grupo, malha, materialToon, aplicarContorno, explodir } from "./_compartilhado";

export { aplicarContorno, explodir };

const COR = {
  veludo: "#C73E2C",
  creme: "#F5F1E6",
  ouro: "#F5D142",
  micangaAzul: "#8FC8E8",
  pelagem: "#A6733F",
  focinho: "#E8B48C",
  orelha: "#54381F",
  chifre: "#F2ECDC",
  ponta: "#1A1A1A",
  olho: "#171310",
  calca: "#2E251E",
  pe: "#5A3A24",
  corda: "#8A6A44",
  tufo: "#2B211A",
};

/** Fitas da barra da manta, na ordem em que se repetem ao redor do boi. */
const FITAS = ["#F5D142", "#8FC8E8", "#F5F1E6", "#5BAE6B", "#E8622F"];

/** Raio do casco (cilindro central da cápsula do corpo). */
const RAIO_CORPO = 0.44;
/** Altura do eixo do corpo (centro da cápsula horizontal). */
const ALTURA_CORPO = 1.16;
/** Recuo do corpo no eixo Z: abre espaço pra a cabeça na frente sem alongar o conjunto. */
const RECUO_CORPO = -0.12;
/** Altura da barra da manta (onde as pernas do brincante aparecem). */
const ALTURA_BARRA = 0.62;
/** Correção de centro no eixo Z aplicada aos grupos de topo na montagem. */
const CENTRO_Z = -0.11;
/** Achatamento da manta no eixo Z (o corpo é alongado, a lathe é circular). */
const ALONGAMENTO = 1.55;

/**
 * Chifre curvo afinando da base pra ponta: varredura de um anel ao longo de
 * uma parábola, com quadro ortonormal por seção (cresce em +Y, curva pra +X
 * e recua em -Z). Geometria montada uma vez, sem custo por quadro.
 */
function chifreCurvo(comprimento: number, raioBase: number, curvaX: number, curvaZ: number, secoes = 7, lados = 6): THREE.BufferGeometry {
  const pos: number[] = [];
  const idx: number[] = [];
  const p = new THREE.Vector3();
  const tangente = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const binormal = new THREE.Vector3();
  const referencia = new THREE.Vector3(0, 0, 1);
  for (let s = 0; s < secoes; s++) {
    const u = s / (secoes - 1);
    p.set(curvaX * u * u, comprimento * u, -curvaZ * u * u);
    tangente.set(2 * curvaX * u, comprimento, -2 * curvaZ * u).normalize();
    normal.crossVectors(tangente, referencia).normalize();
    binormal.crossVectors(tangente, normal).normalize();
    const raio = raioBase * (1 - 0.82 * u);
    for (let j = 0; j < lados; j++) {
      const ang = (j / lados) * Math.PI * 2;
      pos.push(
        p.x + normal.x * Math.cos(ang) * raio + binormal.x * Math.sin(ang) * raio,
        p.y + normal.y * Math.cos(ang) * raio + binormal.y * Math.sin(ang) * raio,
        p.z + normal.z * Math.cos(ang) * raio + binormal.z * Math.sin(ang) * raio,
      );
    }
  }
  for (let s = 0; s < secoes - 1; s++) {
    for (let j = 0; j < lados; j++) {
      const a = s * lados + j;
      const b = s * lados + ((j + 1) % lados);
      idx.push(a, b, a + lados, b, b + lados, a + lados);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Estrela bordada de cinco pontas assentada no flanco cilíndrico do corpo:
 * cada vértice da borda cai na superfície da cápsula e o centro sobe, então
 * o bordado acompanha a curvatura do boi em vez de flutuar como adesivo.
 * Devolve a geometria e os pontos de borda pras miçangas de contorno.
 */
function estrelaNoFlanco(lado: 1 | -1, raioExterno: number, raioInterno: number, zCentro: number, yCentro = 0) {
  const pontas = 5;
  const pos: number[] = [];
  const idx: number[] = [];
  const borda: THREE.Vector3[] = [];
  const superficie = (y: number, folga: number) => lado * (Math.sqrt(Math.max(RAIO_CORPO * RAIO_CORPO - y * y, 0.02)) + folga);
  pos.push(superficie(yCentro, 0.085), yCentro, zCentro);
  for (let i = 0; i < pontas * 2; i++) {
    const ang = (i * Math.PI) / pontas + Math.PI / 2;
    const raio = i % 2 === 0 ? raioExterno : raioInterno;
    const y = yCentro + Math.sin(ang) * raio;
    const z = zCentro + Math.cos(ang) * raio * lado;
    const x = superficie(y, 0.032);
    pos.push(x, y, z);
    borda.push(new THREE.Vector3(x, y, z));
  }
  for (let i = 0; i < pontas * 2; i++) {
    idx.push(0, 1 + i, 1 + ((i + 1) % (pontas * 2)));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return { geo, borda };
}

/** Fileira de miçangas: uma InstancedMesh com cor por instância (ouro e azul alternados). */
function micangas(pontos: THREE.Vector3[], raio: number, nome: string, deslocamento = 0): THREE.InstancedMesh {
  const geo = new THREE.SphereGeometry(raio, 5, 3);
  const m = new THREE.InstancedMesh(geo, materialToon("#FFFFFF"), pontos.length);
  const d = new THREE.Object3D();
  const cor = new THREE.Color();
  const centro = new THREE.Vector3();
  for (const p of pontos) centro.add(p);
  centro.divideScalar(Math.max(pontos.length, 1));
  for (let i = 0; i < pontos.length; i++) {
    d.position.copy(pontos[i]);
    if (deslocamento !== 0) d.position.addScaledVector(pontos[i].clone().sub(centro).normalize(), deslocamento);
    d.updateMatrix();
    m.setMatrixAt(i, d.matrix);
    m.setColorAt(i, cor.set(i % 2 === 0 ? COR.ouro : COR.micangaAzul));
  }
  m.instanceMatrix.needsUpdate = true;
  m.name = nome;
  m.userData.semContorno = true;
  return m;
}

/** Perna do brincante: calça escura em cápsula e pé em bloco biselado, pivô no quadril. */
function pernaDoBrincante(lado: 1 | -1): THREE.Group {
  const g = grupo(lado > 0 ? "perna-dir" : "perna-esq", { pos: [lado * 0.175, 0, 0.02] });
  g.add(malha(new THREE.CapsuleGeometry(0.115, 0.36, 3, 12), materialToon(COR.calca), { pos: [0, -0.3, 0], nome: "calca" }));
  g.add(malha(caixaBisel(0.19, 0.11, 0.29, 0.05, 1), materialToon(COR.pe), { pos: [0, -0.665, 0.05], nome: "pe" }));
  return g;
}

export default function criarBoi(): THREE.Group {
  const raiz = grupo("boi-estrela");

  // ---------------------------------------------------------------- corpo
  // Cápsula horizontal (a armação do boi já vestida de veludo vermelho).
  const corpo = grupo("corpo", { pos: [0, ALTURA_CORPO, RECUO_CORPO] });
  const casco = new THREE.CapsuleGeometry(RAIO_CORPO, 0.72, 5, 18);
  casco.rotateX(Math.PI / 2);
  corpo.add(malha(casco, materialToon(COR.veludo), { escala: [1, 0.96, 1], nome: "casco" }));

  // Estrela bordada nos dois flancos, com contorno de miçangas.
  for (const lado of [1, -1] as const) {
    const g = grupo(lado > 0 ? "estrela-dir" : "estrela-esq");
    const { geo, borda } = estrelaNoFlanco(lado, 0.245, 0.105, -0.02, 0.1);
    g.add(malha(geo, materialToon(COR.creme, { ladoDuplo: true }), { nome: "bordado", semContorno: true }));
    g.add(micangas(borda, 0.026, "micangas-estrela", 0.03));
    corpo.add(g);
  }
  raiz.add(corpo);

  // ---------------------------------------------------------------- manta
  // Saia de veludo em sino, caindo do flanco até a barra, com galão creme.
  const manta = grupo("manta", { pos: [0, ALTURA_BARRA, RECUO_CORPO], escala: [1, 1, ALONGAMENTO] });
  const perfil = [
    new THREE.Vector2(0.4, 0.36),
    new THREE.Vector2(0.472, 0.22),
    new THREE.Vector2(0.53, 0.08),
    new THREE.Vector2(0.552, 0.0),
  ];
  manta.add(malha(new THREE.LatheGeometry(perfil, 20), materialToon(COR.veludo, { ladoDuplo: true }), { nome: "saia", semContorno: true }));
  const galao = new THREE.TorusGeometry(0.552, 0.028, 4, 20);
  galao.rotateX(Math.PI / 2);
  manta.add(malha(galao, materialToon(COR.creme), { pos: [0, 0.035, 0], nome: "galao", semContorno: true }));
  const naBarra: THREE.Vector3[] = [];
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    naBarra.push(new THREE.Vector3(Math.sin(a) * 0.565, 0.09, Math.cos(a) * 0.565));
  }
  manta.add(micangas(naBarra, 0.024, "micangas-barra"));
  raiz.add(manta);

  // ---------------------------------------------------------------- franja
  // Fitas coloridas penduradas na barra, pivô no topo de cada fita.
  const franja = grupo("franja", { pos: [0, ALTURA_BARRA + 0.03, RECUO_CORPO] });
  const total = 26;
  const fita = new THREE.BoxGeometry(0.062, 0.21, 0.016);
  fita.translate(0, -0.105, 0);
  const fitas = new THREE.InstancedMesh(fita, materialToon("#FFFFFF"), total);
  fitas.name = "fitas";
  fitas.userData.semContorno = true;
  const d = new THREE.Object3D();
  d.rotation.order = "YXZ";
  const cor = new THREE.Color();
  const base = new Float32Array(total * 2);
  for (let i = 0; i < total; i++) {
    const a = (i / total) * Math.PI * 2;
    d.position.set(Math.sin(a) * 0.55, 0, Math.cos(a) * 0.55 * ALONGAMENTO);
    d.rotation.set(0, a, 0);
    d.updateMatrix();
    fitas.setMatrixAt(i, d.matrix);
    fitas.setColorAt(i, cor.set(FITAS[i % FITAS.length]));
    base[i * 2] = a;
    base[i * 2 + 1] = (i % 7) * 0.9;
  }
  fitas.instanceMatrix.needsUpdate = true;
  franja.add(fitas);
  raiz.add(franja);

  // ---------------------------------------------------------------- cabeça
  // Pivô na junção com o corpo pra a cabeça balançar como a de um boi de rua.
  const cabeca = grupo("cabeca", { pos: [0, 1.41, 0.7] });
  const pescoco = new THREE.CapsuleGeometry(0.17, 0.13, 3, 10);
  pescoco.rotateX(Math.PI / 2.4);
  cabeca.add(malha(pescoco, materialToon(COR.pelagem), { pos: [0, -0.13, -0.16], escala: [1.0, 0.98, 1.12], nome: "pescoco", semContorno: true }));
  cabeca.add(malha(new THREE.SphereGeometry(0.3, 16, 12), materialToon(COR.pelagem), { pos: [0, 0.08, 0.16], escala: [0.92, 0.95, 1.05], nome: "cranio" }));
  cabeca.add(malha(new THREE.SphereGeometry(0.19, 12, 9), materialToon(COR.focinho), { pos: [0, -0.06, 0.38], escala: [0.88, 0.8, 0.95], nome: "focinho" }));
  const matOlho = materialToon(COR.olho);
  const matNarina = materialToon(COR.ponta);
  for (const lado of [1, -1] as const) {
    const s = lado > 0 ? "dir" : "esq";
    // Olho e narina pousados na superfície do elipsoide (metade pra fora),
    // pra o preto ler como bolinha aplicada e não como mancha afundada.
    cabeca.add(malha(new THREE.SphereGeometry(0.07, 10, 8), matOlho, { pos: [lado * 0.222, 0.139, 0.337], escala: [0.72, 1, 0.95], nome: `olho-${s}`, semContorno: true }));
    cabeca.add(malha(new THREE.SphereGeometry(0.038, 6, 5), matNarina, { pos: [lado * 0.055, -0.128, 0.527], escala: [1, 0.8, 0.75], nome: `narina-${s}`, semContorno: true }));
  }

  // Orelhas: folhas achatadas saindo da lateral do crânio.
  const orelhas = grupo("orelhas", { pos: [0, 0.08, 0.08] });
  for (const lado of [1, -1] as const) {
    orelhas.add(
      malha(new THREE.SphereGeometry(0.13, 9, 7), materialToon(COR.orelha), {
        pos: [lado * 0.27, -0.03, -0.09],
        rot: [0.12, lado * 0.24, lado * -0.38],
        escala: [1.2, 0.38, 0.85],
        nome: lado > 0 ? "orelha-dir" : "orelha-esq",
        semContorno: true,
      }),
    );
  }
  cabeca.add(orelhas);

  // Chifres: cones curvos de ponta preta, abrindo pra fora e pra trás.
  const chifres = grupo("chifres", { pos: [0, 0.23, 0.09] });
  const matChifre = materialToon(COR.chifre);
  const matPonta = materialToon(COR.ponta);
  for (const lado of [1, -1] as const) {
    const s = lado > 0 ? "dir" : "esq";
    const g = grupo(`chifre-${s}`, { pos: [lado * 0.17, -0.02, 0.01], rot: [-0.05, 0, lado * -0.5] });
    g.add(malha(chifreCurvo(0.3, 0.065, lado * 0.19, 0.22), matChifre, { nome: `haste-${s}` }));
    g.add(malha(new THREE.SphereGeometry(0.032, 7, 5), matPonta, { pos: [lado * 0.19, 0.3, -0.22], escala: [1, 1.4, 1], nome: `ponta-${s}`, semContorno: true }));
    chifres.add(g);
  }
  cabeca.add(chifres);
  raiz.add(cabeca);

  // ---------------------------------------------------------------- rabo
  const rabo = grupo("rabo", { pos: [0, 1.29, -0.79], rot: [0.28, 0, 0] });
  const corda = new THREE.CapsuleGeometry(0.036, 0.34, 2, 7);
  rabo.add(malha(corda, materialToon(COR.corda), { pos: [0, -0.19, 0], nome: "corda", semContorno: true }));
  rabo.add(malha(new THREE.SphereGeometry(0.095, 9, 7), materialToon(COR.tufo), { pos: [0, -0.4, 0], escala: [0.95, 1.3, 0.95], nome: "tufo" }));
  raiz.add(rabo);

  // ---------------------------------------------------------------- pernas
  // O miolo: as pernas do brincante aparecendo por baixo da barra da manta.
  const pernas = grupo("pernas", { pos: [0, 0.72, 0] });
  pernas.add(pernaDoBrincante(-1));
  pernas.add(pernaDoBrincante(1));
  raiz.add(pernas);

  // Centra o conjunto em Z: a origem fica no chão sob o centro do boi, e não
  // sob o meio do casco, que é deslocado pra trás pra abrir espaço à cabeça.
  for (const filho of raiz.children) filho.position.z += CENTRO_Z;

  return raiz;
}

type Referencias = {
  corpo: THREE.Group;
  manta: THREE.Group;
  cabeca: THREE.Group;
  rabo: THREE.Group;
  pernas: THREE.Group;
  pernaEsq: THREE.Group;
  pernaDir: THREE.Group;
  fitas: THREE.InstancedMesh | null;
  base: Float32Array;
  dummy: THREE.Object3D;
  corpoY: number;
  pernasY: number;
};

/** Cache de referências no próprio grupo: nada é buscado nem alocado por quadro. */
function referencias(raiz: THREE.Group): Referencias | null {
  const guardado = raiz.userData.refBoi as Referencias | undefined;
  if (guardado) return guardado;
  const corpo = raiz.getObjectByName("corpo") as THREE.Group | undefined;
  const cabeca = raiz.getObjectByName("cabeca") as THREE.Group | undefined;
  const pernas = raiz.getObjectByName("pernas") as THREE.Group | undefined;
  if (!corpo || !cabeca || !pernas) return null;
  const fitas = (raiz.getObjectByName("fitas") as THREE.InstancedMesh | undefined) ?? null;
  const total = fitas ? fitas.count : 0;
  const base = new Float32Array(total * 2);
  for (let i = 0; i < total; i++) {
    base[i * 2] = (i / total) * Math.PI * 2;
    base[i * 2 + 1] = (i % 7) * 0.9;
  }
  const dummy = new THREE.Object3D();
  dummy.rotation.order = "YXZ";
  const ref: Referencias = {
    corpo,
    manta: raiz.getObjectByName("manta") as THREE.Group,
    cabeca,
    rabo: raiz.getObjectByName("rabo") as THREE.Group,
    pernas,
    pernaEsq: raiz.getObjectByName("perna-esq") as THREE.Group,
    pernaDir: raiz.getObjectByName("perna-dir") as THREE.Group,
    fitas,
    base,
    dummy,
    corpoY: corpo.position.y,
    pernasY: pernas.position.y,
  };
  raiz.userData.refBoi = ref;
  return ref;
}

/** Posiciona a franja: `balanco` é a amplitude do vaivém radial das fitas. */
function moverFranja(r: Referencias, t: number, balanco: number, raioZ: number): void {
  const fitas = r.fitas;
  if (!fitas) return;
  const d = r.dummy;
  for (let i = 0; i < fitas.count; i++) {
    const a = r.base[i * 2];
    const fase = r.base[i * 2 + 1];
    d.position.set(Math.sin(a) * 0.55, 0, Math.cos(a) * raioZ);
    d.rotation.set(Math.sin(t * 2.3 + fase) * balanco, a, Math.cos(t * 1.7 + fase) * balanco * 0.6);
    d.updateMatrix();
    fitas.setMatrixAt(i, d.matrix);
  }
  fitas.instanceMatrix.needsUpdate = true;
}

/**
 * Vida do boi. `parado`: o boi dança no lugar (respiração, cabeça balançando,
 * rabo abanando, franja ondulando, passinho lateral). `urrou`: a cabeça sobe e
 * o corpo quica num pulso curto que se repete. `menosMovimento` congela tudo
 * em repouso, sem perder nenhuma leitura de forma.
 */
export function animar(raiz: THREE.Group, t: number, opcoes?: { menosMovimento?: boolean; modo?: "parado" | "urrou" }): void {
  const r = referencias(raiz);
  if (!r) return;
  const raioZ = 0.55 * ALONGAMENTO;

  if (opcoes?.menosMovimento) {
    r.corpo.scale.set(1, 1, 1);
    r.corpo.position.y = r.corpoY;
    r.corpo.rotation.z = 0;
    r.manta.rotation.z = 0;
    r.manta.position.y = ALTURA_BARRA;
    r.cabeca.rotation.set(0, 0, 0);
    r.rabo.rotation.set(0.28, 0, 0);
    r.pernas.position.y = r.pernasY;
    r.pernaEsq.rotation.set(0, 0, 0);
    r.pernaDir.rotation.set(0, 0, 0);
    moverFranja(r, 0, 0, raioZ);
    return;
  }

  const urro = opcoes?.modo === "urrou";

  // Respiração: 0,28 Hz, seno puro, 1,5% de escala (regra C.1 da spec).
  const respiro = Math.sin(t * Math.PI * 2 * 0.28);
  // Pulso do urro: ataque rápido em 0,18 s e queda exponencial, ciclo de 1,2 s.
  let pulso = 0;
  if (urro) {
    const fase = (t % 1.2) / 1.2;
    pulso = fase < 0.15 ? fase / 0.15 : Math.exp(-(fase - 0.15) * 4.2);
  }

  const escala = 1 + respiro * 0.015;
  r.corpo.scale.set(escala, escala + pulso * 0.08, 1);
  r.corpo.position.y = r.corpoY + pulso * 0.07;

  // Gingado lateral: corpo e manta juntos, pra a saia não descolar do casco.
  const gingado = Math.sin(t * Math.PI * 2 * 0.5) * (urro ? 0.05 : 0.03);
  r.corpo.rotation.z = gingado;
  r.manta.rotation.z = gingado;
  r.manta.position.y = ALTURA_BARRA + pulso * 0.05;

  // Cabeça: balanço de 0,06 rad a 0,5 Hz; no urro sobe 0,35 rad no pico.
  r.cabeca.rotation.x = Math.sin(t * Math.PI * 2 * 0.5) * 0.06 - pulso * 0.35;
  r.cabeca.rotation.y = Math.sin(t * Math.PI * 2 * 0.21) * 0.09;
  r.cabeca.rotation.z = -gingado * 0.6;

  // Rabo abanando fora de fase com a cabeça.
  r.rabo.rotation.z = Math.sin(t * Math.PI * 2 * 0.7) * (urro ? 0.5 : 0.32);
  r.rabo.rotation.x = 0.28 + Math.sin(t * Math.PI * 2 * 0.35) * 0.12;

  // Passinho no lugar: pernas em contrafase, com o quadril subindo a cada apoio.
  const passo = Math.sin(t * Math.PI * 2 * (urro ? 1.4 : 1));
  r.pernaEsq.rotation.z = passo * 0.07;
  r.pernaDir.rotation.z = passo * 0.07;
  r.pernaEsq.rotation.x = passo * 0.12;
  r.pernaDir.rotation.x = -passo * 0.12;
  r.pernas.position.y = r.pernasY + Math.abs(passo) * 0.012 + pulso * 0.05;

  moverFranja(r, t, urro ? 0.3 : 0.18, raioZ);
}
