/**
 * Gera os ícones do site a partir do logotipo oficial.
 *
 * Recorta o caranguejo — o símbolo da marca — do logo horizontal, detectando
 * o vão transparente que o separa do lettering "Kambada". Nada é redesenhado:
 * o traço é o original.
 *
 * Uso: node scripts/gerar-icones.mjs
 */

import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const ORIGEM = "public/marca/kambada-logo-horizontal-amarelo.png";
const AMARELO = { r: 0xff, g: 0xcc, b: 0x29 };
const GRAFITE = { r: 0x1d, g: 0x1e, b: 0x20 };

const { data, info } = await sharp(ORIGEM)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;

/** Uma coluna é "cheia" se tiver ao menos um pixel opaco. */
const colunaCheia = (x) => {
  for (let y = 0; y < height; y++) {
    if (data[(y * width + x) * channels + 3] > 16) return true;
  }
  return false;
};

// Primeiro bloco de colunas cheias a partir da esquerda = o caranguejo.
let inicio = 0;
while (inicio < width && !colunaCheia(inicio)) inicio++;

let fim = inicio;
let vao = 0;
const VAO_MINIMO = Math.round(width * 0.02); // vão real, não folga entre traços
for (let x = inicio; x < width; x++) {
  if (colunaCheia(x)) {
    fim = x;
    vao = 0;
  } else if (++vao >= VAO_MINIMO) {
    break;
  }
}

// Linhas ocupadas dentro desse recorte horizontal.
let topo = height;
let base = 0;
for (let y = 0; y < height; y++) {
  for (let x = inicio; x <= fim; x++) {
    if (data[(y * width + x) * channels + 3] > 16) {
      if (y < topo) topo = y;
      if (y > base) base = y;
      break;
    }
  }
}

const larguraSimbolo = fim - inicio + 1;
const alturaSimbolo = base - topo + 1;
console.log(
  `Símbolo localizado: x ${inicio}–${fim} (${larguraSimbolo}px), y ${topo}–${base} (${alturaSimbolo}px)`,
);

const simbolo = sharp(ORIGEM).extract({
  left: inicio,
  top: topo,
  width: larguraSimbolo,
  height: alturaSimbolo,
});

await mkdir("public/marca", { recursive: true });

/** Ícone quadrado: símbolo amarelo centralizado sobre o grafite da marca. */
const LADO = 512;
const MARGEM = 0.16;
const cabe = Math.round(LADO * (1 - MARGEM * 2));

const simboloRedimensionado = await simbolo
  .clone()
  .resize(cabe, cabe, { fit: "contain", background: { ...AMARELO, alpha: 0 } })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: LADO,
    height: LADO,
    channels: 4,
    background: { ...GRAFITE, alpha: 1 },
  },
})
  .composite([{ input: simboloRedimensionado, gravity: "centre" }])
  .png()
  .toFile("src/app/icon.png");
console.log("→ src/app/icon.png (512×512)");

/** Imagem de compartilhamento: logo inteiro centralizado, 1200×630. */
const logoParaOg = await sharp(ORIGEM)
  .resize(760, null, { fit: "inside" })
  .png()
  .toBuffer();

await sharp({
  create: {
    width: 1200,
    height: 630,
    channels: 4,
    background: { ...GRAFITE, alpha: 1 },
  },
})
  .composite([{ input: logoParaOg, gravity: "centre" }])
  .png()
  .toFile("src/app/opengraph-image.png");
console.log("→ src/app/opengraph-image.png (1200×630)");
