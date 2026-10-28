import { NextResponse } from "next/server";
import { corpoJson, dentroDoLimite, ipDaRequisicao } from "@/lib/play/jogos/limite";
import { apelidoValido, avatarValido, lerPlacar, posicaoNaSemana, registrarPontuacao } from "@/lib/play/jogos/placar";
import type { ProvaArraial } from "@/lib/play/jogos/arraial";
import type { ProvaMemoria } from "@/lib/play/jogos/memoria";
import type { ProvaQuebra } from "@/lib/play/jogos/quebra";
import type { ProvaQuiz } from "@/lib/play/jogos/quiz";
import { contaDaRequisicao } from "@/lib/play/contas";
import { chaveValida, resumoDaChave, verificar } from "@/lib/play/jogos/seguranca";
import type { JogoId, PeriodoPlacar } from "@/lib/play/jogos/tipos";

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
 * servidor (que traz os pontos calculados lá). O jogador se identifica pela
 * chave que o navegador gerou; o servidor guarda só um resumo dela.
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

  const prova = verificar<ProvaQuiz | ProvaMemoria | ProvaArraial | ProvaQuebra>(corpo.prova);
  if (!prova || prova.v !== 1 || (prova.jogo !== "quiz" && prova.jogo !== "memoria" && prova.jogo !== "arraial" && prova.jogo !== "quebra")) {
    return NextResponse.json({ ok: false, mensagem: "Prova da partida inválida." }, { status: 400 });
  }
  if (Date.now() - prova.emitidaEm > DEZ_MINUTOS) {
    return NextResponse.json(
      { ok: false, mensagem: "Essa partida já passou do prazo de envio (10 minutos)." },
      { status: 400 },
    );
  }

  const jogador =
    conta ? resumoDaChave(`conta:${conta.id}`) : resumoDaChave(corpo.chave as string);
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
    return NextResponse.json(
      { ok: false, mensagem: "Não foi possível guardar sua pontuação agora. Tente de novo." },
      { status: 500 },
    );
  }

  return NextResponse.json({
    ok: true,
    pontos: prova.pontos,
    melhorDaSemana: resultado.melhorDaSemana,
    pontosDaSemana: resultado.pontosDaSemana,
    posicaoNaSemana: posicao,
  });
}
