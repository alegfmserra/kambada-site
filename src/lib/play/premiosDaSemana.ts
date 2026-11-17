import { alertar } from "../manutencao/alertas";
import { listarContas } from "./contas";
import { enviarCupom } from "./emails";
import { emitirPremiosDaSemanaFechada, jogadorDaConta } from "./jogos/placar";

/**
 * Fechamento automático do ranking semanal do Kambada Play (02/11/2026).
 *
 * Roda dentro da rotina de manutenção (a cada 6 h). Na segunda-feira, a semana anterior
 * "fechou": o ranking que o site mostra já começa do zero (a semana é a chave das
 * pontuações) e aqui o cupom de cada um dos 3 primeiros é emitido SEM esperar a pessoa
 * voltar ao site (10 % / 8 % / 5 %, mínimo de pontos, uso único, validade de 30 dias).
 *
 * Desde 17/11/2026 só recebe cupom a conta com e-mail confirmado até o fechamento da
 * semana; o prêmio de quem não confirmou passa ao próximo confirmado (regra em
 * jogos/placar.ts, `confirmadosAte`).
 *
 * Aviso: quem aceitou novidades recebe o cupom por e-mail (a mesma regra de sempre para
 * e-mail do Play); para os demais, o cupom aparece na tela do ranking assim que a pessoa
 * entrar na conta. A loja recebe um resumo por e-mail, com quem ficou sem cupom por não
 * ter confirmado. Idempotente: só emite e avisa o que
 * ainda não tinha sido emitido.
 */
export type FechamentoSemanal = {
  semana: string;
  top: { posicao: number; apelido: string; pontos: number }[];
  emitidos: { posicao: number; apelido: string; percentual: number; codigo: string; avisoPorEmail: boolean }[];
};

export async function fecharSemanaDoRanking(base = process.env.URL_DO_SITE ?? "https://somoskambada.com.br"): Promise<FechamentoSemanal> {
  const url = base.replace(/\/+$/, "");
  const r = await emitirPremiosDaSemanaFechada();
  const emitidos: FechamentoSemanal["emitidos"] = [];
  if (r.novos.length) {
    const contas = await listarContas();
    for (const n of r.novos) {
      const conta = contas.find((c) => jogadorDaConta(c.id) === n.jogador);
      const avisoPorEmail = conta ? await enviarCupom(url, conta, n).catch(() => false) : false;
      emitidos.push({ posicao: n.posicao, apelido: n.apelido, percentual: n.percentual, codigo: n.codigo, avisoPorEmail });
    }
    const dia = (iso: string) => iso.split("-").reverse().join("/");
    await alertar(
      `ranking-semanal-${r.semana}`,
      `Ranking do Play fechou (semana de ${dia(r.semana)}): ${emitidos.length} cupom(ns) emitido(s)`,
      `Top da semana de ${dia(r.semana)} no Kambada Play:\n` +
        r.top.map((t) => `• ${t.posicao}º ${t.apelido} — ${t.pontos} pontos`).join("\n") +
        `\n\nCupons emitidos automaticamente (uso único, 30 dias):\n` +
        emitidos
          .map((e) => `• ${e.posicao}º ${e.apelido}: ${e.percentual} % — ${e.codigo} — ${e.avisoPorEmail ? "avisado por e-mail" : "sem e-mail (aparece no Play quando a pessoa entrar)"}`)
          .join("\n") +
        (r.semConfirmacao.length
          ? `\n\nFicaram sem cupom por não terem o e-mail confirmado até o fechamento (o prêmio passou adiante):\n` +
            r.semConfirmacao.map((s) => `• ${s.apelido} — ${s.pontos} pontos`).join("\n")
          : "") +
        `\n\nOs cupons ficam em ${url}/admin/cupons.`,
    ).catch(() => undefined);
  }
  return { semana: r.semana, top: r.top, emitidos };
}
