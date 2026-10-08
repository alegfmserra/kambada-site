/**
 * Envio de e-mail pelo Gmail da Kambada (SMTP com senha de app).
 *
 * Decisão do Alexandre (08/10/2026): remetente somoskambada@gmail.com. A senha
 * é uma "senha de app" do Google, criada por ele e colada no painel da
 * Hostinger — nunca no código. Sem as duas variáveis, o envio simplesmente não
 * acontece (e o pedido segue normal).
 *
 *   EMAIL_SMTP_USUARIO   somoskambada@gmail.com
 *   EMAIL_SMTP_SENHA     a senha de app de 16 letras
 *
 * O Gmail guarda uma cópia de cada envio na pasta "Enviados" da conta — é o
 * histórico de quem recebeu o quê.
 */

import nodemailer from "nodemailer";

export function emailConfigurado(): boolean {
  return Boolean(process.env.EMAIL_SMTP_USUARIO && process.env.EMAIL_SMTP_SENHA);
}

let transporte: nodemailer.Transporter | null = null;

function obterTransporte(): nodemailer.Transporter {
  if (!transporte) {
    transporte = nodemailer.createTransport({
      host: process.env.EMAIL_SMTP_HOST ?? "smtp.gmail.com",
      port: Number(process.env.EMAIL_SMTP_PORTA ?? 465),
      secure: true,
      auth: {
        user: process.env.EMAIL_SMTP_USUARIO,
        // A senha de app do Google é exibida com espaços; o SMTP quer sem.
        pass: (process.env.EMAIL_SMTP_SENHA ?? "").replace(/\s+/g, ""),
      },
      connectionTimeout: 15_000,
      socketTimeout: 20_000,
    });
  }
  return transporte;
}

export async function enviarEmail(m: {
  para: string;
  assunto: string;
  texto: string;
  html: string;
}): Promise<void> {
  if (!emailConfigurado()) throw new Error("e-mail não configurado");
  await obterTransporte().sendMail({
    from: { name: "Kambada", address: process.env.EMAIL_SMTP_USUARIO as string },
    to: m.para,
    subject: m.assunto,
    text: m.texto,
    html: m.html,
  });
}

/** Confere usuário e senha sem mandar nada — usado no diagnóstico. */
export async function conferirEmail(): Promise<{ ok: boolean; detalhe?: string }> {
  if (!emailConfigurado()) return { ok: false, detalhe: "variáveis ausentes" };
  try {
    await obterTransporte().verify();
    return { ok: true };
  } catch (e) {
    // Mensagem do servidor sem a senha: o nodemailer não a inclui no erro.
    return { ok: false, detalhe: e instanceof Error ? e.message.slice(0, 200) : String(e) };
  }
}
