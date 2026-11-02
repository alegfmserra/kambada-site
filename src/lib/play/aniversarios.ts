import { hojeEmSaoLuis, listarCupons, normalizarCodigo, salvarCupons, type Cupom } from "../cupons/cupons";
import { alertar } from "../manutencao/alertas";
import { listarRegistros } from "../pedidos/registro";
import { atualizarConta, buscarPorEmail, listarContas, marcarAniversarioEnviado, type Conta } from "./contas";
import { enviarAniversario, enviarAvisoAniversario, enviarLembreteCupomAniversario } from "./emails";
import { idAleatorio } from "./jogos/seguranca";

/**
 * Fluxo de aniversário (02/11/2026, pedido do Alexandre): para quem informou o dia e o mês em
 * "Minha conta", o cliente é lembrado e celebrado em três momentos. Roda na rotina de
 * manutenção (a cada 6 h) e é idempotente:
 *   1. `DIAS_DE_AVISO` dias antes: "falta uma semana", anunciando o presente;
 *   2. no dia: parabéns + cupom de 15 % (uso único, 30 dias, um por ano);
 *   3. `DIAS_ANTES_DE_VENCER` dias antes de o cupom vencer, se ainda não foi usado: lembrete.
 *
 * Quem recebe: conta com e-mail confirmado que aceitou novidades e não se descadastrou. Conta por
 * usuário (sem e-mail), de demonstração ou sem data não entra. A data é só dia e mês (sem ano,
 * sem idade) e é do titular da conta. Se a rotina ficar fora do ar, a passada seguinte ainda pega
 * o dia anterior de cada etapa.
 */
export const CUPOM_ANIVERSARIO = { percentual: 15, validadeDias: 30 } as const;
export const DIAS_DE_AVISO = 7;
export const DIAS_ANTES_DE_VENCER = 7;

const bissexto = (ano: number) => (ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0;
const DIA_MS = 86_400_000;
const paraMs = (dia: string) => Date.parse(`${dia}T00:00:00Z`);

function somarDias(dataIso: string, dias: number): string {
  return new Date(paraMs(dataIso) + dias * DIA_MS).toISOString().slice(0, 10);
}

/** O aniversário "MM-DD" cai na data `dia` (AAAA-MM-DD)? 29/02 comemora em 28/02 nos anos comuns. */
export function fazAniversarioEm(aniversario: string | undefined, dia: string): boolean {
  if (!aniversario) return false;
  const mmdd = dia.slice(5);
  if (aniversario === mmdd) return true;
  return aniversario === "02-29" && mmdd === "02-28" && !bissexto(Number(dia.slice(0, 4)));
}

/** Dias de `hoje` (AAAA-MM-DD) até o próximo aniversário (0 = hoje) e o ano em que ele cai. */
export function proximoAniversario(aniversario: string, hoje: string): { dias: number; ano: number } {
  const ano = Number(hoje.slice(0, 4));
  const em = (a: number) => {
    const mmdd = aniversario === "02-29" && !bissexto(a) ? "02-28" : aniversario;
    return `${a}-${mmdd}`;
  };
  let alvo = em(ano);
  let anoAlvo = ano;
  if (alvo < hoje) {
    anoAlvo = ano + 1;
    alvo = em(anoAlvo);
  }
  return { dias: Math.round((paraMs(alvo) - paraMs(hoje)) / DIA_MS), ano: anoAlvo };
}

const recebe = (c: Conta) => Boolean(c.aniversario && !c.usuario && !c.demo && c.confirmadoEm && c.novidades && !c.descadastradoEm);

/** Quem deve receber o "falta uma semana" (hoje ou, se a rotina falhou, o dia seguinte da janela). */
export function paraAvisar(contas: Conta[], agora = new Date()): Conta[] {
  const hoje = hojeEmSaoLuis(agora);
  return contas.filter((c) => {
    if (!recebe(c)) return false;
    const p = proximoAniversario(c.aniversario!, hoje);
    return (p.dias === DIAS_DE_AVISO || p.dias === DIAS_DE_AVISO - 1) && c.aniversarioAvisoAno !== p.ano;
  });
}

/** Quem deve receber o parabéns hoje (ou que o receberia ontem, se a rotina falhou). */
export function aniversariantes(contas: Conta[], agora = new Date()): Conta[] {
  const hoje = hojeEmSaoLuis(agora);
  const ontem = somarDias(hoje, -1);
  const ano = Number(hoje.slice(0, 4));
  return contas.filter((c) => recebe(c) && c.aniversarioCupomAno !== ano && (fazAniversarioEm(c.aniversario, hoje) || fazAniversarioEm(c.aniversario, ontem)));
}

/** Quem deve receber o lembrete: cupom ainda não usado e a poucos dias de vencer. */
export function paraLembrar(contas: Conta[], usados: Set<string>, agora = new Date()): Conta[] {
  const hoje = hojeEmSaoLuis(agora);
  return contas.filter((c) => {
    const cp = c.aniversarioCupom;
    if (!recebe(c) || !cp || cp.lembreteEnviado || usados.has(cp.codigo)) return false;
    // Do início da janela (vence em DIAS_ANTES_DE_VENCER dias) até o último dia de validade.
    return hoje >= somarDias(cp.validoAte, -DIAS_ANTES_DE_VENCER) && hoje <= cp.validoAte;
  });
}

function codigoNovo(existentes: Set<string>, prefixo = "ANIV-"): string {
  const ALFABETO = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sem O, I, L, 0, 1
  for (let t = 0; t < 20; t++) {
    let c = prefixo;
    const bytes = idAleatorio(6);
    for (let i = 0; i < 6; i++) c += ALFABETO[parseInt(bytes.slice(i * 2, i * 2 + 2), 16) % ALFABETO.length];
    if (!existentes.has(c)) return c;
  }
  throw new Error("Não foi possível gerar um código único.");
}

export type EnvioAniversarios = {
  dia: string;
  avisos: { nome: string; aviso: boolean }[];
  enviados: { nome: string; codigo: string; avisoPorEmail: boolean }[];
  lembretes: { nome: string; codigo: string; enviado: boolean }[];
};

const dataBr = (iso: string) => iso.split("-").reverse().join("/");
const primeiroNome = (c: Conta) => c.nome.trim().split(/\s+/)[0] ?? c.nome;

export async function enviarAniversarios(
  base = process.env.URL_DO_SITE ?? "https://somoskambada.com.br",
  agora = new Date(),
): Promise<EnvioAniversarios> {
  const url = base.replace(/\/+$/, "");
  const hoje = hojeEmSaoLuis(agora);
  const ano = Number(hoje.slice(0, 4));
  const r: EnvioAniversarios = { dia: hoje, avisos: [], enviados: [], lembretes: [] };

  // 1) "Falta uma semana": marca antes de enviar, para ninguém receber duas vezes.
  for (const conta of paraAvisar(await listarContas(), agora)) {
    const { ano: anoDoAniversario } = proximoAniversario(conta.aniversario!, hoje);
    await atualizarConta(conta.id, (c) => {
      c.aniversarioAvisoAno = anoDoAniversario;
    });
    const [, mm, dd] = `${anoDoAniversario}-${conta.aniversario}`.match(/^(\d+)-(\d+)-(\d+)$/) ?? [];
    const aviso = await enviarAvisoAniversario(url, conta, `${dd}/${mm}`).catch(() => false);
    r.avisos.push({ nome: primeiroNome(conta), aviso });
  }

  // 2) No dia: parabéns + cupom de 15 %.
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
    await marcarAniversarioEnviado(conta.id, ano, { codigo: cupom.codigo, emitidoEm: hoje, validoAte });
    const avisoPorEmail = await enviarAniversario(url, conta, { codigo: cupom.codigo, percentual: cupom.percentual, validoAte }).catch(() => false);
    r.enviados.push({ nome: primeiroNome(conta), codigo: cupom.codigo, avisoPorEmail });
  }

  // 3) Lembrete de validade, só se o cupom não apareceu em nenhum pedido.
  const contas = await listarContas();
  if (contas.some((c) => c.aniversarioCupom && !c.aniversarioCupom.lembreteEnviado)) {
    const usados = new Set((await listarRegistros(10000)).filter((p) => p.cupom?.codigo && !p.cancelamento?.concluidoEm && !p.estorno).map((p) => p.cupom!.codigo));
    for (const conta of paraLembrar(contas, usados, agora)) {
      const cp = conta.aniversarioCupom!;
      await atualizarConta(conta.id, (c) => {
        if (c.aniversarioCupom) c.aniversarioCupom.lembreteEnviado = true;
      });
      const enviado = await enviarLembreteCupomAniversario(url, conta, { codigo: cp.codigo, percentual: CUPOM_ANIVERSARIO.percentual, validoAte: cp.validoAte }).catch(() => false);
      r.lembretes.push({ nome: primeiroNome(conta), codigo: cp.codigo, enviado });
    }
  }

  if (r.avisos.length || r.enviados.length || r.lembretes.length) {
    await alertar(
      `aniversarios-${hoje}`,
      `Aniversários (${dataBr(hoje)}): ${r.avisos.length} aviso(s), ${r.enviados.length} cupom(ns), ${r.lembretes.length} lembrete(s)`,
      [
        ...r.avisos.map((a) => `• Aviso de 7 dias para ${a.nome} — ${a.aviso ? "e-mail enviado" : "e-mail NÃO saiu"}`),
        ...r.enviados.map((e) => `• Parabéns para ${e.nome} — ${e.codigo} (${CUPOM_ANIVERSARIO.percentual} %) — ${e.avisoPorEmail ? "e-mail enviado" : "e-mail NÃO saiu (confira o SMTP); o cupom foi criado"}`),
        ...r.lembretes.map((l) => `• Lembrete de validade para ${l.nome} — ${l.codigo} — ${l.enviado ? "e-mail enviado" : "e-mail NÃO saiu"}`),
      ].join("\n") + `\n\nOs cupons ficam em ${url}/admin/cupons (uso único, ${CUPOM_ANIVERSARIO.validadeDias} dias).`,
    ).catch(() => undefined);
  }
  return r;
}

/**
 * Teste do fluxo no próprio e-mail do dono da conta (só chamado pela rota de manutenção, com
 * senha). Manda as 3 mensagens com "[TESTE]" no assunto e um código de MODELO que não vale nada:
 * nenhum cupom real é criado e nenhuma marca é gravada na conta.
 */
export async function enviarTesteDoFluxo(
  email: string,
  base = process.env.URL_DO_SITE ?? "https://somoskambada.com.br",
  agora = new Date(),
): Promise<{ ok: boolean; erro?: string; enviados?: string[] }> {
  const conta = await buscarPorEmail(email);
  if (!conta) return { ok: false, erro: "Não existe conta do Play/loja com esse e-mail." };
  if (conta.usuario || conta.demo) return { ok: false, erro: "Conta sem e-mail real." };
  const url = base.replace(/\/+$/, "");
  const hoje = hojeEmSaoLuis(agora);
  const validoAte = somarDias(hoje, CUPOM_ANIVERSARIO.validadeDias);
  const modelo = { codigo: "MODELO-SEM-VALOR", percentual: CUPOM_ANIVERSARIO.percentual, validoAte };
  const diaMes = conta.aniversario ? `${conta.aniversario.slice(3)}/${conta.aniversario.slice(0, 2)}` : "24/11";
  const enviados: string[] = [];
  if (await enviarAvisoAniversario(url, conta, diaMes, { teste: true })) enviados.push("aviso de 7 dias");
  if (await enviarAniversario(url, conta, modelo, { teste: true })) enviados.push("parabéns com cupom");
  if (await enviarLembreteCupomAniversario(url, conta, modelo, { teste: true })) enviados.push("lembrete de validade");
  return enviados.length ? { ok: true, enviados } : { ok: false, erro: "E-mail não configurado neste ambiente." };
}
