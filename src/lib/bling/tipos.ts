/**
 * Tipos da API v3 do Bling.
 *
 * Descrevem só o que o site realmente usa. A API devolve muito mais campo
 * por produto; declarar tudo seria manutenção sem retorno.
 */

/** Resposta do endpoint de token, tanto no code quanto no refresh. */
export type RespostaToken = {
  access_token: string;
  expires_in: number; // segundos
  token_type: string;
  scope: string;
  refresh_token: string;
};

/** O que guardamos em disco entre as execuções. */
export type TokensSalvos = {
  accessToken: string;
  refreshToken: string;
  /** Instante de expiração em epoch ms, já com a margem de segurança. */
  expiraEm: number;
  escopo: string;
};

export type ProdutoBling = {
  id: number;
  nome: string;
  codigo?: string;
  preco?: number;
  /** "Preço de custo". Em 2026-09-03 estava zerado em toda a conta. */
  precoCusto?: number;
  situacao?: string; // "A" = ativo
  /**
   * Conferido contra a API em 2026-09-03, porque a suposição anterior estava
   * invertida e teria posto cada tamanho na vitrine como um produto:
   *
   * - "V" = produto-PAI, o que tem variações. É ele que vai para a vitrine.
   * - "S" = produto simples OU um FILHO de variação.
   *
   * O que separa um filho de um produto simples é `variacao.produtoPai` —
   * campo que só existe no produto individual. Ver `ehFilhoDeVariacao`.
   */
  formato?: string;
  tipo?: string;
  descricaoCurta?: string;
  imagemURL?: string;
  /** Só no produto individual. A LISTAGEM não devolve este campo. */
  categoria?: { id: number; descricao?: string };
  /** Só no produto individual. A LISTAGEM não devolve este campo. */
  estoque?: { saldoVirtualTotal?: number };
  /** Só no produto individual. Identifica o filho de uma variação. */
  variacao?: {
    nome?: string;
    ordem?: number;
    produtoPai?: { id: number };
  };
  midia?: {
    imagens?: {
      externas?: { link: string }[];
      internas?: { link: string }[];
    };
  };
  variacoes?: { id: number; nome: string; preco?: number }[];
};

export type CategoriaBling = {
  id: number;
  descricao: string;
  categoriaPai?: { id: number };
};

export type SaldoBling = {
  produto: { id: number };
  saldoVirtualTotal?: number;
  saldoFisicoTotal?: number;
};

/** Envelope padrão das respostas: os dados vêm sempre em `data`. */
export type Envelope<T> = { data: T };

export class ErroBling extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly corpo?: unknown,
  ) {
    super(message);
    this.name = "ErroBling";
  }
}
