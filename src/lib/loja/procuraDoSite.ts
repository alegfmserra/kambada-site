import { listarRegistros } from "../pedidos/registro";
import { diaSaoLuis, listarVisitas } from "../visitas/visitas";
import { notasDeProcura } from "./procura";

/**
 * Lê as visitas e os pedidos do disco e devolve a procura por peça para a
 * vitrine da home (somente servidor, 18/11/2026). Refeita no máximo uma vez por
 * dia (dia de São Luís): a vitrine não muda de cara a cada visita, e o arquivo
 * de visitas não é relido a cada renovação da home.
 *
 * Qualquer falha devolve "sem dados": a home cai na regra de sempre (uma peça
 * por categoria) e nunca deixa de abrir por causa disto.
 */
export type ProcuraDoSite = { notas: Map<string, number>; dia: string };

let guardada: ProcuraDoSite | null = null;

export async function procuraDoSite(agora = new Date()): Promise<ProcuraDoSite> {
  const dia = diaSaoLuis(agora);
  if (guardada?.dia === dia) return guardada;
  try {
    const [eventos, registros] = await Promise.all([listarVisitas(), listarRegistros(10000)]);
    const pedidos = registros.map((p) => ({
      criadoEm: p.criadoEm,
      cancelado: Boolean(p.cancelamento?.concluidoEm || p.estorno),
      itens: p.itens,
    }));
    guardada = { notas: notasDeProcura(eventos, pedidos, agora), dia };
    return guardada;
  } catch {
    return { notas: new Map(), dia };
  }
}
