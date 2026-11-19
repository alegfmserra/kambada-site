import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { arquivoTokens } from "../../bling/tokens";

/**
 * Marcas de uso único dos jogos do Kambada Play (somente servidor, 15/11/2026).
 *
 * O estado da partida e a prova do fim de jogo são assinados, mas a assinatura
 * sozinha não impede o REENVIO: dava para responder uma pergunta, ver a certa e
 * mandar o mesmo estado de novo com a resposta certa; e a mesma prova servia
 * para pontuar mais de uma vez, em qualquer conta. Como o ranking vale cupom,
 * o servidor passa a lembrar, por pouco tempo:
 *   - até que pergunta cada partida já respondeu (quiz e Arraial);
 *   - até que carta cada partida da memória já virou (17/11/2026);
 *   - qual jogador já usou a prova de cada partida (ranking);
 *   - quantas partidas de cada jogo o jogador já mandou ao ranking no dia.
 *
 * Guarda na memória do processo e num arquivo ao lado dos outros do Play
 * (sobrevive a reinício). Nada aqui é dado pessoal: id aleatório da partida e
 * o resumo do jogador que o placar já usa. Cada marca vence sozinha.
 *
 * Limite conhecido: com mais de um processo do site no ar ao mesmo tempo, cada
 * um só enxerga o que o outro gravou depois de reiniciar. A hospedagem atual
 * roda um processo só.
 */

type Marca = { v: string; exp: number };

let memoria: Map<string, Marca> | null = null;
let carregadoDe: string | null | undefined;

/** Acima disto, as marcas vencidas são varridas da memória antes de gravar outra. */
const LIMPAR_ACIMA_DE = 5000;
/**
 * A cada tantas linhas acrescentadas, o arquivo é regravado só com o que ainda
 * vale (18/11/2026). Antes ele só encolhia quando o site reiniciava, e com o
 * processo semanas no ar cada carta virada somava uma linha para sempre.
 */
const COMPACTAR_A_CADA = 20000;
let linhasDesdeACompactacao = 0;

function regravar(caminho: string, mapa: Map<string, Marca>): void {
  writeFileSync(caminho, [...mapa].map(([k, m]) => JSON.stringify({ k, v: m.v, exp: m.exp }) + "\n").join(""), "utf8");
  linhasDesdeACompactacao = 0;
}

function arquivo(): string | null {
  if (process.env.PLAY_USO_UNICO_ARQUIVO) return process.env.PLAY_USO_UNICO_ARQUIVO;
  // Nos testes, só memória: nada é escrito na pasta do usuário.
  if (process.env.VITEST) return null;
  return join(dirname(arquivoTokens()), "play-uso-unico.jsonl");
}

function carregar(agora: number): Map<string, Marca> {
  const caminho = arquivo();
  if (memoria && carregadoDe === caminho) return memoria;
  const mapa = new Map<string, Marca>();
  memoria = mapa;
  carregadoDe = caminho;
  if (!caminho) return mapa;
  try {
    for (const linha of readFileSync(caminho, "utf8").split("\n")) {
      if (!linha.trim()) continue;
      try {
        const r = JSON.parse(linha) as { k?: unknown; v?: unknown; exp?: unknown };
        if (typeof r.k !== "string" || typeof r.exp !== "number") continue;
        // Linha com `v` nulo apaga a marca (prova devolvida depois de uma falha ao gravar o placar).
        if (typeof r.v !== "string") mapa.delete(r.k);
        else if (r.exp > agora) mapa.set(r.k, { v: r.v, exp: r.exp });
      } catch {
        /* linha corrompida: ignora */
      }
    }
    // Ao subir, regrava só o que ainda vale: o arquivo não cresce para sempre.
    regravar(caminho, mapa);
  } catch {
    /* arquivo ainda não existe (ou pasta sem permissão): segue só na memória */
  }
  return mapa;
}

function anotar(linha: { k: string; v: string | null; exp: number }) {
  const caminho = arquivo();
  if (!caminho) return;
  try {
    mkdirSync(dirname(caminho), { recursive: true });
    linhasDesdeACompactacao += 1;
    if (linhasDesdeACompactacao >= COMPACTAR_A_CADA && memoria) {
      const agora = Date.now();
      for (const [k, m] of memoria) if (m.exp <= agora) memoria.delete(k);
      // A memória já reflete esta linha (quem chama mexe nela antes de anotar).
      regravar(caminho, memoria);
      return;
    }
    appendFileSync(caminho, JSON.stringify(linha) + "\n", "utf8");
  } catch {
    /* sem disco, a marca vale enquanto o processo viver */
  }
}

/** Valor guardado para a chave, ou null se não há (ou já venceu). */
export function lerMarca(chave: string, agora = Date.now()): string | null {
  const m = carregar(agora).get(chave);
  if (!m) return null;
  if (m.exp <= agora) {
    memoria?.delete(chave);
    return null;
  }
  return m.v;
}

export function gravarMarca(chave: string, valor: string, validadeMs: number, agora = Date.now()): void {
  const mapa = carregar(agora);
  if (mapa.size > LIMPAR_ACIMA_DE) {
    for (const [k, m] of mapa) if (m.exp <= agora) mapa.delete(k);
  }
  const exp = agora + validadeMs;
  mapa.set(chave, { v: valor, exp });
  anotar({ k: chave, v: valor, exp });
}

export function apagarMarca(chave: string, agora = Date.now()): void {
  if (carregar(agora).delete(chave)) anotar({ k: chave, v: null, exp: agora });
}

/**
 * Uma pergunta por vez, sem voltar: registra que a partida respondeu a pergunta
 * `indice`. Devolve false se essa pergunta (ou uma posterior) já tinha sido
 * respondida — é o reenvio do mesmo estado depois de ver a resposta certa.
 */
export function registrarResposta(jogo: "quiz" | "arraial", partida: string, indice: number, validadeMs: number, agora = Date.now()): boolean {
  const chave = `${jogo}:${partida}`;
  const ultima = lerMarca(chave, agora);
  if (ultima !== null && Number(ultima) >= indice) return false;
  gravarMarca(chave, String(indice), validadeMs, agora);
  return true;
}

/**
 * Passo de uma partida em que cada pedido revela algo (memória: virar a carta).
 * Cada passo vale uma vez: sem isto, dava para virar uma carta, ver qual era e
 * reenviar o estado anterior para "desvirar" sem gastar jogada. O MESMO pedido
 * repetido (mesmo passo, mesma marca) é aceito: é a resposta que se perdeu na
 * rede, e quem chama devolve o mesmo resultado.
 */
export function registrarPasso(jogo: "memoria", partida: string, passo: number, marca: string, validadeMs: number, agora = Date.now()): boolean {
  const chave = `${jogo}:${partida}`;
  const ultima = lerMarca(chave, agora);
  if (ultima !== null) {
    const [n, m] = ultima.split("|");
    if (Number(n) > passo) return false;
    if (Number(n) === passo) return m === marca;
  }
  gravarMarca(chave, `${passo}|${marca}`, validadeMs, agora);
  return true;
}

/** Soma um à contagem da chave e devolve o total (a contagem vence junto com a primeira marca). */
export function contarMarca(chave: string, validadeMs: number, agora = Date.now()): number {
  const atual = carregar(agora).get(chave);
  if (!atual || atual.exp <= agora) {
    gravarMarca(chave, "1", validadeMs, agora);
    return 1;
  }
  const total = (Number(atual.v) || 0) + 1;
  atual.v = String(total);
  anotar({ k: chave, v: atual.v, exp: atual.exp });
  return total;
}

const chaveDaProva = (jogo: string, partida: string) => `prova:${jogo}:${partida}`;

/**
 * A prova de uma partida pontua uma vez só, para um jogador só. Devolve false
 * se ela já foi usada (por quem for). Quem chama desfaz com `liberarProva` se
 * não conseguir gravar o placar, para a pessoa poder tentar de novo.
 */
export function reservarProva(jogo: string, partida: string, jogador: string, validadeMs: number, agora = Date.now()): boolean {
  const chave = chaveDaProva(jogo, partida);
  if (lerMarca(chave, agora) !== null) return false;
  gravarMarca(chave, jogador, validadeMs, agora);
  return true;
}

export function liberarProva(jogo: string, partida: string, agora = Date.now()): void {
  apagarMarca(chaveDaProva(jogo, partida), agora);
}

/** Só para testes: esquece a memória (o arquivo, se houver, é relido). */
export function reiniciarUsoUnico(): void {
  linhasDesdeACompactacao = 0;
  memoria = null;
  carregadoDe = undefined;
}
