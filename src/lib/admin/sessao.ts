/**
 * Acesso à área de controle (/admin) — uma senha só, a da loja.
 *
 * A senha mora na variável ADMIN_SENHA (painel da Hostinger), escolhida pelo
 * Alexandre. Entrando, o navegador recebe um cookie com uma ASSINATURA derivada
 * da senha — nunca a senha em si. Trocar a senha no painel derruba todas as
 * sessões abertas, porque a assinatura deixa de bater.
 */

import { createHmac, timingSafeEqual } from "node:crypto";

export const COOKIE_ADMIN = "kambada_admin";
export const DURACAO_SESSAO_S = 12 * 60 * 60;

export function adminConfigurado(): boolean {
  return (process.env.ADMIN_SENHA ?? "").length >= 8;
}

function assinatura(): string {
  return createHmac("sha256", process.env.ADMIN_SENHA ?? "").update("kambada-admin-v1").digest("hex");
}

function iguais(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function senhaConfere(digitada: string): boolean {
  return adminConfigurado() && iguais(digitada, process.env.ADMIN_SENHA as string);
}

export function valorDoCookie(): string {
  return assinatura();
}

export function sessaoValida(cookie: string | undefined): boolean {
  return adminConfigurado() && Boolean(cookie) && iguais(cookie as string, assinatura());
}

/** 5 tentativas erradas a cada 15 minutos por IP. */
const JANELA_MS = 15 * 60 * 1000;
const tentativas = new Map<string, { inicio: number; erros: number }>();

export function podeTentar(ip: string): boolean {
  const t = tentativas.get(ip);
  if (!t || Date.now() - t.inicio > JANELA_MS) return true;
  return t.erros < 5;
}

export function registrarErro(ip: string): void {
  const t = tentativas.get(ip);
  if (!t || Date.now() - t.inicio > JANELA_MS) tentativas.set(ip, { inicio: Date.now(), erros: 1 });
  else t.erros += 1;
}
