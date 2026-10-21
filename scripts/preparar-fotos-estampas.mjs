import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import sharp from "sharp";

/**
 * Fotos por ESTAMPA das matracas (migração de 21/10/2026).
 *
 * Por que separado de preparar-fotos-produtos.mjs: lá a foto é pelo ID do
 * Bling, e as variações novas (Mini/Grande × Estampa × Suporte) só ganham ID
 * quando forem criadas. Aqui a chave é o NOME — `<pai>/<estampa>[/<suporte>]`,
 * em slug — e o site acha a foto pelo atributo da variação, sem depender do ID.
 * Quando o ID existir, a foto por ID (se houver) passa na frente.
 *
 * Gera public/fotos/produtos/estampas/<chave com "--">.jpg e
 * src/lib/fotosEstampas.ts (medidas). Rodar: node scripts/preparar-fotos-estampas.mjs
 *
 * Inclui as estampas "a-confirmar" de propósito: quando o Alexandre confirmar,
 * a foto já está publicada.
 */

const ACERVO = "C:/Users/alegf/OneDrive/Documentos/Claude/Fred - Kambada/comercial/portfolio/Imagens para Portfólio";
const DESTINO = "C:/dev/kambada-site/public/fotos/produtos/estampas";
const W = "will-2026-10-14_";

const slug = (t) =>
  t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

/** [pai, estampa, suporte | null (vale para os dois), arquivo no acervo] */
export const FOTOS_ESTAMPAS = [
  // ── Mini (pintada à mão) ──
  ["Matraca Kambada Mini", "Boizinho Miolo", null, "Matraca Mini - Boizinho Miolo.jpg"],
  ["Matraca Kambada Mini", "Cazumbazinho", null, "Matraca Mini Kazumbazinho.jpg"],
  ["Matraca Kambada Mini", "Boizinho Perfil", "Sem suporte", "Matraca P Boizinho Perfil.jpeg"],
  ["Matraca Kambada Mini", "Boizinho Perfil", "Com suporte", "Matraca P Boizinho Perfil 1 Com Suporte.jpeg"],
  ["Matraca Kambada Mini", "Boizinho Estrelado", null, "Matraca P Boizinho Estrelado.jpeg"],
  // Estampas distintas (Alexandre, 21/10: parecidas não são iguais). As duas fotos mostram peças
  // PERSONALIZADAS (Priscilla; R. Rocha) — ficam como ilustração; a estampa é vendida sem nome.
  ["Matraca Kambada Mini", "Boi do Maranhão", null, "Matraca P Bumba Boi do Maranhão.jpeg"],
  // "Bandeira do Maranhão": mesmo nome na Mini e na Grande (existe em P e G — Alexandre, 21/10).
  ["Matraca Kambada Mini", "Bandeira do Maranhão", null, "Matraca Bumba Boi Bandeira do Maranhão  com Suporte.jpeg"],
  ["Matraca Kambada Mini", "Cazumbá Frontal", null, "Matraca P Cazumba Frontal.jpeg"],
  ["Matraca Kambada Mini", "Chapéu de Fita Bandeira do Maranhão", null, "Matraca P Chapeu de Fita Bandeira do Maranhão com Suporte.jpeg"],
  ["Matraca Kambada Mini", "Miolinho", null, "Matraca P Miolinho Com Suporte.jpeg"],
  // ── Grande ──
  ["Matraca Kambada Grande", "Bandeira do Maranhão", null, "matraca_bandeira-maranhao_com-saquinho_03.jpg"],
  ["Matraca Kambada Grande", "Mosaico Colorido", "Com suporte", "matraca_mosaico-colorido_com-suporte_01.jpg"],
  ["Matraca Kambada Grande", "Mosaico Colorido", "Sem suporte", "Matraca G Bumba Boi  Mosaico.jpeg"],
  ["Matraca Kambada Grande", "Serpente e Rei da Ilha", null, "matraca_serpente-rei-da-ilha_com-suporte_02.jpg"],
  // Topo Boi Preto e Leque Bordado são SUPORTES (Alexandre, 21/10), não estampas: sem foto por estampa.
  // Boi Blackout (boi todo preto, detalhes em branco) — identificado no acervo pelo Fred em 21/10.
  // Com suporte: peça PERSONALIZADA ("Zé Maria", suporte recortado em folhas) — ilustração; vendida sem nome.
  ["Matraca Kambada Grande", "Boi Blackout", "Sem suporte", "matracas-grandes_151_WhatsApp_Image_2026-10-13_at_21.55.34_(4).jpg"],
  ["Matraca Kambada Grande", "Boi Blackout", "Com suporte", "09-encomendas-b2b_106_WhatsApp_Image_2026-09-02_at_21.19.40_(1).jpg"],
  // Caboclo de Pena: nenhuma foto no acervo — fica com a foto do produto (não inventar).
  ["Matraca Kambada Grande", "Boi Estrelado", "Sem suporte", "Matraca G Bumba Boi  Estrelado.jpeg"],
  ["Matraca Kambada Grande", "Boi Estrelado", "Com suporte", "Matraca G Bumba Boi  Estrelado com suporte.jpeg"],
  ["Matraca Kambada Grande", "Boi Miolo", "Sem suporte", "Matraca G Bumba Boi Miolo.jpeg"],
  ["Matraca Kambada Grande", "Boi Miolo", "Com suporte", "Matraca G Bumba Boi Miolo Com Suporte.jpeg"],
  ["Matraca Kambada Grande", "Boi Multicores", "Sem suporte", "Matraca G Bumba Boi Multicores.jpeg"],
  ["Matraca Kambada Grande", "Boi Multicores", "Com suporte", "Matraca G Bumba Boi Multicores com Suporte.jpeg"],
  ["Matraca Kambada Grande", "Reggae Roots", "Sem suporte", "Matraca G Bumba Boi Reggae Roots.jpeg"],
  ["Matraca Kambada Grande", "Reggae Roots", "Com suporte", "Matraca G Bumba Boi Reggae Roots c suporte.jpeg"],
  ["Matraca Kambada Grande", "Boi de Estrelas", "Sem suporte", "Matraca G Bumba Boi de Estrelas.jpeg"],
  ["Matraca Kambada Grande", "Boi de Estrelas", "Com suporte", "Matraca G Bumba Boi de Estrelas com suporte.jpeg"],
  ["Matraca Kambada Grande", "Boi do Maranhão", null, "Matraca G Bumba Boi do Maranhão com suporte.jpeg"],
  ["Matraca Kambada Grande", "Chapéu de Fitas Maranhão", "Sem suporte", "Matraca G Chapeu de Fita Maranhão.jpeg"],
  ["Matraca Kambada Grande", "Chapéu de Fitas Maranhão", "Com suporte", "Matraca G Chapeu de Fitas 1 Com Suporte.jpeg"],
  ["Matraca Kambada Grande", "Fitas Coloridas", "Sem suporte", "Matraca G Fitas Coloridas.jpeg"],
  ["Matraca Kambada Grande", "Fitas Coloridas", "Com suporte", "Matraca G Fitas Coloridas Com Suporte.jpeg"],
  ["Matraca Kambada Grande", "Cazumbá Frontal", null, "Matraca Grande Cazumba Frontal.jpeg"],
  // ── Play: duas figuras (Alexandre, 21/10). Boi de Frente usa a foto do produto (chapéu bordado). ──
  ["Matraca Kambada Play", "Boi de Lado", null, `${W}matraca-kambada-play-boi-de-lado.jpg`],
  // ── Mini DTF (fotos da Wilsonira, 14/10 — as de FOTOS_DTF_PENDENTES) ──
  ["Matraca Kambada Mini DTF", "Boi Preto", null, `${W}matraca-mini-boi-preto-dtf.jpg`],
  ["Matraca Kambada Mini DTF", "Cazumbá Colorido", null, `${W}matraca-mini-cazumba-colorido-dtf.jpg`],
  ["Matraca Kambada Mini DTF", "Cazumbá Preto", null, `${W}matraca-mini-cazumba-preto-dtf.jpg`],
  ["Matraca Kambada Mini DTF", "Miolo de Boi Colorido", null, `${W}matraca-mini-miolo-de-boi-colorido-dtf.jpg`],
  ["Matraca Kambada Mini DTF", "Miolo de Boi Preto", null, `${W}matraca-mini-miolo-de-boi-preto-dtf.jpg`],
];

export const chaveDaFoto = (pai, estampa, suporte) => [slug(pai), slug(estampa), ...(suporte ? [slug(suporte)] : [])].join("/");

function localizar(arquivo) {
  const procurar = (dir) => {
    for (const nome of readdirSync(dir)) {
      const caminho = join(dir, nome);
      if (statSync(caminho).isDirectory()) {
        const achado = procurar(caminho);
        if (achado) return achado;
      } else if (nome === arquivo) return caminho;
    }
    return null;
  };
  return procurar(join(ACERVO, "01_Matracas")) ?? procurar(ACERVO);
}

const LADO = 1200;

const isEntrypoint = process.argv[1] && process.argv[1].endsWith("preparar-fotos-estampas.mjs");
if (isEntrypoint) {
  mkdirSync(DESTINO, { recursive: true });
  const medidas = {};
  const faltando = [];
  for (const [pai, estampa, suporte, arquivo] of FOTOS_ESTAMPAS) {
    const origem = localizar(arquivo);
    if (!origem || !existsSync(origem)) {
      faltando.push(arquivo);
      continue;
    }
    const chave = chaveDaFoto(pai, estampa, suporte);
    const nomeArquivo = `${chave.replaceAll("/", "--")}.jpg`;
    const info = await sharp(origem)
      .rotate()
      .resize(LADO, LADO, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(join(DESTINO, nomeArquivo));
    medidas[chave] = { src: `/fotos/produtos/estampas/${nomeArquivo}`, largura: info.width, altura: info.height };
    console.log(`${nomeArquivo}  ${info.width}×${info.height}  ${(info.size / 1024).toFixed(0)} KB`);
  }
  const ts = `/**
 * Fotos por estampa das matracas (chave "<pai>/<estampa>[/<suporte>]", em slug).
 * GERADO por scripts/preparar-fotos-estampas.mjs — não edite à mão.
 */
export const FOTOS_ESTAMPAS: Record<string, { src: string; largura: number; altura: number }> = ${JSON.stringify(medidas, null, 2)};
`;
  writeFileSync("C:/dev/kambada-site/src/lib/fotosEstampas.ts", ts);
  console.log(`\n${Object.keys(medidas).length} fotos de estampa geradas.`);
  if (faltando.length) {
    console.error(`NÃO ACHADAS no acervo (${faltando.length}):\n  ${faltando.join("\n  ")}`);
    process.exitCode = 1;
  }
}
