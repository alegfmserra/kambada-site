"use client";

import Link from "next/link";
import { useState } from "react";
import { AVATARES, type AvatarId } from "@/lib/play/jogos/tipos";
import { chamar, chaveDoJogador, useJogador } from "./jogador";

type Enviada = { pontos: number; melhorDaSemana: boolean; pontosDaSemana: number; posicaoNaSemana: number | null };

/**
 * Fim de partida: mostra a pontuação e deixa a pessoa entrar no ranking com
 * apelido e avatar. Sem e-mail, sem cadastro.
 */
export function EnviarPontuacao({ prova, pontos }: { prova: string; pontos: number }) {
  const { apelido: salvo, avatar: avatarSalvo, salvar } = useJogador();
  const [apelido, setApelido] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<AvatarId | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");
  const [enviada, setEnviada] = useState<Enviada | null>(null);

  const nome = apelido ?? salvo;
  const escolhido = avatar ?? avatarSalvo;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    const r = await chamar<Enviada>("/api/play/placar", {
      prova,
      apelido: nome,
      avatar: escolhido,
      chave: chaveDoJogador(),
    });
    setEnviando(false);
    if (!r.ok) {
      setErro(r.mensagem ?? "Não deu para enviar. Tente de novo.");
      return;
    }
    salvar(nome.trim(), escolhido);
    setEnviada(r);
  }

  if (enviada) {
    return (
      <div className="rounded-xl border-2 border-borda bg-superficie p-5 text-center">
        <p className="font-display text-2xl font-extrabold text-texto">Éguas, tá no ranking!</p>
        <p className="mt-2 text-texto-suave">
          {enviada.melhorDaSemana
            ? `Seu melhor desta semana neste jogo: ${enviada.pontos} pontos.`
            : `Você já tinha uma pontuação melhor neste jogo esta semana.`}{" "}
          Total da semana: <strong>{enviada.pontosDaSemana}</strong>
          {enviada.posicaoNaSemana ? ` · ${enviada.posicaoNaSemana}º lugar` : ""}.
        </p>
        <Link
          href="/kambadaplay/placar"
          className="mt-5 inline-block rounded-full bg-kambada-amarelo px-8 py-3 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
        >
          Ver o ranking
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="rounded-xl border-2 border-borda bg-superficie p-5">
      <p className="text-center font-display text-xl font-extrabold text-texto">
        Entre no ranking com {pontos} pontos
      </p>
      <label className="mt-4 block text-sm font-semibold text-texto-suave" htmlFor="apelido">
        Seu apelido (3 a 16 letras ou números)
      </label>
      <input
        id="apelido"
        value={nome}
        onChange={(e) => setApelido(e.target.value)}
        maxLength={16}
        minLength={3}
        required
        autoComplete="off"
        className="mt-1 w-full rounded-lg border-2 border-borda bg-fundo px-4 py-3 text-texto outline-none focus:border-kambada-amarelo"
      />
      <fieldset className="mt-4">
        <legend className="text-sm font-semibold text-texto-suave">Seu avatar</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {AVATARES.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setAvatar(a.id)}
              aria-pressed={escolhido === a.id}
              aria-label={a.rotulo}
              title={a.rotulo}
              className={`flex h-12 w-12 items-center justify-center rounded-full border-2 text-2xl transition-colors ${
                escolhido === a.id ? "border-kambada-amarelo bg-kambada-amarelo/25" : "border-borda hover:border-kambada-amarelo"
              }`}
            >
              {a.glifo}
            </button>
          ))}
        </div>
      </fieldset>
      <p className="mt-3 text-xs text-texto-tenue">
        Sem e-mail e sem cadastro. O apelido aparece para todo mundo no ranking.
      </p>
      {erro ? (
        <p role="alert" className="mt-3 rounded-md bg-kambada-grafite/10 px-3 py-2 text-sm font-semibold text-texto">
          {erro}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={enviando || nome.trim().length < 3}
        className="mt-4 w-full rounded-full bg-kambada-amarelo px-8 py-3 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Entrar no ranking"}
      </button>
    </form>
  );
}
