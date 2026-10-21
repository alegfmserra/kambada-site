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
import { aquecerPaginas, type Aquecimento } from "./aquecer";
import { reconciliar, type Reconciliacao } from "./reconciliar";
import { enviarResumoDiario, gravarEstadoManutencao, lerEstadoManutencao, type ResumoEnviado } from "./resumoDiario";
import { enviarRelatoriosMensais, mesAnterior, type RelatorioEnviado } from "./relatorioCupons";

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

/**
 * Renova só quando faltar menos de 2 h. O token do Bling dura ~6 h: com folga de
 * 24 h (como era), TODA passada renovava — após cada deploy, a cada 6 h e a cada
 * cron —, multiplicando as chances de dois processos gastarem o mesmo refresh
 * token (queda de 21/10/2026). Entre uma passada e outra, quem precisa do Bling
 * renova sob demanda, com trava (lib/bling/tokens.ts).
 */
const FOLGA_RENOVACAO = 2 * 60 * 60 * 1000;

async function bling(): Promise<Saude["bling"]> {
  const tokens = await lerTokens();
  if (!tokens) return { ok: false, detalhe: "Bling não autorizado — abrir /api/bling/autorizar" };
  if (tokens.invalido) return { ok: false, detalhe: "Refresh token recusado pelo Bling — reautorizar em /api/bling/autorizar" };
  try {
    const r = await renovarSeVencerEm(FOLGA_RENOVACAO);
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
  let r = await conferirMelhorEnvio();
  // Sem resposta (HTTP 0) ou erro do lado deles é quase sempre um soluço: o
  // alerta de 21/10/2026 00:05 foi isso, e 1 min depois respondia. Confere de
  // novo antes de acusar.
  if (!r.ok && (r.status === 0 || r.status >= 500)) {
    await new Promise((ok) => setTimeout(ok, 20_000));
    r = await conferirMelhorEnvio();
  }
  if (r.ok) return { ok: true, detalhe: `conta ${r.conta}` };
  if (r.status === 401 || r.status === 403) {
    return { ok: false, detalhe: `HTTP ${r.status} — token vencido ou inválido; gerar novo no painel do Melhor Envio e colar em MELHORENVIO_TOKEN na Hostinger` };
  }
  return {
    ok: false,
    detalhe: `${r.status === 0 ? "sem resposta" : `HTTP ${r.status}`} do Melhor Envio em duas tentativas — instabilidade deles ou da rede, não do token. O site confere de novo em 6 h; testar a cotação no carrinho`,
  };
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

/**
 * Verifica tudo, reconcilia pagamentos × pedidos, manda o resumo do dia
 * quando é hora, e avisa a loja do que estiver errado (sem repetir em 6 h).
 */
export async function rotinaDeManutencao(
  opcoes: { forcarResumo?: boolean; relatorioMes?: string } = {},
): Promise<
  Saude & {
    alertas: Record<string, string>;
    reconciliacao: Reconciliacao;
    resumo: ResumoEnviado | { enviado: false; motivo: string };
    relatorioMensal: RelatorioEnviado | { enviado: false; motivo: string };
    aquecimento: Aquecimento | { paginas: 0; motivo: string };
  }
> {
  const s = await verificarSaude();
  const alertas: Record<string, string> = {};

  const reconciliacao = await reconciliar(48);
  if (reconciliacao.pendentes.length) {
    alertas.reconciliacao = await alertar(
      "reconciliacao",
      "Pagamento aprovado sem pedido",
      `${reconciliacao.pendentes.length} pagamento(s) aprovado(s) no Mercado Pago sem pedido no site:\n` +
        reconciliacao.pendentes.map((p) => `• pagamento ${p.pagamentoId}${p.ref ? ` (${p.ref})` : ""} — ${p.motivo}`).join("\n") +
        "\n\nConferir no painel do Mercado Pago e no Bling. O site tentou processar e não conseguiu.",
    );
  }
  if (reconciliacao.recuperados.length) {
    alertas.recuperados = await alertar(
      `recuperados-${reconciliacao.recuperados.map((r) => r.ref).join(",")}`,
      "Pedido recuperado pela reconciliação",
      "Pagamento aprovado que não tinha virado pedido foi processado agora:\n" +
        reconciliacao.recuperados.map((r) => `• ${r.ref} (pagamento ${r.pagamentoId})`).join("\n"),
    );
  }

  let resumo: ResumoEnviado | { enviado: false; motivo: string };
  try {
    resumo = await enviarResumoDiario({ forcar: opcoes.forcarResumo });
  } catch (e) {
    resumo = { enviado: false, motivo: e instanceof Error ? e.message : String(e) };
  }

  // Relatório mensal por cupom: uma vez por mês (o do mês anterior), ou forçado.
  let relatorioMensal: RelatorioEnviado | { enviado: false; motivo: string } = { enviado: false, motivo: "não é hora" };
  try {
    const mes = opcoes.relatorioMes ?? mesAnterior();
    const estado = await lerEstadoManutencao();
    if (opcoes.relatorioMes || estado.ultimoRelatorioMensal !== mes) {
      relatorioMensal = await enviarRelatoriosMensais(mes);
      if (relatorioMensal.enviado && !opcoes.relatorioMes) await gravarEstadoManutencao({ ...estado, ultimoRelatorioMensal: mes });
    }
  } catch (e) {
    relatorioMensal = { enviado: false, motivo: e instanceof Error ? e.message : String(e) };
  }
  const url = (process.env.URL_DO_SITE ?? "https://somoskambada.com.br").replace(/\/+$/, "");

  if (!s.bling.ok) alertas.bling = await alertar("bling", "Bling desconectado", `${s.bling.detalhe}\n\nSem o Bling, o checkout não cria pedido. Reautorizar: ${url}/api/bling/autorizar`);
  if (!s.melhorEnvio.ok) alertas.melhorEnvio = await alertar("melhor-envio", "Melhor Envio fora", `${s.melhorEnvio.detalhe}.\n\nEnquanto durar, o carrinho só oferece a retirada no ateliê.`);
  if (!s.mercadoPago.ok) alertas.mercadoPago = await alertar("mercado-pago", "Mercado Pago com credencial inválida", `${s.mercadoPago.detalhe}\n\nSem ele, ninguém consegue pagar.`);
  if (!s.email.ok) alertas.email = await alertar("smtp", "E-mail da loja não autentica", s.email.detalhe);
  if (!s.pedidosComFalha.ok && s.pedidosComFalha.refs.length) {
    alertas.pedidos = await alertar(
      "pedidos-falha",
      "Pedidos com etapa falhada",
      `${s.pedidosComFalha.detalhe}: ${s.pedidosComFalha.refs.join(", ")}\n\nAbra ${url}/admin/pedidos e use "Refazer pendências".`,
    );
  }
  // Páginas de produto prontas antes do próximo visitante (ver aquecer.ts).
  let aquecimento: Aquecimento | { paginas: 0; motivo: string };
  try {
    aquecimento = await aquecerPaginas(url);
  } catch (e) {
    aquecimento = { paginas: 0, motivo: e instanceof Error ? e.message : String(e) };
  }

  return { ...s, alertas, reconciliacao, resumo, relatorioMensal, aquecimento };
}
