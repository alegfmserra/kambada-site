import * as THREE from "three";

/**
 * Rampas de sombra (gradient map) do material toon da praça, geradas em
 * runtime e cacheadas por número de degraus, pra nenhum objeto recriar a
 * própria `DataTexture` e pra toda a cena compartilhar a mesma leitura de
 * xilogravura (sombra em blocos, sem transição suave).
 */
const cache = new Map<number, THREE.DataTexture>();

export function rampaToon(degraus: number): THREE.DataTexture {
  const existente = cache.get(degraus);
  if (existente) return existente;

  const dados = new Uint8Array(degraus);
  for (let i = 0; i < degraus; i++) {
    // Piso de 60 mantém a sombra legível (não cai pra preto puro),
    // topo em 255 pra luz plena; degraus intermediários espaçados igual.
    dados[i] = Math.round(60 + (195 * i) / Math.max(1, degraus - 1));
  }

  const rampa = new THREE.DataTexture(dados, degraus, 1, THREE.RedFormat);
  rampa.minFilter = THREE.NearestFilter;
  rampa.magFilter = THREE.NearestFilter;
  rampa.needsUpdate = true;
  cache.set(degraus, rampa);
  return rampa;
}
