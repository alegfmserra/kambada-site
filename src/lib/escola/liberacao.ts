import { alterar, lerDados, type Dados, type Membro } from "./dados";
import { ErroEscola, anotar, soGestor } from "./servico";
import { TEMPORADAS, situacaoDa, temporadaPorId } from "./temporadas";

/**
 * Temporadas liberadas para a escola (somente servidor). A Kambada vende por
 * temporada e pode personalizar por escola: o hub liga e desliga cada uma.
 * Regra simples: sem registro = liberada (a escola piloto continua como
 * estava); "fechada" some da trilha do aluno e a página dela dá 404.
 * Hoje há uma escola por portal (a Modelo); quando entrar a segunda, a chave
 * ganha o código da escola sem mudar o resto.
 */

export const liberada = (d: Dados, id: string) => d.liberacoes?.[id] !== false;

export type LinhaLiberacao = { id: string; emoji: string; titulo: string; mes: string; situacao: ReturnType<typeof situacaoDa>; liberada: boolean };

/** O que o hub mostra: cada temporada do ano, com a situação do conteúdo e a chave da escola. */
export async function liberacoesDaEscola(): Promise<LinhaLiberacao[]> {
  const d = await lerDados();
  return TEMPORADAS.map((t) => ({ id: t.id, emoji: t.emoji, titulo: t.titulo, mes: t.mes, situacao: situacaoDa(t), liberada: liberada(d, t.id) }));
}

/** Ids liberados (para o aluno). */
export async function temporadasLiberadas(): Promise<Set<string>> {
  const d = await lerDados();
  return new Set(TEMPORADAS.filter((t) => liberada(d, t.id)).map((t) => t.id));
}

export async function temporadaAberta(id: string): Promise<boolean> {
  return (await temporadasLiberadas()).has(id);
}

export async function liberarTemporada(m: Membro, id: unknown, ligada: unknown): Promise<void> {
  soGestor(m);
  const t = typeof id === "string" ? temporadaPorId(id) : undefined;
  if (!t) throw new ErroEscola("Temporada inválida.");
  if (typeof ligada !== "boolean") throw new ErroEscola("Pedido inválido.");
  await alterar((d) => {
    d.liberacoes = { ...(d.liberacoes ?? {}), [t.id]: ligada };
    anotar(d, m, `${ligada ? "liberou" : "fechou"} a temporada ${t.titulo} para a escola`);
  });
}
