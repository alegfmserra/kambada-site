import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { NextResponse } from "next/server";
import {
  BLOQUINHO_CAPA,
  CADERNINHO_KRAFT,
  CARRANCA,
  ID_CATEGORIA,
  corpoCarranca,
  ID_DEPOSITO,
  KAMBADINHA,
  PASSOS,
  PUXADOR,
  REVOADA_MINI,
  corpoBloquinhoCapa,
  corpoCaderninhoKraft,
  variacoesDoKraft,
  type ChavePasso,
} from "@/lib/bling/ajustes-2026-10-21";
import { chamarBling, listarTudo } from "@/lib/bling/cliente";
import { DESCRICOES } from "@/lib/bling/descricoes-finais";
import { invalidarCatalogoEmMemoria } from "@/lib/bling/produtos";
import { arquivoTokens } from "@/lib/bling/tokens";
import { ErroBling, type ProdutoBling } from "@/lib/bling/tipos";
import { segredoDeManutencao } from "@/lib/seguranca/segredo";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Papelaria, Kambadinha, Revoada Mini e puxador (Alexandre, 21/10/2026) —
 * ESCREVE NO ERP. Dados e corpos em src/lib/bling/ajustes-2026-10-21.ts.
 *
 * Mesma disciplina da rota ajustes-wilzanira: GET ensaia; POST exige
 * `aplicar=1` e `apenas=<chave>` (um passo por chamada); cópia do original
 * antes de gravar; relê e diz se `bateu`; pula o que já está feito.
 */

type Obj = Record<string, unknown>;
const hoje = () => new Date().toISOString().slice(0, 10);
const MOTIVO = "Ajustes do Alexandre em 21/10/2026 (bloquinhos, Kambadinha, Revoada Mini).";

const ler = async (id: number) => (await chamarBling<{ data: Obj }>(`/produtos/${id}`, { revalidar: 0 })).data;

async function saldo(id: number): Promise<number | null> {
  const r = await chamarBling<{ data?: { saldoVirtualTotal?: number }[] }>(`/estoques/saldos?idsProdutos[]=${id}`, { revalidar: 0 });
  return r.data?.[0]?.saldoVirtualTotal ?? null;
}

async function balancar(id: number, quantidade: number): Promise<number | null> {
  if ((await saldo(id)) === quantidade) return quantidade;
  await chamarBling("/estoques", {
    metodo: "POST",
    corpo: { produto: { id }, deposito: { id: ID_DEPOSITO }, operacao: "B", quantidade, observacoes: `${MOTIVO} Lançado via integração do site em ${hoje()}.` },
  });
  return saldo(id);
}

const variacoesDe = (p: Obj) => ((p.variacoes as Obj[] | undefined) ?? []).map((v) => ({
  id: Number(v.id),
  nome: v.nome,
  preco: v.preco,
  atributos: String((v.variacao as Obj | undefined)?.nome ?? ""),
}));

/** Preço de cada variação, uma a uma (o Bling ignora o preço dos filhos no PUT do pai). */
async function precoNasVariacoes(ids: number[], preco: number) {
  const r: Obj[] = [];
  for (const id of ids) {
    const filho = await ler(id);
    if (Number(filho.preco) !== preco) await chamarBling(`/produtos/${id}`, { metodo: "PUT", corpo: { ...filho, preco } });
    r.push({ id, preco: (await ler(id)).preco });
  }
  return r;
}

async function responder(requisicao: Request, escrever: boolean) {
  const url = new URL(requisicao.url);
  if (!segredoDeManutencao(requisicao)) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });

  const apenas = url.searchParams.get("apenas") as ChavePasso | null;
  if (apenas && !PASSOS.some((p) => p.chave === apenas)) {
    return NextResponse.json({ erro: `passo desconhecido: ${apenas}`, passos: PASSOS }, { status: 400 });
  }
  const aplicar = escrever && url.searchParams.get("aplicar") === "1";
  if (aplicar && !apenas) {
    return NextResponse.json({ erro: "aplicar exige apenas=<chave> — um passo por vez", passos: PASSOS }, { status: 400 });
  }
  const roda = (chave: ChavePasso) => !apenas || apenas === chave;

  const feitos: Obj[] = [];
  const originais: unknown[] = [];

  try {
    // ── bloquinho-capa ──
    if (roda("bloquinho-capa")) {
      const atual = await ler(BLOQUINHO_CAPA.id);
      const s = await saldo(BLOQUINHO_CAPA.id);
      const corpo = corpoBloquinhoCapa(atual);
      const plano = { passo: "bloquinho-capa", id: BLOQUINHO_CAPA.id, agora: { nome: atual.nome, preco: atual.preco, saldo: s }, alvo: { nome: BLOQUINHO_CAPA.nome, preco: BLOQUINHO_CAPA.preco, saldo: BLOQUINHO_CAPA.saldo } };
      const jaFeito = atual.nome === BLOQUINHO_CAPA.nome && Number(atual.preco) === BLOQUINHO_CAPA.preco && atual.descricaoCurta === corpo.descricaoCurta && s === BLOQUINHO_CAPA.saldo;
      if (jaFeito) feitos.push({ ...plano, acao: "pular", motivo: "já gravado" });
      else if (!aplicar) feitos.push({ ...plano, acao: "gravar" });
      else {
        originais.push(atual);
        await chamarBling(`/produtos/${BLOQUINHO_CAPA.id}`, { metodo: "PUT", corpo });
        const saldoDepois = await balancar(BLOQUINHO_CAPA.id, BLOQUINHO_CAPA.saldo);
        const d = await ler(BLOQUINHO_CAPA.id);
        feitos.push({
          ...plano,
          acao: "gravado",
          conferido: { nome: d.nome, preco: d.preco, descricao: d.descricaoCurta === corpo.descricaoCurta, saldo: saldoDepois },
          bateu: d.nome === BLOQUINHO_CAPA.nome && Number(d.preco) === BLOQUINHO_CAPA.preco && d.descricaoCurta === corpo.descricaoCurta && saldoDepois === BLOQUINHO_CAPA.saldo,
        });
      }
    }

    // ── caderninho-kraft: conversão por API (pode ser recusada) ──
    if (roda("caderninho-kraft")) {
      const atual = await ler(CADERNINHO_KRAFT.id);
      const plano = { passo: "caderninho-kraft", id: CADERNINHO_KRAFT.id, nomeAgora: atual.nome, formatoAgora: atual.formato, precoAgora: atual.preco, variacoesAgora: variacoesDe(atual) };
      if (atual.formato === "V") feitos.push({ ...plano, acao: "pular", motivo: "já tem variações — use caderninho-kraft-saldo" });
      else if (atual.nome !== CADERNINHO_KRAFT.nomeAntigo) feitos.push({ ...plano, acao: "erro", motivo: `nome inesperado: ${String(atual.nome)}` });
      else if (!aplicar) feitos.push({ ...plano, acao: "converter", corpo: corpoCaderninhoKraft(atual) });
      else {
        originais.push(atual);
        await chamarBling(`/produtos/${CADERNINHO_KRAFT.id}`, { metodo: "PUT", corpo: corpoCaderninhoKraft(atual) });
        const d = await ler(CADERNINHO_KRAFT.id);
        const filhos = variacoesDe(d);
        const casou = variacoesDoKraft().every((e) => filhos.some((f) => f.atributos === e.atributos));
        feitos.push({
          ...plano,
          acao: "convertido",
          conferido: { nome: d.nome, formato: d.formato, preco: d.preco, variacoes: filhos },
          bateu: d.formato === "V" && casou,
          proximo: "caderninho-kraft-saldo",
          seNaoBateu: "criar no painel as 4 variações (Estampa: Bumba meu Boi / Cazumbá / Caboclo de Pena / Ilha do Amor) e rodar caderninho-kraft-saldo",
        });
      }
    }

    // ── caderninho-kraft-saldo ──
    if (roda("caderninho-kraft-saldo")) {
      const atual = await ler(CADERNINHO_KRAFT.id);
      const filhos = variacoesDe(atual);
      const plano = { passo: "caderninho-kraft-saldo", id: CADERNINHO_KRAFT.id, nome: atual.nome, formato: atual.formato, preco: atual.preco, variacoes: filhos };
      if (atual.formato !== "V") feitos.push({ ...plano, acao: "erro", motivo: "ainda sem variações — rodar caderninho-kraft (ou criar no painel)" });
      else if (!aplicar) feitos.push({ ...plano, acao: "gravar", alvo: variacoesDoKraft() });
      else {
        originais.push(atual);
        const descricao = DESCRICOES[CADERNINHO_KRAFT.id];
        if (atual.nome !== CADERNINHO_KRAFT.nome || Number(atual.preco) !== CADERNINHO_KRAFT.preco || atual.descricaoCurta !== descricao) {
          await chamarBling(`/produtos/${CADERNINHO_KRAFT.id}`, { metodo: "PUT", corpo: { ...atual, nome: CADERNINHO_KRAFT.nome, preco: CADERNINHO_KRAFT.preco, descricaoCurta: descricao } });
        }
        const precos = await precoNasVariacoes(filhos.map((f) => f.id), CADERNINHO_KRAFT.preco);
        const saldos: Obj[] = [];
        for (const e of variacoesDoKraft()) {
          const f = filhos.find((x) => x.atributos === e.atributos);
          saldos.push(f ? { atributos: e.atributos, saldo: await balancar(f.id, e.saldo) } : { atributos: e.atributos, erro: "variação não encontrada" });
        }
        const d = await ler(CADERNINHO_KRAFT.id);
        feitos.push({
          ...plano,
          acao: "gravado",
          conferido: { nome: d.nome, preco: d.preco, descricao: d.descricaoCurta === descricao, precos, saldos },
          bateu:
            d.nome === CADERNINHO_KRAFT.nome &&
            Number(d.preco) === CADERNINHO_KRAFT.preco &&
            precos.every((p) => Number(p.preco) === CADERNINHO_KRAFT.preco) &&
            variacoesDoKraft().every((e) => saldos.some((x) => x.atributos === e.atributos && x.saldo === e.saldo)),
        });
      }
    }

    // ── kambadinha ──
    if (roda("kambadinha")) {
      const atual = await ler(KAMBADINHA.id);
      const cores = [];
      for (const c of KAMBADINHA.cores) cores.push({ ...c, precoAgora: (await ler(c.id)).preco, saldoAgora: await saldo(c.id) });
      const plano = { passo: "kambadinha", id: KAMBADINHA.id, precoPaiAgora: atual.preco, cores, alvo: { preco: KAMBADINHA.preco } };
      const jaFeito = Number(atual.preco) === KAMBADINHA.preco && cores.every((c) => Number(c.precoAgora) === KAMBADINHA.preco && c.saldoAgora === c.saldo);
      if (jaFeito) feitos.push({ ...plano, acao: "pular", motivo: "já gravado" });
      else if (!aplicar) feitos.push({ ...plano, acao: "gravar" });
      else {
        originais.push(atual);
        if (Number(atual.preco) !== KAMBADINHA.preco) await chamarBling(`/produtos/${KAMBADINHA.id}`, { metodo: "PUT", corpo: { ...atual, preco: KAMBADINHA.preco } });
        const precos = await precoNasVariacoes(KAMBADINHA.cores.map((c) => c.id), KAMBADINHA.preco);
        const saldos: { atributos: string; saldo: number | null }[] = [];
        for (const c of KAMBADINHA.cores) saldos.push({ atributos: c.atributos, saldo: await balancar(c.id, c.saldo) });
        const d = await ler(KAMBADINHA.id);
        feitos.push({
          ...plano,
          acao: "gravado",
          conferido: { precoPai: d.preco, precos, saldos },
          bateu: Number(d.preco) === KAMBADINHA.preco && precos.every((p) => Number(p.preco) === KAMBADINHA.preco) && KAMBADINHA.cores.every((c, i) => saldos[i].saldo === c.saldo),
        });
      }
    }

    // ── revoada-mini ──
    if (roda("revoada-mini")) {
      const s = await saldo(REVOADA_MINI.id);
      const plano = { passo: "revoada-mini", id: REVOADA_MINI.id, saldoAgora: s, alvo: REVOADA_MINI.saldo };
      if (s === REVOADA_MINI.saldo) feitos.push({ ...plano, acao: "pular", motivo: "já está" });
      else if (!aplicar) feitos.push({ ...plano, acao: "balanco" });
      else {
        const depois = await balancar(REVOADA_MINI.id, REVOADA_MINI.saldo);
        feitos.push({ ...plano, acao: "gravado", conferido: { saldo: depois }, bateu: depois === REVOADA_MINI.saldo });
      }
    }

    // ── carranca: cria (sem estoque), não recria se já existir pelo nome ──
    if (roda("carranca")) {
      const todos = await listarTudo<ProdutoBling>("/produtos?criterio=2", { revalidar: 0 });
      const existente = todos.find((p) => p.nome === CARRANCA.nome);
      if (existente) feitos.push({ passo: "carranca", acao: "pular", motivo: `já existe (id ${existente.id})` });
      else if (!aplicar) feitos.push({ passo: "carranca", acao: "criar", corpo: corpoCarranca(ID_CATEGORIA) });
      else {
        const criado = await chamarBling<{ data: { id: number } }>("/produtos", { metodo: "POST", corpo: corpoCarranca(ID_CATEGORIA) });
        const d = await ler(criado.data.id);
        const filhos = variacoesDe(d);
        const saldos = [];
        for (const f of filhos) saldos.push({ id: f.id, saldo: await saldo(f.id) });
        feitos.push({
          passo: "carranca",
          acao: "criado",
          id: criado.data.id,
          conferido: { nome: d.nome, preco: d.preco, variacoes: filhos, saldos },
          bateu: d.nome === CARRANCA.nome && filhos.length === 1 && Number(filhos[0].preco) === CARRANCA.preco && saldos.every((x) => !x.saldo),
          lembrete: "anote o ID: a foto da Carranca entra no script de fotos por ele; rodar /api/bling/fiscal para o NCM",
        });
      }
    }

    // ── puxador ──
    if (roda("puxador")) {
      const atual = await ler(PUXADOR.id);
      const plano = { passo: "puxador", id: PUXADOR.id, nomeAgora: atual.nome, alvo: PUXADOR.nome };
      if (atual.nome === PUXADOR.nome) feitos.push({ ...plano, acao: "pular", motivo: "já renomeado" });
      else if (!aplicar) feitos.push({ ...plano, acao: "renomear" });
      else {
        originais.push(atual);
        await chamarBling(`/produtos/${PUXADOR.id}`, { metodo: "PUT", corpo: { ...atual, nome: PUXADOR.nome } });
        const d = await ler(PUXADOR.id);
        feitos.push({ ...plano, acao: "renomeado", conferido: { nome: d.nome, preco: d.preco }, bateu: d.nome === PUXADOR.nome });
      }
    }
  } catch (e) {
    feitos.push({ acao: "erro", erro: e instanceof Error ? e.message : String(e), respostaDoBling: e instanceof ErroBling ? e.corpo : undefined });
  }

  if (aplicar) invalidarCatalogoEmMemoria();
  let copia: string | null = null;
  if (originais.length) {
    copia = join(dirname(arquivoTokens()), `backup-ajustes-2026-10-21-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    await mkdir(dirname(copia), { recursive: true });
    await writeFile(copia, JSON.stringify(originais, null, 2), "utf8");
  }
  return NextResponse.json({ modo: aplicar ? "aplicado" : "ensaio — nada foi escrito no Bling", passos: PASSOS, copiaDosOriginais: copia, feitos });
}

export async function GET(requisicao: Request) {
  return responder(requisicao, false);
}
export async function POST(requisicao: Request) {
  return responder(requisicao, true);
}
