/**
 * Capela rústica reconstruída da imagem geral (única vista: fachada em 3/4
 * frontal). Traseira e laterais inferidas como volume liso (registro em
 * docs/evidencias/gauntlet-arraial-3d/referencias-analise.md, inferência 1).
 * Origem no chão sob o centro da nave, fachada virada pra +Z.
 */
import * as THREE from "three";
import { PALETA, caixaBisel, grupo, malha, materialToon, aplicarContorno, explodir } from "./_compartilhado";

export { aplicarContorno, explodir };

const COR = {
  parede: "#F5ECD6",
  paredeSombra: "#DCCBA6",
  telha: PALETA.telha,
  madeira: PALETA.madeira,
  madeiraEscura: PALETA.madeiraEscura,
  sino: "#D9A73B",
  portaInterior: "#1A0E06",
  luzJanela: "#FFD27A",
};

/** Fileiras de telhas em canaleta (meia-cana) cobrindo uma água de telhado. */
function aguaDeTelhas(largura: number, comprimento: number, material: THREE.Material): THREE.InstancedMesh {
  const passo = 0.32;
  const colunas = Math.max(1, Math.round(largura / passo));
  const fileiras = Math.max(1, Math.round(comprimento / 0.42));
  const geo = new THREE.CylinderGeometry(0.15, 0.15, 0.44, 7, 1, false, 0, Math.PI);
  geo.rotateX(Math.PI / 2);
  geo.rotateY(Math.PI / 2);
  const m = new THREE.InstancedMesh(geo, material, colunas * fileiras);
  const d = new THREE.Object3D();
  let i = 0;
  for (let f = 0; f < fileiras; f++) {
    for (let c = 0; c < colunas; c++) {
      d.position.set(-largura / 2 + passo / 2 + c * passo, 0.02, -comprimento / 2 + 0.22 + f * 0.42);
      d.rotation.set(0, 0, 0);
      d.updateMatrix();
      m.setMatrixAt(i++, d.matrix);
    }
  }
  m.userData.semContorno = true;
  return m;
}

/** Telhado de duas águas com telhas em canaleta e cumeeira, sobre uma base sólida. */
function telhadoDuasAguas(largura: number, comprimento: number, altura: number, nome: string): THREE.Group {
  const g = grupo(nome);
  const matTelha = materialToon(COR.telha);
  const matCumeeira = materialToon(PALETA.telhaEscura);
  const inclinacao = Math.atan2(altura, largura / 2);
  const comprimentoAgua = Math.hypot(altura, largura / 2);
  const base = malha(caixaBisel(largura, 0.14, comprimento, 0.03), matCumeeira, { nome: "beiral" });
  // Duas águas: caixas finas inclinadas + telhas instanciadas por cima.
  for (const lado of [-1, 1]) {
    const agua = grupo(`agua-${lado > 0 ? "dir" : "esq"}`);
    agua.position.set((lado * largura) / 4, altura / 2, 0);
    agua.rotation.z = -lado * inclinacao;
    agua.add(malha(caixaBisel(comprimentoAgua + 0.1, 0.12, comprimento + 0.2, 0.03), matTelha, { nome: "placa" }));
    const telhas = aguaDeTelhas(comprimentoAgua, comprimento + 0.2, matTelha);
    telhas.position.y = 0.08;
    agua.add(telhas);
    g.add(agua);
  }
  base.position.y = -0.05;
  g.add(base);
  g.add(malha(new THREE.CylinderGeometry(0.11, 0.11, comprimento + 0.3, 8), matCumeeira, { pos: [0, altura + 0.04, 0], rot: [Math.PI / 2, 0, 0], nome: "cumeeira" }));
  return g;
}

export default function criarCapela(): THREE.Group {
  const raiz = grupo("capela");
  const matParede = materialToon(COR.parede);
  const matMadeira = materialToon(COR.madeira);
  const matMadeiraEscura = materialToon(COR.madeiraEscura);

  // Nave: caixa bisel com um rodapé de pedra.
  const nave = grupo("nave");
  nave.add(malha(caixaBisel(4.2, 3.0, 3.6, 0.06), matParede, { pos: [0, 1.5, 0], nome: "paredes" }));
  nave.add(malha(caixaBisel(4.4, 0.35, 3.8, 0.04), materialToon(PALETA.pedra), { pos: [0, 0.17, 0], nome: "rodape" }));
  // Frontão triangular acima da fachada (deixa o telhado assentar na cumeeira).
  const frontao = new THREE.Shape();
  frontao.moveTo(-2.1, 0);
  frontao.lineTo(2.1, 0);
  frontao.lineTo(0, 1.5);
  frontao.closePath();
  const geoFrontao = new THREE.ExtrudeGeometry(frontao, { depth: 3.6, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 1 });
  geoFrontao.translate(0, 0, -1.8);
  nave.add(malha(geoFrontao, matParede, { pos: [0, 3.0, 0], nome: "frontao" }));
  raiz.add(nave);

  // Telhado da nave.
  const telhado = telhadoDuasAguas(4.9, 4.0, 1.5, "telhado");
  telhado.position.set(0, 3.0, 0);
  raiz.add(telhado);

  // Torre sineira central na fachada.
  const torre = grupo("torre");
  torre.position.set(0, 0, 1.1);
  torre.add(malha(caixaBisel(1.5, 5.6, 1.4, 0.05), matParede, { pos: [0, 2.8, 0], nome: "corpo" }));
  // Vão arqueado do sino: caixa escura embutida + arco.
  const vao = grupo("vao-sino");
  vao.position.set(0, 4.55, 0.72);
  vao.add(malha(caixaBisel(0.62, 0.9, 0.2, 0.02), materialToon(COR.portaInterior), { pos: [0, -0.1, 0], nome: "fundo", semContorno: true }));
  vao.add(malha(new THREE.CylinderGeometry(0.31, 0.31, 0.2, 12, 1, false, 0, Math.PI), materialToon(COR.portaInterior), { pos: [0, 0.35, 0], rot: [Math.PI / 2, 0, 0], nome: "arco", semContorno: true }));
  // Moldura do arco em madeira.
  vao.add(malha(new THREE.TorusGeometry(0.36, 0.05, 6, 14, Math.PI), matMadeira, { pos: [0, 0.35, 0.06], nome: "moldura" }));
  // Sino dourado.
  const sino = grupo("sino");
  sino.position.set(0, 0.3, 0.02);
  const perfilSino = new THREE.LatheGeometry(
    [new THREE.Vector2(0.02, 0.32), new THREE.Vector2(0.12, 0.3), new THREE.Vector2(0.16, 0.15), new THREE.Vector2(0.21, 0.02), new THREE.Vector2(0.23, 0)],
    12
  );
  sino.add(malha(perfilSino, materialToon(COR.sino), { pos: [0, -0.34, 0], nome: "corpo" }));
  sino.add(malha(new THREE.SphereGeometry(0.05, 8, 6), materialToon(COR.sino), { pos: [0, -0.34, 0], nome: "badalo", semContorno: true }));
  vao.add(sino);
  torre.add(vao);
  // Janela redonda (rosácea) abaixo do sino, com luz quente por trás.
  torre.add(malha(new THREE.TorusGeometry(0.28, 0.06, 6, 14), matMadeira, { pos: [0, 3.2, 0.72], nome: "rosacea" }));
  // Miolo do óculo: interior escuro com luz quente vazando, como na porta (fica à frente da parede, atrás do aro).
  torre.add(malha(new THREE.CircleGeometry(0.25, 14), materialToon("#3A2414", { emissivo: COR.luzJanela, intensidadeEmissiva: 0.85 }), { pos: [0, 3.2, 0.716], nome: "vidro", semContorno: true }));
  // Telhado piramidal da torre.
  const telhadoTorre = grupo("telhado-torre");
  telhadoTorre.position.set(0, 5.6, 0);
  telhadoTorre.add(malha(new THREE.ConeGeometry(1.18, 1.1, 4), materialToon(COR.telha), { pos: [0, 0.55, 0], rot: [0, Math.PI / 4, 0], nome: "piramide" }));
  telhadoTorre.add(malha(caixaBisel(1.7, 0.12, 1.6, 0.03), materialToon(PALETA.telhaEscura), { pos: [0, 0.02, 0], nome: "beiral" }));
  // Cruz.
  const cruz = grupo("cruz");
  cruz.position.set(0, 1.1, 0);
  cruz.add(malha(caixaBisel(0.1, 0.95, 0.1, 0.02), matMadeiraEscura, { pos: [0, 0.45, 0], nome: "vertical" }));
  cruz.add(malha(caixaBisel(0.5, 0.1, 0.1, 0.02), matMadeiraEscura, { pos: [0, 0.62, 0], nome: "horizontal" }));
  telhadoTorre.add(cruz);
  torre.add(telhadoTorre);
  raiz.add(torre);

  // Porta em arco com interior escuro e luz quente vazando de dentro.
  const porta = grupo("porta");
  porta.position.set(0, 0, 1.81);
  porta.add(malha(caixaBisel(1.0, 1.4, 0.12, 0.02), materialToon(COR.portaInterior), { pos: [0, 0.7, 0], nome: "vao", semContorno: true }));
  porta.add(malha(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 14, 1, false, 0, Math.PI), materialToon(COR.portaInterior), { pos: [0, 1.4, 0], rot: [Math.PI / 2, 0, 0], nome: "arco", semContorno: true }));
  porta.add(malha(new THREE.TorusGeometry(0.56, 0.07, 6, 16, Math.PI), matMadeira, { pos: [0, 1.4, 0.04], nome: "moldura" }));
  for (const lado of [-1, 1]) porta.add(malha(caixaBisel(0.14, 1.4, 0.14, 0.03), matMadeira, { pos: [lado * 0.56, 0.7, 0.02], nome: `batente-${lado}` }));
  // Luz quente no chão da soleira.
  porta.add(malha(new THREE.PlaneGeometry(0.9, 1.1), materialToon(COR.luzJanela, { emissivo: COR.luzJanela, intensidadeEmissiva: 0.9, transparente: true, opacidade: 0.45 }), { pos: [0, 0.015, 0.62], rot: [-Math.PI / 2, 0, 0], nome: "luz-soleira", semContorno: true }));
  raiz.add(porta);

  // Degraus de entrada.
  const degraus = grupo("degraus");
  degraus.position.set(0, 0, 2.05);
  degraus.add(malha(caixaBisel(2.2, 0.18, 0.6, 0.04), materialToon(PALETA.pedra), { pos: [0, 0.09, 0], nome: "degrau-1" }));
  degraus.add(malha(caixaBisel(2.6, 0.16, 0.5, 0.04), materialToon(PALETA.pedraEscura), { pos: [0, 0.08, 0.5], nome: "degrau-2" }));
  raiz.add(degraus);

  // Janelas laterais (uma por lado) com luz.
  for (const lado of [-1, 1]) {
    const j = grupo(`janela-${lado > 0 ? "dir" : "esq"}`);
    j.position.set(lado * 2.12, 1.7, -0.2);
    j.rotation.y = (lado * Math.PI) / 2;
    j.add(malha(caixaBisel(0.5, 0.8, 0.08, 0.02), materialToon(COR.luzJanela, { emissivo: COR.luzJanela, intensidadeEmissiva: 1.0 }), { nome: "vidro", semContorno: true }));
    j.add(malha(caixaBisel(0.62, 0.92, 0.06, 0.02), matMadeira, { pos: [0, 0, -0.03], nome: "moldura" }));
    raiz.add(j);
  }

  // Varal de bandeirinhas na fachada, abaixo da rosácea, e arbustos nos cantos.
  const bandeirinhas = grupo("bandeirinhas");
  bandeirinhas.position.set(0, 2.55, 1.86);
  const cores = [PALETA.vermelho, PALETA.amarelo, PALETA.verdeAgua, PALETA.azulClaro, PALETA.creme];
  const geoBandeira = new THREE.ConeGeometry(0.11, 0.24, 3);
  const n = 9;
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n;
    const x = -1.7 + t * 3.4;
    const queda = Math.sin(t * Math.PI) * 0.22;
    bandeirinhas.add(malha(geoBandeira, materialToon(cores[i % cores.length], { ladoDuplo: true }), { pos: [x, -queda, 0], rot: [0, 0, Math.PI], nome: `bandeira-${i}`, semContorno: true }));
  }
  bandeirinhas.add(malha(new THREE.CylinderGeometry(0.012, 0.012, 3.5, 4), matMadeiraEscura, { pos: [0, 0.1, 0], rot: [0, 0, Math.PI / 2], nome: "corda", semContorno: true }));
  raiz.add(bandeirinhas);

  const arbustos = grupo("arbustos");
  for (const [x, z, s] of [
    [-2.6, 1.6, 0.55],
    [2.7, 1.4, 0.5],
    [-2.9, 0.2, 0.42],
  ] as [number, number, number][]) {
    arbustos.add(malha(new THREE.IcosahedronGeometry(s, 1), materialToon("#3B7A33"), { pos: [x, s * 0.7, z], nome: "arbusto", semContorno: true }));
  }
  raiz.add(arbustos);

  return raiz;
}

/**
 * O sino badala a cada ~14 s (três batidas que se amortecem) e fica parado
 * no resto do tempo: movimento com causa, em vez de balanço perpétuo.
 * Com prefers-reduced-motion fica em repouso.
 */
export function animar(raiz: THREE.Group, t: number, opcoes?: { menosMovimento?: boolean }): void {
  const sino = raiz.getObjectByName("sino");
  if (!sino) return;
  if (opcoes?.menosMovimento) {
    sino.rotation.z = 0;
    return;
  }
  const ciclo = 14;
  // Deslocado pra a primeira badalada cair depois da chegada da câmera.
  const dentro = (t + 8) % ciclo;
  const badalando = dentro < 3.2 ? Math.exp(-dentro * 0.9) : 0;
  sino.rotation.z = Math.sin(dentro * 7.5) * 0.22 * badalando;
}
