/**
 * Ícones do app do Kambada Play (PWA instalável, 30/10/2026).
 *
 * Mesmo caranguejo do logotipo oficial (recorte igual ao de gerar-icones.mjs),
 * mas invertido: fundo amarelo e símbolo grafite, para o ícone do Play não se
 * confundir com o da loja na tela do celular.
 *
 * Gera em public/kambadaplay/icones/:
 *  - icone-192.png / icone-512.png  (purpose "any")
 *  - icone-maskable-512.png         (margem maior: Android recorta em círculo)
 *  - apple-touch-icon.png           (180×180, sem transparência, para o iPhone)
 *
 * Uso: node scripts/gerar-icones-play.mjs
 */

import { mkdir } from "node:fs/promises";
import sharp from "sharp";

const ORIGEM = "public/marca/kambada-logo-horizontal-amarelo.png";
const AMARELO = { r: 0xff, g: 0xd7, b: 0x2b };
const GRAFITE = { r: 0x20, g: 0x1e, b: 0x1f };
const DESTINO = "public/kambadaplay/icones";

const { data, info } = await sharp(ORIGEM).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;
const opaco = (x, y) => data[(y * width + x) * channels + 3] > 16;

// Primeiro bloco de colunas cheias a partir da esquerda = o caranguejo.
const colunaCheia = (x) => {
  for (let y = 0; y < height; y++) if (opaco(x, y)) return true;
  return false;
};
let inicio = 0;
while (inicio < width && !colunaCheia(inicio)) inicio++;
let fim = inicio;
let vao = 0;
const VAO_MINIMO = Math.round(width * 0.02);
for (let x = inicio; x < width; x++) {
  if (colunaCheia(x)) {
    fim = x;
    vao = 0;
  } else if (++vao >= VAO_MINIMO) break;
}
let topo = height;
let base = 0;
for (let y = 0; y < height; y++) {
  for (let x = inicio; x <= fim; x++) {
    if (opaco(x, y)) {
      if (y < topo) topo = y;
      if (y > base) base = y;
      break;
    }
  }
}

const simbolo = await sharp(ORIGEM)
  .extract({ left: inicio, top: topo, width: fim - inicio + 1, height: base - topo + 1 })
  .png()
  .toBuffer();

/** Símbolo pintado de grafite (mantém só o recorte/alfa do original). */
async function simboloGrafite(lado) {
  const recorte = await sharp(simbolo)
    .resize(lado, lado, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  return sharp({ create: { width: lado, height: lado, channels: 4, background: { ...GRAFITE, alpha: 1 } } })
    .composite([{ input: recorte, blend: "dest-in" }])
    .png()
    .toBuffer();
}

async function icone(lado, margem, arquivo) {
  const cabe = Math.round(lado * (1 - margem * 2));
  await sharp({ create: { width: lado, height: lado, channels: 4, background: { ...AMARELO, alpha: 1 } } })
    .composite([{ input: await simboloGrafite(cabe), gravity: "centre" }])
    .flatten({ background: AMARELO })
    .png()
    .toFile(`${DESTINO}/${arquivo}`);
  console.log(`→ ${DESTINO}/${arquivo} (${lado}×${lado})`);
}

await mkdir(DESTINO, { recursive: true });
await icone(192, 0.16, "icone-192.png");
await icone(512, 0.16, "icone-512.png");
// Zona segura do maskable = círculo de 80 % do lado; 24 % de margem deixa o caranguejo inteiro.
await icone(512, 0.24, "icone-maskable-512.png");
await icone(180, 0.14, "apple-touch-icon.png");
