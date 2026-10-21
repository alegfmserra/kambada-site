import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { NextResponse } from "next/server";
import {
  ID_DEPOSITO,
  LIVRO_TRILINGUE,
  MACHAO,
  MATRACA_DTF,
  PASSOS,
  PLACA,
  PUXADOR,
  corpoPuxador,
  REGATAO_DUPLICADO,
  REGATAO_PAI,
  REGATAO_SALDO,
  REGATAO_TAMANHO,
  REGATAO_VARIACAO,
  corpoMachao,
  corpoMatracaDtf,
  corpoPlaca,
  corpoRegataoPai,
  variacoesDaPlaca,
  type ChavePasso,
} from "@/lib/bling/ajustes-2026-10-20";
import { chamarBling, listarTudo } from "@/lib/bling/cliente";
import { DESCRICOES } from "@/lib/bling/descricoes-finais";
import { invalidarCatalogoEmMemoria } from "@/lib/bling/produtos";
import { arquivoTokens } from "@/lib/bling/tokens";
import { ErroBling, type ProdutoBling } from "@/lib/bling/tipos";
import { segredoDeManutencao } from "@/lib/seguranca/segredo";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Correções da Wilzanira (20/10/2026) — ESCREVE NO ERP. Dados e corpos em
 * src/lib/bling/ajustes-2026-10-20.ts.
 *
 * Disciplina de sempre:
 *  - GET só ensaia (mostra o estado atual e o que faria, passo a passo);
 *  - POST exige `aplicar=1` E `apenas=<chave>` — um passo por chamada, nunca
 *    o lote inteiro de uma vez (chaves: regatao-duplicado, regatao, machao,
 *    trilingue, placa, matraca-dtf);
 *  - antes de gravar, o produto original inteiro vai para um arquivo de cópia;
 *  - relê depois e diz, campo a campo, se ficou (`bateu`);
 *  - não recria o que já existe pelo nome (pode rodar de novo sem duplicar);
 *  - para no primeiro erro.
 */

type Obj = Record<string, unknown>;
const hoje = () => new Date().toISOString().slice(0, 10);
const MOTIVO = "Correções da Wilzanira, autorizadas pelo Alexandre em 20/10/2026.";

const ler = async (id: number) => (await chamarBling<{ data: Obj }>(`/produtos/${id}`, { revalidar: 0 })).data;

async function saldo(id: number): Promise<number | null> {
  const r = await chamarBling<{ data?: { saldoVirtualTotal?: number }[] }>(`/estoques/saldos?idsProdutos[]=${id}`, { revalidar: 0 });
  return r.data?.[0]?.saldoVirtualTotal ?? null;
}

async function balancar(id: number, quantidade: number): Promise<number | null> {
  await chamarBling("/estoques", {
    metodo: "POST",
    corpo: { produto: { id }, deposito: { id: ID_DEPOSITO }, operacao: "B", quantidade, observacoes: `${MOTIVO} Lançado via integração do site em ${hoje()}.` },
  });
  return saldo(id);
}

const variacoesDe = (p: Obj) => ((p.variacoes as Obj[] | undefined) ?? []).map((v) => ({
  id: v.id,
  nome: v.nome,
  situacao: v.situacao,
  preco: v.preco,
  atributos: (v.variacao as Obj | undefined)?.nome,
}));

async function responder(requisicao: Request, escrever: boolean) {
  const url = new URL(requisicao.url);
  if (!segredoDeManutencao(requisicao)) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });

  const apenas = url.searchParams.get("apenas") as ChavePasso | null;
  if (apenas && !PASSOS.some((p) => p.chave === apenas)) {
    return NextResponse.json({ erro: `passo desconhecido: ${apenas}`, passos: PASSOS }, { status: 400 });
  }
  const pediuAplicar = escrever && url.searchParams.get("aplicar") === "1";
  if (pediuAplicar && !apenas) {
    return NextResponse.json({ erro: "aplicar exige apenas=<chave> — um passo por vez", passos: PASSOS }, { status: 400 });
  }
  const aplicar = pediuAplicar;
  const roda = (chave: ChavePasso) => !apenas || apenas === chave;

  const todos = await listarTudo<ProdutoBling>("/produtos?criterio=2", { revalidar: 0 });
  const ativoPeloNome = (nome: string) => todos.find((p) => p.nome === nome);

  const feitos: Obj[] = [];
  const originais: unknown[] = [];

  try {
    // ── regatao-duplicado: zera e inativa 16719577404 ──
    if (roda("regatao-duplicado")) {
      const atual = await ler(REGATAO_DUPLICADO);
      const s = await saldo(REGATAO_DUPLICADO);
      const plano = { passo: "regatao-duplicado", id: REGATAO_DUPLICADO, nome: atual.nome, situacao: atual.situacao, saldo: s, alvo: { situacao: "I", saldo: 0 } };
      if (atual.situacao === "I" && s === 0) feitos.push({ ...plano, acao: "pular", motivo: "já inativo e zerado" });
      else if (!aplicar) feitos.push({ ...plano, acao: "inativar" });
      else {
        originais.push(atual);
        const saldoDepois = s === 0 ? 0 : await balancar(REGATAO_DUPLICADO, 0);
        await chamarBling(`/produtos/${REGATAO_DUPLICADO}`, { metodo: "PUT", corpo: { ...atual, situacao: "I" } });
        const depois = await ler(REGATAO_DUPLICADO);
        feitos.push({ ...plano, acao: "inativado", conferido: { situacao: depois.situacao, saldo: saldoDepois }, bateu: depois.situacao === "I" && saldoDepois === 0 });
      }
    }

    // ── regatao: descrição (off white), G → GG, saldo GG = 1 ──
    if (roda("regatao")) {
      const atual = await ler(REGATAO_PAI);
      const corpo = corpoRegataoPai(atual);
      const s = await saldo(REGATAO_VARIACAO);
      const plano = {
        passo: "regatao",
        id: REGATAO_PAI,
        variacoesAgora: variacoesDe(atual),
        variacaoAlvo: { id: REGATAO_VARIACAO, para: `Tamanho:${REGATAO_TAMANHO}`, saldoAgora: s, saldoAlvo: REGATAO_SALDO },
        descricaoNova: corpo.descricaoCurta,
      };
      const filhoAgora = ((atual.variacoes as Obj[] | undefined) ?? []).find((v) => v.id === REGATAO_VARIACAO);
      const jaFeito =
        atual.descricaoCurta === corpo.descricaoCurta &&
        (filhoAgora?.variacao as Obj | undefined)?.nome === `Tamanho:${REGATAO_TAMANHO}` &&
        s === REGATAO_SALDO;
      if (jaFeito) feitos.push({ ...plano, acao: "pular", motivo: "já gravado" });
      else if (!aplicar) feitos.push({ ...plano, acao: "gravar" });
      else {
        originais.push(atual);
        await chamarBling(`/produtos/${REGATAO_PAI}`, { metodo: "PUT", corpo });
        const saldoDepois = s === REGATAO_SALDO ? s : await balancar(REGATAO_VARIACAO, REGATAO_SALDO);
        const pai = await ler(REGATAO_PAI);
        const filho = await ler(REGATAO_VARIACAO);
        const atributos = (filho.variacao as Obj | undefined)?.nome;
        feitos.push({
          ...plano,
          acao: "gravado",
          conferido: { descricao: pai.descricaoCurta === corpo.descricaoCurta, nomeDaVariacao: filho.nome, atributos, saldo: saldoDepois, variacoesDoPai: variacoesDe(pai) },
          bateu:
            pai.descricaoCurta === corpo.descricaoCurta &&
            String(filho.nome).endsWith(`Tamanho:${REGATAO_TAMANHO}`) &&
            atributos === `Tamanho:${REGATAO_TAMANHO}` &&
            saldoDepois === REGATAO_SALDO,
        });
      }
    }

    // ── machao: cria o produto com a grade a zero ──
    if (roda("machao")) {
      const existente = ativoPeloNome(MACHAO.nome);
      if (existente) feitos.push({ passo: "machao", acao: "pular", motivo: `já existe (id ${existente.id})` });
      else if (!aplicar) feitos.push({ passo: "machao", acao: "criar", corpo: corpoMachao() });
      else {
        const criado = await chamarBling<{ data: { id: number } }>("/produtos", { metodo: "POST", corpo: corpoMachao() });
        const pai = await ler(criado.data.id);
        const filhos = variacoesDe(pai);
        feitos.push({
          passo: "machao",
          acao: "criado",
          id: criado.data.id,
          conferido: { nome: pai.nome, preco: pai.preco, situacao: pai.situacao, descricao: pai.descricaoCurta === MACHAO.descricao, variacoes: filhos },
          bateu: pai.nome === MACHAO.nome && pai.preco === MACHAO.preco && filhos.length === MACHAO.tamanhos.length,
          lembrete: "anote o ID: as fotos do machão entram em scripts/preparar-fotos-produtos.mjs por este ID",
        });
      }
    }

    // ── trilingue: inativa ──
    if (roda("trilingue")) {
      const atual = await ler(LIVRO_TRILINGUE);
      const plano = { passo: "trilingue", id: LIVRO_TRILINGUE, nome: atual.nome, situacao: atual.situacao, saldo: await saldo(LIVRO_TRILINGUE) };
      if (atual.situacao === "I") feitos.push({ ...plano, acao: "pular", motivo: "já inativo" });
      else if (!aplicar) feitos.push({ ...plano, acao: "inativar" });
      else {
        originais.push(atual);
        await chamarBling(`/produtos/${LIVRO_TRILINGUE}`, { metodo: "PUT", corpo: { ...atual, situacao: "I" } });
        const depois = await ler(LIVRO_TRILINGUE);
        feitos.push({ ...plano, acao: "inativado", conferido: { situacao: depois.situacao }, bateu: depois.situacao === "I" });
      }
    }

    // ── placa: Grande → Retangular com variações ──
    if (roda("placa")) {
      const atual = await ler(PLACA.id);
      const esperadas = variacoesDaPlaca();
      const plano = { passo: "placa", id: PLACA.id, nomeAgora: atual.nome, formatoAgora: atual.formato, saldoAgora: await saldo(PLACA.id), variacoesAgora: variacoesDe(atual) };
      if (atual.nome === PLACA.nome && atual.formato === "V") feitos.push({ ...plano, acao: "pular", motivo: "já convertida" });
      else if (atual.nome !== PLACA.nomeAntigo) feitos.push({ ...plano, acao: "erro", motivo: `nome inesperado: ${String(atual.nome)}` });
      else if (!aplicar) feitos.push({ ...plano, acao: "converter", corpo: corpoPlaca(atual) });
      else {
        originais.push(atual);
        await chamarBling(`/produtos/${PLACA.id}`, { metodo: "PUT", corpo: corpoPlaca(atual) });
        const depois = await ler(PLACA.id);
        const filhos = variacoesDe(depois);
        const casou = esperadas.every((e) => filhos.some((f) => f.atributos === e.atributos && f.preco === e.preco));
        // Saldo de cada modelo pela contagem de 13/10.
        const saldos: Obj[] = [];
        for (const e of esperadas) {
          const f = filhos.find((x) => x.atributos === e.atributos);
          if (f?.id) saldos.push({ atributos: e.atributos, saldo: await balancar(Number(f.id), e.saldo) });
        }
        feitos.push({
          ...plano,
          acao: "convertida",
          conferido: { nome: depois.nome, formato: depois.formato, preco: depois.preco, descricao: depois.descricaoCurta === corpoPlaca(atual).descricaoCurta, variacoes: filhos },
          saldos,
          bateu: depois.nome === PLACA.nome && depois.formato === "V" && casou && esperadas.every((e) => saldos.some((x) => x.atributos === e.atributos && x.saldo === e.saldo)),
          seNaoBateu: "a conversão de produto simples em pai pode não ser aceita pelo Bling por API: nesse caso, criar as 2 variações no painel (Modelo: Coreira / Coreiro, R$ 160, saldo 2 cada)",
        });
      }
    }

    // ── placa-saldo: depois da conversão feita no painel (a API recusou), descrição + saldo 2 por modelo ──
    if (roda("placa-saldo")) {
      const atual = await ler(PLACA.id);
      const filhos = variacoesDe(atual);
      const plano = { passo: "placa-saldo", id: PLACA.id, nome: atual.nome, formato: atual.formato, variacoes: filhos };
      if (atual.nome !== PLACA.nome || atual.formato !== "V") feitos.push({ ...plano, acao: "erro", motivo: "a placa ainda não foi convertida (nome/formato)" });
      else if (!aplicar) feitos.push({ ...plano, acao: "gravar", alvo: variacoesDaPlaca().map((v) => ({ atributos: v.atributos, saldo: v.saldo })) });
      else {
        originais.push(atual);
        if (atual.descricaoCurta !== DESCRICOES[PLACA.id]) {
          await chamarBling(`/produtos/${PLACA.id}`, { metodo: "PUT", corpo: { ...atual, descricaoCurta: DESCRICOES[PLACA.id] } });
        }
        const saldos: Obj[] = [];
        for (const e of variacoesDaPlaca()) {
          const f = filhos.find((x) => x.atributos === e.atributos);
          if (!f?.id) { saldos.push({ atributos: e.atributos, erro: "variação não encontrada" }); continue; }
          const agora = await saldo(Number(f.id));
          saldos.push({ atributos: e.atributos, saldo: agora === e.saldo ? agora : await balancar(Number(f.id), e.saldo) });
        }
        const depois = await ler(PLACA.id);
        const descOk = depois.descricaoCurta === DESCRICOES[PLACA.id];
        feitos.push({ ...plano, acao: "gravado", conferido: { descricao: descOk, saldos }, bateu: descOk && variacoesDaPlaca().every((e) => saldos.some((x) => x.atributos === e.atributos && x.saldo === e.saldo)) });
      }
    }

    // ── puxador: item à parte, 1 unidade ──
    if (roda("puxador")) {
      const existente = ativoPeloNome(PUXADOR.nome);
      if (existente) feitos.push({ passo: "puxador", acao: "pular", motivo: `já existe (id ${existente.id})` });
      else if (!aplicar) feitos.push({ passo: "puxador", acao: "criar", corpo: corpoPuxador(), saldo: PUXADOR.saldo });
      else {
        const criado = await chamarBling<{ data: { id: number } }>("/produtos", { metodo: "POST", corpo: corpoPuxador() });
        const saldoDepois = await balancar(criado.data.id, PUXADOR.saldo);
        const p = await ler(criado.data.id);
        feitos.push({
          passo: "puxador",
          acao: "criado",
          id: criado.data.id,
          conferido: { nome: p.nome, preco: p.preco, saldo: saldoDepois },
          bateu: p.nome === PUXADOR.nome && p.preco === PUXADOR.preco && saldoDepois === PUXADOR.saldo,
        });
      }
    }

    // ── matraca-dtf: só com preço ──
    if (roda("matraca-dtf")) {
      if (MATRACA_DTF.preco === null) {
        feitos.push({ passo: "matraca-dtf", acao: "bloqueado", motivo: "sem preço definido — preencher MATRACA_DTF.preco em src/lib/bling/ajustes-2026-10-20.ts e publicar" });
      } else {
        const existente = ativoPeloNome(MATRACA_DTF.nome);
        const sPintada = await saldo(MATRACA_DTF.idPintada);
        const plano = { passo: "matraca-dtf", nome: MATRACA_DTF.nome, preco: MATRACA_DTF.preco, saldo: MATRACA_DTF.saldo, pintada: { id: MATRACA_DTF.idPintada, de: sPintada, para: MATRACA_DTF.saldoPintada } };
        if (existente) feitos.push({ ...plano, acao: "pular", motivo: `já existe (id ${existente.id})` });
        else if (!aplicar) feitos.push({ ...plano, acao: "criar", corpo: corpoMatracaDtf() });
        else {
          const criado = await chamarBling<{ data: { id: number } }>("/produtos", { metodo: "POST", corpo: corpoMatracaDtf() });
          const saldoDtf = await balancar(criado.data.id, MATRACA_DTF.saldo);
          const saldoPintada = sPintada === MATRACA_DTF.saldoPintada ? sPintada : await balancar(MATRACA_DTF.idPintada, MATRACA_DTF.saldoPintada);
          const novo = await ler(criado.data.id);
          feitos.push({
            ...plano,
            acao: "criado",
            id: criado.data.id,
            conferido: { nome: novo.nome, preco: novo.preco, saldo: saldoDtf, saldoPintada },
            bateu: novo.nome === MATRACA_DTF.nome && novo.preco === MATRACA_DTF.preco && saldoDtf === MATRACA_DTF.saldo && saldoPintada === MATRACA_DTF.saldoPintada,
            lembrete: "anote o ID: as fotos DTF (FOTOS_DTF_PENDENTES no script de fotos) entram por este ID",
          });
        }
      }
    }
  } catch (e) {
    feitos.push({ acao: "erro", erro: e instanceof Error ? e.message : String(e), respostaDoBling: e instanceof ErroBling ? e.corpo : undefined });
  }

  if (aplicar) invalidarCatalogoEmMemoria();
  let copia: string | null = null;
  if (originais.length) {
    copia = join(dirname(arquivoTokens()), `backup-ajustes-wilzanira-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
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
