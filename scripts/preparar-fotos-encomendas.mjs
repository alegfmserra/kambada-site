import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

/**
 * Fotos de prova para o portfólio de Encomendas Corporativas (2026-09-03).
 * Origem: pasta "Vendas B2B" — as duas encomendas reais feitas para o
 * Senac (Congresso Financeiro e Restaurante Escola), confirmadas pelo
 * Alexandre com contrato assinado.
 */

const BASE = "C:/Users/alegf/OneDrive/Documentos/Claude/Fred - Kambada/comercial/Vendas B2B";
const destino = "C:/dev/kambada-site/public/fotos";
mkdirSync(destino, { recursive: true });

const trabalho = [
  {
    de: join(BASE, "SENAC - Restaurante Escola", "Mostruário Encomenda.JPG"),
    para: "encomenda-senac-mostruario",
    w: 1200,
  },
  {
    de: join(BASE, "SENAC - Congresso Financeiro", "Kit Completo.jpeg"),
    para: "encomenda-senac-ilha-do-amor",
    w: 1200,
  },
  {
    de: join(BASE, "SENAC - Restaurante Escola", "Kit Completo.JPG"),
    para: "encomenda-senac-kit-completo",
    w: 1200,
  },
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
