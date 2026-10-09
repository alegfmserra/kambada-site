/**
 * Envio de e-mail da loja por SMTP.
 *
 * Remetente (09/10/2026): pedidos@somoskambada.com.br, caixa criada pelo
 * Alexandre na Hostinger só para os pedidos confirmados. A senha da caixa fica
 * no painel da Hostinger — nunca no código. Sem as variáveis, o envio
 * simplesmente não acontece (e o pedido segue normal).
 *
 *   EMAIL_SMTP_USUARIO   pedidos@somoskambada.com.br
 *   EMAIL_SMTP_SENHA     a senha da caixa
 *   EMAIL_SMTP_HOST      opcional — o padrão sai do domínio do usuário:
 *                        @gmail.com → smtp.gmail.com; qualquer outro →
 *                        smtp.hostinger.com (onde mora o domínio da loja)
 *   EMAIL_COPIA_LOJA     opcional — quem recebe o aviso de cada venda
 *                        (padrão: somoskambada@gmail.com)
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import nodemailer from "nodemailer";

export function emailConfigurado(): boolean {
  return Boolean(process.env.EMAIL_SMTP_USUARIO && process.env.EMAIL_SMTP_SENHA);
}

export function emailDaLoja(): string {
  return process.env.EMAIL_COPIA_LOJA?.trim() || "somoskambada@gmail.com";
}

function hostPadrao(usuario: string): string {
  return /@gmail\.com$/i.test(usuario) ? "smtp.gmail.com" : "smtp.hostinger.com";
}

let transporte: nodemailer.Transporter | null = null;

function obterTransporte(): nodemailer.Transporter {
  if (!transporte) {
    const usuario = process.env.EMAIL_SMTP_USUARIO ?? "";
    transporte = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST || hostPadrao(usuario),
      port: Number(process.env.EMAIL_SMTP_PORTA ?? 465),
      secure: true,
      auth: {
        user: usuario,
        // A senha de app do Google é exibida com espaços; o SMTP quer sem.
        pass: (process.env.EMAIL_SMTP_SENHA ?? "").replace(/\s+/g, ""),
      },
      connectionTimeout: 15_000,
      socketTimeout: 20_000,
    });
  }
  return transporte;
}

/** A logo vai DENTRO do e-mail (anexo inline): aparece mesmo sem baixar imagens. */
export const CID_LOGO = "logo-kambada";

let logoEmCache: Buffer | null | undefined;
async function logo(): Promise<Buffer | null> {
  if (logoEmCache !== undefined) return logoEmCache;
  try {
    logoEmCache = await readFile(join(process.cwd(), "public", "marca", "logo-email.png"));
  } catch {
    logoEmCache = null; // sem o arquivo, o e-mail sai com o nome em texto
  }
  return logoEmCache;
}

export async function enviarEmail(m: {
  para: string;
  assunto: string;
  texto: string;
  html: string;
  responderPara?: string;
}): Promise<void> {
  if (!emailConfigurado()) throw new Error("e-mail não configurado");
  const imagem = await logo();
  await obterTransporte().sendMail({
    from: { name: "Kambada — Pedidos", address: process.env.EMAIL_SMTP_USUARIO as string },
    to: m.para,
    replyTo: m.responderPara,
    subject: m.assunto,
    text: m.texto,
    html: m.html,
    attachments: imagem ? [{ filename: "kambada.png", content: imagem, cid: CID_LOGO }] : [],
  });
}

/** Confere usuário e senha sem mandar nada — usado no diagnóstico. */
export async function conferirEmail(): Promise<{ ok: boolean; remetente?: string; detalhe?: string }> {
  if (!emailConfigurado()) return { ok: false, detalhe: "variáveis ausentes" };
  try {
    await obterTransporte().verify();
    return { ok: true, remetente: process.env.EMAIL_SMTP_USUARIO };
  } catch (e) {
    // Mensagem do servidor sem a senha: o nodemailer não a inclui no erro.
    return { ok: false, detalhe: e instanceof Error ? e.message.slice(0, 200) : String(e) };
  }
}
