/**
 * Guia de tamanhos — medidas planas (peça deitada), em centímetros.
 *
 * Fontes:
 *  - adulto unissex: "Fichas_Individualizadas_Produtos_Mercado_Livre_Kambada_.docx"
 *    (comercial/, coleta de out/2026), tabela "Camiseta Kambada";
 *  - babylook, infantis, suede e regatão: medição do ateliê feita pela
 *    Wilsonira em 13/10/2026 ("Kambada_Descricoes - AJUSTES.docx").
 *
 * Só entra aqui o que foi medido; tamanho sem medida não aparece. Quando
 * uma peça traz só busto × comprimento, a coluna de manga fica de fora.
 */

export type TabelaDeMedidas = {
  titulo: string;
  colunas: string[];
  linhas: { tamanho: string; valores: string[] }[];
  observacao: string;
};

const OBSERVACAO =
  "Medidas da peça deitada, de costura a costura. Confecção artesanal: pode variar até 2 cm. Na dúvida entre dois tamanhos, chame no WhatsApp.";

const cm = (n: number) => `${String(n).replace(".", ",")} cm`;
const bustoComprimento = (titulo: string, linhas: [string, number, number][]): TabelaDeMedidas => ({
  titulo,
  colunas: ["Largura do busto", "Comprimento"],
  linhas: linhas.map(([tamanho, b, c]) => ({ tamanho, valores: [cm(b), cm(c)] })),
  observacao: OBSERVACAO,
});

const CAMISA_ADULTO: TabelaDeMedidas = {
  titulo: "Camisa adulto (unissex)",
  colunas: ["Largura do busto", "Comprimento", "Manga"],
  linhas: [
    { tamanho: "P", valores: ["50 cm", "71 cm", "19 cm"] },
    { tamanho: "M", valores: ["51 cm", "72 cm", "20 cm"] },
    { tamanho: "G", valores: ["57 cm", "73 cm", "20 cm"] },
    { tamanho: "GG", valores: ["60 cm", "75 cm", "22,5 cm"] },
    { tamanho: "XG", valores: ["64 cm", "80 cm", "24 cm"] },
  ],
  observacao: OBSERVACAO,
};

const BABYLOOK = bustoComprimento("Camisa babylook", [["P", 40, 58], ["M", 40, 60], ["G", 44, 62]]);
const SUEDE_FEMININO = bustoComprimento("Camisa suede feminina", [["M", 39, 55], ["G", 41, 57], ["GG", 44, 58]]);
const SUEDE_UNISSEX = bustoComprimento("Camisa suede unissex", [["G", 50, 66]]);
const REGATAO = bustoComprimento("Regatão", [["GG", 50, 71]]);
const INFANTIL_BUMBA = bustoComprimento("Camisa infantil", [["6 anos", 35, 46], ["8 anos", 36, 49], ["12 anos", 36, 58], ["14 anos", 36, 60]]);
const INFANTIL_ILHA = bustoComprimento("Camisa infantil", [["2 anos", 32, 46], ["4 anos", 34, 49], ["6 anos", 35, 51], ["10 anos", 38, 54]]);
const INFANTIL_SERPENTE = bustoComprimento("Camisa infantil", [["6 anos", 31, 50]]);
const INFANTIL_CAZUMBAZINHO = bustoComprimento("Camisa infantil", [["8 anos", 39, 53]]);
const INFANTIL_MOSAICO = bustoComprimento("Camisa infantil", [["4 anos", 31, 43]]);
// Revoadinha: a medida do 2 anos veio ilegível (40×11); só o 4 anos entra.
const INFANTIL_REVOADINHA = bustoComprimento("Camisa infantil", [["4 anos", 31, 43]]);

/** Tabelas por peça, pelo nome do produto no Bling. A ordem importa: a primeira que casar vale. */
const POR_NOME: [RegExp, TabelaDeMedidas][] = [
  [/babylook/i, BABYLOOK],
  [/suede.*feminin/i, SUEDE_FEMININO],
  [/suede/i, SUEDE_UNISSEX],
  [/regat/i, REGATAO],
  [/bumba meu boi infantil/i, INFANTIL_BUMBA],
  [/infantil ilha encantada/i, INFANTIL_ILHA],
  [/lenda da serpente infantil/i, INFANTIL_SERPENTE],
  [/cazumb[aá]zinho/i, INFANTIL_CAZUMBAZINHO],
  [/serpente mosaico infantil/i, INFANTIL_MOSAICO],
  [/revoadinha/i, INFANTIL_REVOADINHA],
];

/** Peças infantis ou de corte especial sem medida própria ficam sem tabela (nunca a do adulto). */
const SEM_TABELA = /infantil|babylook|suede|revoadinha|zinho\b|anos/i;

export function tabelaDeMedidas(produto: { categoria: string; nome: string }): TabelaDeMedidas | null {
  if (produto.categoria !== "camisas") return null;
  const especifica = POR_NOME.find(([re]) => re.test(produto.nome));
  if (especifica) return especifica[1];
  if (SEM_TABELA.test(produto.nome)) return null;
  return CAMISA_ADULTO;
}
