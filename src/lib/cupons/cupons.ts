/**
 * Cupons de desconto — criados e limitados pela área de controle.
 *
 * Pedido do Alexandre (09/10/2026): nenhum cupom existe de saída; a loja cria
 * cada um numa página interna e o limita pela QUANTIDADE DE USOS num período
 * (ex.: "Jorge — 30 usos por semana"), e não pelo valor das compras. A ideia é
 * não vender sempre com desconto e proteger a margem.
 *
 * Regras:
 *  - o desconto é um percentual sobre as PEÇAS (o frete não tem desconto);
 *  - o uso conta quando o pagamento é APROVADO (pedido registrado);
 *  - o período é contado no fuso de São Luís: dia (meia-noite), semana
 *    (segunda-feira) ou mês (dia 1); "total" é o limite para sempre;
 *  - parceiro e comissão são só para o relatório (a comissão é paga por fora,
 *    por Pix, como combinado com o parceiro).
 *
 * Os cupons ficam num arquivo JSON na pasta persistente do servidor (a mesma
 * dos pedidos), e sobrevivem a cada deploy.
 */

import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { arquivoTokens } from "../bling/tokens";
import { emCentavos } from "../loja/dinheiro";
import { listarRegistros, type RegistroPedido } from "../pedidos/registro";

export type Periodo = "total" | "dia" | "semana" | "mes";

export type Cupom = {
  codigo: string;
  percentual: number;
  parceiro?: string;
  comissaoPercentual?: number;
  limite: { usos: number; periodo: Periodo };
  validoDe?: string; // AAAA-MM-DD
  validoAte?: string; // AAAA-MM-DD (inclusive)
  ativo: boolean;
  criadoEm: string;
};

export const ROTULO_PERIODO: Record<Periodo, string> = {
  total: "no total",
  dia: "por dia",
  semana: "por semana",
  mes: "por mês",
};

export const FORMATO_CODIGO = /^[A-Z0-9-]{3,20}$/;

export function normalizarCodigo(bruto: string): string {
  return bruto
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

// ---------------------------------------------------------------------------
// Armazenamento
// ---------------------------------------------------------------------------

export function arquivoCupons(): string {
  return process.env.CUPONS_ARQUIVO ?? join(dirname(arquivoTokens()), "cupons.json");
}

export async function listarCupons(): Promise<Cupom[]> {
  try {
    const dados = JSON.parse(await readFile(arquivoCupons(), "utf8")) as Cupom[];
    return Array.isArray(dados) ? dados : [];
  } catch {
    return [];
  }
}

export async function salvarCupons(cupons: Cupom[]): Promise<void> {
  const destino = arquivoCupons();
  await mkdir(dirname(destino), { recursive: true });
  const temporario = `${destino}.${process.pid}.tmp`;
  await writeFile(temporario, JSON.stringify(cupons, null, 2), "utf8");
  await rename(temporario, destino);
}

export async function buscarCupom(codigo: string): Promise<Cupom | null> {
  const c = normalizarCodigo(codigo);
  return (await listarCupons()).find((x) => x.codigo === c) ?? null;
}

// ---------------------------------------------------------------------------
// Período e contagem de usos
// ---------------------------------------------------------------------------

/** São Luís: UTC−3 o ano inteiro (sem horário de verão). */
const FUSO_MS = 3 * 60 * 60 * 1000;

/** Início do período corrente, em UTC. */
export function inicioDoPeriodo(periodo: Periodo, agora = new Date()): Date {
  if (periodo === "total") return new Date(0);
  const local = new Date(agora.getTime() - FUSO_MS); // relógio de São Luís, lido em UTC
  const ano = local.getUTCFullYear();
  const mes = local.getUTCMonth();
  const dia = local.getUTCDate();
  let inicioLocal: number;
  if (periodo === "dia") inicioLocal = Date.UTC(ano, mes, dia);
  else if (periodo === "mes") inicioLocal = Date.UTC(ano, mes, 1);
  else {
    // Semana começa na segunda-feira.
    const diaDaSemana = (local.getUTCDay() + 6) % 7; // segunda = 0
    inicioLocal = Date.UTC(ano, mes, dia - diaDaSemana);
  }
  return new Date(inicioLocal + FUSO_MS);
}

export function usosNoPeriodo(registros: RegistroPedido[], cupom: Cupom, agora = new Date()): number {
  const desde = inicioDoPeriodo(cupom.limite.periodo, agora).getTime();
  return registros.filter((r) => r.cupom?.codigo === cupom.codigo && Date.parse(r.criadoEm) >= desde).length;
}

/** Data de hoje em São Luís, AAAA-MM-DD — para comparar com validoDe/validoAte. */
export function hojeEmSaoLuis(agora = new Date()): string {
  return new Date(agora.getTime() - FUSO_MS).toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Desconto
// ---------------------------------------------------------------------------

/**
 * Preço unitário com desconto, em centavos — arredondado ao centavo por
 * unidade, para o valor de cada item no Mercado Pago bater com o total.
 */
export function precoComDesconto(precoReais: number, percentual: number): number {
  return Math.round((emCentavos(precoReais) * (100 - percentual)) / 100);
}

export function descontoEmCentavos(itens: { p: number; q: number }[], percentual: number): number {
  return itens.reduce((s, i) => s + (emCentavos(i.p) - precoComDesconto(i.p, percentual)) * i.q, 0);
}

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

export type ResultadoCupom =
  | { ok: true; cupom: Cupom; descontoCentavos: number }
  | { ok: false; mensagem: string };

export function avaliarCupom(
  cupom: Cupom | null,
  itens: { p: number; q: number }[],
  registros: RegistroPedido[],
  agora = new Date(),
): ResultadoCupom {
  if (!cupom || !cupom.ativo) return { ok: false, mensagem: "Cupom não encontrado." };
  const hoje = hojeEmSaoLuis(agora);
  if (cupom.validoDe && hoje < cupom.validoDe) return { ok: false, mensagem: "Este cupom ainda não começou a valer." };
  if (cupom.validoAte && hoje > cupom.validoAte) return { ok: false, mensagem: "Este cupom já expirou." };
  if (usosNoPeriodo(registros, cupom, agora) >= cupom.limite.usos) {
    return {
      ok: false,
      mensagem:
        cupom.limite.periodo === "total"
          ? "Os usos deste cupom acabaram."
          : `Os usos deste cupom ${ROTULO_PERIODO[cupom.limite.periodo]} acabaram. Tente no próximo período.`,
    };
  }
  const descontoCentavos = descontoEmCentavos(itens, cupom.percentual);
  if (descontoCentavos <= 0) return { ok: false, mensagem: "Este cupom não dá desconto nestas peças." };
  return { ok: true, cupom, descontoCentavos };
}

/** Atalho com leitura de disco — usado pelas rotas. */
export async function validarCupom(codigo: string, itens: { p: number; q: number }[]): Promise<ResultadoCupom> {
  const [cupom, registros] = await Promise.all([buscarCupom(codigo), listarRegistros(5000)]);
  return avaliarCupom(cupom, itens, registros);
}

// ---------------------------------------------------------------------------
// Relatório (área de controle)
// ---------------------------------------------------------------------------

export type RelatorioCupom = {
  usosNoPeriodo: number;
  usosTotal: number;
  vendasCentavos: number;
  descontoCentavos: number;
  comissaoCentavos: number;
};

export function relatorioDoCupom(cupom: Cupom, registros: RegistroPedido[], agora = new Date()): RelatorioCupom {
  const comCupom = registros.filter((r) => r.cupom?.codigo === cupom.codigo);
  const vendasCentavos = comCupom.reduce(
    (s, r) => s + r.itens.reduce((t, i) => t + emCentavos(i.preco) * i.quantidade, 0) - emCentavos(r.cupom?.desconto ?? 0),
    0,
  );
  const descontoCentavos = comCupom.reduce((s, r) => s + emCentavos(r.cupom?.desconto ?? 0), 0);
  return {
    usosNoPeriodo: usosNoPeriodo(registros, cupom, agora),
    usosTotal: comCupom.length,
    vendasCentavos,
    descontoCentavos,
    // Comissão sobre as peças já com desconto (o frete fica de fora).
    comissaoCentavos: Math.round((vendasCentavos * (cupom.comissaoPercentual ?? 0)) / 100),
  };
}
