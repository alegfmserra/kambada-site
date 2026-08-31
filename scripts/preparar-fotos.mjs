import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

const A = "C:/Users/alegf/OneDrive/Documentos/Claude/Fred - Kambada/comercial/Imagens Diversas/FOTOS EDITADAS -20260831T204605Z-1-001/FOTOS EDITADAS";
const B = "C:/Users/alegf/OneDrive/Documentos/Claude/Fred - Kambada/comercial/Imagens Diversas/FOTOS EDITADAS -20260831T204618Z-1-001/FOTOS EDITADAS";
const destino = "C:/dev/kambada-site/public/fotos";
mkdirSync(destino, { recursive: true });

/**
 * origem, nome final, largura alvo.
 * Larguras pensadas para o uso real no site: hero grande, cartões médios.
 */
const trabalho = [
  // Identidade — pessoas, São Luís, família
  { de: join(B, "IMG_2635.jpg"), para: "familia-caminhando", w: 1600 },
  { de: join(B, "IMG_2581.jpg"), para: "familia-sentados", w: 1200 },
  { de: join(B, "IMG_2598.jpg"), para: "menina-rindo", w: 900 },
  { de: join(B, "IMG_2648.jpg"), para: "familia-maos-dadas", w: 900 },
  { de: join(B, "IMG_2723.jpg"), para: "camisa-ilha-encantada", w: 900 },
  { de: join(B, "IMG_2734.jpg"), para: "camisa-casarao", w: 900 },
  { de: join(B, "IMG_2744.jpg"), para: "estampa-detalhe", w: 900 },
  // Produtos por categoria
  { de: join(A, "IMG_1836.JPG"), para: "cat-matracas", w: 800 },
  { de: join(A, "IMG_1830.JPG"), para: "cat-bones", w: 800 },
  { de: join(A, "IMG_1829.JPG"), para: "cat-ecobags", w: 800 },
  { de: join(A, "IMG_1839.JPG"), para: "cat-necessaires", w: 800 },
  { de: join(A, "IMG_1841.JPG"), para: "kit-tradicao", w: 800 },
  { de: join(A, "IMG_1834.JPG"), para: "expositor-feira", w: 1200 },
  { de: join(A, "IMG_1835.JPG"), para: "mandala", w: 800 },
];

let total = 0;
for (const t of trabalho) {
  if (!existsSync(t.de)) {
    console.log("FALTANDO:", t.de);
    continue;
  }
  const img = sharp(t.de).rotate();
  const meta = await img.metadata();

  await img
    .clone()
    .resize(t.w, null, { withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(join(destino, `${t.para}.webp`));

  const info = await sharp(join(destino, `${t.para}.webp`)).metadata();
  total += info.size ?? 0;
  console.log(
    `${t.para}.webp  ${info.width}x${info.height}  ${Math.round((info.size ?? 0) / 1024)} KB   (origem ${meta.width}x${meta.height})`,
  );
}
console.log("\nTotal:", Math.round(total / 1024), "KB");
