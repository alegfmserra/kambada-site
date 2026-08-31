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
  situacao?: string; // "A" = ativo
  formato?: string; // "S" simples, "V" variação, "E" com variações
  tipo?: string;
  descricaoCurta?: string;
  imagemURL?: string;
  categoria?: { id: number; descricao?: string };
  estoque?: { saldoVirtualTotal?: number };
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
