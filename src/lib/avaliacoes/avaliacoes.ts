import { appendFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { arquivoTokens } from "../bling/tokens";
import type { Produto } from "../catalogo";
import { assinar, idAleatorio, verificar } from "../play/jogos/seguranca";

/**
 * Avaliações de peça — só de quem comprou (29/10/2026).
 *
 * O convite sai no e-mail de "pedido chegou / retirado" com um link assinado
 * pelo servidor (vale 120 dias). Quem abre avalia as peças DAQUELE pedido:
 * nota de 1 a 5, comentário opcional e a autorização para publicar. Nada vai
 * ao ar sem a loja aprovar no painel — e a regra da moderação é publicar
 * tudo, boa ou ruim; só fica de fora ofensa, dado pessoal ou o que não fala
 * da peça (esconder avaliação ruim engana o consumidor, CDC art. 37).
 *
 * Guardamos o nome como vai aparecer ("Maria J."), nunca o e-mail.
 */

export type StatusAvaliacao = "pendente" | "aprovada" | "recusada";

export type Avaliacao = {
  id: string;
  em: string;
  pedido: string;
  /** Chave da peça: ID do produto-pai no Bling (ou o slug, no catálogo local). */
  produto: string;
  produtoNome: string;
  /** Variação comprada (ex.: "G", "Estampa Guará · Com suporte"). */
  opcao?: string;
  nota: number;
  texto?: string;
  nome: string;
  autorizaPublicar: boolean;
  status: StatusAvaliacao;
  moderadoEm?: string;
};

export const chaveDoProduto = (p: Pick<Produto, "idBling" | "slug">): string => String(p.idBling ?? p.slug);

// ---------------------------------------------------------------------------
// Convite (link assinado)
// ---------------------------------------------------------------------------

const VALIDADE_CONVITE_S = 120 * 24 * 60 * 60;

type Convite = { v: 1; t: "avaliar"; ref: string; exp: number };

export function tokenDeAvaliacao(ref: string, agora = Date.now()): string {
  const c: Convite = { v: 1, t: "avaliar", ref, exp: Math.floor(agora / 1000) + VALIDADE_CONVITE_S };
  return assinar(c);
}

/** Pedido do convite, ou null se o link foi adulterado ou venceu. */
export function lerTokenDeAvaliacao(token: unknown, agora = Date.now()): string | null {
  const c = verificar<Convite>(token);
  if (!c || c.v !== 1 || c.t !== "avaliar" || typeof c.ref !== "string") return null;
  return c.exp > Math.floor(agora / 1000) ? c.ref : null;
}

export const linkDeAvaliacao = (urlDoSite: string, ref: string) =>
  `${urlDoSite}/avaliar?t=${encodeURIComponent(tokenDeAvaliacao(ref))}`;

// ---------------------------------------------------------------------------
// Validação
// ---------------------------------------------------------------------------

/** "Maria José da Silva" → "Maria J."; nome de uma palavra fica como está. */
export function nomeDeExibicao(bruto: unknown): string {
  const partes = String(bruto ?? "")
    .replace(/[^\p{L}\s'-]/gu, " ")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!partes.length) return "Cliente Kambada";
  const primeiro = partes[0].charAt(0).toUpperCase() + partes[0].slice(1).toLowerCase();
  const ultimo = partes.length > 1 ? partes[partes.length - 1] : "";
  return (ultimo ? `${primeiro} ${ultimo.charAt(0).toUpperCase()}.` : primeiro).slice(0, 40);
}

export type EnvioDeAvaliacao = { produto: string; nota: number; texto?: string };

/** Lê as notas enviadas pelo formulário; ignora o que não for peça do pedido. */
export function lerEnvio(corpo: unknown, produtosDoPedido: Set<string>): EnvioDeAvaliacao[] {
  const lista = Array.isArray((corpo as { avaliacoes?: unknown })?.avaliacoes) ? (corpo as { avaliacoes: unknown[] }).avaliacoes : [];
  const vistos = new Set<string>();
  const saida: EnvioDeAvaliacao[] = [];
  for (const item of lista.slice(0, 30)) {
    const { produto, nota, texto } = (item ?? {}) as Record<string, unknown>;
    if (typeof produto !== "string" || !produtosDoPedido.has(produto) || vistos.has(produto)) continue;
    if (typeof nota !== "number" || !Number.isInteger(nota) || nota < 1 || nota > 5) continue;
    vistos.add(produto);
    const limpo = typeof texto === "string" ? texto.replace(/\s+/g, " ").trim().slice(0, 600) : "";
    saida.push({ produto, nota, ...(limpo ? { texto: limpo } : {}) });
  }
  return saida;
}

// ---------------------------------------------------------------------------
// Armazenamento (JSON Lines na pasta persistente, como a pesquisa)
// ---------------------------------------------------------------------------

export function arquivoAvaliacoes(): string {
  return process.env.AVALIACOES_ARQUIVO ?? join(dirname(arquivoTokens()), "avaliacoes.jsonl");
}
const arquivoTemporario = () => join(tmpdir(), "kambada-avaliacoes.jsonl");

let fila: Promise<unknown> = Promise.resolve();
function naFila<T>(trabalho: () => Promise<T>): Promise<T> {
  const proximo = fila.then(trabalho, trabalho);
  fila = proximo.catch(() => undefined);
  return proximo;
}

async function lerArquivo(caminho: string): Promise<Avaliacao[]> {
  try {
    const lista: Avaliacao[] = [];
    for (const l of (await readFile(caminho, "utf8")).split("\n")) {
      if (!l.trim()) continue;
      try {
        lista.push(JSON.parse(l) as Avaliacao);
      } catch {
        /* linha corrompida: ignora */
      }
    }
    return lista;
  } catch {
    return [];
  }
}

export async function listarAvaliacoes(): Promise<Avaliacao[]> {
  const todas = [...(await lerArquivo(arquivoAvaliacoes())), ...(await lerArquivo(arquivoTemporario()))];
  return todas.sort((a, b) => b.em.localeCompare(a.em));
}

async function regravar(lista: Avaliacao[]): Promise<void> {
  const destino = arquivoAvaliacoes();
  await mkdir(dirname(destino), { recursive: true });
  const tmp = `${destino}.${process.pid}.tmp`;
  await writeFile(tmp, lista.map((a) => JSON.stringify(a)).join("\n") + (lista.length ? "\n" : ""), "utf8");
  await rename(tmp, destino);
}

type PecaDoPedido = { produto: string; produtoNome: string; opcao?: string };

/**
 * Grava as avaliações de um pedido. Reenviar troca a avaliação anterior da
 * mesma peça no mesmo pedido (e ela volta para a fila de aprovação).
 */
export function gravarAvaliacoes(
  pedido: string,
  nomeDoCliente: string,
  autorizaPublicar: boolean,
  envios: EnvioDeAvaliacao[],
  pecas: PecaDoPedido[],
  agora = new Date(),
): Promise<Avaliacao[]> {
  return naFila(async () => {
    const novas: Avaliacao[] = envios.map((e) => {
      const peca = pecas.find((p) => p.produto === e.produto)!;
      return {
        id: idAleatorio(),
        em: agora.toISOString(),
        pedido,
        produto: e.produto,
        produtoNome: peca.produtoNome,
        ...(peca.opcao ? { opcao: peca.opcao } : {}),
        nota: e.nota,
        ...(e.texto ? { texto: e.texto } : {}),
        nome: nomeDeExibicao(nomeDoCliente),
        autorizaPublicar,
        status: "pendente",
      };
    });
    const substituidas = new Set(novas.map((a) => `${a.pedido}|${a.produto}`));
    const atuais = await lerArquivo(arquivoAvaliacoes());
    if (atuais.some((a) => substituidas.has(`${a.pedido}|${a.produto}`))) {
      await regravar([...atuais.filter((a) => !substituidas.has(`${a.pedido}|${a.produto}`)), ...novas]);
    } else {
      try {
        await mkdir(dirname(arquivoAvaliacoes()), { recursive: true });
        await appendFile(arquivoAvaliacoes(), novas.map((a) => JSON.stringify(a) + "\n").join(""), "utf8");
      } catch (e) {
        console.error("[avaliacoes] pasta persistente indisponível, gravando na temporária:", e);
        await appendFile(arquivoTemporario(), novas.map((a) => JSON.stringify(a) + "\n").join(""), "utf8");
      }
    }
    return novas;
  });
}

export function moderarAvaliacao(id: string, status: Exclude<StatusAvaliacao, "pendente">, agora = new Date()): Promise<boolean> {
  return naFila(async () => {
    const lista = await lerArquivo(arquivoAvaliacoes());
    const a = lista.find((x) => x.id === id);
    if (!a) return false;
    a.status = status;
    a.moderadoEm = agora.toISOString();
    await regravar(lista);
    return true;
  });
}

// ---------------------------------------------------------------------------
// O que vai ao ar
// ---------------------------------------------------------------------------

/** Publicável = aprovada pela loja E autorizada pelo cliente. */
export const publicavel = (a: Avaliacao) => a.status === "aprovada" && a.autorizaPublicar;

export function avaliacoesDoProduto(todas: Avaliacao[], chave: string): { media: number | null; lista: Avaliacao[] } {
  const lista = todas.filter((a) => a.produto === chave && publicavel(a));
  const media = lista.length ? Math.round((lista.reduce((s, a) => s + a.nota, 0) / lista.length) * 10) / 10 : null;
  return { media, lista };
}
