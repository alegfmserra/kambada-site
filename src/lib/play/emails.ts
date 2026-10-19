import { enviarEmail, emailConfigurado } from "../email/enviar";
import { escaparHtml } from "../email/confirmacao";
import { tokenDeEmail, type Conta } from "./contas";

/**
 * E-mails do Kambada Play (confirmação de cadastro, redefinição de senha,
 * cupom do ranking). Saem pela mesma caixa da loja (`pedidos@`); se o
 * Alexandre criar `play@`, basta trocar EMAIL_SMTP_USUARIO.
 *
 * Sem SMTP configurado (máquina local, prévia), nada é enviado e a função
 * devolve o link — assim dá para testar o fluxo sem caixa de e-mail.
 */

function moldura(titulo: string, corpoHtml: string, rodape: string): string {
  return `<!doctype html><html lang="pt-BR"><body style="margin:0;background:#f3eee4;font-family:Arial,Helvetica,sans-serif;color:#1d1e20">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#1d1e20;padding:20px 24px;color:#ffcc29;font-size:20px;font-weight:bold">Kambada Play</td></tr>
<tr><td style="padding:24px"><h1 style="margin:0 0 12px;font-size:22px">${escaparHtml(titulo)}</h1>${corpoHtml}</td></tr>
<tr><td style="padding:16px 24px;background:#f3eee4;font-size:12px;color:#5e6266">${rodape}</td></tr>
</table></td></tr></table></body></html>`;
}

function botao(texto: string, link: string): string {
  return `<p style="margin:20px 0"><a href="${link}" style="display:inline-block;background:#ffcc29;color:#1d1e20;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:999px">${escaparHtml(texto)}</a></p><p style="font-size:12px;color:#5e6266;word-break:break-all">Se o botão não abrir, copie este endereço: ${link}</p>`;
}

export function linkDescadastro(base: string, conta: Conta): string {
  return `${base}/api/play/conta?acao=descadastrar&token=${encodeURIComponent(tokenDeEmail("descadastrar", conta.id))}`;
}

function rodapePadrao(base: string, conta: Conta): string {
  return `Você recebe este e-mail porque criou uma conta no Kambada Play (somoskambada.com.br). Para não receber novidades, <a href="${linkDescadastro(base, conta)}" style="color:#5e6266">clique aqui</a>. Somos Kambada LTDA · São Luís – MA.`;
}

export async function enviarConfirmacao(base: string, conta: Conta): Promise<{ enviado: boolean; link: string }> {
  const link = `${base}/kambadaplay/confirmar?token=${encodeURIComponent(tokenDeEmail("confirmar", conta.id))}`;
  if (!emailConfigurado()) return { enviado: false, link };
  await enviarEmail({
    para: conta.email,
    assunto: "Confirme seu e-mail no Kambada Play",
    texto: `Éguas, ${conta.nome}! Falta um passo: confirme seu e-mail abrindo este endereço (vale 48 horas):\n\n${link}\n\nSe você não criou esta conta, ignore esta mensagem.`,
    html: moldura(
      `Éguas, ${conta.nome}!`,
      `<p>Falta um passo para o seu cadastro no Kambada Play: confirme seu e-mail. O link vale por 48 horas.</p>${botao("Confirmar meu e-mail", link)}<p style="font-size:13px;color:#5e6266">Se você não criou esta conta, é só ignorar esta mensagem.</p>`,
      rodapePadrao(base, conta),
    ),
  });
  return { enviado: true, link };
}

export async function enviarRedefinicao(base: string, conta: Conta): Promise<{ enviado: boolean; link: string }> {
  const link = `${base}/kambadaplay/redefinir?token=${encodeURIComponent(tokenDeEmail("redefinir", conta))}`;
  if (!emailConfigurado()) return { enviado: false, link };
  await enviarEmail({
    para: conta.email,
    assunto: "Redefinir sua senha do Kambada Play",
    texto: `Olá, ${conta.nome}. Para criar uma nova senha, abra este endereço (vale 1 hora):\n\n${link}\n\nSe você não pediu, ignore esta mensagem — sua senha continua a mesma.`,
    html: moldura(
      "Nova senha",
      `<p>Olá, ${escaparHtml(conta.nome)}. Para criar uma nova senha, use o botão abaixo. O link vale por 1 hora.</p>${botao("Criar nova senha", link)}<p style="font-size:13px;color:#5e6266">Se você não pediu, ignore: sua senha continua a mesma.</p>`,
      rodapePadrao(base, conta),
    ),
  });
  return { enviado: true, link };
}

export async function enviarCupom(
  base: string,
  conta: Conta,
  premio: { codigo: string; percentual: number; posicao: number; validoAte: string },
): Promise<boolean> {
  if (!emailConfigurado() || !conta.confirmadoEm || !conta.novidades) return false;
  const [a, m, d] = premio.validoAte.split("-");
  const validade = `${d}/${m}/${a}`;
  await enviarEmail({
    para: conta.email,
    assunto: `Seu cupom de ${premio.percentual}% — ${premio.posicao}º lugar no Kambada Play`,
    texto: `Éguas, ${conta.nome}! Você ficou em ${premio.posicao}º lugar no ranking da semana e ganhou ${premio.percentual}% nas peças da loja.\n\nCupom: ${premio.codigo}\nVale até ${validade}, para uma compra (o frete não tem desconto).\n\nLoja: ${base}/loja`,
    html: moldura(
      `Éguas, ${conta.nome}! Você ficou em ${premio.posicao}º lugar`,
      `<p>Você está no top 3 do ranking da semana no Kambada Play e ganhou <strong>${premio.percentual}%</strong> nas peças da loja.</p><p style="font-size:28px;font-weight:bold;letter-spacing:3px;background:#1d1e20;color:#ffcc29;display:inline-block;padding:10px 18px;border-radius:8px">${escaparHtml(premio.codigo)}</p><p style="font-size:13px;color:#5e6266">Vale até ${validade}, para uma compra. O frete não tem desconto.</p>${botao("Usar na loja", `${base}/loja`)}`,
      rodapePadrao(base, conta),
    ),
  });
  return true;
}
