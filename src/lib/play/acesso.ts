import { createHash, timingSafeEqual } from "node:crypto";
import { assinar, verificar } from "./jogos/seguranca";

/**
 * Acesso ao Kambada Play (login provisório).
 *
 * Por enquanto o Play é fechado: quem entra usa um login e uma senha únicos,
 * definidos pelo Alexandre. Valores padrão: "somoskambada" para os dois. Em
 * produção, defina PLAY_LOGIN e PLAY_SENHA no servidor para trocá-los sem mexer
 * no código — e troque a senha padrão antes de abrir o Play ao público.
 *
 * Depois do login o navegador recebe um cookie assinado e com validade; o
 * `proxy` confere esse cookie antes de qualquer página ou API do Play.
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

type Sessao = { v: 1; exp: number };

export function criarSessao(agora = Date.now()): string {
  const s: Sessao = { v: 1, exp: Math.floor(agora / 1000) + VALIDADE_SESSAO_S };
  return assinar(s);
}

export function sessaoValida(cookie: unknown, agora = Date.now()): boolean {
  const s = verificar<Sessao>(cookie);
  return !!s && s.v === 1 && typeof s.exp === "number" && s.exp > Math.floor(agora / 1000);
}

/** Só volta para dentro do Play: nunca para um endereço de fora (redirecionamento aberto). */
export function destinoSeguro(de: unknown): string {
  if (typeof de !== "string") return "/kambadaplay";
  if (!de.startsWith("/kambadaplay") || de.startsWith("//") || de.includes("\\") || de.includes("://")) {
    return "/kambadaplay";
  }
  if (de.startsWith("/kambadaplay/entrar")) return "/kambadaplay";
  return de.slice(0, 200);
}

/** Arquivos estáticos (imagens, vídeo, .wasm) passam direto: o que fica atrás do login são as páginas e a API. */
export function ehArquivoEstatico(caminho: string): boolean {
  return /\.(?:webp|png|jpe?g|gif|svg|mp4|webm|wasm|js|css|json|ico|woff2?|glb)$/i.test(caminho);
}

export const ROTAS_PUBLICAS = ["/kambadaplay/entrar", "/api/play/entrar", "/api/play/sair"];
