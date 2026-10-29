import { NextResponse } from "next/server";
import { anotarPista, iniciarDesafio, iniciarMissao, responderDesafio, type RespostaArraial } from "@/lib/play/jogos/arraial";
import { contaDaRequisicao } from "@/lib/play/contas";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";
import { registrarEventoPartida } from "@/lib/play/jogos/partidas";
import type { Evento } from "@/lib/play/jogos/perfil";
import { abrirBauDoDia, acharObjeto, equiparItem, falarComPersonagem, fecharRecado, lerPerfil, provaDoRecado, registrarEventos } from "@/lib/play/jogos/perfilArmazem";
import type { NpcId } from "@/lib/play/jogos/missoesArraial";
import { ORDEM_PERSONAGENS } from "@/lib/play/jogos/missoesArraial";
import { concluirMini, iniciarMini } from "@/lib/play/jogos/minis";
import { verificar } from "@/lib/play/jogos/seguranca";

export const dynamic = "force-dynamic";

/**
 * Arraial da Kambada — missões com conversa encadeada e desafio final, mais a
 * carreira de brincante (XP, nível, diárias) guardada na conta.
 *   { acao: "iniciar" }                       -> missão do mês + estado
 *   { acao: "pista", estado, npc }            -> anota a pista da conversa (+XP)
 *   { acao: "desafio", estado }               -> 1ª pergunta do desafio
 *   { acao: "responder", estado, escolha, pulou? } -> resultado, próxima ou prova final (+XP)
 *   { acao: "perfil" }                        -> perfil da conta (null sem conta)
 *   { acao: "equipar", slot, item }           -> veste um item que a conta já tem
 *   { acao: "bau" }                           -> abre o baú do dia (1 por dia)
 *   { acao: "recado-falar", npc }             -> conversa de recado que o personagem tem para a conta (ou null)
 *   { acao: "recado-fim", npc, recado, resposta? } -> fecha o passo (falar/responder/entregar)
 *   { acao: "recado-achei", objeto }          -> objeto do mapa encontrado (avança o passo "achar")
 *   { acao: "mini-iniciar", mini }            -> sequência da mini-atividade (fogueira | quadrilha)
 *   { acao: "mini-fim", estado, resposta }     -> confere o que o jogador tocou (+XP 1x/dia por atividade)
 *     (pulou: true = alguma fala foi pulada; o servidor zera o bônus de rapidez
 *      e também mede sozinho o tempo mínimo de leitura — ver arraial.ts)
 * Fica atrás do login (porteiro em src/proxy.ts): é conteúdo de assinante.
 * Sem conta (acesso de demonstração) o jogo roda igual, só sem perfil.
 */
export async function POST(requisicao: Request) {
  if (!dentroDoLimite(ipDaRequisicao(requisicao), "arraial", 200, 10 * 60 * 1000)) {
    return NextResponse.json({ ok: false, mensagem: "Calma! Tente de novo em alguns minutos." }, { status: 429 });
  }
  const corpo = await corpoJson(requisicao);
  if (!corpo) return NextResponse.json({ ok: false, mensagem: "Requisição inválida." }, { status: 400 });

  if (corpo.acao === "perfil") {
    const conta = await contaDaRequisicao(requisicao).catch(() => null);
    return NextResponse.json({ ok: true, perfil: conta ? await lerPerfil(conta.id) : null });
  }

  if (corpo.acao === "equipar" || corpo.acao === "bau") {
    const conta = await contaDaRequisicao(requisicao).catch(() => null);
    if (!conta) return NextResponse.json({ ok: false, mensagem: "Entre na sua conta para guardar a coleção." }, { status: 401 });
    try {
      const r = corpo.acao === "equipar" ? await equiparItem(conta.id, corpo.slot, corpo.item) : await abrirBauDoDia(conta.id);
      if ("erro" in r) return NextResponse.json({ ok: false, mensagem: r.erro }, { status: 400 });
      return NextResponse.json({ ok: true, ...r });
    } catch {
      return NextResponse.json({ ok: false, mensagem: "Não deu para guardar agora. Tente de novo." }, { status: 500 });
    }
  }

  if (corpo.acao === "recado-falar" || corpo.acao === "recado-fim") {
    const conta = await contaDaRequisicao(requisicao).catch(() => null);
    const npc = ORDEM_PERSONAGENS.find((n) => n === corpo.npc);
    if (!conta || !npc) return NextResponse.json({ ok: true, dialogo: null });
    try {
      if (corpo.acao === "recado-falar") return NextResponse.json({ ok: true, dialogo: await falarComPersonagem(conta.id, npc) });
      const r = typeof corpo.recado === "string" ? await fecharRecado(conta.id, npc, corpo.recado, corpo.resposta) : { erro: "Recado inválido." };
      if ("erro" in r) return NextResponse.json({ ok: false, mensagem: r.erro }, { status: 400 });
      return NextResponse.json({ ok: true, ...r });
    } catch {
      return NextResponse.json({ ok: true, dialogo: null });
    }
  }
  if (corpo.acao === "recado-achei") {
    const conta = await contaDaRequisicao(requisicao).catch(() => null);
    if (!conta || typeof corpo.objeto !== "string") return NextResponse.json({ ok: true, achou: null });
    try {
      const r = await acharObjeto(conta.id, corpo.objeto);
      return NextResponse.json(r ? { ok: true, ...r } : { ok: true, achou: null });
    } catch {
      return NextResponse.json({ ok: true, achou: null });
    }
  }
  if (corpo.acao === "mini-iniciar") {
    const r = iniciarMini(corpo.mini);
    if ("erro" in r) return NextResponse.json({ ok: false, mensagem: r.erro }, { status: 400 });
    return NextResponse.json({ ok: true, ...r });
  }
  if (corpo.acao === "mini-fim") {
    const r = concluirMini(corpo.estado, corpo.resposta);
    if ("erro" in r) return NextResponse.json({ ok: false, mensagem: r.erro }, { status: 400 });
    const conta = await contaDaRequisicao(requisicao).catch(() => null);
    if (conta) {
      try {
        const { perfil, ganho } = await registrarEventos(conta.id, [{ tipo: "mini", mini: r.mini, perfeito: r.perfeito }]);
        // Prova de um recado: a mini perfeita avança o passo e pode fechar o recado.
        const recado = typeof corpo.recado === "string" ? await provaDoRecado(conta.id, corpo.recado, r.mini, r.perfeito).catch(() => null) : null;
        if (recado) {
          const ganhoTotal = { ...ganho, xp: ganho.xp + (recado.ganho?.xp ?? 0), recado: recado.ganho?.recado, subiuPara: recado.ganho?.subiuPara ?? ganho.subiuPara };
          return NextResponse.json({ ok: true, ...r, perfil: recado.perfil, ganho: ganhoTotal, recadoAvancou: true, recadoConcluido: recado.concluida });
        }
        return NextResponse.json({ ok: true, ...r, perfil, ganho });
      } catch {
        /* a carreira nunca pode derrubar a atividade */
      }
    }
    return NextResponse.json({ ok: true, ...r });
  }

  // Quantas pistas a partida já tinha: só pista NOVA rende XP (conversa relida não).
  const pistasAntes = corpo.acao === "pista" ? (verificar<{ pistas?: NpcId[] }>(corpo.estado)?.pistas?.length ?? -1) : -1;

  const r =
    corpo.acao === "iniciar"
      ? iniciarMissao()
      : corpo.acao === "pista"
        ? anotarPista(corpo.estado, corpo.npc)
        : corpo.acao === "desafio"
          ? iniciarDesafio(corpo.estado)
          : corpo.acao === "responder"
            ? responderDesafio(corpo.estado, corpo.escolha, Date.now(), corpo.pulou)
            : { erro: "Ação desconhecida." };
  if ("erro" in r) return NextResponse.json({ ok: false, mensagem: r.erro }, { status: 400 });

  const conta = await contaDaRequisicao(requisicao).catch(() => null);
  if (corpo.acao === "iniciar" || (corpo.acao === "responder" && "prova" in r)) {
    await registrarEventoPartida({ jogo: "arraial", tipo: corpo.acao === "iniciar" ? "inicio" : "fim", conta: conta?.id });
  }

  // Carreira: o servidor decide o XP a partir do que ele mesmo validou.
  const eventos: Evento[] = [];
  if (corpo.acao === "pista" && "pistas" in r && pistasAntes >= 0 && r.pistas.length > pistasAntes) {
    eventos.push({ tipo: "conversa", npc: corpo.npc as NpcId });
  }
  if (corpo.acao === "responder") {
    const resp = r as RespostaArraial;
    if (resp.certa) eventos.push({ tipo: "acerto" });
    if (resp.prova) eventos.push({ tipo: "desafio", acertos: resp.acertos ?? 0, pistasCompletas: (resp.bonusPistas ?? 0) > 0 });
  }
  if (conta && eventos.length) {
    try {
      const { perfil, ganho } = await registrarEventos(conta.id, eventos);
      return NextResponse.json({ ok: true, ...r, perfil, ganho });
    } catch {
      /* a carreira nunca pode derrubar a partida */
    }
  }
  return NextResponse.json({ ok: true, ...r });
}
