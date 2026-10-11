/**
 * Saúde e manutenção do site — o que precisa continuar vivo sem ninguém olhar.
 *
 * Problema (auditoria de 10/10/2026): o refresh token do Bling (30 dias) e o
 * token do Melhor Envio (30 dias) só eram usados sob demanda. Um período sem
 * venda derrubava cotação e checkout em silêncio.
 *
 * Solução: `rotinaDeManutencao()` roda a cada 6 h (timer do processo em
 * instrumentation.ts + cron externo chamando /api/manutencao) e
 *  1. renova o token do Bling se faltar menos de 24 h — isso também rotaciona
 *     o refresh token, que nunca mais chega perto dos 30 dias;
 *  2. confere o Melhor Envio, o Mercado Pago e o SMTP;
 *  3. conta pedidos com etapa falhada;
 *  4. manda alerta por e-mail quando algo está errado.
 * `/api/saude` expõe só ok/não-ok (200/503) para um monitor externo.
 */

import { lerTokens, renovarSeVencerEm } from "../bling/tokens";
import { conferirEmail, emailConfigurado } from "../email/enviar";
import { conferirMelhorEnvio, freteConfigurado } from "../frete/melhorEnvio";
import { conferirChave, mercadoPagoConfigurado } from "../mercadopago/cliente";
import { listarRegistros } from "../pedidos/registro";
import { alertar } from "./alertas";

export type Item = { ok: boolean; detalhe: string };
export type Saude = {
  ok: boolean;
  verificadoEm: string;
  bling: Item & { expiraEm?: string; renovouAgora?: boolean };
  melhorEnvio: Item;
  mercadoPago: Item;
  email: Item;
  pedidosComFalha: Item & { refs: string[] };
};

const UM_DIA = 24 * 60 * 60 * 1000;

async function bling(): Promise<Saude["bling"]> {
  const tokens = await lerTokens();
  if (!tokens) return { ok: false, detalhe: "Bling não autorizado — abrir /api/bling/autorizar" };
  if (tokens.invalido) return { ok: false, detalhe: "Refresh token recusado pelo Bling — reautorizar em /api/bling/autorizar" };
  try {
    const r = await renovarSeVencerEm(UM_DIA);
    return {
      ok: true,
      detalhe: r.renovou ? "token renovado agora" : "token válido",
      expiraEm: new Date(r.expiraEm).toISOString(),
      renovouAgora: r.renovou,
    };
  } catch (e) {
    return { ok: false, detalhe: `renovação falhou: ${e instanceof Error ? e.message : String(e)}` };
  }
}

async function melhorEnvio(): Promise<Item> {
  if (!freteConfigurado()) return { ok: false, detalhe: "MELHORENVIO_TOKEN ausente" };
  const r = await conferirMelhorEnvio();
  return r.ok ? { ok: true, detalhe: `conta ${r.conta}` } : { ok: false, detalhe: `HTTP ${r.status} — token vencido ou inválido; gerar novo no painel do Melhor Envio` };
}

async function mercadoPago(): Promise<Item> {
  if (!mercadoPagoConfigurado()) return { ok: false, detalhe: "MERCADOPAGO_ACCESS_TOKEN ausente" };
  const r = await conferirChave();
  return r.ok ? { ok: true, detalhe: `ambiente ${r.ambiente}` } : { ok: false, detalhe: `HTTP ${r.status} ${r.detalhe ?? ""}`.trim() };
}

async function email(): Promise<Item> {
  if (!emailConfigurado()) return { ok: false, detalhe: "SMTP não configurado" };
  const r = await conferirEmail();
  return r.ok ? { ok: true, detalhe: r.remetente ?? "ok" } : { ok: false, detalhe: r.detalhe ?? "falhou" };
}

async function pedidosComFalha(): Promise<Saude["pedidosComFalha"]> {
  try {
    const registros = await listarRegistros(100);
    const refs = registros
      .filter((r) => r.estoque?.erro || r.email?.erro || r.emailLoja?.erro || r.nfe?.erro || r.emailNota?.erro)
      .map((r) => r.ref);
    return { ok: refs.length === 0, detalhe: refs.length ? `${refs.length} pedido(s) com etapa falhada` : "nenhum", refs };
  } catch (e) {
    return { ok: false, detalhe: `não consegui ler os pedidos: ${e instanceof Error ? e.message : String(e)}`, refs: [] };
  }
}

export async function verificarSaude(): Promise<Saude> {
  const [b, me, mp, em, pf] = await Promise.all([bling(), melhorEnvio(), mercadoPago(), email(), pedidosComFalha()]);
  return {
    ok: b.ok && me.ok && mp.ok && em.ok,
    verificadoEm: new Date().toISOString(),
    bling: b,
    melhorEnvio: me,
    mercadoPago: mp,
    email: em,
    pedidosComFalha: pf,
  };
}

/** Verifica tudo e avisa a loja do que estiver errado (sem repetir em 6 h). */
export async function rotinaDeManutencao(): Promise<Saude & { alertas: Record<string, string> }> {
  const s = await verificarSaude();
  const alertas: Record<string, string> = {};
  const url = (process.env.URL_DO_SITE ?? "https://maroon-heron-459360.hostingersite.com").replace(/\/+$/, "");

  if (!s.bling.ok) alertas.bling = await alertar("bling", "Bling desconectado", `${s.bling.detalhe}\n\nSem o Bling, o checkout não cria pedido. Reautorizar: ${url}/api/bling/autorizar`);
  if (!s.melhorEnvio.ok) alertas.melhorEnvio = await alertar("melhor-envio", "Melhor Envio fora", `${s.melhorEnvio.detalhe}\n\nSem ele, o cliente de fora de São Luís só vê a retirada no ateliê. Gerar token novo no painel do Melhor Envio e colar em MELHORENVIO_TOKEN na Hostinger.`);
  if (!s.mercadoPago.ok) alertas.mercadoPago = await alertar("mercado-pago", "Mercado Pago com credencial inválida", `${s.mercadoPago.detalhe}\n\nSem ele, ninguém consegue pagar.`);
  if (!s.email.ok) alertas.email = await alertar("smtp", "E-mail da loja não autentica", s.email.detalhe);
  if (!s.pedidosComFalha.ok && s.pedidosComFalha.refs.length) {
    alertas.pedidos = await alertar(
      "pedidos-falha",
      "Pedidos com etapa falhada",
      `${s.pedidosComFalha.detalhe}: ${s.pedidosComFalha.refs.join(", ")}\n\nAbra ${url}/admin/pedidos e use "Refazer pendências".`,
    );
  }
  return { ...s, alertas };
}
