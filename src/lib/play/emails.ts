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

/** `lembrete`: o reenvio automático 24 h depois do cadastro (assunto e abertura próprios). */
export async function enviarConfirmacao(
  base: string,
  conta: Conta,
  lembrete = false,
): Promise<{ enviado: boolean; link: string }> {
  const link = `${base}/kambadaplay/confirmar?token=${encodeURIComponent(tokenDeEmail("confirmar", conta.id))}`;
  if (!emailConfigurado()) return { enviado: false, link };
  const abertura = lembrete
    ? "Seu cadastro na Kambada ficou pela metade: falta confirmar o e-mail"
    : "Falta um passo para o seu cadastro no Kambada Play: confirme seu e-mail";
  await enviarEmail({
    remetente: "Kambada Play",
    descadastro: linkDescadastro(base, conta),
    para: conta.email,
    assunto: lembrete ? "Falta só confirmar seu e-mail na Kambada" : "Confirme seu e-mail no Kambada Play",
    texto: `Éguas, ${conta.nome}! ${abertura}. Abra este endereço (vale 48 horas):\n\n${link}\n\nSe você não criou esta conta, ignore esta mensagem.`,
    html: moldura(
      `Éguas, ${conta.nome}!`,
      `<p>${abertura}. O link vale por 48 horas.</p>${botao("Confirmar meu e-mail", link)}<p style="font-size:13px;color:#5e6266">Se você não criou esta conta, é só ignorar esta mensagem.</p>`,
      rodapePadrao(base, conta),
    ),
  });
  return { enviado: true, link };
}

// ---------------------------------------------------------------------------
// Fluxo de aniversário (02/11/2026): 1) aviso "falta uma semana", 2) parabéns com
// cupom de 15 % no dia, 3) lembrete de validade se o cupom não foi usado.
// Só vai a quem tem e-mail confirmado e aceitou novidades; `teste` ignora isso e põe
// "[TESTE]" no assunto (usado só para o Alexandre ver as mensagens no próprio e-mail).
// ---------------------------------------------------------------------------

type OpcoesAniversario = { teste?: boolean };

const podeReceber = (c: Conta, o: OpcoesAniversario) =>
  emailConfigurado() && (o.teste || (c.confirmadoEm && c.novidades && !c.descadastradoEm && !c.usuario && !c.demo));

const primeiroNome = (c: Conta) => c.nome.trim().split(/\s+/)[0] ?? c.nome;
const dataBr = (iso: string) => iso.split("-").reverse().join("/");
const cupomEmDestaque = (codigo: string) =>
  `<p style="font-size:28px;font-weight:bold;letter-spacing:3px;background:#1d1e20;color:#ffcc29;display:inline-block;padding:10px 18px;border-radius:8px">${escaparHtml(codigo)}</p>`;

/** 1) Uma semana antes: o dia está chegando e um presente vem junto. `diaMes` = "24/11". */
export async function enviarAvisoAniversario(base: string, conta: Conta, diaMes: string, opcoes: OpcoesAniversario = {}): Promise<boolean> {
  if (!podeReceber(conta, opcoes)) return false;
  const nome = primeiroNome(conta);
  const prefixo = opcoes.teste ? "[TESTE] " : "";
  await enviarEmail({
    remetente: "Kambada",
    descadastro: linkDescadastro(base, conta),
    para: conta.email,
    assunto: `${prefixo}Falta uma semana para o seu dia, ${nome}! 🎉`,
    texto: `Éguas, ${nome}! O seu aniversário (${diaMes}) está chegando e a gente não deixa passar em branco.\n\nNo dia, vai chegar aqui na sua caixa de entrada um presente da Kambada: 15% de desconto nas peças da loja, só seu.\n\nEnquanto o dia não chega, vá espiando a loja e escolhendo o que vai levar:\n${base}/loja\n\nUm abraço de todo mundo da Kambada.`,
    html: moldura(
      `Éguas, ${nome}! Falta uma semana 🎉`,
      `<p>O seu aniversário (<strong>${escaparHtml(diaMes)}</strong>) está chegando e a gente não deixa passar em branco.</p><p>No dia, vai chegar aqui na sua caixa de entrada um <strong>presente da Kambada</strong>: <strong>15% de desconto</strong> nas peças da loja, só seu.</p><p>Enquanto o dia não chega, vá espiando a loja e escolhendo o que vai levar. Se der saudade da brincadeira, o Kambada Play também está de portas abertas.</p>${botao("Espiar a loja", `${base}/loja`)}<p style="font-size:13px;color:#5e6266">Um abraço de todo mundo da Kambada.</p>`,
      rodapePadrao(base, conta),
    ),
  });
  return true;
}

/** 2) No dia: parabéns e o cupom de aniversário (15 %). */
export async function enviarAniversario(
  base: string,
  conta: Conta,
  cupom: { codigo: string; percentual: number; validoAte: string },
  opcoes: OpcoesAniversario = {},
): Promise<boolean> {
  if (!podeReceber(conta, opcoes)) return false;
  const validade = dataBr(cupom.validoAte);
  const nome = primeiroNome(conta);
  const prefixo = opcoes.teste ? "[TESTE] " : "";
  await enviarEmail({
    remetente: "Kambada",
    descadastro: linkDescadastro(base, conta),
    para: conta.email,
    assunto: `${prefixo}Parabéns, ${nome}! Um presente da Kambada para o seu dia 🎁`,
    texto: `Parabéns, ${nome}! Feliz aniversário!\n\nA Kambada deseja um dia lindo, cheio de festa e de cultura do Maranhão. Para celebrar, separamos um presente: ${cupom.percentual}% de desconto nas peças da loja.\n\nCupom: ${cupom.codigo}\nVale até ${validade}, para uma compra (o frete não tem desconto).\n\nLoja: ${base}/loja`,
    html: moldura(
      `Parabéns, ${nome}! 🎉`,
      `<p>Feliz aniversário, ${escaparHtml(nome)}! A Kambada deseja um dia lindo, cheio de festa e de cultura do Maranhão.</p><p>Para celebrar, separamos um presente: <strong>${cupom.percentual}% de desconto</strong> nas peças da loja.</p>${cupomEmDestaque(cupom.codigo)}<p style="font-size:13px;color:#5e6266">Vale até ${validade}, para uma compra. O frete não tem desconto.</p>${botao("Usar meu presente", `${base}/loja`)}`,
      rodapePadrao(base, conta),
    ),
  });
  return true;
}

/** 3) Uma semana antes de o cupom vencer, se ainda não foi usado. */
export async function enviarLembreteCupomAniversario(
  base: string,
  conta: Conta,
  cupom: { codigo: string; percentual: number; validoAte: string },
  opcoes: OpcoesAniversario = {},
): Promise<boolean> {
  if (!podeReceber(conta, opcoes)) return false;
  const validade = dataBr(cupom.validoAte);
  const nome = primeiroNome(conta);
  const prefixo = opcoes.teste ? "[TESTE] " : "";
  await enviarEmail({
    remetente: "Kambada",
    descadastro: linkDescadastro(base, conta),
    para: conta.email,
    assunto: `${prefixo}${nome}, o seu presente de aniversário ainda está te esperando 🎁`,
    texto: `Oi, ${nome}! O seu cupom de aniversário de ${cupom.percentual}% vale até ${validade} e ainda não foi usado.\n\nCupom: ${cupom.codigo}\n\nÉ só colocar no carrinho: ${base}/loja\n\nSe já escolheu, aproveite. Se não, ainda dá tempo!`,
    html: moldura(
      `Seu presente ainda está esperando 🎁`,
      `<p>Oi, ${escaparHtml(nome)}! O seu cupom de aniversário de <strong>${cupom.percentual}%</strong> vale até <strong>${validade}</strong> e ainda não foi usado.</p>${cupomEmDestaque(cupom.codigo)}<p style="font-size:13px;color:#5e6266">Uso único, nas peças da loja (o frete não tem desconto).</p>${botao("Escolher minha peça", `${base}/loja`)}`,
      rodapePadrao(base, conta),
    ),
  });
  return true;
}

export async function enviarRedefinicao(base: string, conta: Conta): Promise<{ enviado: boolean; link: string }> {
  const link = `${base}/kambadaplay/redefinir?token=${encodeURIComponent(tokenDeEmail("redefinir", conta))}`;
  if (!emailConfigurado()) return { enviado: false, link };
  await enviarEmail({
    remetente: "Kambada Play",
    descadastro: linkDescadastro(base, conta),
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
    remetente: "Kambada Play",
    descadastro: linkDescadastro(base, conta),
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
