import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { NextResponse } from "next/server";
import {
  ID_DEPOSITO,
  PAIS_ANTIGOS,
  PAIS_NOVOS,
  PASSOS,
  PLAY,
  DE_PARA,
  corpoComPrecosCorrigidos,
  corpoFilhoNovo,
  corpoPaiNovo,
  corpoPlay,
  corposFigurasNovasDoPlay,
  decisaoDeInativar,
  diferencas,
  planoDoPlay,
  mesmaVariacao,
  movimentos,
  pendenteNaAntiga,
  planoDeSaldos,
  problemasDoPlano,
  variacoesPlanejadas,
  type ChavePai,
  type PaiNovo,
} from "@/lib/bling/migracao-matracas-2026-10-21";
import { chamarBling, listarTudo } from "@/lib/bling/cliente";
import { invalidarCatalogoEmMemoria } from "@/lib/bling/produtos";
import { arquivoTokens } from "@/lib/bling/tokens";
import { ErroBling, type ProdutoBling } from "@/lib/bling/tipos";
import { segredoDeManutencao } from "@/lib/seguranca/segredo";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

/**
 * Migração das matracas (aprovada pelo Alexandre em 21/10/2026) — ESCREVE NO ERP.
 * Dados, de→para e corpos em src/lib/bling/migracao-matracas-2026-10-21.ts;
 * plano em site-novo/PLANO_migracao-matracas_2026-10-21.md.
 *
 * Mesma disciplina das outras rotas de escrita:
 *  - GET só ensaia (estado atual + o que faria, passo a passo, + problemas do plano);
 *  - POST exige `aplicar=1` E `apenas=<chave>` — um passo por chamada;
 *  - antes de gravar, o produto original inteiro vai para um arquivo de cópia;
 *  - relê depois e diz se ficou (`bateu`);
 *  - idempotente: criar/completar não duplica; saldos conferem a conservação
 *    (antiga + novas = contagem) e recusam se alguém mexeu no estoque no meio;
 *  - para no primeiro erro.
 * Inativar um pai antigo com saldo ainda A CONFIRMAR exige `pendentes=manter`
 * (o saldo fica guardado na variação inativa; a estampa dessas peças é confirmada
 * com o cliente no WhatsApp — decisão do Alexandre, 21/10).
 */

type Obj = Record<string, unknown>;
const hoje = () => new Date().toISOString().slice(0, 10);
const MOTIVO = "Migração das matracas (Mini/Grande × Estampa × Suporte), autorizada pelo Alexandre em 21/10/2026.";

const ler = async (id: number) => (await chamarBling<{ data: Obj }>(`/produtos/${id}`, { revalidar: 0 })).data;

async function saldo(id: number): Promise<number> {
  const r = await chamarBling<{ data?: { saldoVirtualTotal?: number }[] }>(`/estoques/saldos?idsProdutos[]=${id}`, { revalidar: 0 });
  return r.data?.[0]?.saldoVirtualTotal ?? 0;
}

async function balancar(id: number, quantidade: number): Promise<number> {
  await chamarBling("/estoques", {
    metodo: "POST",
    corpo: { produto: { id }, deposito: { id: ID_DEPOSITO }, operacao: "B", quantidade, observacoes: `${MOTIVO} Lançado via integração do site em ${hoje()}.` },
  });
  return saldo(id);
}

const filhosDe = (p: Obj) =>
  ((p.variacoes as Obj[] | undefined) ?? []).map((v) => ({
    id: Number(v.id),
    nome: v.nome,
    situacao: v.situacao,
    preco: v.preco,
    atributos: (v.variacao as Obj | undefined)?.nome,
  }));

async function responder(requisicao: Request, escrever: boolean) {
  const url = new URL(requisicao.url);
  if (!segredoDeManutencao(requisicao)) return NextResponse.json({ erro: "não autorizado" }, { status: 401 });

  const apenas = url.searchParams.get("apenas");
  if (apenas && !PASSOS.some((p) => p.chave === apenas)) {
    return NextResponse.json({ erro: `passo desconhecido: ${apenas}`, passos: PASSOS }, { status: 400 });
  }
  const aplicar = escrever && url.searchParams.get("aplicar") === "1";
  if (aplicar && !apenas) {
    return NextResponse.json({ erro: "aplicar exige apenas=<chave> — um passo por vez", passos: PASSOS }, { status: 400 });
  }
  const problemas = problemasDoPlano();
  if (aplicar && problemas.length) {
    return NextResponse.json({ erro: "o plano tem problemas — corrija o arquivo de dados antes de aplicar", problemas }, { status: 422 });
  }
  const roda = (chave: string) => !apenas || apenas === chave;

  const todos = await listarTudo<ProdutoBling>("/produtos?criterio=2", { revalidar: 0 });
  const paiAtivo = (nome: string) => todos.find((p) => p.nome === nome && p.formato === "V");

  const feitos: Obj[] = [];
  const originais: unknown[] = [];

  /** Cria o pai com as variações confirmadas, ou completa o que falta; corrige preço herdado (cloneInfo). */
  async function criarOuCompletar(pai: PaiNovo) {
    const passo = `criar-${pai.chave}`;
    const planejadas = variacoesPlanejadas(pai);
    const aConfirmar = pai.estampas.filter((e) => e.status !== "confirmada").map((e) => ({ estampa: e.nome, origem: e.origem, motivo: e.motivo }));
    const existente = paiAtivo(pai.nome);

    if (!existente) {
      if (!aplicar) {
        feitos.push({ passo, acao: "criar", nome: pai.nome, variacoes: planejadas.map((v) => ({ atributos: v.atributos, preco: v.preco })), naoEntramAinda: aConfirmar, corpo: corpoPaiNovo(pai) });
        return;
      }
      const criado = await chamarBling<{ data: { id: number } }>("/produtos", { metodo: "POST", corpo: corpoPaiNovo(pai) });
      let lido = await ler(criado.data.id);
      const dif = diferencas(pai, filhosDe(lido));
      if (dif.precoErrado.length) {
        await chamarBling(`/produtos/${criado.data.id}`, { metodo: "PUT", corpo: corpoComPrecosCorrigidos(lido, pai) });
        lido = await ler(criado.data.id);
      }
      const depois = diferencas(pai, filhosDe(lido));
      feitos.push({
        passo,
        acao: "criado",
        id: criado.data.id,
        conferido: { nome: lido.nome, situacao: lido.situacao, descricao: lido.descricaoCurta === pai.descricao, variacoes: filhosDe(lido), precosCorrigidos: dif.precoErrado },
        bateu: lido.nome === pai.nome && depois.faltam.length === 0 && depois.precoErrado.length === 0 && depois.sobrando.length === 0,
        pendencias: depois,
        lembrete: "anote o ID: entra em scripts/preparar-fotos-produtos.mjs (foto/galeria própria) e no WORKFLOW",
      });
      return;
    }

    const atual = await ler(existente.id);
    const dif = diferencas(pai, filhosDe(atual));
    const plano = { passo, id: existente.id, nome: pai.nome, faltam: dif.faltam.map((v) => v.atributos), precoErrado: dif.precoErrado, sobrando: dif.sobrando, naoEntramAinda: aConfirmar };
    if (!dif.faltam.length && !dif.precoErrado.length) {
      feitos.push({ ...plano, acao: "pular", motivo: "já existe com todas as variações confirmadas e preços certos" });
      return;
    }
    if (!aplicar) {
      feitos.push({ ...plano, acao: "completar", corpos: dif.faltam.map((v) => corpoFilhoNovo(pai, existente.id, v)) });
      return;
    }
    originais.push(atual);
    const criados: Obj[] = [];
    for (const v of dif.faltam) {
      const r = await chamarBling<{ data: { id: number } }>("/produtos", { metodo: "POST", corpo: corpoFilhoNovo(pai, existente.id, v) });
      criados.push({ id: r.data.id, atributos: v.atributos });
    }
    let lido = await ler(existente.id);
    if (diferencas(pai, filhosDe(lido)).precoErrado.length) {
      await chamarBling(`/produtos/${existente.id}`, { metodo: "PUT", corpo: corpoComPrecosCorrigidos(lido, pai) });
      lido = await ler(existente.id);
    }
    const depois = diferencas(pai, filhosDe(lido));
    feitos.push({ ...plano, acao: "completado", criados, conferido: filhosDe(lido), bateu: depois.faltam.length === 0 && depois.precoErrado.length === 0, pendencias: depois });
  }

  try {
    for (const pai of PAIS_NOVOS) {
      if (roda(`criar-${pai.chave}`)) await criarOuCompletar(pai);
    }

    // ── play: herdada → Boi de Frente (3), cria Boi de Lado (1) ──
    if (roda("play")) {
      const herdada = PLAY.modelos.find((m) => m.herdada)!;
      const idDoModelo = (filhos: ReturnType<typeof filhosDe>, m: (typeof PLAY.modelos)[number]) =>
        m.herdada ? PLAY.variacao : filhos.find((f) => mesmaVariacao(f.atributos, m.atributos))?.id;

      const atual = await ler(PLAY.id);
      const filhos = filhosDe(atual);
      const renomear = !mesmaVariacao(filhos.find((f) => f.id === PLAY.variacao)?.atributos, herdada.atributos);
      const criar = corposFigurasNovasDoPlay().filter((c) => !filhos.some((f) => mesmaVariacao(f.atributos, (c.variacao as Obj).nome)));
      const saldosAgora = new Map<string, number>();
      for (const m of PLAY.modelos) {
        const id = idDoModelo(filhos, m);
        saldosAgora.set(m.atributos, id ? await saldo(id) : 0);
      }
      const p = planoDoPlay(saldosAgora);
      const plano = { passo: "play", id: PLAY.id, variacoes: filhos, renomear: renomear ? { id: PLAY.variacao, de: PLAY.atributosAntigos, para: herdada.atributos } : null, criar, saldos: p.alvos };
      const saldosOk = p.alvos.every((a) => a.agora === a.alvo);

      if (!renomear && !criar.length && saldosOk) feitos.push({ ...plano, acao: "pular", motivo: "já feito" });
      else if (!p.ok) feitos.push({ ...plano, acao: "erro", motivo: p.motivo });
      else if (!aplicar) feitos.push({ ...plano, acao: "dividir" });
      else {
        originais.push(atual);
        if (renomear) await chamarBling(`/produtos/${PLAY.id}`, { metodo: "PUT", corpo: corpoPlay(atual) });
        const criados: Obj[] = [];
        for (const c of criar) {
          const r = await chamarBling<{ data: { id: number } }>("/produtos", { metodo: "POST", corpo: c });
          criados.push({ id: r.data.id, atributos: (c.variacao as Obj).nome });
        }
        const filhosDepois = filhosDe(await ler(PLAY.id));
        // Primeiro as novas (entra), depois a herdada (sai): se cair no meio, a conservação acusa na próxima rodada.
        const conferido: Obj[] = [];
        for (const m of [...PLAY.modelos].sort((a, b) => Number(a.herdada) - Number(b.herdada))) {
          const id = idDoModelo(filhosDepois, m);
          if (!id) {
            conferido.push({ atributos: m.atributos, erro: "variação não encontrada" });
            continue;
          }
          const agora = await saldo(id);
          conferido.push({ atributos: m.atributos, id, saldo: agora === m.saldo ? agora : await balancar(id, m.saldo) });
        }
        const nomes = filhosDepois.map((f) => f.atributos);
        feitos.push({
          ...plano,
          acao: "dividido",
          criados,
          conferido: { variacoes: filhosDepois, saldos: conferido },
          bateu:
            PLAY.modelos.every((m) => nomes.some((n) => mesmaVariacao(n, m.atributos))) &&
            PLAY.modelos.every((m) => conferido.some((c) => c.atributos === m.atributos && c.saldo === m.saldo)),
        });
      }
    }

    // ── saldos: só os de→para respondidos; conservação conferida por variação antiga ──
    if (roda("saldos")) {
      // IDs das variações novas, pelos atributos.
      const idNovo = new Map<string, number>();
      for (const pai of PAIS_NOVOS) {
        const existente = paiAtivo(pai.nome);
        if (!existente) continue;
        for (const f of filhosDe(await ler(existente.id))) {
          const v = variacoesPlanejadas(pai).find((p) => mesmaVariacao(f.atributos, p.atributos));
          if (v) idNovo.set(`${pai.chave}|${v.atributos}`, f.id);
        }
      }
      const faltaPai = [...new Set(movimentos().map((m) => m.pai))].filter((c: ChavePai) => !paiAtivo(PAIS_NOVOS.find((p) => p.chave === c)!.nome));
      if (faltaPai.length) {
        feitos.push({ passo: "saldos", acao: "erro", motivo: `crie antes os pais: ${faltaPai.join(", ")}` });
      } else {
        // Só as antigas com algo a mover: as que só têm peças "a confirmar com o cliente"
        // ficam como estão (e são inativadas com pendentes=manter).
        const antigas = [...new Set(movimentos().map((m) => m.de))];
        for (const idAntiga of antigas) {
          const agoraAntiga = await saldo(idAntiga);
          const agoraNovas = new Map<string, number>();
          for (const m of movimentos().filter((x) => x.de === idAntiga)) {
            const chave = `${m.pai}|${m.atributos}`;
            const id = idNovo.get(chave);
            agoraNovas.set(chave, id ? await saldo(id) : 0);
          }
          const p = planoDeSaldos(idAntiga, agoraAntiga, agoraNovas);
          const base = { passo: "saldos", antiga: { id: idAntiga, agora: agoraAntiga, alvo: p.alvoAntiga, aConfirmar: pendenteNaAntiga(idAntiga) }, novas: p.novas.map((n) => ({ ...n, id: idNovo.get(n.chave) ?? null })) };
          const semId = p.novas.filter((n) => !idNovo.get(n.chave));
          if (!p.ok) feitos.push({ ...base, acao: "erro", motivo: p.motivo });
          else if (semId.length) feitos.push({ ...base, acao: "erro", motivo: `variação nova não encontrada: ${semId.map((n) => n.chave).join(", ")}` });
          else if (agoraAntiga === p.alvoAntiga && p.novas.every((n) => n.agora === n.alvo)) feitos.push({ ...base, acao: "pular", motivo: p.novas.length ? "já movido" : "nada respondido para esta variação (tudo A CONFIRMAR)" });
          else if (!aplicar) feitos.push({ ...base, acao: "mover" });
          else {
            // Primeiro as novas (entra), depois a antiga (sai): se cair no meio, a conservação acusa na próxima rodada.
            const conferidoNovas: Obj[] = [];
            for (const n of p.novas) conferidoNovas.push({ chave: n.chave, saldo: n.agora === n.alvo ? n.agora : await balancar(idNovo.get(n.chave)!, n.alvo) });
            const saldoAntiga = agoraAntiga === p.alvoAntiga ? agoraAntiga : await balancar(idAntiga, p.alvoAntiga);
            feitos.push({
              ...base,
              acao: "movido",
              conferido: { antiga: saldoAntiga, novas: conferidoNovas },
              bateu: saldoAntiga === p.alvoAntiga && p.novas.every((n) => conferidoNovas.some((c) => c.chave === n.chave && c.saldo === n.alvo)),
            });
          }
        }
      }
    }

    // ── inativar-<pai antigo>: variações primeiro, depois o pai ──
    for (const antigo of PAIS_ANTIGOS) {
      const passo = `inativar-${antigo.chave}`;
      if (!roda(passo)) continue;
      const destino = PAIS_NOVOS.find((p) => p.chave === antigo.redirecionaPara)!;
      const atual = await ler(antigo.id);
      const filhos = filhosDe(atual);
      const saldos = await Promise.all(filhos.map(async (f) => ({ id: f.id, atributos: f.atributos, situacao: f.situacao, saldo: await saldo(f.id) })));
      const aConfirmar = antigo.variacoes.reduce((s, v) => s + pendenteNaAntiga(v.id), 0);
      const plano = { passo, id: antigo.id, nome: atual.nome, situacao: atual.situacao, variacoes: saldos, aConfirmar, redirecionaPara: destino.nome };
      const parado = saldos.filter((s) => s.saldo > 0).reduce((t, s) => t + s.saldo, 0);
      const decisao = decisaoDeInativar({
        jaInativo: atual.situacao === "I" && filhos.every((f) => f.situacao === "I"),
        destinoAtivo: Boolean(paiAtivo(destino.nome)),
        parado,
        pendentesManter: url.searchParams.get("pendentes") === "manter",
        aplicar,
      });
      if (decisao === "pular") feitos.push({ ...plano, acao: "pular", motivo: "já inativo" });
      else if (decisao === "erro") feitos.push({ ...plano, acao: "erro", motivo: `"${destino.nome}" ainda não existe ativo — o endereço antigo ficaria sem destino` });
      else if (decisao === "bloqueado") {
        feitos.push({ ...plano, acao: "bloqueado", motivo: `${parado} peça(s) ainda nas variações antigas (estampa a confirmar com o cliente ou saldos não movidos). Rode "saldos" ou repita com pendentes=manter para inativar guardando o saldo.` });
      } else if (decisao === "inativar") feitos.push({ ...plano, acao: "inativar", saldoGuardado: parado });
      else {
        originais.push(atual);
        for (const f of filhos.filter((x) => x.situacao !== "I")) {
          const filho = await ler(f.id);
          originais.push(filho);
          await chamarBling(`/produtos/${f.id}`, { metodo: "PUT", corpo: { ...filho, situacao: "I" } });
        }
        const paiAgora = await ler(antigo.id);
        if (paiAgora.situacao !== "I") await chamarBling(`/produtos/${antigo.id}`, { metodo: "PUT", corpo: { ...paiAgora, situacao: "I" } });
        const depois = await ler(antigo.id);
        const filhosDepois = await Promise.all(filhos.map(async (f) => ({ id: f.id, situacao: (await ler(f.id)).situacao })));
        feitos.push({ ...plano, acao: "inativado", conferido: { pai: depois.situacao, variacoes: filhosDepois }, bateu: depois.situacao === "I" && filhosDepois.every((f) => f.situacao === "I") });
      }
    }
  } catch (e) {
    feitos.push({ acao: "erro", erro: e instanceof Error ? e.message : String(e), respostaDoBling: e instanceof ErroBling ? e.corpo : undefined });
  }

  if (aplicar) invalidarCatalogoEmMemoria();
  let copia: string | null = null;
  if (originais.length) {
    copia = join(dirname(arquivoTokens()), `backup-migracao-matracas-${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    await mkdir(dirname(copia), { recursive: true });
    await writeFile(copia, JSON.stringify(originais, null, 2), "utf8");
  }
  return NextResponse.json({
    modo: aplicar ? "aplicado" : "ensaio — nada foi escrito no Bling",
    passos: PASSOS,
    problemasDoPlano: problemas,
    estampaAConfirmarComOCliente: DE_PARA.filter((d) => !d.para).map((d) => ({ de: d.de, contagem: d.contagem, quantidade: d.quantidade, suporteJaDecidido: d.destinoParcial ?? null, provavel: d.provavel })),
    copiaDosOriginais: copia,
    feitos,
  });
}

export async function GET(requisicao: Request) {
  return responder(requisicao, false);
}
export async function POST(requisicao: Request) {
  return responder(requisicao, true);
}
