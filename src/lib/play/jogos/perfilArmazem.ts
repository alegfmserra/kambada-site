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
import type { MiniId } from "./minis";
import type { PersonagemId } from "./missoesArraial";
import { concluirAchado, concluirPasso, concluirProva, falarCom, type Dialogo, type Retorno } from "./recados";

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
      if (r.ganho.amizade) total.amizade = r.ganho.amizade;
      if (r.ganho.itensNovos) total.itensNovos = [...(total.itensNovos ?? []), ...r.ganho.itensNovos];
    }
    d.perfis[contaId] = atual;
    await gravar(d);
    return { perfil: publico(atual, dia), ganho: total };
  });
}

// --- Recados (missões entre personagens) ---------------------------------------

export type ResultadoRecado = {
  falas: string[];
  certa?: boolean;
  avancou: boolean;
  concluida?: { titulo: string; xp: number };
  perfil: PerfilPublico;
  ganho?: Ganho;
};

/** O que o personagem tem para dizer a esta conta (sem gravar nada). */
export async function falarComPersonagem(contaId: string, npc: PersonagemId, agora = new Date()): Promise<Dialogo | null> {
  const d = await ler();
  const p = completar(d.perfis[contaId] ?? perfilNovo());
  return falarCom(p.recados, npc, hojeEmSaoLuis(agora), contaId, p.inventario.length > 0);
}

/** Guarda o novo estado dos recados e paga o XP se o recado terminou. */
function fecharEm(d: Dados, contaId: string, p: Perfil, r: Retorno, dia: string): ResultadoRecado {
  p.recados = r.estado;
  let ganho: Ganho | undefined;
  let atual = p;
  if (r.concluida) {
    const ev = aplicarEvento(atual, { tipo: "recado", titulo: r.concluida.titulo, xp: r.concluida.xp }, dia);
    atual = ev.perfil;
    ganho = ev.ganho;
  }
  d.perfis[contaId] = atual;
  return { falas: r.falas, certa: r.certa, avancou: r.avancou, concluida: r.concluida, perfil: publico(atual, dia), ganho };
}

export function fecharRecado(
  contaId: string,
  npc: PersonagemId,
  recadoId: string,
  resposta: unknown,
  agora = new Date(),
): Promise<ResultadoRecado | { erro: string }> {
  return naFila(async () => {
    const dia = hojeEmSaoLuis(agora);
    const d = await ler();
    const p = completar(d.perfis[contaId] ?? perfilNovo());
    const r = concluirPasso(p.recados, npc, recadoId, resposta, dia, contaId, p.inventario.length > 0);
    if ("erro" in r) return r;
    if (!r.avancou) return { falas: r.falas, certa: r.certa, avancou: false, perfil: publico(p, dia) };
    const saida = fecharEm(d, contaId, p, r, dia);
    await gravar(d);
    return saida;
  });
}

/** Objeto do mapa encontrado: avança o passo "achar" do recado, se for o atual. */
export function acharObjeto(contaId: string, objeto: string, agora = new Date()): Promise<(ResultadoRecado & { achou: string }) | null> {
  return naFila(async () => {
    const dia = hojeEmSaoLuis(agora);
    const d = await ler();
    const p = completar(d.perfis[contaId] ?? perfilNovo());
    const r = concluirAchado(p.recados, objeto, dia);
    if (!r) return null;
    const saida = fecharEm(d, contaId, p, r, dia);
    await gravar(d);
    return { ...saida, achou: r.nome };
  });
}

/** Mini-atividade perfeita: avança o passo "prova" do recado, se for o atual. */
export function provaDoRecado(
  contaId: string,
  recadoId: string,
  mini: MiniId,
  perfeito: boolean,
  agora = new Date(),
): Promise<ResultadoRecado | null> {
  return naFila(async () => {
    const dia = hojeEmSaoLuis(agora);
    const d = await ler();
    const p = completar(d.perfis[contaId] ?? perfilNovo());
    const r = concluirProva(p.recados, recadoId, mini, perfeito, dia);
    if (!r) return null;
    const saida = fecharEm(d, contaId, p, r, dia);
    await gravar(d);
    return saida;
  });
}
