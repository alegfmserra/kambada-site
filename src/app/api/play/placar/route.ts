import { NextResponse } from "next/server";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";
import { apelidoValido, avatarValido, jogadorDaConta, lerPlacar, posicaoNaSemana, registrarPontuacao } from "@/lib/play/jogos/placar";
import {
  PARTIDAS_NO_RANKING_POR_DIA,
  REPETICOES_PARA_AVISAR,
  contarPartidaNoDia,
  limiteDoDiaAtingido,
  repeticoesSeguidas,
  type ProvaDeJogo,
} from "@/lib/play/jogos/antifraude";
import { alertar } from "@/lib/manutencao/alertas";
import { contaDaRequisicao } from "@/lib/play/contas";
import { chaveValida, resumoDaChave, verificar } from "@/lib/play/jogos/seguranca";
import { liberarProva, reservarProva } from "@/lib/play/jogos/usoUnico";
import { JOGOS, type JogoId, type PeriodoPlacar } from "@/lib/play/jogos/tipos";

export const dynamic = "force-dynamic";

const DEZ_MINUTOS = 10 * 60 * 1000;

/** Lê o placar. ?jogo=quiz|memoria|arraial|quebra (sem jogo = geral) &periodo=semana|mes|total */
export async function GET(requisicao: Request) {
  const url = new URL(requisicao.url);
  const jogoBruto = url.searchParams.get("jogo");
  const jogo: JogoId | undefined = jogoBruto === "quiz" || jogoBruto === "memoria" || jogoBruto === "arraial" || jogoBruto === "quebra" ? jogoBruto : undefined;
  const p = url.searchParams.get("periodo");
  const periodo: PeriodoPlacar = p === "mes" || p === "total" ? p : "semana";
  const linhas = await lerPlacar({ jogo, periodo, limite: 20 });
  return NextResponse.json({ ok: true, periodo, jogo: jogo ?? "geral", linhas });
}

/**
 * Envia a pontuação de uma partida. Só vale com a prova assinada pelo
 * servidor (que traz os pontos calculados lá e a conta que jogou). O jogador é
 * a conta; sem conta (demonstração), a chave que o navegador gerou.
 */
export async function POST(requisicao: Request) {
  if (!dentroDoLimite(ipDaRequisicao(requisicao), "placar", 30, DEZ_MINUTOS)) {
    return NextResponse.json({ ok: false, mensagem: "Calma! Tente de novo em alguns minutos." }, { status: 429 });
  }
  const corpo = await corpoJson(requisicao);
  if (!corpo) return NextResponse.json({ ok: false, mensagem: "Requisição inválida." }, { status: 400 });

  const apelido = apelidoValido(corpo.apelido);
  if (!apelido) {
    return NextResponse.json(
      { ok: false, mensagem: "Escolha um apelido de 3 a 16 letras ou números, sem palavrões." },
      { status: 400 },
    );
  }
  // Com conta, o jogador é a conta (vale em qualquer aparelho); sem conta
  // (acesso de demonstração), vale a chave que o navegador gerou.
  const conta = await contaDaRequisicao(requisicao);
  if (!conta && !chaveValida(corpo.chave)) {
    return NextResponse.json({ ok: false, mensagem: "Seu navegador não gerou a chave do jogador." }, { status: 400 });
  }

  const prova = verificar<ProvaDeJogo>(corpo.prova);
  if (!prova || prova.v !== 1 || (prova.jogo !== "quiz" && prova.jogo !== "memoria" && prova.jogo !== "arraial" && prova.jogo !== "quebra")) {
    return NextResponse.json({ ok: false, mensagem: "Prova da partida inválida." }, { status: 400 });
  }
  if (Date.now() - prova.emitidaEm > DEZ_MINUTOS) {
    return NextResponse.json(
      { ok: false, mensagem: "Essa partida já passou do prazo de envio (10 minutos)." },
      { status: 400 },
    );
  }

  // A prova leva dentro a conta que jogou a partida (17/11/2026): antes ela era de
  // "quem enviasse primeiro" e dava para jogar numa conta e pontuar em outra.
  // Prova sem o campo é de partida começada antes da mudança (some sozinha em minutos).
  if (prova.conta !== undefined && prova.conta !== (conta?.id ?? null)) {
    return NextResponse.json(
      { ok: false, mensagem: "Essa partida foi jogada em outra conta. Jogue de novo nesta conta para pontuar." },
      { status: 403 },
    );
  }

  const jogador = conta ? jogadorDaConta(conta.id) : resumoDaChave(corpo.chave as string);
  // Teto por dia: a partir daqui a conta continua jogando, só não manda mais este jogo ao ranking hoje.
  if (limiteDoDiaAtingido(prova.jogo, jogador)) {
    return NextResponse.json(
      {
        ok: false,
        mensagem: `Éguas! Hoje tu já mandaste ${PARTIDAS_NO_RANKING_POR_DIA} partidas deste jogo para o ranking. Amanhã tem mais.`,
      },
      { status: 429 },
    );
  }
  // A prova vale uma vez só: sem isto, a mesma prova pontuava de novo.
  // A marca dura mais que o prazo de envio da prova (10 minutos).
  if (typeof prova.partida !== "string" || !reservarProva(prova.jogo, prova.partida, jogador, 2 * DEZ_MINUTOS)) {
    return NextResponse.json(
      { ok: false, mensagem: "Essa partida já foi enviada para o ranking. Jogue outra para pontuar de novo." },
      { status: 409 },
    );
  }
  let resultado: Awaited<ReturnType<typeof registrarPontuacao>>;
  let posicao: number | null;
  try {
    resultado = await registrarPontuacao({
    jogador,
    apelido,
    avatar: avatarValido(corpo.avatar),
    jogo: prova.jogo,
    pontos: prova.pontos,
  });
    posicao = await posicaoNaSemana(jogador);
  } catch {
    // Não gravou: devolve a prova, para o "tente de novo" funcionar.
    liberarProva(prova.jogo, prova.partida);
    return NextResponse.json(
      { ok: false, mensagem: "Não foi possível guardar sua pontuação agora. Tente de novo." },
      { status: 500 },
    );
  }

  contarPartidaNoDia(prova.jogo, jogador);
  // Mesma pontuação, em sequência, sempre no tempo mínimo: avisa a loja (não bloqueia sozinho).
  const repeticoes = repeticoesSeguidas(prova, jogador);
  if (repeticoes >= REPETICOES_PARA_AVISAR) {
    void alertar(
      `play-ranking-suspeito-${jogador.slice(0, 12)}`,
      "Kambada Play: pontuação repetida no tempo mínimo (possível trapaça no ranking)",
      `O jogador "${apelido}" mandou ${repeticoes} partidas seguidas de ${JOGOS[prova.jogo].nome} com a mesma pontuação (${prova.pontos}) e sempre no tempo mínimo que o servidor aceita. Gente de verdade quase nunca repete isso.\n\n` +
        (conta ? `Conta: ${conta.id} (veja em /admin). ` : "Sem conta (acesso de demonstração). ") +
        `Nada foi bloqueado. Se for trapaça, desative o cupom da semana em /admin/cupons e avalie a conta.`,
    ).catch(() => undefined);
  }

  return NextResponse.json({
    ok: true,
    pontos: prova.pontos,
    melhorDaSemana: resultado.melhorDaSemana,
    pontosDaSemana: resultado.pontosDaSemana,
    posicaoNaSemana: posicao,
  });
}
