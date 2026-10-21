/**
 * Reserva de "uma vez só" entre processos.
 *
 * Problema (20–21/10/2026): o servidor teve mais de um processo de pé ao mesmo
 * tempo, cada um com o seu timer, e o resumo do dia e os alertas chegaram em
 * dobro. Ler-conferir-gravar um JSON não protege disso — os dois leem antes de
 * qualquer um gravar.
 *
 * Solução: criar um arquivo com a flag "wx" (falha se já existir) é atômico no
 * sistema de arquivos; só um processo ganha. As reservas ficam em
 * `.kambada/reservas/` e as com mais de 7 dias são apagadas a cada reserva.
 */

import { existsSync } from "node:fs";
import { mkdir, readdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { arquivoTokens } from "../bling/tokens";

const VALIDADE_MS = 7 * 24 * 60 * 60 * 1000;

function pasta(): string {
  return join(dirname(arquivoTokens()), "reservas");
}

function caminho(nome: string): string {
  return join(pasta(), `${nome.replace(/[^\w.-]/g, "_")}.reserva`);
}

/**
 * A pasta de dados do site existe neste processo? Processo que sobrou de antes
 * de uma troca de domínio aponta para uma pasta que já não existe: ele não deve
 * mandar e-mail nenhum (foi ele que mandou o resumo "0 pedidos" e o alerta com
 * o endereço antigo em 21/10/2026).
 */
export function pastaDeDadosPresente(): boolean {
  return existsSync(dirname(arquivoTokens()));
}

/** true = este processo ganhou a reserva e deve fazer o trabalho. */
export async function reservar(nome: string): Promise<boolean> {
  await mkdir(pasta(), { recursive: true });
  await limparVencidas().catch(() => undefined);
  try {
    await writeFile(caminho(nome), `${process.pid} ${new Date().toISOString()}`, { flag: "wx" });
    return true;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "EEXIST") return false;
    throw e;
  }
}

/** Devolve a reserva quando o trabalho falhou, para a próxima passada tentar de novo. */
export async function liberar(nome: string): Promise<void> {
  await rm(caminho(nome), { force: true });
}

async function limparVencidas(): Promise<void> {
  const agora = Date.now();
  for (const f of await readdir(pasta())) {
    const c = join(pasta(), f);
    if (agora - (await stat(c)).mtimeMs > VALIDADE_MS) await rm(c, { force: true });
  }
}
