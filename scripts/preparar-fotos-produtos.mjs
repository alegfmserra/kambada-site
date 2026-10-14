import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
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

/**
 * Acha o arquivo mesmo que o Alexandre o tenha movido para uma subpasta do
 * acervo (ele reorganiza as pastas por tipo). Primeiro o caminho dado; depois
 * busca pelo nome em qualquer subpasta da mesma categoria; por fim no acervo todo.
 */
function localizarArquivo(pasta, arquivo) {
  const direto = join(ACERVO, pasta, arquivo);
  if (existsSync(direto)) return direto;
  const procurar = (dir) => {
    for (const nome of readdirSync(dir)) {
      const caminho = join(dir, nome);
      if (statSync(caminho).isDirectory()) { const achado = procurar(caminho); if (achado) return achado; }
      else if (nome === arquivo) return caminho;
    }
    return null;
  };
  const raizCategoria = join(ACERVO, pasta.split("/")[0]);
  return (existsSync(raizCategoria) && procurar(raizCategoria)) || procurar(ACERVO) || direto;
}

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
  16701478149: ["Marias_2026-10-13", "Necessaire Azulejos.jpg", "Necessaire Azulejos (foto nova das Marias, 13/10)"],
  16701478277: ["Marias_2026-10-13", "Necessaire  Tradição.jpg", "Necessaire Tradição (Marias, 13/10)"],
  16701478241: ["Marias_2026-10-13", "Necessaire Serpente - Tons de Azul.jpg", "Necessaire Serpente Tons de Azul (Marias, 13/10)"],
  16701478328: ["04_Necessaires", "necessaire_tradicao-colorida_02.jpg", "Necessaire Tradição Colorida"],
  // Pareôs
  16701478379: ["08_Pareos", "pareo_cidade-dos-azulejos_01.jpg", "Pareô Cidade dos Azulejos"],
  16701478410: ["08_Pareos", "pareo_mosaico_01.jpg", "Pareô Mosaico"],
  16701478418: ["08_Pareos", "pareo_reggae-roots_01.jpg", "Pareô Reggae Roots"],
  16701478426: ["08_Pareos", "pareo_revoada-dos-guaras_modelo_01.jpg", "Pareô Revoada dos Guarás (foto com modelo)"],
  // Papelaria
  16701538916: ["06_Papelaria_e_Kits", "papelaria_kit-ecologico_guaras_02.jpg", "Kit Ecológico Guarás"],
  16701539190: ["06_Papelaria_e_Kits", "papelaria_kit-ecologico_bumba-meu-boi_02.jpg", "Kit Ecológico Bumba Meu Boi"],
  // Kit Ecológico Cazumbá (16701539241): a única foto (604×704, desfocada) foi descartada do acervo em 13/10 — sem foto até o ensaio novo.
  16701539267: ["06_Papelaria_e_Kits/Kit Ecológico", "Kit Ecológico - Lendas.jpg", "Kit Ecológico Ilha do Amor — capa inteira (Marias 13/10; Alexandre nomeou de Lendas)"],
  16689787486: ["06_Papelaria_e_Kits/Lapis Ecológico", "papelaria_lapis-plantavel_boi_01.jpg", "Lápis Plantável (1 unidade com cartela, Marias 13/10)"],
  16701503196: ["06_Papelaria_e_Kits/Livretinhos", "papelaria_kambada-goods_01.jpg", "Kambada Goods (Marias, 13/10)"],
  16701502407: ["06_Papelaria_e_Kits/Livretinhos", "Joguinhos Divertidos - Capa.jpg", "Joguinhos Divertido — capa (Marias, 13/10)"],
  // Camisas com modelo (Marias, 13/10): servem de principal até o ensaio em fundo branco.
  16698813505: ["Marias_2026-10-13", "Camisa Tradição Bumba Meu Boi.jpg", "Camisa Tradição Texto (modelo) — Alexandre nomeou de Tradição Bumba Meu Boi; confirmar se é esta ou a Camisa Tradição"],
  16698811377: ["Marias_2026-10-13", "Camisa Alusiva São Luís.jpg", "Camisa Alusiva São Luís (modelo)"],
  16698807702: ["Marias_2026-10-13", "Camisa Reggae Roots.jpg", "Camisa Reggae Roots (modelo)"],
  // Camisas — ensaios de 05/06, 15/07 e Dia dos Pais, distribuídos em 13/10/2026 (ver _MANIFESTO-distribuicao-fotos)
  16698810433: ["07_Camisas_Estampadas/Camisa Boizinho com Fio de Matraca", "camisa-boizinho-com-fio-de-matraca_101_estampas_lisas_-_editadas-14.jpg", "Camisa Boizinho com Fio de Matraca (bordô, modelo)"],
  16698809408: ["07_Camisas_Estampadas/Camisa Caboclo de Pena", "camisa-caboclo-de-pena_286_IMG_7590.jpg", "Camisa Caboclo de Pena (preta, modelo)"],
  16698806570: ["07_Camisas_Estampadas/Camisa Revoada dos Guarás", "camisa-revoada-dos-guaras_101_IMG_7472.jpg", "Camisa Revoada dos Guarás (branca, casal)"],
  16698802616: ["07_Camisas_Estampadas/Camisa Tradição", "camisa-tradicao_263_IMG_2581.jpg", "Camisa Tradição (marinho, Dia dos Pais)"],
  16698815567: ["07_Camisas_Estampadas/Camisa Revoadinha dos Guarás", "camisa-revoadinha-dos-guaras_265_IMG_2594.jpg", "Camisa Revoadinha dos Guarás (infantil rosa, Dia dos Pais)"],
  16698811730: ["07_Camisas_Estampadas/Camisa Boi Maranhense que só", "camisa-boi-maranhense-que-so_101_WhatsApp_Image_2026-10-13_at_21.55.36.jpg", "Camisa Boi Maranhense que só (bordô, modelo)"],
  // Brindes
  16689786358: ["02_Placas_de_Madeira", "decoracao_PORTA-CHAVE_carranca_01.jpg", "Porta-chave"],
  16701502913: ["Chaveiros", "chaveiro_chaveiro-mascote-kambada-cartela-aprimorado_01.jpg", "Chaveiros Sortidos (foto do chaveiro mascote)"],
  // Decoração
  16701503226: ["02_Placas_de_Madeira", "decoracao_mandala_trio_01.jpg", "Mandala Modelos Diversos (os três modelos)"],
  16701503257: ["02_Placas_de_Madeira", "decoracao_placa-reta_par-de-bois_01.jpg", "Placa de Madeira Reta"],
  // Matracas — produtos
  16698778218: ["01_Matracas", "matraca_kambada-play_com-chapeu-bordado_01.jpg", "Matraca Kambada Play (com chapéu bordado)"],
  16698775382: ["01_Matracas", "matraca_bandeira-maranhao_com-saquinho_03.jpg", "Matraca Grande com Suporte — foto principal do produto"],
  // Matracas — variações de estampa da Grande com Suporte
  16701634559: ["01_Matracas", "matraca_mosaico-colorido_com-suporte_01.jpg", "variação Mosaico Colorido"],
  16701634568: ["01_Matracas", "matraca_serpente-rei-da-ilha_com-suporte_02.jpg", "variação Serpente e Rei da Ilha"],
  16701634579: ["01_Matracas", "matraca_topo-boi-preto_01.jpg", "variação Topo Boi Preto"],
};

/**
 * Galeria (fotos além da principal), por ID do Bling: [pasta, [arquivos...]].
 * Vão para public/fotos/produtos/galeria/<id>-<n>.jpg e, pelo link, para o Bling.
 */
export const GALERIA = {
  16698811377: ["07_Camisas_Estampadas/Camisa Alusiva São Luís", ["camisa-alusiva-sao-luis_101_IMG_7440.jpg", "camisa-alusiva-sao-luis_118_IMG_7503.jpg", "camisa-alusiva-sao-luis_104_IMG_7443.jpg", "camisa-alusiva-sao-luis_132_IMG_7517.jpg", "camisa-alusiva-sao-luis_220_IMG_7656.jpg", "camisa-alusiva-sao-luis_107_IMG_7448.jpg"]],
  16698810433: ["07_Camisas_Estampadas/Camisa Boizinho com Fio de Matraca", ["camisa-boizinho-com-fio-de-matraca_103_estampas_lisas_-_editadas-16.jpg", "camisa-boizinho-com-fio-de-matraca_110_IMG_7456.jpg", "camisa-boizinho-com-fio-de-matraca_118_IMG_7464.jpg", "camisa-boizinho-com-fio-de-matraca_126_IMG_7472.jpg", "camisa-boizinho-com-fio-de-matraca_157_WhatsApp_Image_2026-10-13_at_21.55.33_(2).jpg"]],
  16698809408: ["07_Camisas_Estampadas/Camisa Caboclo de Pena", ["camisa-caboclo-de-pena_211_IMG_7773.jpg", "camisa-caboclo-de-pena_218_WhatsApp_Image_2026-10-13_at_21.55.33.jpg", "camisa-caboclo-de-pena_184_IMG_7746.jpg", "camisa-caboclo-de-pena_283_IMG_7587.jpg", "camisa-caboclo-de-pena_198_IMG_7760.jpg"]],
  16698806570: ["07_Camisas_Estampadas/Camisa Revoada dos Guarás", ["camisa-revoada-dos-guaras_116_IMG_7487.jpg", "camisa-revoada-dos-guaras_114_IMG_7485.jpg", "camisa-revoada-dos-guaras_104_IMG_7475.jpg", "camisa-revoada-dos-guaras_120_IMG_7491.jpg"]],
  16698802616: ["07_Camisas_Estampadas/Camisa Tradição", ["camisa-tradicao_122_IMG_2592.jpg", "camisa-tradicao_272_IMG_2648.jpg", "camisa-tradicao_281_IMG_2723.jpg", "camisa-tradicao_112_IMG_2582.jpg", "camisa-tradicao_248_IMG_2721.jpg"]],
  16698815567: ["07_Camisas_Estampadas/Camisa Revoadinha dos Guarás", ["camisa-revoadinha-dos-guaras_125_IMG_2595.jpg", "camisa-revoadinha-dos-guaras_267_IMG_2598.jpg", "camisa-revoadinha-dos-guaras_256_IMG_2729.jpg", "camisa-revoadinha-dos-guaras_121_IMG_2591.jpg", "camisa-revoadinha-dos-guaras_150_IMG_2622.jpg"]],
};

/** Lado maior em pixels. O Mercado Livre recomenda 1200; o mínimo dele é 500. */
const LADO = 1200;

const isEntrypoint = process.argv[1] && process.argv[1].endsWith("preparar-fotos-produtos.mjs");
if (isEntrypoint) {
  mkdirSync(DESTINO, { recursive: true });
  const medidas = {};
  for (const [id, [pasta, arquivo]] of Object.entries(FOTOS)) {
    const info = await sharp(localizarArquivo(pasta, arquivo))
      .rotate() // respeita a orientação da câmera (EXIF)
      .resize(LADO, LADO, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(join(DESTINO, `${id}.jpg`));
    medidas[id] = { largura: info.width, altura: info.height };
    console.log(`${id}.jpg  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }

  // Galeria
  const galeria = {};
  mkdirSync(join(DESTINO, "galeria"), { recursive: true });
  for (const [id, [pasta, arquivos]] of Object.entries(GALERIA)) {
    galeria[id] = [];
    for (let n = 0; n < arquivos.length; n++) {
      const info = await sharp(localizarArquivo(pasta, arquivos[n])).rotate()
        .resize(LADO, LADO, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82, mozjpeg: true })
        .toFile(join(DESTINO, "galeria", `${id}-${n + 1}.jpg`));
      galeria[id].push({ n: n + 1, largura: info.width, altura: info.height });
    }
    console.log(`galeria ${id}: ${arquivos.length} fotos`);
  }

  // O site precisa das medidas para reservar o espaço da foto antes de ela
  // carregar — sem isso a página "pula" quando a imagem chega.
  const ts = `/**
 * Fotos de produto disponíveis no site, por ID do Bling, com as medidas.
 * GERADO por scripts/preparar-fotos-produtos.mjs — não edite à mão.
 */
export const FOTOS_PRODUTOS: Record<number, { largura: number; altura: number }> = ${JSON.stringify(medidas, null, 2)};

/** Fotos extras (galeria) por ID: /fotos/produtos/galeria/<id>-<n>.jpg */
export const GALERIA_PRODUTOS: Record<number, { n: number; largura: number; altura: number }[]> = ${JSON.stringify(galeria, null, 2)};
`;
  writeFileSync("C:/dev/kambada-site/src/lib/fotosProdutos.ts", ts);
  console.log(`\n${Object.keys(medidas).length} fotos geradas.`);
}
