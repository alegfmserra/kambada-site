import { hashDeterministico } from "@/lib/play/hash";

/**
 * Ruído de valor 2D determinístico (interpolação suave entre hashes da grade),
 * pra relevo do terreno, variação de cor da grama e jitter da vegetação sem
 * Math.random. Sempre o mesmo resultado pro mesmo (x, z).
 */
function hash2(ix: number, iz: number): number {
  return hashDeterministico(ix * 157.31 + iz * 311.7);
}

function suave(t: number): number {
  return t * t * (3 - 2 * t);
}

export function ruido2(x: number, z: number): number {
  const ix = Math.floor(x);
  const iz = Math.floor(z);
  const fx = suave(x - ix);
  const fz = suave(z - iz);
  const a = hash2(ix, iz);
  const b = hash2(ix + 1, iz);
  const c = hash2(ix, iz + 1);
  const d = hash2(ix + 1, iz + 1);
  return a + (b - a) * fx + (c - a) * fz + (a - b - c + d) * fx * fz;
}

/** Ruído fractal (3 oitavas) em 0..1. */
export function fbm(x: number, z: number): number {
  return (ruido2(x, z) * 0.5 + ruido2(x * 2.1 + 7.3, z * 2.1 + 3.1) * 0.3 + ruido2(x * 4.3 + 1.7, z * 4.3 + 9.2) * 0.2);
}
