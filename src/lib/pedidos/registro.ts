/**
 * Registro dos pedidos do site — a memória própria da loja.
 *
 * Pedido do Alexandre (08/10/2026): guardar os dados de cada venda para o
 * acompanhamento e para a página de controle. O site não tem banco de dados;
 * cada pedido vira um arquivo JSON na mesma pasta persistente das chaves do
 * Bling (fora da pasta da aplicação, então sobrevive a cada deploy).
 *
 * LGPD — guarda só o necessário para acompanhar e controlar: nome, e-mail,
 * itens, entrega e totais. CPF, telefone e endereço NÃO entram aqui: estão no
 * Bling, onde a nota fiscal precisa deles.
 *
 * Os campos `estoque`, `email` e `nfe` registram o que já foi feito depois da
 * venda — é o que impede baixar estoque ou mandar e-mail duas vezes.
 */

import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { arquivoTokens } from "../bling/tokens";

export type Etapa = { feitoEm?: string; erro?: string; detalhe?: string };

export type RegistroPedido = {
  ref: string;
  pagamentoId: number;
  criadoEm: string;
  cliente: { nome: string; email: string };
  itens: { id: number; nome: string; quantidade: number; preco: number }[];
  entrega: { descricao: string; valor: number; retirada: boolean; prazoDias: number };
  total: number;
  pagamento: { tipo?: string; parcelas?: number; taxa?: number };
  bling: { idPedido: number };
  estoque?: Etapa;
  email?: Etapa;
  /** Aviso "novo pedido pago" à caixa da loja. */
  emailLoja?: Etapa;
  nfe?: Etapa & { idNota?: number };
};

const FORMATO_REF = /^KMB-\d{8}-[0-9A-F]{6}$/;

export function pastaDosPedidos(): string {
  return process.env.PEDIDOS_PASTA ?? join(dirname(arquivoTokens()), "pedidos");
}

function arquivoDo(ref: string): string {
  // A referência vira nome de arquivo: só passa o formato exato, nada de "../".
  if (!FORMATO_REF.test(ref)) throw new Error(`referência inválida: ${ref}`);
  return join(pastaDosPedidos(), `${ref}.json`);
}

export async function lerRegistro(ref: string): Promise<RegistroPedido | null> {
  try {
    return JSON.parse(await readFile(arquivoDo(ref), "utf8")) as RegistroPedido;
  } catch {
    return null;
  }
}

/** Grava em arquivo temporário e renomeia: um arquivo nunca fica pela metade. */
export async function salvarRegistro(r: RegistroPedido): Promise<void> {
  const destino = arquivoDo(r.ref);
  await mkdir(dirname(destino), { recursive: true });
  const temporario = `${destino}.${process.pid}.tmp`;
  await writeFile(temporario, JSON.stringify(r, null, 2), "utf8");
  await rename(temporario, destino);
}

export async function atualizarRegistro(
  ref: string,
  mudanca: Partial<RegistroPedido>,
): Promise<RegistroPedido | null> {
  const atual = await lerRegistro(ref);
  if (!atual) return null;
  const novo = { ...atual, ...mudanca };
  await salvarRegistro(novo);
  return novo;
}

/** Os pedidos mais recentes primeiro. */
export async function listarRegistros(limite = 100): Promise<RegistroPedido[]> {
  let nomes: string[];
  try {
    nomes = (await readdir(pastaDosPedidos())).filter((n) => /^KMB-.*\.json$/.test(n));
  } catch {
    return [];
  }
  const registros = await Promise.all(nomes.map((n) => lerRegistro(n.replace(/\.json$/, ""))));
  return registros
    .filter((r): r is RegistroPedido => r !== null)
    .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
    .slice(0, limite);
}
