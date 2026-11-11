import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { arquivoEscola } from "./dados";
import type { Papel } from "./tipos";

/**
 * Sessão do portal da escola: cookie próprio, separado do cookie do Play.
 * `m` = marca do segredo (senha da equipe ou figuras do aluno): trocou, a sessão cai.
 *
 * Segredo da assinatura: ESCOLA_SEGREDO, se existir; senão um segredo
 * aleatório criado na primeira vez e guardado ao lado dos dados
 * (`escola-segredo.txt`). Assim o site do subdomínio sobe sem nenhuma
 * variável secreta digitada no painel da Hostinger.
 */
export const COOKIE_ESCOLA = "kambada-escola";

let segredoEmMemoria: string | null = null;
function segredo(): string {
  if (process.env.ESCOLA_SEGREDO) return process.env.ESCOLA_SEGREDO;
  if (segredoEmMemoria) return segredoEmMemoria;
  const arquivo = join(dirname(arquivoEscola()), "escola-segredo.txt");
  try {
    const lido = readFileSync(arquivo, "utf8").trim();
    if (lido.length >= 32) return (segredoEmMemoria = lido);
  } catch {
    // primeira vez
  }
  const novo = randomBytes(32).toString("hex");
  try {
    mkdirSync(dirname(arquivo), { recursive: true });
    writeFileSync(arquivo, novo, { encoding: "utf8", mode: 0o600 });
  } catch (erro) {
    // Sem disco: vale até o processo reiniciar (as sessões caem no reinício).
    console.error(`[escola] não consegui gravar o segredo em ${arquivo}: ${String(erro)}`);
  }
  return (segredoEmMemoria = novo);
}

function assinar(dados: unknown): string {
  const carga = Buffer.from(JSON.stringify(dados), "utf8").toString("base64url");
  return `${carga}.${createHmac("sha256", segredo()).update(carga).digest("base64url")}`;
}

function verificar<T>(token: unknown): T | null {
  if (typeof token !== "string" || token.length > 2000) return null;
  const [carga, sig] = token.split(".");
  if (!carga || !sig) return null;
  const esperado = createHmac("sha256", segredo()).update(carga).digest();
  const recebido = Buffer.from(sig, "base64url");
  if (recebido.length !== esperado.length || !timingSafeEqual(recebido, esperado)) return null;
  try {
    return JSON.parse(Buffer.from(carga, "base64url").toString("utf8")) as T;
  } catch {
    return null;
  }
}

/** Aluno: um turno de aula. Equipe: uma semana. */
export const VALIDADE_S: Record<Papel, number> = {
  aluno: 10 * 3600,
  professor: 7 * 86400,
  coordenacao: 7 * 86400,
  gestor: 12 * 3600,
};

/**
 * `ver` (só coordenação): a coordenação passeia pelas visões da própria escola
 * sem sair — "professor" (todas as turmas da escola) ou "aluno" (um aluno de
 * demonstração dela). Ausente = a visão da coordenação.
 */
export type Visao = "professor" | "aluno";
export type SessaoEscola = { v: "esc1"; p: Papel; id: string; m: string; exp: number; ver?: Visao };

export function criarSessaoEscola(p: Papel, id: string, m: string, agora = Date.now(), ver?: Visao): string {
  const s: SessaoEscola = { v: "esc1", p, id, m, exp: Math.floor(agora / 1000) + VALIDADE_S[p], ...(p === "coordenacao" && ver ? { ver } : {}) };
  return assinar(s);
}

export function lerSessaoEscola(cookie: unknown, agora = Date.now()): SessaoEscola | null {
  const s = verificar<SessaoEscola>(cookie);
  if (!s || s.v !== "esc1" || typeof s.exp !== "number" || s.exp <= Math.floor(agora / 1000)) return null;
  if (s.p !== "aluno" && s.p !== "professor" && s.p !== "coordenacao" && s.p !== "gestor") return null;
  if (typeof s.id !== "string" || typeof s.m !== "string") return null;
  if (s.ver !== undefined && (s.p !== "coordenacao" || (s.ver !== "professor" && s.ver !== "aluno"))) return null;
  return s;
}

export function sessaoDoCabecalho(cabecalhoCookie: string | null): SessaoEscola | null {
  const par = (cabecalhoCookie ?? "")
    .split(";")
    .map((p) => p.trim())
    .find((p) => p.startsWith(`${COOKIE_ESCOLA}=`));
  return par ? lerSessaoEscola(decodeURIComponent(par.slice(COOKIE_ESCOLA.length + 1))) : null;
}

export function opcoesCookie(p: Papel) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: VALIDADE_S[p],
  };
}
