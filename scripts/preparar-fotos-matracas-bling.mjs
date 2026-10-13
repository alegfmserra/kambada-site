import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

/**
 * Fotos das estampas de matraca, para anexar como imagem de produto no
 * Bling (2026-09-03). Origem: pasta de portfólio comercial — ver
 * site-novo/ESTUDO-ESTAMPAS-MATRACA_2026-09-03.md para o estudo completo.
 * O Bling só aceita imagem por link externo, por isso essas fotos precisam
 * existir em produção (somoskambada.com.br/fotos/...) antes do link
 * funcionar de verdade — publicar o próximo deploy é o que liga o link.
 */

const BASE =
  "C:/Users/alegf/OneDrive/Documentos/Claude/Fred - Kambada/comercial/portfolio/Imagens para Portfólio/01_Matracas";
const destino = "C:/dev/kambada-site/public/fotos";
mkdirSync(destino, { recursive: true });

const trabalho = [
  { de: join(BASE, "matraca_bandeira_maranhao_com_saco.jpg"), para: "matraca-bandeira-maranhao", w: 1200 },
  { de: join(BASE, "matraca_mosaico_colorido_sem_saco.jpg"), para: "matraca-mosaico-colorido", w: 1200 },
  { de: join(BASE, "matraca_serpente_verde_ondas_azuis.jpg"), para: "matraca-serpente-rei-da-ilha", w: 1200 },
  { de: join(BASE, "matraca_topo_animal_preto_pontos_coloridos.jpg"), para: "matraca-topo-boi-preto", w: 1200 },
  { de: join(BASE, "matraca_leque_bordado_estrela_branca_A.jpg"), para: "matraca-leque-bordado", w: 1200 },
  { de: join(BASE, "matraca_kambada_play_solo.jpg"), para: "matraca-play", w: 1200 },
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
