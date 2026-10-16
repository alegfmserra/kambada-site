/** Galeria temporária do harness da forja: trajes lado a lado. */
import * as THREE from "three";
import criarPersonagem, { animar as animarPersonagem, type Traje } from "./personagem";
import { aplicarContorno, explodir, grupo } from "./_compartilhado";
export { aplicarContorno, explodir };
const TRAJES: Traje[] = ["jogador", "ze", "francisca", "padre", "chico", "ritinha", "vendedora", "quadrilheiro", "quadrilheira", "sanfoneiro", "zabumbeiro", "triangulo", "coreira", "tocador-tambor", "aquecedor"];
export default function criarGaleria(): THREE.Group {
  const g = grupo("galeria");
  // ?grupo=0|1|2 mostra 5 trajes por folha de contato; sem grupo, todos.
  const grupoQ = typeof location !== "undefined" ? new URLSearchParams(location.search).get("grupo") : null;
  const lista = grupoQ === null ? TRAJES : TRAJES.slice(Number(grupoQ) * 5, Number(grupoQ) * 5 + 5);
  lista.forEach((t, i) => {
    const p = criarPersonagem({ traje: t, variante: TRAJES.indexOf(t) });
    p.position.set(i * 1.1 - (lista.length - 1) * 0.55, 0, 0);
    g.add(p);
  });
  return g;
}
export function animar(raiz: THREE.Group, t: number): void {
  raiz.children.forEach((p, i) => {
    const traje = p.userData.traje as Traje;
    const modo = ["sanfoneiro", "zabumbeiro", "triangulo", "tocador-tambor", "aquecedor", "ritinha"].includes(traje) ? "tocando" : traje === "coreira" ? "coreira" : traje.startsWith("quadrilhe") ? "dancando" : i === 0 ? "andando" : "parado";
    animarPersonagem(p as THREE.Group, t, { modo, fase: i * 0.37 });
  });
}
