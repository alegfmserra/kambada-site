import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

/**
 * Fotos de produto, nomeadas pelo ID do Bling (2026-10-08).
 *
 * Uma foto principal por produto — ou por variação, nas estampas de matraca.
 * Servem a dois destinos com o mesmo arquivo:
 *  1. o site, que as mostra direto (public/fotos/produtos/<id>.jpg);
 *  2. o Bling, que as BAIXA pelo link público e guarda no armazenamento dele —
 *     de onde seguem para o Mercado Livre.
 *
 * Origem: comercial/portfolio/Imagens para Portfólio, já renomeada.
 *
 * SÓ entra o que tem correspondência segura. Ficaram de fora, de propósito:
 *  - os tamanhos de matraca (Grande/Pequena, com/sem suporte): a foto não
 *    mostra o tamanho, e errar aqui vende a peça errada;
 *  - a variação "Leque Bordado": as fotos são do Kambada Play (chapéu bordado),
 *    não de uma estampa — a variação provavelmente nem deveria existir;
 *  - a variação "Caboclo de Pena": nenhuma foto identificada;
 *  - as camisas: o acervo tem um ensaio só; o Alexandre vai trazer mais fotos;
 *  - as ecobags e necessaires sem foto no acervo.
 *
 * Para trocar ou acrescentar: edite a lista, rode `node scripts/preparar-fotos-produtos.mjs`,
 * publique, e chame /api/bling/fotos (ver docs).
 */

const ACERVO =
  "C:/Users/alegf/OneDrive/Documentos/Claude/Fred - Kambada/comercial/portfolio/Imagens para Portfólio";
const DESTINO = "C:/dev/kambada-site/public/fotos/produtos";

/** idBling → [pasta, arquivo, observação para o relatório] */
export const FOTOS = {
  // Bonés
  16701478057: ["05_Bones", "bone_guaras-bege_01.jpg", "Boné Guarás Bege"],
  16701478099: ["05_Bones", "bone_marinho_maranhense-que-so_01.jpg", "Boné Marinho Maranhense Que Só"],
  16701477657: ["05_Bones", "bone_preto_sao-luis-ilha-encantada_01.jpg", "Boné Preto Lendas — POR ELIMINAÇÃO: o boné preto do acervo traz 'São Luís Ilha Encantada'"],
  // Ecobags
  16701491097: ["03_Ecobags", "ecobag_boizinho-com-fio-de-matraca_01.jpg", "Ecobag Boizinho com fio de matraca"],
  16701486198: ["03_Ecobags", "ecobag_caboclo-de-pena_01.jpg", "Ecobag Caboclo de Pena"],
  16701491047: ["03_Ecobags", "ecobag_sao-luis-azulejos_01.jpg", "Ecobag São Luís Azulejos"],
  // Necessaires
  16701478149: ["04_Necessaires", "necessaire_azulejos_com-caneta_01.jpg", "Necessaire Azulejos"],
  16701478328: ["04_Necessaires", "necessaire_tradicao-colorida_02.jpg", "Necessaire Tradição Colorida"],
  // Pareôs
  16701478379: ["08_Pareos", "pareo_cidade-dos-azulejos_01.jpg", "Pareô Cidade dos Azulejos"],
  16701478410: ["08_Pareos", "pareo_mosaico_01.jpg", "Pareô Mosaico"],
  16701478418: ["08_Pareos", "pareo_reggae-roots_01.jpg", "Pareô Reggae Roots"],
  16701478426: ["08_Pareos", "pareo_revoada-dos-guaras_modelo_01.jpg", "Pareô Revoada dos Guarás (foto com modelo)"],
  // Papelaria
  16701538916: ["06_Papelaria_e_Kits", "papelaria_kit-ecologico_guaras_02.jpg", "Kit Ecológico Guarás"],
  16701539190: ["06_Papelaria_e_Kits", "papelaria_kit-ecologico_bumba-meu-boi_02.jpg", "Kit Ecológico Bumba Meu Boi"],
  16701539241: ["06_Papelaria_e_Kits", "papelaria_kit-ecologico_cazumba_03.jpg", "Kit Ecológico Cazumbá"],
  16701539267: ["06_Papelaria_e_Kits", "papelaria_kit-ecologico_ilha-do-amor_05.jpg", "Kit Ecológico Ilha do Amor"],
  16689787486: ["06_Papelaria_e_Kits", "papelaria_lapis-plantavel_lote_01.jpg", "Lápis Plantável"],
  16701502407: ["06_Papelaria_e_Kits", "papelaria_livrinho_joguinhos-divertidos_02.jpg", "Joguinhos Divertido (a foto mostra também a camisa Ilha Encantada)"],
  // Brindes
  16689786358: ["02_Placas_de_Madeira", "decoracao_PORTA-CHAVE_carranca_01.jpg", "Porta-chave"],
  16701502913: ["Chaveiros", "chaveiro_chaveiro-mascote-kambada-cartela-aprimorado_01.jpg", "Chaveiros Sortidos (foto do chaveiro mascote)"],
  // Decoração
  16701503226: ["02_Placas_de_Madeira", "decoracao_mandala_trio_01.jpg", "Mandala Modelos Diversos (os três modelos)"],
  16701503257: ["02_Placas_de_Madeira", "decoracao_placa-reta_par-de-bois_01.jpg", "Placa de Madeira Reta"],
  // Matracas — produtos
  16698778218: ["01_Matracas", "matraca_kambada-play_com-chapeu-bordado_01.jpg", "Matraca Kambada Play (com chapéu bordado)"],
  16698775382: ["01_Matracas", "matraca_bandeira-maranhao_com-saquinho_01.jpg", "Matraca Grande com Suporte — foto principal do produto"],
  // Matracas — variações de estampa da Grande com Suporte
  16701634559: ["01_Matracas", "matraca_mosaico-colorido_com-suporte_01.jpg", "variação Mosaico Colorido"],
  16701634568: ["01_Matracas", "matraca_serpente-rei-da-ilha_com-suporte_01.jpg", "variação Serpente e Rei da Ilha"],
  16701634579: ["01_Matracas", "matraca_topo-boi-preto_01.jpg", "variação Topo Boi Preto"],
};

/** Lado maior em pixels. O Mercado Livre recomenda 1200; o mínimo dele é 500. */
const LADO = 1200;

const isEntrypoint = process.argv[1] && process.argv[1].endsWith("preparar-fotos-produtos.mjs");
if (isEntrypoint) {
  mkdirSync(DESTINO, { recursive: true });
  const medidas = {};
  for (const [id, [pasta, arquivo]] of Object.entries(FOTOS)) {
    const info = await sharp(join(ACERVO, pasta, arquivo))
      .rotate() // respeita a orientação da câmera (EXIF)
      .resize(LADO, LADO, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(join(DESTINO, `${id}.jpg`));
    medidas[id] = { largura: info.width, altura: info.height };
    console.log(`${id}.jpg  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }

  // O site precisa das medidas para reservar o espaço da foto antes de ela
  // carregar — sem isso a página "pula" quando a imagem chega.
  const ts = `/**
 * Fotos de produto disponíveis no site, por ID do Bling, com as medidas.
 * GERADO por scripts/preparar-fotos-produtos.mjs — não edite à mão.
 */
export const FOTOS_PRODUTOS: Record<number, { largura: number; altura: number }> = ${JSON.stringify(medidas, null, 2)};
`;
  writeFileSync("C:/dev/kambada-site/src/lib/fotosProdutos.ts", ts);
  console.log(`\n${Object.keys(medidas).length} fotos geradas.`);
}
