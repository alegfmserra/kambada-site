import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
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
  // Caminho absoluto (fotos por estampa já geradas, pasta de pendências): usa direto.
  if (/^[A-Za-z]:[\/]/.test(pasta) || pasta.startsWith("/")) return join(pasta, arquivo);
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

// ── Fotos da Wilsonira (Drive, 14/10/2026), importadas para o acervo com prefixo will-2026-10-14_ ──
const W = "will-2026-10-14_";
const T7 = "07_Camisas_Estampadas/_Triagem Will 2026-10-14", T3 = "03_Ecobags/_Triagem Will 2026-10-14", T1 = "01_Matracas/_Triagem Will 2026-10-14";
const PL = "02_Placas_de_Madeira", KIT = "06_Papelaria_e_Kits/Kit Ecológico", CHV = "Chaveiros/Chaveiro de Pinus";
Object.assign(FOTOS, {
  16698815567: [T7, `${W}camisa-infantil-guaras-rosa.jpg`, "Revoadinha dos Guarás — peça no cabide (Will)"],
  16698815216: [T7, `${W}camisa-infantil-ilha-encantada-off-white-dtf.jpg`, "Infantil Ilha Encantada (Will)"],
  16698816511: [T7, `${W}camisa-suede-guaras-azul-marinho-1.jpg`, "Suede Feminino azul (Will)"],
  16701490850: [T3, `${W}ecobag-grande-ilha-encantada.jpg`, "Ecobag Serpente Tons de Azul (Will)"],
  16701491012: [T3, `${W}ecobag-grande-quebrdeira-de-coco.jpg`, "Ecobag Quebradeira de Coco (Will)"],
  16701478328: ["04_Necessaires/Necessaire Tradição", `${W}necessaire-tradicao-colorido.jpg`, "Necessaire Tradição Colorida (Will)"],
  // 16701539190: capa deitada da Will substituída pela capa em pé da Kambada (18/10) — ver bloco K
  16701539241: [KIT, `${W}capa-kit-ecologico-cazumba.jpg`, "Kit Cazumbá — capa (Will)"],
  // 16701538916: capa deitada da Will substituída pela capa em pé da Kambada (18/10) — ver bloco K
  16701539267: [KIT, `${W}capa-kit-ecoogico-lendas.jpg`, "Kit Ilha do Amor — capa Lendas (Will)"],
  // O cadastro 16701502913 chama-se "Chaveiros Kambadinha" no Bling (mascote); os chaveiros de pinus DTF da Will ficam no acervo até existir produto próprio.
  16701502913: ["Chaveiros", "chaveiro_chaveiro-mascote-kambada-cartela-aprimorado-v2_01.jpg", "Chaveiro Kambadinha (mascote, cartela)"],
  16689786358: ["02_Placas_de_Madeira/Porta-chaves", `${W}porta-chaves-boi-azul.jpg`, "Porta-chave (Will)"],
  16719152093: [CHV, `${W}chaveiros-dtf-5.jpg`, "Chaveiros em Madeira Pinus (Will) — cadastro criado pelo Alexandre em 14/10"],
});
Object.assign(GALERIA, {
  16698815567: [T7, [`${W}camisa-infantil-guaras-azul.jpg`, `${W}camisa-infantil-guaras-off-white.jpg`, ...GALERIA[16698815567][1].slice(0, 4)]],
  16698816511: [T7, [`${W}camisa-suede-guaras-azul-marinho-2.jpg`]],
  16701486198: [T3, [`${W}ecobag-grande-caboclo-de-pena-azul.jpg`, `${W}ecobag-grande-caboclo-de-pena-marrom.jpg`]],
  16701491047: [T3, [`${W}ecobag-grande-sao-luis.jpg`]],
  16701491097: [T3, [`${W}ecobag-mini-matraca-boi.jpg`]],
  16701478057: ["05_Bones", [`${W}bone-guara-bege.jpg`]],
  16701478099: ["05_Bones", [`${W}bone-maranhense-que-so-azul-marinho.jpg`]],
  16701539190: [KIT, [`${W}kit-ecologico-bumba-meu-boi.jpg`, `${W}kit-ecologico-aberto.jpg`]],
  16701539241: [KIT, [`${W}kit-ecologico-cazumba.jpg`, `${W}kit-ecologico-aberto.jpg`]],
  16701538916: [KIT, [`${W}kit-ecologico-guara.jpg`, `${W}kit-ecologico-aberto.jpg`]],
  16701539267: [KIT, [`${W}kit-ecologico-aberto.jpg`]],
  16701503257: [PL, [`${W}placa-coreira.jpg`, `${W}placa-coreiro.jpg`, `${W}detalhe-placa-coreira.jpg`, `${W}placa-retangular-em-pinus-coreiro.jpg`]],
  // 16701503283: fotos da Will substituídas pelas da Kambada de 17/10 (mesmos itens) — ver bloco K
  16701503226: [PL, [`${W}placa-redonda-em-pinus-boi-colorido-com-acabamento-em-sisal-e-fio-nautico.jpg`, `${W}placa-redonda-em-pinus-boi-colorido-com-acabamento-em-sisal-e-fio-nautico-2.jpg`]],
  16689786358: ["02_Placas_de_Madeira/Porta-chaves", [`${W}porta-chaves-azulejo.jpg`, `${W}porta-chaves-carranca.jpg`]],
  16698778218: [T1, [`${W}matraca-kambada-play-boi-de-lado.jpg`, `${W}matraca-kambada-play-boi-de-lado-2.jpg`]],
  16698776080: [T1, [`${W}matraca-grande-reggae-roots.jpg`]],
  16698777979: [T1, [`${W}matraca-pequena-boi-colorido-pintada-a-mao.jpg`, `${W}matraca-pequena-cazumba-pintada-a-mao.jpg`, `${W}matraca-mini-boi-preto-dtf.jpg`, `${W}matraca-mini-cazumba-colorido-dtf.jpg`, `${W}matraca-mini-cazumba-preto-dtf.jpg`, `${W}matraca-mini-miolo-de-boi-colorido-dtf.jpg`, `${W}matraca-mini-miolo-de-boi-preto-dtf.jpg`]],
  16698775382: [T1, [`${W}matraca-grande-com-suporte-boi.jpg`]],
  16719152093: [CHV, [`${W}chaveiros-dtf-4.jpg`, `${W}chaveiros-dtf-1.jpg`, `${W}chaveiros-dtf-2.jpg`, `${W}chaveiros-dtf.jpg`]],
  16701478418: ["08_Pareos", [`${W}pareo-lendas.jpg`]],
  16701478379: ["08_Pareos", [`${W}pareo-sao-luis.jpg`]],
});


// ── Fotos da Kambada (WhatsApp 17/10, entregues em 18/10/2026), nomeadas pelo Alexandre pelo NOME do produto;
//    o casamento nome → ID do Bling foi feito pelo Fred em 18/10 (ver site-novo/FOTOS_produtos-sem-foto_2026-10-18.md).
//    Fora, de propósito: "Cropped Lendas 1/2" (cropped não tem cadastro no Bling).
const K = "Kambada_2026-10-18";
Object.assign(FOTOS, {
  16701539190: [K, "Kit Anotação - Bumba Meu Boi.jpeg", "Kit Ecológico Bumba Meu Boi — capa em pé"],
  16701539241: [K, "Kit Anotação - Cazumba.jpeg", "Kit Ecológico Cazumbá — capa em pé"],
  16701538916: [K, "Kit Anotação - Guarás.jpeg", "Kit Ecológico Guarás — capa em pé"],
  16701539267: [K, "Kit Anotação - Lendas.jpeg", "Kit Ecológico Ilha do Amor — capa em pé (Lendas)"],
  16698814825: [K, "Camisa Cazumbazinho1.jpeg", "Camisa Cazumbázinho"],
  16698814722: [K, "Camisa Cazumbá.jpeg", "Camisa Cazumbá (bege; a preta vai na galeria — um cadastro só no Bling)"],
  16698808333: [K, "Camisa Lenda da Serpente Infantil2.jpeg", "Camisa Lenda da Serpente Infantil"],
  16698804685: [K, "Camisa Lendas e Carrancas1.jpeg", "Camisa Lendas e Carrancas"],
  16698816975: [K, "Camisa Revoada dos Guarás Suede Unissex1.jpeg", "Camisa Revoada dos Guarás Suede Unissex"],
  16698816110: [K, "Camisa Serpente Mosaico Infantil1.jpeg", "Camisa Serpente Mosaico Infantil"],
  16698814567: [K, "Camisa Sol Nosso de Cada Dia - Regatão1.jpeg", "Camisa Sol Nosso de Cada Dia - Regatão"],
  16719577340: [K, "Camisa Tambor.jpeg", "Camisa Tambor"],
  16698776080: [K, "Matraca G Bumba Boi  Estrelado.jpeg", "Matraca Grande sem Suporte (estampa Estrelado)"],
  16698777669: [K, "Matraca P Boizinho Perfil 1 Com Suporte.jpeg", "Matraca Pequena com Suporte (Boizinho)"],
  16698777979: [K, "Matraca P Boizinho Perfil.jpeg", "Matraca Pequena sem Suporte (Boizinho)"],
  16689788251: [K, "Livro Vermelho (Historinha do Boi).jpeg", "Livro Vermelho (Historinha)"],
  16701503283: [K, "placa-redonda-kambada-2026-10-18-1.jpeg", "Placa de Madeira Redonda (boi colorido; WhatsApp 17/10)"],
});
// Galeria: acrescenta às fotos que o produto já tinha (não substitui).
const acrescentar = (id, arquivos) => { if (GALERIA[id]) GALERIA[id][1].push(...arquivos); else GALERIA[id] = [K, arquivos]; };
acrescentar(16698814825, ["Camisa Cazumbazinho12.jpeg", "Camisa Cazumbazinho3.jpeg"]);
acrescentar(16698814722, ["Camisa Cazumbá V2 - Preta.jpeg"]);
acrescentar(16698808333, ["Camisa Lenda da Serpente Infantil3.jpeg", "Camisa Lenda da Serpente Infantil5 (2).jpeg"]);
acrescentar(16698804685, ["Camisa Lendas e Carrancas2.jpeg", "Camisa Lendas e Carrancas3.jpeg", "Camisa Lendas e Carrancas4.jpeg"]);
acrescentar(16698816975, ["Camisa Revoada dos Guarás Suede Unissex2.jpeg"]);
acrescentar(16698814567, ["Camisa Sol Nosso de Cada Dia - Regatão2.jpeg"]);
acrescentar(16719577340, ["Camisa Tambor1.jpeg", "Camisa Tambor2.jpeg"]);
acrescentar(16698776080, ["Matraca G  Bumba Boi Perfil Estrelado.jpeg", "Matraca G Bumba Boi  Mosaico.jpeg", "Matraca G Bumba Boi Miolo.jpeg", "Matraca G Bumba Boi Multicores.jpeg", "Matraca G Bumba Boi Reggae Roots.jpeg", "Matraca G Bumba Boi de Estrelas.jpeg", "Matraca G Chapeu de Fita Maranhão.jpeg", "Matraca G Fitas Coloridas.jpeg", "Matraca Grande Cazumba Frontal.jpeg"]);
acrescentar(16698775382, ["Matraca G Bumba Boi  Estrelado com suporte.jpeg", "Matraca G Bumba Boi  Mosaico com suporte.jpeg", "Matraca G Bumba Boi Miolo Com Suporte.jpeg", "Matraca G Bumba Boi Multicores com Suporte.jpeg", "Matraca G Bumba Boi Reggae Roots c suporte.jpeg", "Matraca G Bumba Boi de Estrelas com suporte.jpeg", "Matraca G Bumba Boi de Estrelas com suporte 2.jpeg", "Matraca G Bumba Boi de Estrelas com suporte 3.jpeg", "Matraca G Bumba Boi do Maranhão com suporte.jpeg", "Matraca G Bumba Boi do Maranhão com suporte2.jpeg", "Matraca G Chapeu de Fitas 1 Com Suporte.jpeg", "Matraca G Fitas Coloridas Com Suporte.jpeg", "Matraca Bumba Boi  Estrelado com Suporte.jpeg"]);
acrescentar(16698777669, ["Matraca P Boizinho Perfil 2 Com Suporte.jpeg", "Matraca P Boizinho Perfil 3 com Suporte.jpeg", "Matraca P Chapeu de Fita Bandeira do Maranhão com Suporte.jpeg", "Matraca P Miolinho Com Suporte.jpeg", "Matraca Bumba Boi Bandeira do Maranhão  com Suporte.jpeg"]);
acrescentar(16698777979, ["Matraca P Boizinho Estrelado.jpeg", "Matraca P Bumba Boi do Maranhão.jpeg", "Matraca P Bumba Boi do Maranhão2.jpeg", "Matraca P Cazumba Frontal.jpeg"]);
acrescentar(16698778218, ["Matraca Kambada Play.jpeg"]);
GALERIA[16701539190] = [K, ["Kit Anotação - Bumba Meu Boi Contracapa.jpeg", "Kit Anotação - Interior Geral - vertical.jpg"]]; // 18/10: só fotos em pé (pedido do Alexandre)
GALERIA[16701539241] = [K, ["Kit Anotação - Cazumba Contracapa.jpeg", "Kit Anotação - Interior Geral - vertical.jpg"]];
GALERIA[16701538916] = [K, ["Kit Anotação - Guarás Contracapa.jpeg", "Kit Anotação - Interior Geral - vertical.jpg"]];
GALERIA[16701539267] = [K, ["Kit Anotação - Lendas Contracapa.jpeg", "Kit Anotação - Interior Geral - vertical.jpg"]];
acrescentar(16689788251, ["Livro Vermelho (Historinha do Boi)  Verso.jpeg"]);
GALERIA[16701503283] = [K, ["placa-redonda-kambada-2026-10-18-4.jpeg", "placa-redonda-kambada-2026-10-18-2.jpeg", "placa-redonda-kambada-2026-10-18-3.jpeg", "Placa de Madeeira Bumba Boi Vazado.jpeg"]]; // boi azul, boi preto, Cazumbá, vazado — uma por item

// ── Correções da Wilzanira (20/10/2026, autorizadas pelo Alexandre) ──
// Matraca Grande com Suporte: a capa era uma matraca SEM suporte (bandeira, com saquinho) —
// sai do produto; a capa passa a ser a grande com suporte de boi (Will, fundo claro, em pé).
FOTOS[16698775382] = [T1, `${W}matraca-grande-com-suporte-boi.jpg`, "Matraca Grande com Suporte — capa com suporte (Wilzanira, 20/10)"];
GALERIA[16698775382][1] = GALERIA[16698775382][1].filter((a) => a !== `${W}matraca-grande-com-suporte-boi.jpg`);
// Matraca Pequena sem Suporte é a pintada à mão: as 5 fotos DTF (estampa impressa, mais barata)
// saem daqui e vão para o produto próprio da Matraca Mini DTF, quando ele existir no Bling.
GALERIA[16698777979][1] = GALERIA[16698777979][1].filter((a) => !/dtf/i.test(a));
/** Fotos da Matraca Mini DTF, à espera do ID (o cadastro espera o preço). Ao criar: FOTOS[id] e GALERIA[id] com estas. */
export const FOTOS_DTF_PENDENTES = {
  pasta: T1,
  principal: `${W}matraca-mini-cazumba-colorido-dtf.jpg`,
  galeria: [`${W}matraca-mini-miolo-de-boi-colorido-dtf.jpg`, `${W}matraca-mini-boi-preto-dtf.jpg`, `${W}matraca-mini-cazumba-preto-dtf.jpg`, `${W}matraca-mini-miolo-de-boi-preto-dtf.jpg`],
};
// Pareôs Cidade dos Azulejos ("São Luís") e Reggae Roots: a foto da galeria era a MESMA da capa
// (conferido por comparação de imagem). Fica só a capa, como Mosaico e Revoada.
delete GALERIA[16701478379];
delete GALERIA[16701478418];
// Placa de Madeira Grande → "Placa de Madeira Retangular", modelos Coreira e Coreiro. As fotos das
// placas coreira/coreiro estavam no cadastro "Placa de Madeira Reta" (16701503257), INATIVO no Bling.
FOTOS[16701503321] = [PL, `${W}placa-coreira.jpg`, "Placa de Madeira Retangular — Coreira"];
GALERIA[16701503321] = [PL, [`${W}placa-coreiro.jpg`, `${W}detalhe-placa-coreira.jpg`, `${W}placa-retangular-em-pinus-coreiro.jpg`]];
delete FOTOS[16701503257];
delete GALERIA[16701503257];

// ── Fotos pendentes (Alexandre, 20/10/2026 — pasta "Fotos Site - Pendencias", nomeadas pelo produto) ──
const PD = "Kambada_2026-10-20-pendencias";
FOTOS[16701503083] = [PD, "Blocos de Anotacao - R$ 17,00.jpeg", "Bloco Anotação Caderninho Ecológico (R$ 17)"];
GALERIA[16701503083] = [PD, ["WhatsApp Image 2026-10-20 at 22.57.44 (1).jpeg"]];
FOTOS[16689786870] = [PD, "Bloquinho - R$ 9,00 - 1.jpeg", "Bloquinho (R$ 9)"];
GALERIA[16689786870] = [PD, ["Bloquinho - R$ 9,00 - 2.jpeg", "Bloquinho - R$ 9,00 - 3.jpeg"]];
FOTOS[16701502720] = [PD, "Canetas Ecologicas Kambada.jpeg", "Canetas Ecológicas"];
FOTOS[16701502913] = [PD, "Chaveiro Kambadinha - Preto.jpeg", "Chaveiro Kambadinha (preto)"];
GALERIA[16701502913] = [PD, ["Chaveiro Kambadinha - Amarelo.jpeg"]];
FOTOS[16701478191] = [PD, "necessaire_guaras_01.jpg", "Necessaire Guarás"];
// Prévia JPEG tirada do RAW (.ARW) da câmera e girada para ficar em pé.
FOTOS[16698808484] = [PD, "Camisa Bumba meu Boi Infantil - em pe.jpg", "Camisa Bumba Meu Boi Infantil"];
// Camisa Babylook Bumba Boi (rosa, modelo com ecobag) — a única que faltava (Alexandre, 22/10/2026).
FOTOS[16698808826] = ["07_Camisas_Estampadas/Camisa Babylook Bumba Boi", "camisa-babylook-bumba-boi_01.png", "Camisa Babylook Bumba Boi (rosa, modelo)"];

// ── Matracas migradas (21/10/2026) e Chaveiro Kambadinha por cor: foto por VARIAÇÃO, para o Bling ──
//    Variação com qualquer suporte → foto "com suporte" da estampa; sem suporte → "sem suporte" ou a única.
//    Caboclo de Pena (Grande): sem foto no acervo — fica com a capa do produto.
const ABS_EST = "C:/dev/kambada-site/public/fotos/produtos/estampas";
const ABS_PD = "C:/Users/alegf/OneDrive/Documentos/Claude/Fred - Kambada/comercial/portfolio/Imagens para Portfólio/Kambada_2026-10-20-pendencias";
FOTOS[16722498826] = [ABS_EST, "matraca-kambada-grande--bandeira-do-maranhao.jpg", "matraca-kambada-grande Bandeira do Maranhão · Com suporte"];
FOTOS[16722498827] = [ABS_EST, "matraca-kambada-grande--bandeira-do-maranhao.jpg", "matraca-kambada-grande Bandeira do Maranhão · Leque Bordado"];
FOTOS[16722498825] = [ABS_EST, "matraca-kambada-grande--bandeira-do-maranhao.jpg", "matraca-kambada-grande Bandeira do Maranhão · Sem suporte"];
FOTOS[16722498829] = [ABS_EST, "matraca-kambada-grande--bandeira-do-maranhao.jpg", "matraca-kambada-grande Bandeira do Maranhão · Topo Boi Preto"];
FOTOS[16722498848] = [ABS_EST, "matraca-kambada-grande--boi-blackout--com-suporte.jpg", "matraca-kambada-grande Boi Blackout · Com suporte"];
FOTOS[16722498849] = [ABS_EST, "matraca-kambada-grande--boi-blackout--com-suporte.jpg", "matraca-kambada-grande Boi Blackout · Leque Bordado"];
FOTOS[16722498847] = [ABS_EST, "matraca-kambada-grande--boi-blackout--sem-suporte.jpg", "matraca-kambada-grande Boi Blackout · Sem suporte"];
FOTOS[16722498851] = [ABS_EST, "matraca-kambada-grande--boi-blackout--com-suporte.jpg", "matraca-kambada-grande Boi Blackout · Topo Boi Preto"];
FOTOS[16722498855] = [ABS_EST, "matraca-kambada-grande--boi-estrelado--com-suporte.jpg", "matraca-kambada-grande Boi Estrelado · Com suporte"];
FOTOS[16722498856] = [ABS_EST, "matraca-kambada-grande--boi-estrelado--com-suporte.jpg", "matraca-kambada-grande Boi Estrelado · Leque Bordado"];
FOTOS[16722498854] = [ABS_EST, "matraca-kambada-grande--boi-estrelado--sem-suporte.jpg", "matraca-kambada-grande Boi Estrelado · Sem suporte"];
FOTOS[16722498857] = [ABS_EST, "matraca-kambada-grande--boi-estrelado--com-suporte.jpg", "matraca-kambada-grande Boi Estrelado · Topo Boi Preto"];
FOTOS[16722498859] = [ABS_EST, "matraca-kambada-grande--boi-miolo--com-suporte.jpg", "matraca-kambada-grande Boi Miolo · Com suporte"];
FOTOS[16722498860] = [ABS_EST, "matraca-kambada-grande--boi-miolo--com-suporte.jpg", "matraca-kambada-grande Boi Miolo · Leque Bordado"];
FOTOS[16722498858] = [ABS_EST, "matraca-kambada-grande--boi-miolo--sem-suporte.jpg", "matraca-kambada-grande Boi Miolo · Sem suporte"];
FOTOS[16722498862] = [ABS_EST, "matraca-kambada-grande--boi-miolo--com-suporte.jpg", "matraca-kambada-grande Boi Miolo · Topo Boi Preto"];
FOTOS[16722498865] = [ABS_EST, "matraca-kambada-grande--boi-multicores--com-suporte.jpg", "matraca-kambada-grande Boi Multicores · Com suporte"];
FOTOS[16722498866] = [ABS_EST, "matraca-kambada-grande--boi-multicores--com-suporte.jpg", "matraca-kambada-grande Boi Multicores · Leque Bordado"];
FOTOS[16722498863] = [ABS_EST, "matraca-kambada-grande--boi-multicores--sem-suporte.jpg", "matraca-kambada-grande Boi Multicores · Sem suporte"];
FOTOS[16722498867] = [ABS_EST, "matraca-kambada-grande--boi-multicores--com-suporte.jpg", "matraca-kambada-grande Boi Multicores · Topo Boi Preto"];
FOTOS[16722498874] = [ABS_EST, "matraca-kambada-grande--boi-de-estrelas--com-suporte.jpg", "matraca-kambada-grande Boi de Estrelas · Com suporte"];
FOTOS[16722498875] = [ABS_EST, "matraca-kambada-grande--boi-de-estrelas--com-suporte.jpg", "matraca-kambada-grande Boi de Estrelas · Leque Bordado"];
FOTOS[16722498872] = [ABS_EST, "matraca-kambada-grande--boi-de-estrelas--sem-suporte.jpg", "matraca-kambada-grande Boi de Estrelas · Sem suporte"];
FOTOS[16722498877] = [ABS_EST, "matraca-kambada-grande--boi-de-estrelas--com-suporte.jpg", "matraca-kambada-grande Boi de Estrelas · Topo Boi Preto"];
FOTOS[16722498879] = [ABS_EST, "matraca-kambada-grande--boi-do-maranhao.jpg", "matraca-kambada-grande Boi do Maranhão · Com suporte"];
FOTOS[16722498880] = [ABS_EST, "matraca-kambada-grande--boi-do-maranhao.jpg", "matraca-kambada-grande Boi do Maranhão · Leque Bordado"];
FOTOS[16722498878] = [ABS_EST, "matraca-kambada-grande--boi-do-maranhao.jpg", "matraca-kambada-grande Boi do Maranhão · Sem suporte"];
FOTOS[16722498881] = [ABS_EST, "matraca-kambada-grande--boi-do-maranhao.jpg", "matraca-kambada-grande Boi do Maranhão · Topo Boi Preto"];
FOTOS[16722498896] = [ABS_EST, "matraca-kambada-grande--cazumba-frontal.jpg", "matraca-kambada-grande Cazumbá Frontal · Com suporte"];
FOTOS[16722498897] = [ABS_EST, "matraca-kambada-grande--cazumba-frontal.jpg", "matraca-kambada-grande Cazumbá Frontal · Leque Bordado"];
FOTOS[16722498894] = [ABS_EST, "matraca-kambada-grande--cazumba-frontal.jpg", "matraca-kambada-grande Cazumbá Frontal · Sem suporte"];
FOTOS[16722498900] = [ABS_EST, "matraca-kambada-grande--cazumba-frontal.jpg", "matraca-kambada-grande Cazumbá Frontal · Topo Boi Preto"];
FOTOS[16722498883] = [ABS_EST, "matraca-kambada-grande--chapeu-de-fitas-maranhao--com-suporte.jpg", "matraca-kambada-grande Chapéu de Fitas Maranhão · Com suporte"];
FOTOS[16722498885] = [ABS_EST, "matraca-kambada-grande--chapeu-de-fitas-maranhao--com-suporte.jpg", "matraca-kambada-grande Chapéu de Fitas Maranhão · Leque Bordado"];
FOTOS[16722498882] = [ABS_EST, "matraca-kambada-grande--chapeu-de-fitas-maranhao--sem-suporte.jpg", "matraca-kambada-grande Chapéu de Fitas Maranhão · Sem suporte"];
FOTOS[16722498886] = [ABS_EST, "matraca-kambada-grande--chapeu-de-fitas-maranhao--com-suporte.jpg", "matraca-kambada-grande Chapéu de Fitas Maranhão · Topo Boi Preto"];
FOTOS[16722498888] = [ABS_EST, "matraca-kambada-grande--fitas-coloridas--com-suporte.jpg", "matraca-kambada-grande Fitas Coloridas · Com suporte"];
FOTOS[16722498889] = [ABS_EST, "matraca-kambada-grande--fitas-coloridas--com-suporte.jpg", "matraca-kambada-grande Fitas Coloridas · Leque Bordado"];
FOTOS[16722498887] = [ABS_EST, "matraca-kambada-grande--fitas-coloridas--sem-suporte.jpg", "matraca-kambada-grande Fitas Coloridas · Sem suporte"];
FOTOS[16722498891] = [ABS_EST, "matraca-kambada-grande--fitas-coloridas--com-suporte.jpg", "matraca-kambada-grande Fitas Coloridas · Topo Boi Preto"];
FOTOS[16722498832] = [ABS_EST, "matraca-kambada-grande--mosaico-colorido--com-suporte.jpg", "matraca-kambada-grande Mosaico Colorido · Com suporte"];
FOTOS[16722498834] = [ABS_EST, "matraca-kambada-grande--mosaico-colorido--com-suporte.jpg", "matraca-kambada-grande Mosaico Colorido · Leque Bordado"];
FOTOS[16722498831] = [ABS_EST, "matraca-kambada-grande--mosaico-colorido--sem-suporte.jpg", "matraca-kambada-grande Mosaico Colorido · Sem suporte"];
FOTOS[16722498835] = [ABS_EST, "matraca-kambada-grande--mosaico-colorido--com-suporte.jpg", "matraca-kambada-grande Mosaico Colorido · Topo Boi Preto"];
FOTOS[16722498869] = [ABS_EST, "matraca-kambada-grande--reggae-roots--com-suporte.jpg", "matraca-kambada-grande Reggae Roots · Com suporte"];
FOTOS[16722498870] = [ABS_EST, "matraca-kambada-grande--reggae-roots--com-suporte.jpg", "matraca-kambada-grande Reggae Roots · Leque Bordado"];
FOTOS[16722498868] = [ABS_EST, "matraca-kambada-grande--reggae-roots--sem-suporte.jpg", "matraca-kambada-grande Reggae Roots · Sem suporte"];
FOTOS[16722498871] = [ABS_EST, "matraca-kambada-grande--reggae-roots--com-suporte.jpg", "matraca-kambada-grande Reggae Roots · Topo Boi Preto"];
FOTOS[16722498838] = [ABS_EST, "matraca-kambada-grande--serpente-e-rei-da-ilha.jpg", "matraca-kambada-grande Serpente e Rei da Ilha · Com suporte"];
FOTOS[16722498839] = [ABS_EST, "matraca-kambada-grande--serpente-e-rei-da-ilha.jpg", "matraca-kambada-grande Serpente e Rei da Ilha · Leque Bordado"];
FOTOS[16722498837] = [ABS_EST, "matraca-kambada-grande--serpente-e-rei-da-ilha.jpg", "matraca-kambada-grande Serpente e Rei da Ilha · Sem suporte"];
FOTOS[16722498840] = [ABS_EST, "matraca-kambada-grande--serpente-e-rei-da-ilha.jpg", "matraca-kambada-grande Serpente e Rei da Ilha · Topo Boi Preto"];
FOTOS[16722498712] = [ABS_EST, "matraca-kambada-mini-dtf--boi-preto.jpg", "matraca-kambada-mini-dtf Boi Preto"];
FOTOS[16722498714] = [ABS_EST, "matraca-kambada-mini-dtf--cazumba-colorido.jpg", "matraca-kambada-mini-dtf Cazumbá Colorido"];
FOTOS[16722498715] = [ABS_EST, "matraca-kambada-mini-dtf--cazumba-preto.jpg", "matraca-kambada-mini-dtf Cazumbá Preto"];
FOTOS[16722498716] = [ABS_EST, "matraca-kambada-mini-dtf--miolo-de-boi-colorido.jpg", "matraca-kambada-mini-dtf Miolo de Boi Colorido"];
FOTOS[16722498718] = [ABS_EST, "matraca-kambada-mini-dtf--miolo-de-boi-preto.jpg", "matraca-kambada-mini-dtf Miolo de Boi Preto"];
FOTOS[16722500157] = [ABS_EST, "matraca-kambada-play--boi-de-lado.jpg", "Play Boi de Lado"];
// ── Matraca Kambada Play: são DUAS figuras (Alexandre, 24/10/2026) ──
// Boi de Lado (perfil, cabeça virada) já tinha foto; o Boi de Frente (cara de frente, listras) não tinha
// nenhuma, e a vitrine mostrava sempre o perfil. Frente vira a principal (é a 1ª opção); as de perfil vão para a galeria.
const PLAYF = "01_Matracas/Matracas Kambada Play";
FOTOS[16698780234] = [PLAYF, "matracas-kambada-play_110_WhatsApp_Image_2026-09-02_at_21.19.39_(2).jpg", "Play Boi de Frente"];
FOTOS[16698778218] = [PLAYF, "matracas-kambada-play_110_WhatsApp_Image_2026-09-02_at_21.19.39_(2).jpg", "Matraca Kambada Play — capa = Boi de Frente"];
GALERIA[16698778218] = [PLAYF, ["matracas-kambada-play_104_IMG_2041.jpg", "matracas-kambada-play_107_IMG_2044.jpg", "matraca_kambada-play_com-chapeu-bordado_01.jpg", "will-2026-10-14_matraca-kambada-play-boi-de-lado.jpg", "will-2026-10-14_matraca-kambada-play-boi-de-lado-2.jpg", "matraca_kambada-play_chapeu-bordado-detalhe_01.jpg"]];
FOTOS[16722497302] = [ABS_PD, "Chaveiro Kambadinha - Amarelo.jpeg", "Chaveiro Kambadinha Amarelo"];
FOTOS[16722497303] = [ABS_PD, "Chaveiro Kambadinha - Preto.jpeg", "Chaveiro Kambadinha Preto"];
FOTOS[16722498785] = [ABS_EST, "matraca-kambada-mini--bandeira-do-maranhao.jpg", "matraca-kambada-mini Bandeira do Maranhão · Com suporte"];
FOTOS[16722498784] = [ABS_EST, "matraca-kambada-mini--bandeira-do-maranhao.jpg", "matraca-kambada-mini Bandeira do Maranhão · Sem suporte"];
FOTOS[16722498772] = [ABS_EST, "matraca-kambada-mini--boi-do-maranhao.jpg", "matraca-kambada-mini Boi do Maranhão · Com suporte"];
FOTOS[16722498771] = [ABS_EST, "matraca-kambada-mini--boi-do-maranhao.jpg", "matraca-kambada-mini Boi do Maranhão · Sem suporte"];
FOTOS[16722498770] = [ABS_EST, "matraca-kambada-mini--boizinho-estrelado.jpg", "matraca-kambada-mini Boizinho Estrelado · Com suporte"];
FOTOS[16722498768] = [ABS_EST, "matraca-kambada-mini--boizinho-estrelado.jpg", "matraca-kambada-mini Boizinho Estrelado · Sem suporte"];
FOTOS[16722498762] = [ABS_EST, "matraca-kambada-mini--boizinho-miolo.jpg", "matraca-kambada-mini Boizinho Miolo · Com suporte"];
FOTOS[16722498759] = [ABS_EST, "matraca-kambada-mini--boizinho-miolo.jpg", "matraca-kambada-mini Boizinho Miolo · Sem suporte"];
FOTOS[16722498767] = [ABS_EST, "matraca-kambada-mini--boizinho-perfil--com-suporte.jpg", "matraca-kambada-mini Boizinho Perfil · Com suporte"];
FOTOS[16722498765] = [ABS_EST, "matraca-kambada-mini--boizinho-perfil--sem-suporte.jpg", "matraca-kambada-mini Boizinho Perfil · Sem suporte"];
FOTOS[16722498764] = [ABS_EST, "matraca-kambada-mini--cazumbazinho.jpg", "matraca-kambada-mini Cazumbazinho · Com suporte"];
FOTOS[16722498763] = [ABS_EST, "matraca-kambada-mini--cazumbazinho.jpg", "matraca-kambada-mini Cazumbazinho · Sem suporte"];
FOTOS[16722498776] = [ABS_EST, "matraca-kambada-mini--cazumba-frontal.jpg", "matraca-kambada-mini Cazumbá Frontal · Com suporte"];
FOTOS[16722498773] = [ABS_EST, "matraca-kambada-mini--cazumba-frontal.jpg", "matraca-kambada-mini Cazumbá Frontal · Sem suporte"];
FOTOS[16722498779] = [ABS_EST, "matraca-kambada-mini--chapeu-de-fita-bandeira-do-maranhao.jpg", "matraca-kambada-mini Chapéu de Fita Bandeira do Maranhão · Com suporte"];
FOTOS[16722498777] = [ABS_EST, "matraca-kambada-mini--chapeu-de-fita-bandeira-do-maranhao.jpg", "matraca-kambada-mini Chapéu de Fita Bandeira do Maranhão · Sem suporte"];
FOTOS[16722498783] = [ABS_EST, "matraca-kambada-mini--miolinho.jpg", "matraca-kambada-mini Miolinho · Com suporte"];
FOTOS[16722498780] = [ABS_EST, "matraca-kambada-mini--miolinho.jpg", "matraca-kambada-mini Miolinho · Sem suporte"];
FOTOS[16722498823] = [ABS_EST, "matraca-kambada-grande--boi-estrelado--com-suporte.jpg", "pai novo de matraca"];
GALERIA[16722498823] = [ABS_EST, ["matraca-kambada-grande--boi-blackout--com-suporte.jpg","matraca-kambada-grande--bandeira-do-maranhao.jpg","matraca-kambada-grande--boi-blackout--sem-suporte.jpg","matraca-kambada-grande--boi-estrelado--sem-suporte.jpg","matraca-kambada-grande--boi-miolo--com-suporte.jpg","matraca-kambada-grande--boi-miolo--sem-suporte.jpg","matraca-kambada-grande--boi-multicores--com-suporte.jpg","matraca-kambada-grande--boi-multicores--sem-suporte.jpg","matraca-kambada-grande--boi-de-estrelas--com-suporte.jpg","matraca-kambada-grande--boi-de-estrelas--sem-suporte.jpg","matraca-kambada-grande--boi-do-maranhao.jpg","matraca-kambada-grande--cazumba-frontal.jpg","matraca-kambada-grande--chapeu-de-fitas-maranhao--com-suporte.jpg","matraca-kambada-grande--chapeu-de-fitas-maranhao--sem-suporte.jpg","matraca-kambada-grande--fitas-coloridas--com-suporte.jpg","matraca-kambada-grande--fitas-coloridas--sem-suporte.jpg","matraca-kambada-grande--mosaico-colorido--com-suporte.jpg","matraca-kambada-grande--mosaico-colorido--sem-suporte.jpg","matraca-kambada-grande--reggae-roots--com-suporte.jpg","matraca-kambada-grande--reggae-roots--sem-suporte.jpg","matraca-kambada-grande--serpente-e-rei-da-ilha.jpg"]];
FOTOS[16722498711] = [ABS_EST, "matraca-kambada-mini-dtf--boi-preto.jpg", "pai novo de matraca"];
GALERIA[16722498711] = [ABS_EST, ["matraca-kambada-mini-dtf--cazumba-colorido.jpg","matraca-kambada-mini-dtf--cazumba-preto.jpg","matraca-kambada-mini-dtf--miolo-de-boi-colorido.jpg","matraca-kambada-mini-dtf--miolo-de-boi-preto.jpg"]];
FOTOS[16722498758] = [ABS_EST, "matraca-kambada-mini--boizinho-perfil--com-suporte.jpg", "pai novo de matraca"];
GALERIA[16722498758] = [ABS_EST, ["matraca-kambada-mini--bandeira-do-maranhao.jpg","matraca-kambada-mini--boi-do-maranhao.jpg","matraca-kambada-mini--boizinho-estrelado.jpg","matraca-kambada-mini--boizinho-miolo.jpg","matraca-kambada-mini--boizinho-perfil--sem-suporte.jpg","matraca-kambada-mini--cazumbazinho.jpg","matraca-kambada-mini--cazumba-frontal.jpg","matraca-kambada-mini--chapeu-de-fita-bandeira-do-maranhao.jpg","matraca-kambada-mini--miolinho.jpg"]];

// ── Fotos do Alexandre, 21/10/2026 (pasta "Nova pasta" em Downloads → acervo Kambada_2026-10-21-fotos) ──
//    Bloquinhos: o 16689786870 (era "Bloquinho", R$ 9) vira o caderninho KRAFT de 4 estampas — as fotos dele já
//    eram do kraft; o 16701503083 vira o de capa impressa (R$ 10) e fica com as fotos que já tinha.
//    A galeria dele repetia a foto principal (mesma imagem) — saiu.
const F21 = "Kambada_2026-10-21-fotos";
delete GALERIA[16701503083];
FOTOS[16689786870] = [F21, "Bloquinho de Kraft - Brincantes(17,00).jpeg", "Caderninho kraft — Bumba meu Boi (brincantes)"];
GALERIA[16689786870] = [F21, [
  "Bloquinho de Kraft - Kazumbá(17,00).jpeg",
  "Bloquinho de Kraft - Caboclo Pena(17,00).jpeg",
  "Bloquinho de Kraft - Lendas (17,00).jpeg",
  "Bloquinho de Kraft Verso - Brincantes (17,00).jpeg",
  "Bloquinho de Kraft - Kazumbá Verso(17,00).jpeg",
  "Bloquinho de Kraft Verso - Caboclo Pena(17,00).jpeg",
  "Bloquinho de Kraft Verso - Lendas (17,00).jpeg",
  "Bloquinhos de Kraft - Interior Geral (17,00).jpeg",
]];
// Carcará: as duas fotos são quase iguais — vai uma só (regra de 18/10: sem foto repetida).
FOTOS[16701485938] = [F21, "Ecobag Carcará Grande.jpeg", "Ecobag Carcará Grande"];
FOTOS[16701485939] = [F21, "Ecobag Carcará Grande.jpeg", "Ecobag Carcará · Grande"];
FOTOS[16701490748] = [F21, "Ecobag Guarás Grande.jpeg", "Ecobag Revoada dos Guarás Grande"];
GALERIA[16701490748] = [F21, ["Ecobag Guarás Grande 2.jpeg", "Ecobag Guarás  Mini.jpeg"]];
FOTOS[16701490753] = [F21, "Ecobag Guarás Grande.jpeg", "Ecobag Revoada dos Guarás · Grande"];
FOTOS[16701490750] = [F21, "Ecobag Guarás  Mini.jpeg", "Ecobag Revoada dos Guarás · Mini"];
FOTOS[16701490705] = [F21, "Ecobag Tradições 3 Grande.jpeg", "Ecobag Tradição Grande"];
FOTOS[16701490706] = [F21, "Ecobag Tradições 3 Grande.jpeg", "Ecobag Tradição · Grande"];
// Serpente: a foto antiga era da Carranca Encantada ("São Luís Ilha Encantada"), que não tem estoque.
FOTOS[16701490850] = [F21, "Ecobag Serpente em Tons de Azul - Grande.jpeg", "Ecobag Serpente Tons de Azul (no lugar da foto da Carranca)"];
FOTOS[16701490854] = [F21, "Ecobag Serpente em Tons de Azul - Grande.jpeg", "Ecobag Serpente Tons de Azul · Grande"];
FOTOS[16722270860] = [F21, "Suporte para Coreira.jpeg", "Puxador - Suporte para Coreira"];
GALERIA[16722270860] = [F21, ["Suporte Para Coreira em uso.jpeg"]];
// Variações do caderninho kraft, criadas em 21/10 pela rota ajustes-2026-10-21 (foto da capa de cada estampa, para o Bling).
FOTOS[16722783299] = [F21, "Bloquinho de Kraft - Brincantes(17,00).jpeg", "Caderninho kraft · Bumba meu Boi"];
FOTOS[16722783302] = [F21, "Bloquinho de Kraft - Kazumbá(17,00).jpeg", "Caderninho kraft · Cazumbá"];
FOTOS[16722783305] = [F21, "Bloquinho de Kraft - Caboclo Pena(17,00).jpeg", "Caderninho kraft · Caboclo de Pena"];
FOTOS[16722783308] = [F21, "Bloquinho de Kraft - Lendas (17,00).jpeg", "Caderninho kraft · Ilha do Amor"];
// Ecobag Carranca Encantada (cadastro criado em 21/10, só Grande, sem estoque): a foto que estava na Serpente.
FOTOS[16722800147] = [T3, `${W}ecobag-grande-ilha-encantada.jpg`, "Ecobag Carranca Encantada (Will)"];

/** Lado maior em pixels. O Mercado Livre recomenda 1200; o mínimo dele é 500. */
const LADO = 1200;

const versao = (caminho) => createHash("md5").update(readFileSync(caminho)).digest("hex").slice(0, 8);

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
    // v = impressão do arquivo: entra no endereço da foto (?v=) e muda quando a foto muda — sem isso, o
    // navegador e o otimizador de imagens seguem mostrando a foto antiga por até um ano (21/10/2026).
    medidas[id] = { largura: info.width, altura: info.height, v: versao(join(DESTINO, `${id}.jpg`)) };
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
      galeria[id].push({ n: n + 1, largura: info.width, altura: info.height, v: versao(join(DESTINO, "galeria", `${id}-${n + 1}.jpg`)) });
    }
    console.log(`galeria ${id}: ${arquivos.length} fotos`);
  }

  // O site precisa das medidas para reservar o espaço da foto antes de ela
  // carregar — sem isso a página "pula" quando a imagem chega.
  const ts = `/**
 * Fotos de produto disponíveis no site, por ID do Bling, com as medidas.
 * GERADO por scripts/preparar-fotos-produtos.mjs — não edite à mão.
 */
export const FOTOS_PRODUTOS: Record<number, { largura: number; altura: number; v?: string }> = ${JSON.stringify(medidas, null, 2)};

/** Fotos extras (galeria) por ID: /fotos/produtos/galeria/<id>-<n>.jpg */
export const GALERIA_PRODUTOS: Record<number, { n: number; largura: number; altura: number; v?: string }[]> = ${JSON.stringify(galeria, null, 2)};
`;
  writeFileSync("C:/dev/kambada-site/src/lib/fotosProdutos.ts", ts);
  console.log(`\n${Object.keys(medidas).length} fotos geradas.`);
}
