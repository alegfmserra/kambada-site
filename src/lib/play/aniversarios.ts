import { hojeEmSaoLuis, listarCupons, normalizarCodigo, salvarCupons, type Cupom } from "../cupons/cupons";
import { alertar } from "../manutencao/alertas";
import { listarContas, marcarAniversarioEnviado, type Conta } from "./contas";
import { enviarAniversario } from "./emails";
import { idAleatorio } from "./jogos/seguranca";

/**
 * Parabéns de aniversário com cupom (02/11/2026, pedido do Alexandre): na data, quem informou
 * o dia e o mês do aniversário em "Minha conta" recebe um e-mail de parabéns e um cupom de 15 %
 * (uso único, 30 dias, um por ano). Roda na rotina de manutenção (a cada 6 h) e é idempotente.
 *
 * Quem recebe: conta com e-mail confirmado que aceitou receber novidades e não se descadastrou.
 * Conta por usuário (sem e-mail), de demonstração ou sem data não entra. A data é só dia e mês
 * (sem ano, sem idade) e é do titular da conta. Se a rotina ficar fora do ar no dia, a
 * passada seguinte ainda pega quem fez aniversário ontem.
 */
export const CUPOM_ANIVERSARIO = { percentual: 15, validadeDias: 30 } as const;

const bissexto = (ano: number) => (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;

function somarDias(dataIso: string, dias: number): string {
  return new Date(Date.parse(`${dataIso}T00:00:00Z`) + dias * 86_400_000).toISOString().slice(0, 10);
}

/** O aniversário "MM-DD" cai na data `dia` (AAAA-MM-DD)? 29/02 comemora em 28/02 nos anos comuns. */
export function fazAniversarioEm(aniversario: string | undefined, dia: string): boolean {
  if (!aniversario) return false;
  const mmdd = dia.slice(5);
  if (aniversario === mmdd) return true;
  return aniversario === "02-29" && mmdd === "02-28" && !bissexto(Number(dia.slice(0, 4)));
}

/** Contas que devem receber o parabéns hoje (ou que o receberiam ontem, se a rotina falhou). */
export function aniversariantes(contas: Conta[], agora = new Date()): Conta[] {
  const hoje = hojeEmSaoLuis(agora);
  const ontem = somarDias(hoje, -1);
  const ano = Number(hoje.slice(0, 4));
  return contas.filter(
    (c) =>
      c.aniversario &&
      !c.usuario &&
      !c.demo &&
      c.confirmadoEm &&
      c.novidades &&
      !c.descadastradoEm &&
      c.aniversarioCupomAno !== ano &&
      (fazAniversarioEm(c.aniversario, hoje) || fazAniversarioEm(c.aniversario, ontem)),
  );
}

function codigoNovo(existentes: Set<string>): string {
  const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sem O, I, L, 0, 1
  for (let t = 0; t < 20; t++) {
    let c = "ANIV-";
    const bytes = idAleatorio(6);
    for (let i = 0; i < 6; i++) c += ALFABETO[parseInt(bytes.slice(i * 2, i * 2 + 2), 16) % ALFABETO.length];
    if (!existentes.has(c)) return c;
  }
  throw new Error("Não foi possível gerar um código único.");
}

export type EnvioAniversarios = { dia: string; enviados: { nome: string; codigo: string; avisoPorEmail: boolean }[] };

export async function enviarAniversarios(
  base = process.env.URL_DO_SITE ?? "https://somoskambada.com.br",
  agora = new Date(),
): Promise<EnvioAniversarios> {
  const url = base.replace(/\/+$/, "");
  const hoje = hojeEmSaoLuis(agora);
  const ano = Number(hoje.slice(0, 4));
  const enviados: EnvioAniversarios["enviados"] = [];

  for (const conta of aniversariantes(await listarContas(), agora)) {
    const cupons = await listarCupons();
    const validoAte = somarDias(hoje, CUPOM_ANIVERSARIO.validadeDias);
    const cupom: Cupom = {
      codigo: normalizarCodigo(codigoNovo(new Set(cupons.map((c) => c.codigo)))),
      percentual: CUPOM_ANIVERSARIO.percentual,
      parceiro: `Kambada · aniversário ${ano}`,
      limite: { usos: 1, periodo: "total" },
      validoDe: hoje,
      validoAte,
      ativo: true,
      criadoEm: agora.toISOString(),
    };
    await salvarCupons([...cupons, cupom]);
    // Marca antes de enviar: se o e-mail falhar, o cupom existe e a loja é avisada, mas ninguém recebe dois.
    await marcarAniversarioEnviado(conta.id, ano);
    const avisoPorEmail = await enviarAniversario(url, conta, { codigo: cupom.codigo, percentual: cupom.percentual, validoAte }).catch(() => false);
    enviados.push({ nome: conta.nome.split(" ")[0], codigo: cupom.codigo, avisoPorEmail });
  }

  if (enviados.length) {
    await alertar(
      `aniversarios-${hoje}`,
      `Aniversariantes de hoje: ${enviados.length} cupom(ns) de ${CUPOM_ANIVERSARIO.percentual} % enviado(s)`,
      enviados.map((e) => `• ${e.nome} — ${e.codigo} — ${e.avisoPorEmail ? "e-mail enviado" : "e-mail NÃO saiu (confira o SMTP); o cupom foi criado"}`).join("\n") +
        `\n\nOs cupons ficam em ${url}/admin/cupons (uso único, ${CUPOM_ANIVERSARIO.validadeDias} dias).`,
    ).catch(() => undefined);
  }
  return { dia: hoje, enviados };
}
