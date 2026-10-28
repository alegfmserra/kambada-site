import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { arquivoTokens } from "../../bling/tokens";
import { hojeEmSaoLuis } from "../../cupons/cupons";
import {
  abrirBau,
  aplicarEvento,
  completar,
  equipar,
  perfilNovo,
  publico,
  type Evento,
  type Ganho,
  type Perfil,
  type PerfilPublico,
} from "./perfil";

/**
 * Armazenamento dos perfis do Arraial: um arquivo JSON na pasta persistente
 * (a mesma do placar e das contas), com fila para duas gravações não se
 * atropelarem e queda para a pasta temporária se o disco for só leitura.
 * Chave = id interno da conta; sem conta, não há perfil.
 */

type Dados = { versao: 1; perfis: Record<string, Perfil> };

export function arquivoPerfis(): string {
  return process.env.PLAY_PERFIS_ARQUIVO ?? join(dirname(arquivoTokens()), "play-perfis.json");
}
const arquivoTemporario = () => join(tmpdir(), "kambada-play-perfis.json");

let fila: Promise<unknown> = Promise.resolve();
function naFila<T>(trabalho: () => Promise<T>): Promise<T> {
  const proximo = fila.then(trabalho, trabalho);
  fila = proximo.catch(() => undefined);
  return proximo;
}

let usarTemporario = false;

async function ler(): Promise<Dados> {
  const caminhos = usarTemporario ? [arquivoTemporario()] : [arquivoPerfis(), arquivoTemporario()];
  for (const c of caminhos) {
    try {
      const d = JSON.parse(await readFile(c, "utf8")) as Dados;
      return { versao: 1, perfis: d.perfis ?? {} };
    } catch {
      // tenta o próximo
    }
  }
  return { versao: 1, perfis: {} };
}

async function gravarEm(destino: string, d: Dados): Promise<void> {
  await mkdir(dirname(destino), { recursive: true });
  const tmp = `${destino}.${process.pid}.tmp`;
  await writeFile(tmp, JSON.stringify(d), "utf8");
  await rename(tmp, destino);
}

async function gravar(d: Dados): Promise<void> {
  if (!usarTemporario) {
    try {
      await gravarEm(arquivoPerfis(), d);
      return;
    } catch {
      usarTemporario = true;
    }
  }
  await gravarEm(arquivoTemporario(), d);
}

/** Perfil público da conta (sem gravar nada). */
export async function lerPerfil(contaId: string, agora = new Date()): Promise<PerfilPublico> {
  const d = await ler();
  return publico(completar(d.perfis[contaId] ?? perfilNovo()), hojeEmSaoLuis(agora));
}

/** Troca o item vestido num slot. */
export function equiparItem(contaId: string, slot: unknown, id: unknown, agora = new Date()): Promise<{ perfil: PerfilPublico } | { erro: string }> {
  return naFila(async () => {
    const d = await ler();
    const r = equipar(completar(d.perfis[contaId] ?? perfilNovo()), slot, id);
    if ("erro" in r) return r;
    d.perfis[contaId] = r.perfil;
    await gravar(d);
    return { perfil: publico(r.perfil, hojeEmSaoLuis(agora)) };
  });
}

/** Abre o baú do dia da conta. */
export function abrirBauDoDia(
  contaId: string,
  agora = new Date(),
): Promise<{ perfil: PerfilPublico; item?: { id: string; nome: string; ficha: string }; xp: number } | { erro: string }> {
  return naFila(async () => {
    const dia = hojeEmSaoLuis(agora);
    const d = await ler();
    const r = abrirBau(completar(d.perfis[contaId] ?? perfilNovo()), contaId, dia);
    if ("erro" in r) return r;
    d.perfis[contaId] = r.perfil;
    await gravar(d);
    return { perfil: publico(r.perfil, dia), item: r.item, xp: r.xp };
  });
}

/** Aplica eventos em sequência e grava uma vez. */
export function registrarEventos(
  contaId: string,
  eventos: Evento[],
  agora = new Date(),
): Promise<{ perfil: PerfilPublico; ganho: Ganho }> {
  return naFila(async () => {
    const dia = hojeEmSaoLuis(agora);
    const d = await ler();
    let atual = completar(d.perfis[contaId] ?? perfilNovo());
    const total: Ganho = { xp: 0, diariasConcluidas: [] };
    for (const e of eventos) {
      const r = aplicarEvento(atual, e, dia);
      atual = r.perfil;
      total.xp += r.ganho.xp;
      total.diariasConcluidas.push(...r.ganho.diariasConcluidas);
      if (r.ganho.subiuPara) total.subiuPara = r.ganho.subiuPara;
      if (r.ganho.bonusSequencia) total.bonusSequencia = r.ganho.bonusSequencia;
      if (r.ganho.itensNovos) total.itensNovos = [...(total.itensNovos ?? []), ...r.ganho.itensNovos];
    }
    d.perfis[contaId] = atual;
    await gravar(d);
    return { perfil: publico(atual, dia), ganho: total };
  });
}
