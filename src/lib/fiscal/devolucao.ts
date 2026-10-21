/**
 * Nota fiscal de devolução de venda, emitida pelo site no Bling (Fase B,
 * 21/10/2026).
 *
 * Regra do Glauco (via Alexandre): é a operação inversa da venda — CFOP de
 * entrada correspondente ao da nota emitida — e SEMPRE referencia a nota de
 * venda original (chave, número, série e data).
 *
 * Quando: a nota de venda passou das 24 h (não dá mais para cancelar) e o
 * pedido foi cancelado/estornado, ou o cliente devolveu a peça (arrependimento).
 *
 * Dois passos, de propósito: (1) o site CRIA a nota no Bling (rascunho, não vai
 * à SEFAZ) e mostra o link para conferir; (2) a loja clica "Enviar à SEFAZ".
 * Nota fiscal autorizada não se desfaz.
 *
 * A API do Bling não cria natureza de operação: a natureza "Devolução de venda"
 * precisa existir na conta (ou estar em BLING_NATUREZA_DEVOLUCAO).
 */

import { chamarBling } from "../bling/cliente";
import { atualizarRegistro, lerRegistro, type RegistroPedido } from "../pedidos/registro";

/**
 * CFOP da devolução a partir do CFOP da venda. Só os que a Kambada usa e cujo
 * inverso é certo; o resto devolve null e a nota sai manualmente com o Glauco
 * (ex.: livro em consignação, x115).
 */
const INVERSO: Record<string, string> = {
  "5101": "1201", // venda de produção própria (MA)
  "5102": "1202", // venda de mercadoria adquirida (MA)
  "6101": "2201",
  "6102": "2202",
  "6107": "2201", // venda de produção própria a não contribuinte de outra UF
  "6108": "2202", // venda de mercadoria adquirida a não contribuinte de outra UF
};

export function cfopDeDevolucao(cfopVenda: string | undefined): string | null {
  return INVERSO[(cfopVenda ?? "").replace(/\D/g, "")] ?? null;
}

type ItemNota = {
  codigo?: string;
  descricao?: string;
  unidade?: string;
  quantidade?: number;
  valor?: number;
  tipo?: string;
  origem?: number;
  cfop?: string;
  classificacaoFiscal?: string;
  gtin?: string;
};
type NotaBling = {
  id?: number;
  numero?: string;
  serie?: number | string;
  chaveAcesso?: string;
  dataEmissao?: string;
  situacao?: number;
  contato?: { id?: number; nome?: string; tipoPessoa?: string; numeroDocumento?: string; contribuinte?: number; ie?: string; email?: string; endereco?: unknown };
  itens?: ItemNota[];
};

/** "2026-10-21 10:00:00" → "2610" (AAMM, como a SEFAZ pede na referência). */
export function aamm(data: string | undefined): string {
  const m = /^(\d{2})(\d{2})-(\d{2})/.exec(data ?? "");
  return m ? `${m[2]}${m[3]}` : "";
}

/** Corpo da nota de devolução a partir da nota de venda. Exportada para teste. */
export function montarNotaDeDevolucao(venda: NotaBling, idNatureza: number, ref: string, hoje = new Date()) {
  if (!venda.chaveAcesso) throw new Error("a nota de venda não tem chave de acesso — ela foi autorizada?");
  const itens = (venda.itens ?? []).map((i) => {
    const cfop = cfopDeDevolucao(i.cfop);
    if (!cfop) throw new Error(`CFOP ${i.cfop ?? "?"} de "${i.descricao}" sem inverso definido — emitir esta devolução manualmente com o Glauco`);
    return {
      codigo: i.codigo,
      descricao: i.descricao,
      unidade: i.unidade,
      quantidade: i.quantidade,
      valor: i.valor,
      tipo: i.tipo ?? "P",
      origem: i.origem ?? 0,
      classificacaoFiscal: i.classificacaoFiscal,
      gtin: i.gtin,
      cfop,
    };
  });
  if (!itens.length) throw new Error("a nota de venda veio sem itens");
  const referencia = {
    modelo: "55",
    chaveAcesso: venda.chaveAcesso,
    numero: venda.numero,
    serie: venda.serie !== undefined ? String(venda.serie) : undefined,
    data: aamm(venda.dataEmissao),
  };
  const c = venda.contato ?? {};
  const dia = hoje.toISOString().slice(0, 10);
  return {
    tipo: 0, // entrada
    finalidade: 4, // devolução
    dataOperacao: dia,
    naturezaOperacao: { id: idNatureza },
    contato: {
      id: c.id,
      nome: c.nome,
      tipoPessoa: c.tipoPessoa,
      numeroDocumento: c.numeroDocumento,
      contribuinte: c.contribuinte,
      ie: c.ie,
      email: c.email,
      endereco: c.endereco,
    },
    documentoReferenciado: referencia,
    documentosReferenciados: [referencia],
    itens,
    observacoes: `Devolução referente à NF-e nº ${venda.numero ?? "?"} série ${venda.serie ?? "?"}, chave ${venda.chaveAcesso}. Pedido do site ${ref}.`,
  };
}

/**
 * A natureza "Devolução de venda" — exatamente esta. Na conta existem também
 * "Devolução de compra" e "Devolução de venda com ST" (conferido em 21/10/2026,
 * id 15110388646); pegar a primeira com "devolu" no nome escolheria a de COMPRA.
 */
export function escolherNaturezaDeDevolucao(naturezas: { id: number; descricao?: string; situacao?: number }[]): number | null {
  const achada = naturezas.find((n) => /^\s*devolu[cç][aã]o de venda\s*$/i.test(n.descricao ?? "") && n.situacao !== 0);
  return achada?.id ?? null;
}

export async function naturezaDeDevolucao(): Promise<number> {
  const fixa = Number(process.env.BLING_NATUREZA_DEVOLUCAO);
  if (fixa) return fixa;
  const r = await chamarBling<{ data?: { id: number; descricao?: string; situacao?: number }[] }>(
    "/naturezas-operacoes?limite=100",
    { revalidar: 0 },
  );
  const id = escolherNaturezaDeDevolucao(r.data ?? []);
  const achada = id ? { id } : null;
  if (!achada) {
    throw new Error(
      'não há natureza de operação de devolução no Bling — criar "Devolução de venda" (entrada, finalidade devolução, CFOP 1.202/2.202) em Cadastros → Naturezas de operação',
    );
  }
  return achada.id;
}

/** Passo 1: cria a nota de devolução no Bling (sem enviar à SEFAZ). */
export async function criarNotaDeDevolucao(ref: string): Promise<RegistroPedido | null> {
  const r = await lerRegistro(ref);
  if (!r) throw new Error(`pedido ${ref} não encontrado`);
  if (!r.nfe?.idNota) throw new Error("o pedido não tem nota de venda");
  if (r.devolucao?.idNota) return r;
  try {
    const venda = (await chamarBling<{ data?: NotaBling }>(`/nfe/${r.nfe.idNota}`, { revalidar: 0 })).data ?? {};
    const corpo = montarNotaDeDevolucao(venda, await naturezaDeDevolucao(), ref);
    const criada = await chamarBling<{ data?: { id?: number } }>("/nfe", { metodo: "POST", corpo });
    if (!criada.data?.id) throw new Error("o Bling não devolveu o número da nota de devolução");
    return atualizarRegistro(ref, {
      devolucao: { idNota: criada.data.id, criadaEm: new Date().toISOString(), referencia: `NF-e ${venda.numero} série ${venda.serie}` },
    });
  } catch (e) {
    return atualizarRegistro(ref, { devolucao: { ...r.devolucao, erro: e instanceof Error ? e.message : String(e) } });
  }
}

/** Passo 2: a loja conferiu no Bling e manda à SEFAZ. */
export async function enviarNotaDeDevolucao(ref: string): Promise<RegistroPedido | null> {
  const r = await lerRegistro(ref);
  const d = r?.devolucao;
  if (!r || !d?.idNota) throw new Error("crie a nota de devolução primeiro");
  if (d.enviadaEm) return r;
  try {
    await chamarBling(`/nfe/${d.idNota}/enviar?enviarEmail=false`, { metodo: "POST" });
    const nota = (await chamarBling<{ data?: NotaBling }>(`/nfe/${d.idNota}`, { revalidar: 0 })).data;
    const devolucao = { ...d, enviadaEm: new Date().toISOString(), numero: nota?.numero, situacao: nota?.situacao, erro: undefined };
    // A devolução resolve a pendência da nota no cancelamento.
    const cancelamento = r.cancelamento?.nota
      ? { ...r.cancelamento, nota: { ...r.cancelamento.nota, resolvidaEm: r.cancelamento.nota.resolvidaEm ?? new Date().toISOString() } }
      : r.cancelamento;
    return atualizarRegistro(ref, { devolucao, cancelamento });
  } catch (e) {
    return atualizarRegistro(ref, { devolucao: { ...d, erro: e instanceof Error ? e.message : String(e) } });
  }
}
