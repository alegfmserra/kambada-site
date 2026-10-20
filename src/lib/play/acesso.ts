import { createHash, timingSafeEqual } from "node:crypto";
import { assinar, verificar } from "./jogos/seguranca";

/**
 * Acesso ao Kambada Play.
 *
 * Dois jeitos de entrar, os dois com o mesmo cookie assinado:
 *  - **conta** (e-mail + senha, ver `contas.ts`) — é o caminho normal;
 *  - **demonstração** (login e senha únicos, padrão "somoskambada"; em
 *    produção, PLAY_LOGIN / PLAY_SENHA trocam o padrão) — para apresentações.
 *    Quem entra assim não aparece na base de contas.
 *
 * O `proxy` só confere se o cookie é válido; quem precisa saber QUEM é
 * (ranking, prêmio, "minha conta") usa `sessaoDaRequisicao`.
 */

export const COOKIE_SESSAO = "kambada-play";
export const VALIDADE_SESSAO_S = 30 * 24 * 60 * 60; // 30 dias

const LOGIN_PADRAO = "somoskambada";
const SENHA_PADRAO = "somoskambada";

function resumo(t: string): Buffer {
  return createHash("sha256").update(t, "utf8").digest();
}

/** Comparação em tempo constante (resumos de mesmo tamanho). */
function iguais(a: string, b: string): boolean {
  return timingSafeEqual(resumo(a), resumo(b));
}

export function credenciaisValidas(usuario: unknown, senha: unknown): boolean {
  if (typeof usuario !== "string" || typeof senha !== "string") return false;
  if (usuario.length > 100 || senha.length > 100) return false;
  const loginCerto = process.env.PLAY_LOGIN || LOGIN_PADRAO;
  const senhaCerta = process.env.PLAY_SENHA || SENHA_PADRAO;
  // As duas comparações sempre rodam, para não revelar qual campo errou.
  const a = iguais(usuario.trim().toLowerCase(), loginCerto.toLowerCase());
  const b = iguais(senha, senhaCerta);
  return a && b;
}

export type Sessao =
  | { v: 1; exp: number } // demonstração
  | { v: 2; exp: number; conta: string }; // conta com e-mail

export function criarSessao(agora = Date.now()): string {
  const s: Sessao = { v: 1, exp: Math.floor(agora / 1000) + VALIDADE_SESSAO_S };
  return assinar(s);
}

export function criarSessaoDeConta(contaId: string, agora = Date.now()): string {
  const s: Sessao = { v: 2, exp: Math.floor(agora / 1000) + VALIDADE_SESSAO_S, conta: contaId };
  return assinar(s);
}

export function lerSessao(cookie: unknown, agora = Date.now()): Sessao | null {
  const s = verificar<Sessao>(cookie);
  if (!s || typeof s.exp !== "number" || s.exp <= Math.floor(agora / 1000)) return null;
  if (s.v === 1) return s;
  if (s.v === 2 && typeof s.conta === "string" && s.conta) return s;
  return null;
}

export function sessaoValida(cookie: unknown, agora = Date.now()): boolean {
  return lerSessao(cookie, agora) !== null;
}

/** Lê o cookie da requisição (rotas de API, sem NextRequest). */
export function sessaoDaRequisicao(requisicao: Request): Sessao | null {
  const bruto = requisicao.headers.get("cookie") ?? "";
  const par = bruto.split(";").map((p) => p.trim()).find((p) => p.startsWith(`${COOKIE_SESSAO}=`));
  if (!par) return null;
  return lerSessao(decodeURIComponent(par.slice(COOKIE_SESSAO.length + 1)));
}

/**
 * Só volta para dentro do Play ou para a "Minha conta" da loja (a conta é a
 * mesma nos dois): nunca para um endereço de fora (redirecionamento aberto).
 */
export function destinoSeguro(de: unknown): string {
  if (typeof de !== "string") return "/kambadaplay";
  if (de.startsWith("//") || de.includes("\\") || de.includes("://")) return "/kambadaplay";
  if (de === "/conta" || de.startsWith("/conta?")) return de.slice(0, 200);
  if (!de.startsWith("/kambadaplay")) return "/kambadaplay";
  if (/^\/kambadaplay\/(entrar|confirmar|redefinir|planos)/.test(de)) return "/kambadaplay";
  return de.slice(0, 200);
}

/** Arquivos estáticos (imagens, vídeo, .wasm) passam direto: o que fica atrás do login são as páginas e a API. */
export function ehArquivoEstatico(caminho: string): boolean {
  return /\.(?:webp|png|jpe?g|gif|svg|mp4|webm|wasm|js|css|json|ico|woff2?|glb)$/i.test(caminho);
}

export const ROTAS_PUBLICAS = [
  "/kambadaplay/entrar",
  "/kambadaplay/confirmar",
  "/kambadaplay/redefinir",
  // Planos ficam fora do login: escola e família precisam ver o preço antes de criar a conta.
  "/kambadaplay/planos",
  // Degustação sem cadastro: só o quiz no nível fácil, sem ranking (a API confere o nível e corta a prova).
  "/kambadaplay/experimente",
  "/api/play/quiz",
  "/api/play/entrar",
  "/api/play/sair",
  "/api/play/conta",
  // Exportação da base para o marketing: tem segredo próprio (REVALIDATE_SECRET), não passa pelo login.
  "/api/play/contas",
];
