import { timingSafeEqual } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { NextResponse } from "next/server";
import {
  BALANCOS,
  BALANCOS_POR_NOME,
  ID_CATEGORIA,
  ID_DEPOSITO,
  PRECOS,
  PRODUTOS_NOVOS,
  VARIACOES_NOVAS,
} from "@/lib/bling/ajustes-2026-10-14";
import { chamarBling, listarTudo } from "@/lib/bling/cliente";
import { invalidarCatalogoEmMemoria } from "@/lib/bling/produtos";
import { arquivoTokens } from "@/lib/bling/tokens";
import { ErroBling, type ProdutoBling } from "@/lib/bling/tipos";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Ajustes de 14/10/2026 — ESCREVE NO ERP. Quatro etapas, nesta ordem:
 *  1. cria produtos novos (pai com variações);
 *  2. cria variações que faltam em produtos existentes;
 *  3. corrige preço de cadastros a R$ 0;
 *  4. lança balanços (saldo absoluto) — inclusive das variações recém-criadas.
 *
 * Disciplina de sempre: GET ensaia, POST exige aplicar=1, `etapa=1..4`
 * roda uma etapa só, tudo relido depois de gravar, para no primeiro erro,
 * e nunca cria o que já existe pelo nome (pode rodar de novo sem duplicar).
 */

function segredoConfere(recebido: string | null): boolean {
  const esperado = process.env.REVALIDATE_SECRET;
  if (!esperado || !recebido) return false;
  const a = Buffer.from(recebido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

const hoje = () => new Date().toISOString().slice(0, 10);

async function saldoAtual(id: number): Promise<number | null> {
  const r = await chamarBling<{ data?: { saldoVirtualTotal?: number }[] }>(`/estoques/saldos?idsProdutos[]=${id}`, { revalidar: 0 });
  return r.data?.[0]?.saldoVirtualTotal ?? null;
}

async function balancar(id: number, saldo: number, motivo: string) {
  await chamarBling("/estoques", {
    metodo: "POST",
    corpo: { produto: { id }, deposito: { id: ID_DEPOSITO }, operacao: "B", quantidade: saldo, observacoes: `${motivo} Lançado via integração do site em ${hoje()}.` },
  });
  return saldoAtual(id);
}

async function responder(requisicao: Request, escrever: boolean) {
  const url = new URL(requisicao.url);
  if (!segredoConfere(url.searchParams.get("token"))) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });
  const aplicar = escrever && url.searchParams.get("aplicar") === "1";
  const etapa = Number(url.searchParams.get("etapa") || 0); // 0 = todas

  const todos = await listarTudo<ProdutoBling>("/produtos?criterio=2", { revalidar: 0 });
  const porNome = new Map(todos.map((p) => [p.nome, p]));
  const MOTIVO = "Balanço pela contagem física da Wilsonira (13/10/2026), aprovado pelo Alexandre em 14/10/2026.";

  const feitos: Record<string, unknown>[] = [];
  const originais: unknown[] = [];
  const falhou = (item: Record<string, unknown>, e: unknown) => {
    feitos.push({ ...item, erro: e instanceof Error ? e.message : String(e), respostaDoBling: e instanceof ErroBling ? e.corpo : undefined });
    return true;
  };
  let parar = false;

  // ── 1. produtos novos ──
  if (!etapa || etapa === 1) {
    for (const n of PRODUTOS_NOVOS) {
      if (parar) break;
      const existente = porNome.get(n.nome);
      if (existente) { feitos.push({ etapa: 1, nome: n.nome, acao: "pular", motivo: `já existe (id ${existente.id})` }); continue; }
      if (!aplicar) { feitos.push({ etapa: 1, nome: n.nome, acao: "criar", tamanhos: n.tamanhos }); continue; }
      try {
        const criado = await chamarBling<{ data: { id: number } }>("/produtos", {
          metodo: "POST",
          corpo: {
            nome: n.nome, preco: n.preco, tipo: "P", situacao: "A", formato: "V", categoria: { id: ID_CATEGORIA },
            variacoes: n.tamanhos.map((t, i) => ({
              nome: `${n.nome} Tamanho:${t.rotulo}`, preco: n.preco, tipo: "P", situacao: "A", formato: "S", categoria: { id: ID_CATEGORIA },
              variacao: { nome: `Tamanho:${t.rotulo}`, ordem: i + 1, produtoPai: { cloneInfo: true } },
            })),
          },
        });
        const idPai = criado.data.id;
        const filhos = (await listarTudo<ProdutoBling>("/produtos?criterio=2", { revalidar: 0 })).filter((p) => p.nome.startsWith(`${n.nome} Tamanho:`));
        const saldos: Record<string, unknown>[] = [];
        for (const t of n.tamanhos) {
          const f = filhos.find((p) => p.nome === `${n.nome} Tamanho:${t.rotulo}`);
          if (!f) { saldos.push({ tamanho: t.rotulo, erro: "filho não encontrado após criar" }); continue; }
          const dep = await balancar(f.id, t.saldo, MOTIVO);
          saldos.push({ tamanho: t.rotulo, id: f.id, saldo: dep, bateu: dep === t.saldo });
        }
        feitos.push({ etapa: 1, nome: n.nome, acao: "criado", idPai, saldos });
        porNome.set(n.nome, { id: idPai, nome: n.nome } as ProdutoBling);
      } catch (e) { parar = falhou({ etapa: 1, nome: n.nome }, e); }
    }
  }

  // ── 2. variações novas ──
  if (!etapa || etapa === 2) {
    for (const v of VARIACOES_NOVAS) {
      if (parar) break;
      const nome = `${v.nomePai} Tamanho:${v.tamanho}`;
      const existente = porNome.get(nome);
      if (existente) {
        const atual = await saldoAtual(existente.id);
        if (atual === v.saldo || !aplicar) { feitos.push({ etapa: 2, nome, acao: atual === v.saldo ? "pular" : "balancar", id: existente.id, saldoAtual: atual, saldoAlvo: v.saldo }); continue; }
        try { const dep = await balancar(existente.id, v.saldo, MOTIVO); feitos.push({ etapa: 2, nome, acao: "balanceada", id: existente.id, de: atual, para: v.saldo, conferido: dep, bateu: dep === v.saldo }); } catch (e) { parar = falhou({ etapa: 2, nome }, e); }
        continue;
      }
      if (!aplicar) { feitos.push({ etapa: 2, nome, acao: "criar", saldo: v.saldo }); continue; }
      try {
        const pai = await chamarBling<{ data: { preco?: number } }>(`/produtos/${v.pai}`, { revalidar: 0 });
        const preco = pai.data.preco ?? 89.9;
        const criado = await chamarBling<{ data: { id: number } }>("/produtos", {
          metodo: "POST",
          corpo: { nome, preco, tipo: "P", situacao: "A", formato: "S", categoria: { id: ID_CATEGORIA }, variacao: { nome: `Tamanho:${v.tamanho}`, ordem: 9, produtoPai: { id: v.pai } } },
        });
        const relido = await chamarBling<{ data: { variacao?: { produtoPai?: { id: number } } } }>(`/produtos/${criado.data.id}`, { revalidar: 0 });
        const dep = await balancar(criado.data.id, v.saldo, MOTIVO);
        feitos.push({ etapa: 2, nome, acao: "criada", id: criado.data.id, filhoDoPai: relido.data.variacao?.produtoPai?.id === v.pai, preco, saldo: dep, bateu: dep === v.saldo });
      } catch (e) { parar = falhou({ etapa: 2, nome }, e); }
    }
  }

  // ── 3. preços ──
  if (!etapa || etapa === 3) {
    for (const p of PRECOS) {
      if (parar) break;
      const existente = porNome.get(p.nome);
      if (!existente) { feitos.push({ etapa: 3, nome: p.nome, acao: "erro", motivo: "não existe no Bling" }); continue; }
      if (existente.preco === p.preco) { feitos.push({ etapa: 3, nome: p.nome, acao: "pular", motivo: "preço já certo" }); continue; }
      if (!aplicar) { feitos.push({ etapa: 3, nome: p.nome, acao: "corrigir", id: existente.id, de: existente.preco, para: p.preco }); continue; }
      try {
        const atual = await chamarBling<{ data: Record<string, unknown> }>(`/produtos/${existente.id}`, { revalidar: 0 });
        originais.push(atual.data);
        await chamarBling(`/produtos/${existente.id}`, { metodo: "PUT", corpo: { ...atual.data, preco: p.preco, situacao: "A" } });
        const relido = await chamarBling<{ data: { preco: number } }>(`/produtos/${existente.id}`, { revalidar: 0 });
        feitos.push({ etapa: 3, nome: p.nome, acao: "corrigido", id: existente.id, de: existente.preco, para: relido.data.preco, bateu: relido.data.preco === p.preco });
      } catch (e) { parar = falhou({ etapa: 3, nome: p.nome }, e); }
    }
  }

  // ── 4. balanços ──
  if (!etapa || etapa === 4) {
    const alvos = [
      ...BALANCOS,
      ...BALANCOS_POR_NOME.map((b) => ({ id: porNome.get(b.nome)?.id ?? 0, nome: b.nome, saldo: b.saldo })),
    ];
    for (const b of alvos) {
      if (parar) break;
      if (!b.id) { feitos.push({ etapa: 4, nome: b.nome, acao: "erro", motivo: "id não encontrado pelo nome" }); continue; }
      try {
        const atual = await saldoAtual(b.id);
        if (atual === b.saldo) { feitos.push({ etapa: 4, nome: b.nome, id: b.id, acao: "pular", saldo: atual }); continue; }
        if (!aplicar) { feitos.push({ etapa: 4, nome: b.nome, id: b.id, acao: "balancar", de: atual, para: b.saldo }); continue; }
        const dep = await balancar(b.id, b.saldo, MOTIVO);
        feitos.push({ etapa: 4, nome: b.nome, id: b.id, acao: "balanceado", de: atual, para: b.saldo, conferido: dep, bateu: dep === b.saldo });
      } catch (e) { parar = falhou({ etapa: 4, nome: b.nome, id: b.id }, e); }
    }
  }

  if (aplicar) invalidarCatalogoEmMemoria();
  let copia: string | null = null;
  if (originais.length) {
    copia = join(dirname(arquivoTokens()), `backup-ajustes-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    await mkdir(dirname(copia), { recursive: true });
    await writeFile(copia, JSON.stringify(originais, null, 2), "utf8");
  }
  const resumo: Record<string, number> = {};
  for (const f of feitos) resumo[String(f.acao)] = (resumo[String(f.acao)] ?? 0) + 1;
  return NextResponse.json({ modo: aplicar ? "aplicado" : "ensaio — nada foi escrito no Bling", resumo, copiaDosOriginais: copia, feitos });
}

export async function GET(requisicao: Request) {
  return responder(requisicao, false);
}
export async function POST(requisicao: Request) {
  return responder(requisicao, true);
}
