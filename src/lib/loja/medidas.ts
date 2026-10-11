/**
 * Guia de tamanhos — medidas planas (peça deitada), em centímetros.
 *
 * Fonte: "Fichas_Individualizadas_Produtos_Mercado_Livre_Kambada_.docx"
 * (comercial/, coleta de out/2026), tabela "Camiseta Kambada". Só entra aqui
 * o que foi medido; tamanho sem medida não aparece. Infantil, babylook e
 * suede ainda não têm tabela — quando o ateliê medir, é só acrescentar.
 */

export type TabelaDeMedidas = {
  titulo: string;
  colunas: string[];
  linhas: { tamanho: string; valores: string[] }[];
  observacao: string;
};

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
  observacao:
    "Medidas da peça deitada, de costura a costura. Como é confecção artesanal em lote pequeno, pode variar até 2 cm. Na dúvida entre dois tamanhos, chame no WhatsApp que a gente ajuda.",
};

/** Camisas infantis, babylook e suede ficam de fora até terem medida própria. */
const SEM_TABELA = /infantil|babylook|suede|revoadinha|zinho\b|anos/i;

export function tabelaDeMedidas(produto: { categoria: string; nome: string }): TabelaDeMedidas | null {
  if (produto.categoria !== "camisas") return null;
  if (SEM_TABELA.test(produto.nome)) return null;
  return CAMISA_ADULTO;
}
