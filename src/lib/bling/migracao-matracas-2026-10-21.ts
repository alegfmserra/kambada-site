/**
 * Reestruturação das matracas — aprovada pelo Alexandre em 21/10/2026.
 * Plano completo: site-novo/PLANO_migracao-matracas_2026-10-21.md (pasta Fred - Kambada).
 * Usado pela rota /api/bling/migracao-matracas (GET ensaia, POST aplica, um passo por vez).
 *
 * Antes (5 pais): Grande com Suporte (6 estampas, saldo todo em "Caboclo de Pena"),
 * Grande sem Suporte, Pequena com Suporte, Pequena sem Suporte e Play — os quatro
 * últimos com UMA variação herdada da importação ("Estampa:Caboclo de Pena").
 *
 * Depois:
 *  - Matraca Kambada Mini     — Estampa × Suporte · sem R$ 110 · com R$ 145
 *  - Matraca Kambada Grande   — Estampa × Suporte (Sem · Com · Leque Bordado · Topo
 *    Boi Preto) · sem R$ 145 · com R$ 190 (qualquer tipo de suporte)
 *  - Matraca Kambada Mini DTF — Estampa (estampa impressa, sem suporte) · R$ 85
 *  - Matraca Kambada Play     — o MESMO cadastro de hoje (16698778218), duas figuras:
 *    Modelo:Boi de Frente (a variação herdada, renomeada, saldo 3) e Modelo:Boi de
 *    Lado (nova, saldo 1), R$ 220 (Alexandre, 21/10).
 *  - os 4 pais antigos (Grande/Pequena × com/sem) ficam INATIVOS, nunca excluídos:
 *    os pedidos antigos continuam apontando para eles.
 *
 * Regras que este arquivo obedece:
 *  - estampa com status "a-confirmar" NÃO é criada; vira variação quando alguém
 *    confirmar (trocar para "confirmada" e rodar o passo de novo — ele completa);
 *  - de→para com `para: null` = estampa a confirmar com o cliente no WhatsApp
 *    (Alexandre, 21/10 — a migração não espera ninguém): o saldo fica guardado na
 *    variação antiga (inativa) até a resposta. Nada de chute;
 *  - as funções de montagem e de conferência são puras (testadas em
 *    migracao-matracas-2026-10-21.test.ts); a rota só lê, chama, relê e confere.
 */

/**
 * Mesmo resultado de `paraSlug` (produtos.ts), copiado aqui de propósito: este
 * arquivo é importado pela foto do carrinho (componente de cliente), e
 * produtos.ts puxa o cliente do Bling e o disco — não podem ir para o navegador.
 */
export function paraSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export const ID_CATEGORIA = 13568333;
export const ID_DEPOSITO = 14888952004;

type Obj = Record<string, unknown>;

/**
 * Valores do atributo Suporte. "Com suporte" = suporte reto. Leque Bordado
 * (recorte em folhas) e Topo Boi Preto (boi recortado no alto) são TIPOS de
 * suporte, só da Grande (Alexandre, 21/10/2026) — não estampas.
 */
export const SEM = "Sem suporte";
export const COM = "Com suporte";
export const LEQUE = "Leque Bordado";
export const TOPO = "Topo Boi Preto";
export type Suporte = string;

export type Estampa = {
  nome: string;
  status: "confirmada" | "a-confirmar";
  /** Só quando a estampa não existe em todos os suportes do pai (padrão: todos). */
  suportes?: Suporte[];
  /** De onde veio o nome — vai para o plano e para o ensaio. */
  origem: string;
  motivo?: string;
};

export type ChavePai = "mini" | "grande" | "dtf";

export type PaiNovo = {
  chave: ChavePai;
  nome: string;
  /** Valores do atributo Suporte, na ordem do seletor. */
  suportes: Suporte[];
  /** Preço por suporte. O DTF não tem atributo de suporte: preço único (chave SEM). */
  precos: Record<Suporte, number>;
  /** false = variação só de Estampa (DTF). */
  temSuporte: boolean;
  estampas: Estampa[];
  descricao: string;
};

const CUIDADO = "Cuidados: lugar seco, longe do sol forte; limpe com pano seco. Não molhe.";
const A_MAO = "Pintada à mão, uma a uma: cada peça varia um pouco da foto.";

// Fotos de 18/10/2026 (nomeadas pela Kambada). Alexandre, 21/10: as 16 ENTRAM TODAS,
// sem fundir parecidas; tamanho pelo nome do arquivo ("Mini"/"P" = Mini, "G"/"Grande"
// = Grande). Fotos de peças personalizadas (Priscilla, R. Rocha, Verônica Tavares,
// César Roots) ficam como ilustração — a estampa é vendida sem o nome.
const FOTOS_1810 = "fotos da Kambada de 18/10 (nome do arquivo)";

export const MINI: PaiNovo = {
  chave: "mini",
  nome: "Matraca Kambada Mini",
  suportes: [SEM, COM],
  precos: { [SEM]: 110, [COM]: 145 },
  temSuporte: true,
  estampas: [
    { nome: "Boizinho Miolo", status: "confirmada", origem: "proposta de 13/10 (aprovada) · foto \"Matraca Mini - Boizinho Miolo\"" },
    { nome: "Cazumbazinho", status: "confirmada", origem: "proposta de 13/10 (aprovada) · foto \"Matraca Mini Kazumbazinho\" (grafia Cazumbá)" },
    { nome: "Boizinho Perfil", status: "confirmada", origem: FOTOS_1810 },
    { nome: "Boizinho Estrelado", status: "confirmada", origem: FOTOS_1810 },
    { nome: "Boi do Maranhão", status: "confirmada", origem: FOTOS_1810 + " (\"Matraca P\") — foto mostra peça personalizada (Priscilla); vendida sem nome" },
    { nome: "Cazumbá Frontal", status: "confirmada", origem: FOTOS_1810 + " (\"Matraca P\")" },
    { nome: "Chapéu de Fita Bandeira do Maranhão", status: "confirmada", origem: FOTOS_1810 + " (\"Matraca P\") — só foto com suporte" },
    { nome: "Miolinho", status: "confirmada", origem: FOTOS_1810 + " (\"Matraca P\") — só foto com suporte" },
    {
      // Mesmo nome da Grande (Alexandre, 21/10: existe em P e G). NÃO é a "Boi do Maranhão" (outro desenho).
      nome: "Bandeira do Maranhão",
      status: "confirmada",
      origem: FOTOS_1810 + " (\"Bumba Boi Bandeira do Maranhão\", existe em P e G) — foto mostra peça personalizada (R. Rocha); vendida sem nome",
    },
  ],
  descricao: [
    "Matraca guardada em caixa não faz barulho — e matraca que não faz barulho é enfeite. A mini cabe na mão da criança e no bolso de quem chega no arraial sem conhecer ninguém e sai batendo com a fila inteira. Com suporte, vira o presente que mora na parede o ano todo e desce em junho.",
    "",
    "Material: tatajuba polida (matraca) e pinus (suporte); tintas e verniz à base d'água.",
    "Medidas: matraca 12×10×2 cm · ~200 g. Com suporte: 20×14 cm · ~400 g.",
    "Acompanha: cordão. O suporte de parede só na opção \"Com suporte\".",
    "Escolha a estampa e se quer com ou sem suporte.",
    CUIDADO,
    A_MAO,
  ].join("\n"),
};

export const GRANDE: PaiNovo = {
  chave: "grande",
  nome: "Matraca Kambada Grande",
  // Alexandre 21/10: Leque Bordado e Topo Boi Preto são TIPOS DE SUPORTE, só da Grande.
  suportes: [SEM, COM, LEQUE, TOPO],
  // Suporte reto R$ 190; Leque Bordado e Topo Boi Preto R$ 195, corte diferenciado (Alexandre, 21/10, tarde).
  precos: { [SEM]: 145, [COM]: 190, [LEQUE]: 195, [TOPO]: 195 },
  temSuporte: true,
  estampas: [
    { nome: "Bandeira do Maranhão", status: "confirmada", origem: "proposta de 13/10 (aprovada) · variação já existente na Grande com Suporte" },
    { nome: "Mosaico Colorido", status: "confirmada", origem: "proposta de 13/10 (aprovada) · variação já existente" },
    { nome: "Serpente e Rei da Ilha", status: "confirmada", origem: "proposta de 13/10 (aprovada) · variação já existente" },
    // Alexandre 21/10: entram, só na Grande, com todos os suportes.
    { nome: "Caboclo de Pena", status: "confirmada", origem: "proposta de 13/10 · Alexandre 21/10 — sem foto no acervo: mostra a foto do produto" },
    { nome: "Boi Blackout", status: "confirmada", origem: "proposta de 13/10 · Alexandre 21/10: boi todo preto com detalhes pintados em branco (fotos identificadas no acervo)" },
    { nome: "Boi Estrelado", status: "confirmada", origem: FOTOS_1810 },
    { nome: "Boi Miolo", status: "confirmada", origem: FOTOS_1810 },
    { nome: "Boi Multicores", status: "confirmada", origem: FOTOS_1810 + " — foto personalizada (Verônica Tavares)" },
    { nome: "Reggae Roots", status: "confirmada", origem: FOTOS_1810 + " + foto da Wilsonira (14/10) — foto sem suporte personalizada (César Roots)" },
    { nome: "Boi de Estrelas", status: "confirmada", origem: FOTOS_1810 },
    { nome: "Boi do Maranhão", status: "confirmada", origem: FOTOS_1810 + " — só foto com suporte" },
    { nome: "Chapéu de Fitas Maranhão", status: "confirmada", origem: FOTOS_1810 + " + foto da Wilsonira (14/10); existe também na Mini" },
    { nome: "Fitas Coloridas", status: "confirmada", origem: FOTOS_1810 },
    { nome: "Cazumbá Frontal", status: "confirmada", origem: FOTOS_1810 + " — só foto sem suporte" },
  ],
  descricao: [
    "Tá ouvindo? Madeira batendo em madeira, som seco que não pede licença. Cem matracas juntas e o chão do arraial treme — é assim o nosso Bumba Meu Boi. Foi uma matraquinha de brinde, lá no arraial da nossa família, que virou a Kambada. Sem suporte, é ela e o cordão pra levar e bater à vontade; com suporte, mora na parede o ano todo e desce em junho.",
    "",
    "Material: tatajuba (matraca) e pinus (suporte); tintas e verniz à base d'água.",
    "Medidas: matraca 20×10×2 cm · ~390 g. Com suporte: ~35×14 cm · ~805 g.",
    "Acompanha: cordão. Suporte de parede nas opções com suporte: reto, Leque Bordado (recortado em folhas) ou Topo Boi Preto (boi recortado no alto).",
    "Escolha a estampa e o suporte.",
    CUIDADO,
    A_MAO,
  ].join("\n"),
};

/**
 * Mini DTF = produto próprio (recomendação do Fred, ver plano §3): estampa
 * IMPRESSA, não pintada à mão — preço, prazo e promessa diferentes. Dentro da
 * Mini, ela puxaria a vitrine para "a partir de R$ 85" e herdaria o "pintada à
 * mão" da descrição e da página. Nomes = os das fotos da Wilsonira (14/10).
 */
export const DTF: PaiNovo = {
  chave: "dtf",
  nome: "Matraca Kambada Mini DTF",
  suportes: [SEM],
  precos: { [SEM]: 85 },
  temSuporte: false,
  estampas: [
    { nome: "Boi Preto", status: "confirmada", origem: "foto da Wilsonira (14/10) · contagem \"Boi preto\" (DTF) = 2" },
    { nome: "Cazumbá Colorido", status: "confirmada", origem: "foto da Wilsonira (14/10) · contagem = 1" },
    { nome: "Cazumbá Preto", status: "confirmada", origem: "foto da Wilsonira (14/10) · contagem = 2" },
    { nome: "Miolo de Boi Colorido", status: "confirmada", origem: "foto da Wilsonira (14/10) · sem peça na contagem (feita por encomenda)" },
    { nome: "Miolo de Boi Preto", status: "confirmada", origem: "foto da Wilsonira (14/10) · sem peça na contagem (feita por encomenda)" },
  ],
  descricao: [
    "A matraca na versão mais em conta: a mesma madeira e o mesmo tamanho da mini, com a estampa impressa em DTF em vez de pintada à mão. Bate igual, cabe na mão da criança e vai no bolso pro arraial.",
    "",
    "Material: tatajuba; estampa impressa em DTF (não é pintada à mão).",
    "Medidas: 12×10×2 cm · ~200 g.",
    "Acompanha: cordão. NÃO acompanha suporte.",
    CUIDADO,
  ].join("\n"),
};

export const PAIS_NOVOS: PaiNovo[] = [MINI, GRANDE, DTF];

// ── Kambada Play: fica o cadastro de hoje, com duas figuras (Alexandre, 21/10) ──
export const PLAY = {
  id: 16698778218,
  nome: "Matraca Kambada Play",
  /** A variação herdada "Estampa:Caboclo de Pena" (saldo 4) — vai assim na nota fiscal hoje. */
  variacao: 16698780234,
  atributosAntigos: "Estampa:Caboclo de Pena",
  preco: 220,
  /** Saldo total da contagem de 13/10 ("boi de frente" 3 + "boi de lado" 1). */
  saldo: 4,
  /** A herdada vira Boi de Frente; Boi de Lado é criada. Mesmo suporte, mesmo preço. */
  modelos: [
    { atributos: "Modelo:Boi de Frente", saldo: 3, herdada: true },
    { atributos: "Modelo:Boi de Lado", saldo: 1, herdada: false },
  ],
};

// ── Os pais antigos ──
export type PaiAntigo = {
  id: number;
  nome: string;
  chave: string;
  /** Para onde o endereço antigo do site leva. */
  redirecionaPara: ChavePai;
  /** Variações de hoje (lidas da vitrine em 21/10/2026) com o saldo que a contagem de 13/10 dá. */
  variacoes: { id: number; atributos: string; saldo: number }[];
};

export const PAIS_ANTIGOS: PaiAntigo[] = [
  {
    id: 16698775382,
    nome: "Matraca Kambada Grande com Suporte",
    chave: "grande-com-suporte",
    redirecionaPara: "grande",
    variacoes: [
      { id: 16698775698, atributos: "Estampa:Caboclo de Pena", saldo: 8 },
      { id: 16701634550, atributos: "Estampa:Bandeira do Maranhão", saldo: 0 },
      { id: 16701634586, atributos: "Estampa:Leque Bordado", saldo: 0 },
      { id: 16701634559, atributos: "Estampa:Mosaico Colorido", saldo: 0 },
      { id: 16701634568, atributos: "Estampa:Serpente e Rei da Ilha", saldo: 0 },
      { id: 16701634579, atributos: "Estampa:Topo Boi Preto", saldo: 0 },
    ],
  },
  {
    id: 16698776080,
    nome: "Matraca Kambada Grande sem Suporte",
    chave: "grande-sem-suporte",
    redirecionaPara: "grande",
    variacoes: [{ id: 16698777264, atributos: "Estampa:Caboclo de Pena", saldo: 10 }],
  },
  {
    id: 16698777669,
    nome: "Matraca Kambada Pequena com Suporte",
    chave: "pequena-com-suporte",
    redirecionaPara: "mini",
    variacoes: [{ id: 16698777852, atributos: "Estampa:Caboclo de Pena", saldo: 6 }],
  },
  {
    id: 16698777979,
    nome: "Matraca Kambada Pequena sem Suporte",
    chave: "pequena-sem-suporte",
    redirecionaPara: "mini",
    variacoes: [{ id: 16698777992, atributos: "Estampa:Caboclo de Pena", saldo: 22 }],
  },
];

// ── De→para do saldo (contagem física da Wilsonira, 13/10/2026 — "SOMOS KAMBADA. ESTOQUE.docx") ──

export type Destino = { pai: ChavePai; estampa: string; suporte: Suporte };

export type DePara = {
  /** ID da variação antiga que guarda a peça hoje. */
  de: number;
  /** Como a Wilsonira escreveu na contagem. */
  contagem: string;
  quantidade: number;
  /** null = estampa a confirmar com o cliente no WhatsApp; a peça fica na variação antiga (inativa). */
  para: Destino | null;
  /** Palpite do Fred, só para orientar a pergunta. Nunca é aplicado. */
  provavel?: string;
  /** Já se sabe o pai e o suporte (Alexandre, 21/10); falta só a estampa. */
  destinoParcial?: { pai: ChavePai; suporte: Suporte };
};

const PSEM = 16698777992; // Pequena sem Suporte
const GSEM = 16698777264; // Grande sem Suporte
const PCOM = 16698777852; // Pequena com Suporte
const GCOM = 16698775698; // Grande com Suporte ("Caboclo de Pena")

export const DE_PARA: DePara[] = [
  // Mini sem suporte, pintada à mão (17)
  { de: PSEM, contagem: "Boi com miolo (Maranhão)", quantidade: 5, para: null, provavel: "Mini · Boizinho Miolo ou Boi do Maranhão" },
  { de: PSEM, contagem: "Boi Maranhão", quantidade: 2, para: null, provavel: "Mini · Boi do Maranhão" },
  { de: PSEM, contagem: "Boi colorido", quantidade: 5, para: null, provavel: "Mini · Boizinho Perfil ou Boizinho Estrelado" },
  { de: PSEM, contagem: "Cazumbá", quantidade: 1, para: null, provavel: "Mini · Cazumbazinho ou Cazumbá Frontal" },
  { de: PSEM, contagem: "Boi com miolo (colorido)", quantidade: 4, para: null, provavel: "Mini · Boizinho Miolo" },
  // Mini sem suporte, DTF (5) — nomes batem com as fotos da Wilsonira
  { de: PSEM, contagem: "Cazumbá preto (DTF)", quantidade: 2, para: { pai: "dtf", estampa: "Cazumbá Preto", suporte: "Sem suporte" } },
  { de: PSEM, contagem: "Cazumbá colorido (DTF)", quantidade: 1, para: { pai: "dtf", estampa: "Cazumbá Colorido", suporte: "Sem suporte" } },
  { de: PSEM, contagem: "Boi preto (DTF)", quantidade: 2, para: { pai: "dtf", estampa: "Boi Preto", suporte: "Sem suporte" } },
  // Grande sem suporte (10)
  { de: GSEM, contagem: "Boi colorido", quantidade: 1, para: null, provavel: "Grande · Mosaico Colorido ou Boi Multicores" },
  { de: GSEM, contagem: "Boi com miolo (Maranhão)", quantidade: 7, para: null, provavel: "Grande · Bandeira do Maranhão ou Boi Miolo" },
  { de: GSEM, contagem: "Boi preto", quantidade: 1, para: null, provavel: "Grande · Boi Blackout?" },
  { de: GSEM, contagem: "Boi colorido com imã", quantidade: 1, para: null, provavel: "matraca do Play sem o suporte? (o Play é a que tem imã)" },
  // Mini com suporte (6)
  { de: PCOM, contagem: "Boi com miolo (Maranhão)", quantidade: 1, para: null, provavel: "Mini · Miolinho ou Boizinho Miolo" },
  { de: PCOM, contagem: "Chapéu de fitas (Maranhão)", quantidade: 1, para: null, provavel: "Mini · Chapéu de Fita Bandeira do Maranhão" },
  { de: PCOM, contagem: "Boi colorido", quantidade: 2, para: null, provavel: "Mini · Boizinho Perfil" },
  { de: PCOM, contagem: "Boi Maranhão", quantidade: 2, para: null, provavel: "Mini · Boi do Maranhão ou Bandeira do Maranhão" },
  // Grande com suporte (8, hoje tudo em "Caboclo de Pena"). Alexandre 21/10: "folhas" = suporte
  // Leque Bordado e "boi preto" = suporte Topo Boi Preto — o SUPORTE está decidido, a ESTAMPA não.
  { de: GCOM, contagem: "Boi colorido suporte folhas", quantidade: 4, para: null, destinoParcial: { pai: "grande", suporte: LEQUE }, provavel: "Grande · estampa \"Boi colorido\" (qual do catálogo?) · Suporte: Leque Bordado" },
  { de: GCOM, contagem: "Boi preto", quantidade: 3, para: null, destinoParcial: { pai: "grande", suporte: TOPO }, provavel: "Grande · estampa ? · Suporte: Topo Boi Preto" },
  { de: GCOM, contagem: "Boi com miolo (suporte de boi)", quantidade: 1, para: null, provavel: "Grande · Bandeira do Maranhão? (suporte recortado em boi — é Play?)" },
];

// ── Fotos: os pais novos herdam as fotos dos antigos até ganharem as próprias ──
/**
 * slug do nome do pai novo → IDs antigos de onde vêm foto principal e galeria.
 * Vale enquanto o ID novo não estiver em scripts/preparar-fotos-produtos.mjs.
 * As fotos por ESTAMPA vêm de scripts/preparar-fotos-estampas.mjs.
 */
export const HERANCA_DE_FOTOS: Record<string, number[]> = {
  "matraca-kambada-mini": [16698777979, 16698777669],
  "matraca-kambada-grande": [16698775382, 16698776080],
};

// ── Redirecionamento dos endereços antigos ──
/** ID antigo (o que vai no fim do endereço) → nome do pai novo. */
export const REDIRECIONAMENTOS: Record<number, string> = Object.fromEntries(
  PAIS_ANTIGOS.map((p) => [p.id, PAIS_NOVOS.find((n) => n.chave === p.redirecionaPara)!.nome]),
);

// ── Funções puras ──

export function suportesDa(e: Estampa, pai: PaiNovo): Suporte[] {
  return (e.suportes ?? pai.suportes).filter((s) => pai.suportes.includes(s));
}

/** "Estampa:Boizinho Miolo;Suporte:Com suporte" (ou só "Estampa:Boi Preto" no DTF). */
export function atributosDe(pai: PaiNovo, estampa: string, suporte: Suporte): string {
  return pai.temSuporte ? `Estampa:${estampa};Suporte:${suporte}` : `Estampa:${estampa}`;
}

export function precoDe(pai: PaiNovo, suporte: Suporte): number {
  const p = pai.precos[suporte];
  if (typeof p !== "number") throw new Error(`${pai.nome}: sem preço para "${suporte}"`);
  return p;
}

export type VariacaoPlanejada = { atributos: string; estampa: string; suporte: Suporte; preco: number; ordem: number };

/** As variações a existir no Bling: só estampas confirmadas, sem antes com depois por estampa. */
export function variacoesPlanejadas(pai: PaiNovo): VariacaoPlanejada[] {
  const lista: VariacaoPlanejada[] = [];
  for (const e of pai.estampas.filter((x) => x.status === "confirmada")) {
    for (const s of suportesDa(e, pai)) {
      lista.push({ atributos: atributosDe(pai, e.nome, s), estampa: e.nome, suporte: s, preco: precoDe(pai, s), ordem: lista.length + 1 });
    }
  }
  return lista;
}

/** Compara "Estampa:X;Suporte:Y" sem depender de ordem, espaço, caixa ou acento. */
export function mesmaVariacao(a: unknown, b: unknown): boolean {
  const norm = (v: unknown) =>
    String(v ?? "")
      .split(";")
      .map((p) => p.split(":").map((x) => paraSlug(x)).join(":"))
      .filter((p) => p !== ":" && p !== "")
      .sort()
      .join(";");
  return norm(a) !== "" && norm(a) === norm(b);
}

/** Corpo do POST do pai com todas as variações confirmadas. O preço do filho é CORRIGIDO depois (cloneInfo copia o do pai). */
export function corpoPaiNovo(pai: PaiNovo): Obj {
  const variacoes = variacoesPlanejadas(pai);
  if (variacoes.length === 0) throw new Error(`${pai.nome}: nenhuma estampa confirmada`);
  return {
    nome: pai.nome,
    preco: Math.min(...variacoes.map((v) => v.preco)),
    tipo: "P",
    situacao: "A",
    formato: "V",
    categoria: { id: ID_CATEGORIA },
    descricaoCurta: pai.descricao,
    variacoes: variacoes.map((v) => ({
      nome: `${pai.nome} ${v.atributos}`,
      preco: v.preco,
      tipo: "P",
      situacao: "A",
      formato: "S",
      categoria: { id: ID_CATEGORIA },
      variacao: { nome: v.atributos, ordem: v.ordem, produtoPai: { cloneInfo: true } },
    })),
  };
}

/** Corpo do POST de UMA variação nova num pai que já existe (estampa confirmada depois). */
export function corpoFilhoNovo(pai: PaiNovo, idPai: number, v: VariacaoPlanejada): Obj {
  return {
    nome: `${pai.nome} ${v.atributos}`,
    preco: v.preco,
    tipo: "P",
    situacao: "A",
    formato: "S",
    categoria: { id: ID_CATEGORIA },
    variacao: { nome: v.atributos, ordem: v.ordem, produtoPai: { id: idPai } },
  };
}

type FilhoLido = { id?: unknown; preco?: unknown; atributos?: unknown };

/** O que falta criar e que preço corrigir, comparando o planejado com o pai relido. */
export function diferencas(pai: PaiNovo, filhos: FilhoLido[]) {
  const faltam: VariacaoPlanejada[] = [];
  const precoErrado: { id: number; atributos: string; de: unknown; para: number }[] = [];
  for (const v of variacoesPlanejadas(pai)) {
    const f = filhos.find((x) => mesmaVariacao(x.atributos, v.atributos));
    if (!f) faltam.push(v);
    else if (f.preco !== v.preco) precoErrado.push({ id: Number(f.id), atributos: v.atributos, de: f.preco, para: v.preco });
  }
  const sobrando = filhos.filter((f) => !variacoesPlanejadas(pai).some((v) => mesmaVariacao(f.atributos, v.atributos)));
  return { faltam, precoErrado, sobrando };
}

/** PUT no pai com os preços dos filhos corrigidos (o resto volta como veio). */
export function corpoComPrecosCorrigidos(atual: Obj, pai: PaiNovo): Obj {
  const variacoes = (atual.variacoes as Obj[] | undefined) ?? [];
  return {
    ...atual,
    variacoes: variacoes.map((v) => {
      const plano = variacoesPlanejadas(pai).find((p) => mesmaVariacao((v.variacao as Obj | undefined)?.nome, p.atributos));
      return plano && v.preco !== plano.preco ? { ...v, preco: plano.preco } : v;
    }),
  };
}

const HERDADA_PLAY = PLAY.modelos.find((m) => m.herdada)!;
const NOVAS_PLAY = PLAY.modelos.filter((m) => !m.herdada);

/** PUT no pai do Play: a variação herdada vira "Modelo:Boi de Frente" (o resto volta como veio). */
export function corpoPlay(atual: Obj): Obj {
  const variacoes = (atual.variacoes as Obj[] | undefined) ?? [];
  if (!variacoes.some((v) => v.id === PLAY.variacao)) throw new Error(`variação ${PLAY.variacao} não está no Play ${PLAY.id}`);
  return {
    ...atual,
    variacoes: variacoes.map((v) => {
      if (v.id !== PLAY.variacao) return v;
      const variacao = (v.variacao as Obj | undefined) ?? {};
      return { ...v, nome: `${PLAY.nome} ${HERDADA_PLAY.atributos}`, variacao: { ...variacao, nome: HERDADA_PLAY.atributos } };
    }),
  };
}

/** POST das figuras novas do Play (hoje: Boi de Lado), filhas do pai que já existe. */
export function corposFigurasNovasDoPlay(): Obj[] {
  return NOVAS_PLAY.map((m, i) => ({
    nome: `${PLAY.nome} ${m.atributos}`,
    preco: PLAY.preco,
    tipo: "P",
    situacao: "A",
    formato: "S",
    categoria: { id: ID_CATEGORIA },
    variacao: { nome: m.atributos, ordem: i + 2, produtoPai: { id: PLAY.id } },
  }));
}

/**
 * Saldos do Play: herdada 4 → Boi de Frente 3 + Boi de Lado 1. Conservação:
 * a soma das figuras tem de dar o saldo da contagem; se não der, recusa.
 */
export function planoDoPlay(saldos: Map<string, number>): { ok: boolean; motivo?: string; alvos: { atributos: string; agora: number; alvo: number }[] } {
  const alvos = PLAY.modelos.map((m) => ({ atributos: m.atributos, agora: saldos.get(m.atributos) ?? 0, alvo: m.saldo }));
  const total = alvos.reduce((s, a) => s + a.agora, 0);
  if (total !== PLAY.saldo) return { ok: false, motivo: `saldo do Play mudou desde a contagem: soma ${total}, esperado ${PLAY.saldo}`, alvos };
  return { ok: true, alvos };
}

const paiPorChave = (chave: ChavePai) => PAIS_NOVOS.find((p) => p.chave === chave)!;

/**
 * Problemas do plano, antes de qualquer chamada. Vazio = coerente.
 * Confere: soma da contagem por variação antiga = saldo esperado; destino com
 * estampa confirmada e suporte que existe; nenhum destino recebendo de duas origens.
 */
export function problemasDoPlano(): string[] {
  const erros: string[] = [];
  for (const antigo of PAIS_ANTIGOS) {
    for (const v of antigo.variacoes) {
      const soma = DE_PARA.filter((d) => d.de === v.id).reduce((s, d) => s + d.quantidade, 0);
      if (soma !== v.saldo) erros.push(`${antigo.nome} ${v.atributos}: contagem soma ${soma}, saldo esperado ${v.saldo}`);
    }
  }
  const origemDoDestino = new Map<string, number>();
  for (const d of DE_PARA) {
    if (!PAIS_ANTIGOS.some((p) => p.variacoes.some((v) => v.id === d.de))) erros.push(`de→para com origem desconhecida: ${d.de}`);
    if (d.destinoParcial && !paiPorChave(d.destinoParcial.pai).suportes.includes(d.destinoParcial.suporte)) {
      erros.push(`${d.contagem}: suporte "${d.destinoParcial.suporte}" não existe em ${paiPorChave(d.destinoParcial.pai).nome}`);
    }
    if (d.para && d.destinoParcial && (d.para.pai !== d.destinoParcial.pai || d.para.suporte !== d.destinoParcial.suporte)) {
      erros.push(`${d.contagem}: o destino contradiz o suporte já decidido (${d.destinoParcial.suporte})`);
    }
    if (!d.para) continue;
    const pai = paiPorChave(d.para.pai);
    const e = pai.estampas.find((x) => x.nome === d.para!.estampa);
    if (!e) erros.push(`${d.contagem}: estampa "${d.para.estampa}" não existe em ${pai.nome}`);
    else if (e.status !== "confirmada") erros.push(`${d.contagem}: estampa "${e.nome}" ainda é a-confirmar`);
    else if (!suportesDa(e, pai).includes(d.para.suporte)) erros.push(`${d.contagem}: "${e.nome}" não existe "${d.para.suporte}"`);
    const chave = `${pai.chave}|${atributosDe(pai, d.para.estampa, d.para.suporte)}`;
    const anterior = origemDoDestino.get(chave);
    if (anterior !== undefined && anterior !== d.de) erros.push(`${chave} recebe de duas variações antigas`);
    origemDoDestino.set(chave, d.de);
  }
  return erros;
}

export type Movimento = { pai: ChavePai; atributos: string; de: number; quantidade: number };

/** Saldo-alvo de cada variação nova (soma dos de→para já respondidos). */
export function movimentos(): Movimento[] {
  const porDestino = new Map<string, Movimento>();
  for (const d of DE_PARA) {
    if (!d.para) continue;
    const atributos = atributosDe(paiPorChave(d.para.pai), d.para.estampa, d.para.suporte);
    const chave = `${d.para.pai}|${atributos}`;
    const atual = porDestino.get(chave);
    porDestino.set(chave, { pai: d.para.pai, atributos, de: d.de, quantidade: (atual?.quantidade ?? 0) + d.quantidade });
  }
  return [...porDestino.values()];
}

/** Quanto fica na variação antiga quando os movimentos respondidos forem feitos (= o que ainda é A CONFIRMAR). */
export function pendenteNaAntiga(idAntiga: number): number {
  return DE_PARA.filter((d) => d.de === idAntiga && !d.para).reduce((s, d) => s + d.quantidade, 0);
}

/**
 * Plano de saldos de UMA variação antiga, dado o que o Bling diz agora.
 * Conservação: antiga + novas alimentadas por ela = saldo da contagem. Se não
 * fecha, alguém vendeu ou mexeu no estoque no meio do caminho → a rota recusa.
 */
export function planoDeSaldos(
  idAntiga: number,
  saldoAntigaAgora: number,
  saldoNovasAgora: Map<string, number>, // `${pai}|${atributos}` → saldo
): { ok: boolean; motivo?: string; alvoAntiga: number; novas: { chave: string; agora: number; alvo: number }[] } {
  const antiga = PAIS_ANTIGOS.flatMap((p) => p.variacoes).find((v) => v.id === idAntiga);
  if (!antiga) return { ok: false, motivo: `variação antiga ${idAntiga} fora do plano`, alvoAntiga: saldoAntigaAgora, novas: [] };
  const daqui = movimentos().filter((m) => m.de === idAntiga);
  const novas = daqui.map((m) => {
    const chave = `${m.pai}|${m.atributos}`;
    return { chave, agora: saldoNovasAgora.get(chave) ?? 0, alvo: m.quantidade };
  });
  const total = saldoAntigaAgora + novas.reduce((s, n) => s + n.agora, 0);
  const alvoAntiga = antiga.saldo - daqui.reduce((s, m) => s + m.quantidade, 0);
  if (total !== antiga.saldo) {
    return { ok: false, motivo: `saldo mudou desde a contagem de 13/10: antiga ${saldoAntigaAgora} + novas ${total - saldoAntigaAgora} = ${total}, esperado ${antiga.saldo}. Conferir vendas/ajustes e refazer o de→para.`, alvoAntiga, novas };
  }
  return { ok: true, alvoAntiga, novas };
}

/**
 * O que o passo inativar-<pai antigo> faz. Saldo parado nas variações antigas
 * (peças cuja estampa se confirma com o cliente no WhatsApp) NÃO impede: com
 * `pendentes=manter` o pai e as variações são inativados guardando o saldo.
 */
export function decisaoDeInativar(e: {
  jaInativo: boolean;
  destinoAtivo: boolean;
  parado: number;
  pendentesManter: boolean;
  aplicar: boolean;
}): "pular" | "erro" | "bloqueado" | "inativar" | "aplicar" {
  if (e.jaInativo) return "pular";
  if (!e.destinoAtivo) return "erro";
  if (e.parado > 0 && !e.pendentesManter) return "bloqueado";
  return e.aplicar ? "aplicar" : "inativar";
}

/** Os passos, na ordem de aplicação (ver plano §9). */
export const PASSOS = [
  { chave: "criar-mini", oQue: "cria Matraca Kambada Mini com as estampas confirmadas × Sem/Com suporte (110/145) — ou completa as que faltam" },
  { chave: "criar-grande", oQue: "cria Matraca Kambada Grande com as estampas confirmadas × Sem/Com/Leque Bordado/Topo Boi Preto (145/190/190/190) — ou completa" },
  { chave: "criar-dtf", oQue: "cria Matraca Kambada Mini DTF com as 5 estampas, R$ 85 — ou completa" },
  { chave: "play", oQue: "Play: herdada Estampa:Caboclo de Pena → Modelo:Boi de Frente (saldo 3); cria Modelo:Boi de Lado (saldo 1), R$ 220" },
  { chave: "saldos", oQue: "move o saldo dos de→para respondidos (hoje: 5 DTF); o A CONFIRMAR fica na variação antiga" },
  ...PAIS_ANTIGOS.map((p) => ({ chave: `inativar-${p.chave}`, oQue: `inativa ${p.nome} e as variações dele (exige os pais novos ativos)` })),
] as const;

export type ChavePasso = (typeof PASSOS)[number]["chave"];
