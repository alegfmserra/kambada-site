/**
 * Tudo o que o site guarda, num lugar só, para a área de controle (Alexandre,
 * 21/10/2026): "tudo precisa estar no painel e a gente precisa extrair isso de
 * uma forma mais tranquila".
 *
 * - `reunirDados()`: lê pedidos, contas, pesquisa, cupons e placar do Play.
 * - `montarPlanilha()`: a planilha Excel única do botão "Baixar tudo".
 *
 * Só a área de controle (senha) chama isto — não há link público nem segredo
 * em endereço. Senhas das contas NUNCA entram (nem o hash).
 */

import ExcelJS from "exceljs";
import { listarCupons, type Cupom } from "../cupons/cupons";
import { etapaDoPedido } from "../pedidos/cancelamento";
import { listarRegistros, type RegistroPedido } from "../pedidos/registro";
import { listarRespostas, resumir, ROTULOS, type Resposta } from "../pesquisa/pesquisa";
import { listarContas, type Conta } from "../play/contas";
import { dadosDoPlacar, type Pontuacao, type PremioEmitido } from "../play/jogos/placar";

export type Dados = {
  pedidos: RegistroPedido[];
  contas: Conta[];
  respostas: Resposta[];
  cupons: Cupom[];
  pontuacoes: Pontuacao[];
  premios: PremioEmitido[];
};

export async function reunirDados(): Promise<Dados> {
  const [pedidos, contas, respostas, cupons, placar] = await Promise.all([
    listarRegistros(10000),
    listarContas(),
    listarRespostas(),
    listarCupons(),
    dadosDoPlacar(),
  ]);
  return { pedidos, contas, respostas, cupons, pontuacoes: placar.pontuacoes, premios: placar.premios };
}

const rotulo = (v: string | undefined) => (v ? (ROTULOS[v] ?? v) : "");
const data = (iso?: string) => (iso ? new Date(iso).toLocaleString("pt-BR", { timeZone: "America/Fortaleza" }) : "");
/** Texto livre que começa com =, +, - ou @ viraria fórmula na planilha. */
const seguro = (s: string | undefined) => (s && /^[=+\-@]/.test(s) ? `'${s}` : (s ?? ""));

const cancelado = (r: RegistroPedido) => Boolean(r.cancelamento?.concluidoEm || r.estorno);

/** Os números da aba "Resumo" e do topo da página Dados. */
export function resumoGeral(d: Dados) {
  const pagos = d.pedidos.filter((r) => !cancelado(r));
  const pesquisa = resumir(d.respostas);
  const sugestoes = d.respostas.filter((r) => r.sugestao).length;
  return {
    pedidos: d.pedidos.length,
    pedidosValidos: pagos.length,
    faturado: Math.round(pagos.reduce((s, r) => s + r.total, 0) * 100) / 100,
    cancelados: d.pedidos.length - pagos.length,
    contas: d.contas.length,
    contasConfirmadas: d.contas.filter((c) => c.confirmadoEm).length,
    aceitamNovidades: d.contas.filter((c) => c.novidades && c.confirmadoEm && !c.descadastradoEm).length,
    respostas: pesquisa.total,
    notaMedia: pesquisa.notaMedia,
    assinaria: pesquisa.assinaria,
    valorPlay: pesquisa.valorPlay,
    origem: pesquisa.origem,
    curtiu: pesquisa.curtiu,
    mit: pesquisa.mit,
    sugestoes,
    cupons: d.cupons.length,
    cuponsAtivos: d.cupons.filter((c) => c.ativo).length,
    partidasPlay: d.pontuacoes.length,
    jogadoresPlay: new Set(d.pontuacoes.map((p) => p.jogador)).size,
    premiosPlay: d.premios.length,
  };
}

const PRETO = "FF201E1F";
const AMARELO = "FFFFD72B";

function aba(wb: ExcelJS.Workbook, nome: string, colunas: { header: string; key: string; width: number }[], linhas: Record<string, unknown>[]) {
  const ws = wb.addWorksheet(nome);
  ws.columns = colunas;
  ws.getRow(1).eachCell((c) => {
    c.font = { name: "Arial", size: 10, bold: true, color: { argb: AMARELO } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRETO } };
  });
  ws.views = [{ state: "frozen", ySplit: 1 }];
  for (const l of linhas) ws.addRow(l).font = { name: "Arial", size: 10 };
  if (linhas.length) ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: colunas.length } };
  return ws;
}

export async function montarPlanilha(d: Dados, agora = new Date()): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Site Kambada";
  const r = resumoGeral(d);

  const res = wb.addWorksheet("Resumo", { properties: { tabColor: { argb: AMARELO } } });
  res.columns = [{ width: 46 }, { width: 22 }];
  res.addRow([`KAMBADA · dados do site — ${data(agora.toISOString())}`]).font = { name: "Arial", size: 13, bold: true };
  res.addRow(["Área de controle · uso interno · contém dados pessoais (LGPD): não repassar."]).font = { name: "Arial", size: 9, italic: true };
  res.addRow([]);
  const blocos: [string, unknown][] = [
    ["Pedidos registrados", r.pedidos],
    ["Pedidos válidos (sem cancelados)", r.pedidosValidos],
    ["Faturado no site, sem cancelados (R$)", r.faturado],
    ["Pedidos cancelados/estornados", r.cancelados],
    ["Contas criadas (loja + Play)", r.contas],
    ["Contas com e-mail confirmado", r.contasConfirmadas],
    ["Aceitam receber novidades", r.aceitamNovidades],
    ["Respostas da pesquisa de satisfação", r.respostas],
    ["Nota média do site (1 a 5)", r.notaMedia ?? "—"],
    ["Sugestões de conteúdo recebidas", r.sugestoes],
    ["Cupons cadastrados (ativos)", `${r.cupons} (${r.cuponsAtivos})`],
    ["Partidas no Kambada Play", r.partidasPlay],
    ["Jogadores no Kambada Play", r.jogadoresPlay],
    ["Prêmios do ranking emitidos", r.premiosPlay],
  ];
  for (const [k, v] of blocos) res.addRow([k, v]).font = { name: "Arial", size: 10 };
  res.addRow([]);
  res.addRow(["Assinaria o Kambada Play? (indicativo de pagamento)"]).font = { name: "Arial", size: 10, bold: true };
  for (const [k, v] of Object.entries(r.assinaria)) res.addRow([`  ${k}`, v]).font = { name: "Arial", size: 10 };
  res.addRow(["Quanto vale o Play para você?"]).font = { name: "Arial", size: 10, bold: true };
  for (const [k, v] of Object.entries(r.valorPlay)) res.addRow([`  ${k}`, v]).font = { name: "Arial", size: 10 };
  res.addRow(["Como conheceu a Kambada"]).font = { name: "Arial", size: 10, bold: true };
  for (const [k, v] of Object.entries(r.origem)) res.addRow([`  ${k}`, v]).font = { name: "Arial", size: 10 };
  res.addRow([]);
  res.addRow(["Indicadores MIT / MaraInTech vindos da pesquisa (n = quem respondeu a pergunta)"]).font = { name: "Arial", size: 10, bold: true };
  const m = r.mit;
  const linhasMit: [string, unknown][] = [
    ["F1.2 Confirmam a dor — n", m.F1_2_confirmaDor.n],
    ["F1.2 Confirmam a dor — % (só 'Sim, falta')", m.F1_2_confirmaDor.pct ?? "—"],
    ["F2.2 Conseguiram sem ajuda — n", m.F2_2_conseguiu.n],
    ["F2.2 Conseguiram sem ajuda — % (autodeclarado)", m.F2_2_conseguiu.pctSemAjuda ?? "—"],
    ["F2.3 NPS do Play — n", m.F2_3_nps.n],
    ["F2.3 NPS do Play (promotores − detratores, %)", m.F2_3_nps.nps ?? "—"],
    ["F2.5 Toparam participar de testes", m.F2_5_topaTeste.sim],
    ["F3.2/F3.7 Responderam sobre cargo de direção", m.F3_2_F3_7_instituicoes.respondeuCargoDirecao],
    ["F3.2/F3.7 Com cargo de direção", m.F3_2_F3_7_instituicoes.comCargoDirecao],
    ["F3.2/F3.7 Instituições distintas citadas", m.F3_2_F3_7_instituicoes.distintas],
    ["F3.2/F3.7 Gestores que deixaram contato", m.F3_2_F3_7_instituicoes.comContato],
  ];
  for (const [k, v] of linhasMit) res.addRow([`  ${k}`, v]).font = { name: "Arial", size: 10 };
  const blocosMit: [string, Record<string, number>][] = [
    ["F1.3 Frequência de busca (12 meses)", m.F1_3_frequencia.distribuicao],
    ["F2.7/I7 Aprendeu algo novo", m.F2_7_I7_aprendeu.distribuicao],
    ["I6 Tipo de instituição (quem dirige)", m.I6_tipoInstituicao],
    ["F1.4 Pessoas atendidas pelas instituições", m.F1_4_alcanceInstituicoes],
    ["F3.2 Interesse em piloto", m.F3_2_F3_7_instituicoes.interessePiloto],
    ["F1.4 Perfil de quem respondeu", m.F1_4_perfil],
  ];
  for (const [titulo, dist] of blocosMit) {
    res.addRow([`  ${titulo}`]).font = { name: "Arial", size: 10, italic: true };
    for (const [k, v] of Object.entries(dist)) res.addRow([`    ${k}`, v]).font = { name: "Arial", size: 10 };
  }
  res.addRow([]);
  res.addRow(["Pagamentos de assinatura do Play: a cobrança ainda não foi ligada — não há pagamentos a listar."]).font = { name: "Arial", size: 9, italic: true };

  aba(
    wb,
    "Pesquisa de satisfação",
    [
      { header: "Data", key: "em", width: 18 },
      { header: "Nota", key: "nota", width: 6 },
      { header: "Site funcionou?", key: "funcionou", width: 14 },
      { header: "Problema relatado", key: "problema", width: 40 },
      { header: "O que curtiu", key: "curtiu", width: 30 },
      { header: "Sugestão de conteúdo", key: "sugestao", width: 40 },
      { header: "Valor do Play", key: "valorPlay", width: 16 },
      { header: "Assinaria o Play?", key: "assinaria", width: 26 },
      { header: "Como conheceu", key: "origem", width: 14 },
      { header: "Comentário", key: "comentario", width: 40 },
      { header: "Responde como", key: "perfil", width: 22 },
      { header: "Cidade", key: "cidade", width: 20 },
      { header: "Falta material? (F1.2)", key: "confirmaDor", width: 16 },
      { header: "Frequência de busca 12m (F1.3)", key: "frequenciaBusca", width: 20 },
      { header: "Conseguiu sem ajuda? (F2.2)", key: "conseguiu", width: 16 },
      { header: "Recomendaria 0–10 (NPS, F2.3)", key: "recomendaria", width: 12 },
      { header: "Aprendeu algo? (F2.7/I7)", key: "aprendeu", width: 14 },
      { header: "Cargo de direção?", key: "cargoDirecao", width: 12 },
      { header: "Tipo de instituição (I6)", key: "tipoInstituicao", width: 30 },
      { header: "Instituição", key: "instituicao", width: 26 },
      { header: "Pessoas atendidas (F1.4)", key: "alcance", width: 16 },
      { header: "Interesse em piloto (F3.2)", key: "interessePiloto", width: 14 },
      { header: "Topa teste (F2.5)", key: "topaTeste", width: 12 },
      { header: "Contato deixado", key: "contato", width: 28 },
      { header: "Página", key: "pagina", width: 22 },
      { header: "Tela (px)", key: "largura", width: 9 },
    ],
    d.respostas.map((x) => ({
      em: data(x.em),
      nota: x.nota ?? "",
      funcionou: rotulo(x.funcionou),
      problema: seguro(x.problema),
      curtiu: x.curtiu.map(rotulo).join(", "),
      sugestao: seguro(x.sugestao),
      valorPlay: rotulo(x.valorPlay),
      assinaria: rotulo(x.assinaria),
      origem: rotulo(x.origem),
      comentario: seguro(x.comentario),
      perfil: rotulo(x.perfil),
      cidade: seguro(x.cidade),
      confirmaDor: rotulo(x.confirmaDor),
      frequenciaBusca: rotulo(x.frequenciaBusca),
      conseguiu: rotulo(x.conseguiu),
      recomendaria: x.recomendaria ?? "",
      aprendeu: rotulo(x.aprendeu),
      cargoDirecao: rotulo(x.cargoDirecao),
      tipoInstituicao: rotulo(x.tipoInstituicao),
      instituicao: seguro(x.instituicao),
      alcance: rotulo(x.alcance),
      interessePiloto: rotulo(x.interessePiloto),
      topaTeste: rotulo(x.topaTeste),
      contato: seguro(x.contato),
      pagina: x.pagina ?? "",
      largura: x.largura ?? "",
    })),
  );

  aba(
    wb,
    "Contas",
    [
      { header: "Nome", key: "nome", width: 28 },
      { header: "E-mail", key: "email", width: 32 },
      { header: "Criada em", key: "criadoEm", width: 18 },
      { header: "E-mail confirmado", key: "confirmado", width: 18 },
      { header: "Aceita novidades", key: "novidades", width: 15 },
      { header: "Descadastrou", key: "descadastro", width: 18 },
      { header: "Último acesso", key: "acesso", width: 18 },
      { header: "Pedidos no site", key: "pedidos", width: 14 },
    ],
    d.contas.map((c) => ({
      nome: seguro(c.nome),
      email: c.email,
      criadoEm: data(c.criadoEm),
      confirmado: data(c.confirmadoEm) || "não",
      novidades: c.novidades ? "sim" : "não",
      descadastro: data(c.descadastradoEm),
      acesso: data(c.ultimoAcessoEm),
      pedidos: d.pedidos.filter((p) => p.cliente.email.toLowerCase() === c.email).length,
    })),
  );

  aba(
    wb,
    "Pedidos",
    [
      { header: "Pedido", key: "ref", width: 22 },
      { header: "Data", key: "data", width: 18 },
      { header: "Cliente", key: "cliente", width: 26 },
      { header: "E-mail", key: "email", width: 30 },
      { header: "Peças", key: "itens", width: 46 },
      { header: "Entrega", key: "entrega", width: 22 },
      { header: "Frete (R$)", key: "frete", width: 10 },
      { header: "Cupom", key: "cupom", width: 14 },
      { header: "Desconto (R$)", key: "desconto", width: 12 },
      { header: "Total (R$)", key: "total", width: 11 },
      { header: "Pagamento", key: "pagamento", width: 14 },
      { header: "Etapa", key: "etapa", width: 34 },
      { header: "Rastreio", key: "rastreio", width: 18 },
      { header: "Nota fiscal (id Bling)", key: "nota", width: 18 },
    ],
    d.pedidos.map((p) => ({
      ref: p.ref,
      data: data(p.criadoEm),
      cliente: seguro(p.cliente.nome),
      email: p.cliente.email,
      itens: p.itens.map((i) => `${i.quantidade}× ${i.nome}`).join("; "),
      entrega: p.entrega.retirada ? "Retirada no ateliê" : p.entrega.descricao,
      frete: p.entrega.valor,
      cupom: p.cupom?.codigo ?? "",
      desconto: p.cupom?.desconto ?? "",
      total: p.total,
      pagamento: p.pagamento.tipo ?? "",
      etapa: etapaDoPedido(p),
      rastreio: p.envio?.codigo ?? "",
      nota: p.nfe?.idNota ?? "",
    })),
  );

  aba(
    wb,
    "Cupons",
    [
      { header: "Código", key: "codigo", width: 16 },
      { header: "Desconto %", key: "percentual", width: 11 },
      { header: "Parceiro", key: "parceiro", width: 22 },
      { header: "Comissão %", key: "comissao", width: 11 },
      { header: "Limite de usos", key: "limite", width: 18 },
      { header: "Válido de", key: "de", width: 12 },
      { header: "Válido até", key: "ate", width: 12 },
      { header: "Ativo", key: "ativo", width: 7 },
      { header: "Usos em pedidos", key: "usos", width: 14 },
    ],
    d.cupons.map((c) => ({
      codigo: c.codigo,
      percentual: c.percentual,
      parceiro: c.parceiro ?? "",
      comissao: c.comissaoPercentual ?? "",
      limite: `${c.limite.usos} por ${c.limite.periodo}`,
      de: c.validoDe ?? "",
      ate: c.validoAte ?? "",
      ativo: c.ativo ? "sim" : "não",
      usos: d.pedidos.filter((p) => p.cupom?.codigo === c.codigo && !cancelado(p)).length,
    })),
  );

  aba(
    wb,
    "Play — partidas",
    [
      { header: "Data", key: "em", width: 18 },
      { header: "Apelido", key: "apelido", width: 20 },
      { header: "Jogo", key: "jogo", width: 14 },
      { header: "Pontos", key: "pontos", width: 9 },
      { header: "Semana", key: "semana", width: 12 },
    ],
    d.pontuacoes.map((x) => ({ em: data(x.em), apelido: seguro(x.apelido), jogo: x.jogo, pontos: x.pontos, semana: x.semana })),
  );

  aba(
    wb,
    "Play — prêmios",
    [
      { header: "Semana", key: "semana", width: 12 },
      { header: "Posição", key: "posicao", width: 9 },
      { header: "Desconto %", key: "percentual", width: 11 },
      { header: "Cupom", key: "codigo", width: 18 },
      { header: "Emitido em", key: "emitidoEm", width: 18 },
    ],
    d.premios.map((x) => ({ semana: x.semana, posicao: x.posicao, percentual: x.percentual, codigo: x.codigo, emitidoEm: data(x.emitidoEm) })),
  );

  return Buffer.from(await wb.xlsx.writeBuffer());
}
