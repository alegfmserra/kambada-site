import { mkdir, readFile, rename, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
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
 * ⚠️ O caminho PRECISA ficar fora da pasta da aplicação. Comprovado em
 * produção em 2026-09-02: a Hostinger recria o diretório do app a cada
 * implantação, e um caminho relativo (`.dados/…`) é apagado junto — a loja
 * perdia a conexão e exigia autorização manual a cada atualização.
 *
 * Por isso o padrão agora é a pasta pessoal do usuário do sistema, que
 * sobrevive ao deploy. Caminho relativo ainda é aceito, mas só faz sentido em
 * desenvolvimento.
 */

const URL_TOKEN = "https://www.bling.com.br/Api/v3/oauth/token";
const URL_AUTORIZACAO = "https://www.bling.com.br/Api/v3/oauth/authorize";

/** Renova com folga, para nunca usar um token que expira no meio da chamada. */
const MARGEM_MS = 5 * 60 * 1000;

export function arquivoTokens(): string {
  const configurado = process.env.BLING_TOKENS_ARQUIVO;
  if (configurado) return configurado;

  // Fora da pasta da aplicação, para sobreviver a cada implantação.
  return join(homedir(), ".kambada", "bling-tokens.json");
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
    renovadoEm: Date.now(),
  };
  await escreverTokens(tokens);
  return tokens;
}

/** Escrita atômica (tmp + rename): queda no meio não corrompe o refresh token. */
async function escreverTokens(tokens: TokensSalvos): Promise<void> {
  const caminho = arquivoTokens();
  await mkdir(dirname(caminho), { recursive: true });
  // Temporário com o PID: dois processos não disputam o mesmo .tmp.
  const tmp = `${caminho}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(tokens, null, 2), "utf8");
  await rename(tmp, caminho);
}

/** Folga mínima para considerar o token "fresco" sem renovar. */
export function precisaRenovar(expiraEm: number, folgaMs: number, agora = Date.now()): boolean {
  return expiraEm - agora < folgaMs;
}

/**
 * Renova se o token vencer dentro de `folgaMs` (manutenção periódica). Cada
 * renovação rotaciona também o refresh token — é o que o mantém vivo.
 */
export async function renovarSeVencerEm(folgaMs: number): Promise<{ renovou: boolean; expiraEm: number }> {
  const tokens = await lerTokens();
  if (!tokens) throw new ErroBling("O aplicativo ainda não foi autorizado no Bling.", 401);
  if (tokens.invalido) throw new ErroBling("Refresh token recusado pelo Bling — reautorizar em /api/bling/autorizar.", 401);
  if (!precisaRenovar(tokens.expiraEm, folgaMs)) return { renovou: false, expiraEm: tokens.expiraEm };
  const novos = await renovarUmaVez(folgaMs);
  return { renovou: novos.renovadoEm !== tokens.renovadoEm, expiraEm: novos.expiraEm };
}

/**
 * O build (`next build`) roda em outros processos, ao mesmo tempo que o site no
 * ar, e lê o MESMO arquivo de tokens. Ele nunca renova: usa o token se ainda
 * estiver válido; senão a página cai no catálogo local e se refaz depois.
 */
const EM_BUILD = process.env.NEXT_PHASE === "phase-production-build";

/**
 * Trava ENTRE PROCESSOS (21/10/2026). A trava em memória só vale dentro de um
 * processo; site no ar + build da Hostinger + rotas de manutenção renovando
 * juntos gastavam o mesmo refresh token duas vezes — o Bling aceita o primeiro
 * e recusa o segundo, e o perdedor marcava a conexão como inválida: o Bling
 * "desconectava". `mkdir` é atômico: só um processo cria a pasta da trava.
 */
const TRAVA_VENCIDA_MS = 60_000;
async function comTrava<T>(trabalho: () => Promise<T>): Promise<T> {
  const trava = `${arquivoTokens()}.trava`;
  await mkdir(dirname(trava), { recursive: true });
  const inicio = Date.now();
  for (;;) {
    try {
      await mkdir(trava);
      break;
    } catch (e) {
      if ((e as NodeJS.ErrnoException).code !== "EEXIST") throw e;
      try {
        // Processo que morreu segurando a trava não pode travar a loja para sempre.
        if (Date.now() - (await stat(trava)).mtimeMs > TRAVA_VENCIDA_MS) {
          await rm(trava, { recursive: true, force: true });
          continue;
        }
      } catch {
        continue; // a trava sumiu entre o mkdir e o stat: tenta de novo
      }
      if (Date.now() - inicio > 30_000) throw new ErroBling("Renovação do Bling em andamento em outro processo.", 503);
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  try {
    return await trabalho();
  } finally {
    await rm(trava, { recursive: true, force: true }).catch(() => undefined);
  }
}

/** Renova com trava; quem chega depois relê o arquivo e usa o token que o outro já renovou. */
function renovarUmaVez(folgaMs: number): Promise<TokensSalvos> {
  if (EM_BUILD) {
    return Promise.reject(new ErroBling("Build não renova o token do Bling (usa só token válido).", 503));
  }
  if (!renovacaoEmAndamento) {
    renovacaoEmAndamento = comTrava(async () => {
      const atuais = await lerTokens();
      if (!atuais) throw new ErroBling("O aplicativo ainda não foi autorizado no Bling.", 401);
      if (atuais.invalido) throw new ErroBling("Refresh token recusado pelo Bling — reautorizar em /api/bling/autorizar.", 401);
      if (!precisaRenovar(atuais.expiraEm, folgaMs)) return atuais; // outro processo já renovou
      return renovarTokens(atuais.refreshToken);
    }).finally(() => {
      renovacaoEmAndamento = null;
    });
  }
  return renovacaoEmAndamento;
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
  try {
    const resposta = await pedirToken({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
    return await gravarTokens(resposta);
  } catch (e) {
    // 400/401 = refresh token morto (invalid_grant). Marcar e parar de tentar:
    // antes, cada requisição repetia o POST ao OAuth e podia bloquear o client.
    if (e instanceof ErroBling && (e.status === 400 || e.status === 401)) {
      const atuais = await lerTokens();
      // Se o arquivo já tem OUTRO refresh token, alguém renovou no meio do caminho:
      // a conexão está viva — usa o novo, não marca nada.
      if (atuais && !atuais.invalido && atuais.refreshToken !== refreshToken) return atuais;
      if (atuais) await escreverTokens({ ...atuais, invalido: true });
    }
    throw e;
  }
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
  if (tokens.invalido) {
    throw new ErroBling(
      "O Bling recusou o refresh token. Reautorizar em /api/bling/autorizar.",
      401,
    );
  }
  if (Date.now() < tokens.expiraEm) return tokens.accessToken;

  const renovados = await renovarUmaVez(0);
  return renovados.accessToken;
}

export async function estaAutorizado(): Promise<boolean> {
  return (await lerTokens()) !== null;
}
