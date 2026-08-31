import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import type { RespostaToken, TokensSalvos } from "./tipos";
import { ErroBling } from "./tipos";

/**
 * Guarda e renova os tokens do Bling.
 *
 * O access_token dura poucas horas; o refresh_token é o que mantém a conexão
 * viva. Por isso os tokens precisam sobreviver a reinício do servidor — se
 * ficassem só em memória, cada deploy exigiria uma nova autorização manual.
 *
 * Onde guardamos: um arquivo JSON no caminho de BLING_TOKENS_ARQUIVO. Sem
 * banco de dados, é a opção honesta para este porte de projeto.
 *
 * ⚠️ Limitação conhecida: se o disco da hospedagem for efêmero (recriado a
 * cada deploy), o arquivo se perde e é preciso autorizar de novo. Na Hostinger
 * o processo tem disco persistente, então funciona — mas o caminho é
 * configurável justamente para poder apontar para um volume que persista.
 */

const URL_TOKEN = "https://www.bling.com.br/Api/v3/oauth/token";
const URL_AUTORIZACAO = "https://www.bling.com.br/Api/v3/oauth/authorize";

/** Renova com folga, para nunca usar um token que expira no meio da chamada. */
const MARGEM_MS = 5 * 60 * 1000;

function arquivoTokens(): string {
  return process.env.BLING_TOKENS_ARQUIVO ?? ".dados/bling-tokens.json";
}

function credenciais(): { id: string; segredo: string } {
  const id = process.env.BLING_CLIENT_ID;
  const segredo = process.env.BLING_CLIENT_SECRET;
  if (!id || !segredo) {
    throw new ErroBling(
      "BLING_CLIENT_ID e BLING_CLIENT_SECRET não estão definidos. Veja .env.example.",
      500,
    );
  }
  return { id, segredo };
}

function cabecalhoBasico(): string {
  const { id, segredo } = credenciais();
  return `Basic ${Buffer.from(`${id}:${segredo}`).toString("base64")}`;
}

/** URL para onde o Alexandre é mandado para autorizar o aplicativo. */
export function urlDeAutorizacao(state: string): string {
  const { id } = credenciais();
  const params = new URLSearchParams({
    response_type: "code",
    client_id: id,
    state,
  });
  return `${URL_AUTORIZACAO}?${params.toString()}`;
}

export async function lerTokens(): Promise<TokensSalvos | null> {
  try {
    const bruto = await readFile(arquivoTokens(), "utf8");
    const dados = JSON.parse(bruto) as TokensSalvos;
    if (!dados.refreshToken) return null;
    return dados;
  } catch {
    return null;
  }
}

export async function gravarTokens(resposta: RespostaToken): Promise<TokensSalvos> {
  const tokens: TokensSalvos = {
    accessToken: resposta.access_token,
    refreshToken: resposta.refresh_token,
    expiraEm: Date.now() + resposta.expires_in * 1000 - MARGEM_MS,
    escopo: resposta.scope,
  };
  const caminho = arquivoTokens();
  await mkdir(dirname(caminho), { recursive: true });
  // Escrita simples: o volume é baixo e só o callback e o refresh escrevem.
  await writeFile(caminho, JSON.stringify(tokens, null, 2), "utf8");
  return tokens;
}

async function pedirToken(corpo: Record<string, string>): Promise<RespostaToken> {
  const resposta = await fetch(URL_TOKEN, {
    method: "POST",
    headers: {
      Authorization: cabecalhoBasico(),
      "Content-Type": "application/json",
      Accept: "1.0",
    },
    body: JSON.stringify(corpo),
  });

  const texto = await resposta.text();
  if (!resposta.ok) {
    throw new ErroBling(
      `Falha ao obter token do Bling (HTTP ${resposta.status})`,
      resposta.status,
      texto.slice(0, 500),
    );
  }
  return JSON.parse(texto) as RespostaToken;
}

/** Troca o code recebido no callback por um par de tokens. Vale 1 minuto. */
export async function trocarCodePorToken(code: string): Promise<TokensSalvos> {
  const resposta = await pedirToken({ grant_type: "authorization_code", code });
  return gravarTokens(resposta);
}

export async function renovarTokens(refreshToken: string): Promise<TokensSalvos> {
  const resposta = await pedirToken({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });
  return gravarTokens(resposta);
}

/**
 * Renovação em andamento, compartilhada entre chamadas simultâneas.
 *
 * Sem isto, várias requisições que encontrem o token vencido ao mesmo tempo
 * disparariam vários refresh em paralelo. Como o Bling pode rotacionar o
 * refresh_token a cada uso, o segundo pedido chegaria com um token já
 * invalidado — e a conexão cairia, exigindo autorização manual de novo.
 * Aqui todas esperam a mesma renovação.
 */
let renovacaoEmAndamento: Promise<TokensSalvos> | null = null;

/**
 * Devolve um access_token válido, renovando se estiver perto de expirar.
 * Lança se o aplicativo ainda não foi autorizado — quem chama decide o que
 * mostrar (a vitrine, por exemplo, cai para o catálogo local).
 */
export async function tokenValido(): Promise<string> {
  const tokens = await lerTokens();
  if (!tokens) {
    throw new ErroBling(
      "O aplicativo ainda não foi autorizado no Bling. Acesse /api/bling/autorizar.",
      401,
    );
  }
  if (Date.now() < tokens.expiraEm) return tokens.accessToken;

  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = renovarTokens(tokens.refreshToken).finally(() => {
      renovacaoEmAndamento = null;
    });
  }

  const renovados = await renovacaoEmAndamento;
  return renovados.accessToken;
}

export async function estaAutorizado(): Promise<boolean> {
  return (await lerTokens()) !== null;
}
