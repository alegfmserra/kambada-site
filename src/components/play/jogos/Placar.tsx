"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  JOGOS,
  PONTOS_MINIMOS_PREMIO,
  PREMIOS_SEMANAIS,
  REGRAS_PREMIO,
  glifoDoAvatar,
  type JogoId,
  type LinhaPlacar,
  type PeriodoPlacar,
} from "@/lib/play/jogos/tipos";
import { chamar, chaveDoJogador } from "./jogador";

type SituacaoPremio =
  | { elegivel: false }
  | {
      elegivel: true;
      semana: string;
      posicao: number;
      percentual: number;
      codigo?: string;
      validoAte?: string;
      resgatarAte: string;
      expirou: boolean;
    };

const PERIODOS: { id: PeriodoPlacar; rotulo: string }[] = [
  { id: "semana", rotulo: "Da semana" },
  { id: "mes", rotulo: "Do mês" },
  { id: "total", rotulo: "De sempre" },
];

const ABAS: { id: JogoId | "geral"; rotulo: string }[] = [
  { id: "geral", rotulo: "Geral" },
  { id: "quiz", rotulo: JOGOS.quiz.nome },
  { id: "memoria", rotulo: JOGOS.memoria.nome },
  { id: "arraial", rotulo: JOGOS.arraial.nome },
];

const MEDALHAS = ["🥇", "🥈", "🥉"];

function dataBr(iso: string): string {
  const [a, m, d] = iso.split("-");
  return `${d}/${m}/${a}`;
}

/** Banner do prêmio: aparece para quem ficou entre os 3 primeiros da semana que fechou. */
function Premio() {
  const [situacao, setSituacao] = useState<SituacaoPremio | null>(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const r = await chamar<{ situacao: SituacaoPremio }>(`/api/play/premio?chave=${chaveDoJogador()}`);
      if (vivo && r.ok) setSituacao(r.situacao);
    })();
    return () => {
      vivo = false;
    };
  }, []);

  async function resgatar() {
    setErro("");
    setEnviando(true);
    const r = await chamar<{ codigo: string; validoAte: string; percentual: number; posicao: number }>(
      "/api/play/premio",
      { chave: chaveDoJogador() },
    );
    setEnviando(false);
    if (!r.ok) {
      setErro(r.mensagem ?? "Não deu para resgatar.");
      return;
    }
    setSituacao((s) =>
      s && s.elegivel ? { ...s, codigo: r.codigo, validoAte: r.validoAte, percentual: r.percentual } : s,
    );
  }

  if (!situacao || !situacao.elegivel) return null;
  return (
    <div className="mb-8 rounded-xl border-4 border-kambada-amarelo bg-kambada-amarelo/15 p-5">
      <p className="font-display text-2xl font-extrabold text-texto">
        {MEDALHAS[situacao.posicao - 1]} Você foi {situacao.posicao}º lugar na semana de {dataBr(situacao.semana)}!
      </p>
      {situacao.codigo ? (
        <>
          <p className="mt-2 text-texto-suave">
            Seu cupom de <strong>{situacao.percentual}%</strong> nas peças da loja (frete não tem desconto), para uma
            compra{situacao.validoAte ? `, válido até ${dataBr(situacao.validoAte)}` : ""}:
          </p>
          <p className="mt-3 inline-block select-all rounded-lg bg-kambada-grafite px-5 py-3 font-display text-3xl font-extrabold tracking-widest text-kambada-amarelo">
            {situacao.codigo}
          </p>
          <p className="mt-2 text-sm text-texto-tenue">Anote o código: ele só aparece para este navegador.</p>
          <Link
            href="/loja"
            className="mt-4 ml-0 inline-block rounded-full bg-kambada-amarelo px-8 py-3 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
          >
            Usar na loja
          </Link>
        </>
      ) : situacao.expirou ? (
        <p className="mt-2 text-texto-suave">O prazo para resgatar o prêmio dessa semana acabou. Na próxima, vai!</p>
      ) : (
        <>
          <p className="mt-2 text-texto-suave">
            Você ganhou um cupom de <strong>{situacao.percentual}%</strong>. Resgate até {dataBr(situacao.resgatarAte)}.
          </p>
          {erro ? <p role="alert" className="mt-2 font-semibold text-texto">{erro}</p> : null}
          <button
            type="button"
            onClick={resgatar}
            disabled={enviando}
            className="mt-4 rounded-full bg-kambada-amarelo px-8 py-3 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro disabled:opacity-50"
          >
            {enviando ? "Gerando…" : "Resgatar meu cupom"}
          </button>
        </>
      )}
    </div>
  );
}

export function Placar() {
  const [periodo, setPeriodo] = useState<PeriodoPlacar>("semana");
  const [aba, setAba] = useState<JogoId | "geral">("geral");
  const [linhas, setLinhas] = useState<LinhaPlacar[] | null>(null);

  const carregar = useCallback(async () => {
    setLinhas(null);
    const jogo = aba === "geral" ? "" : `&jogo=${aba}`;
    const r = await chamar<{ linhas: LinhaPlacar[] }>(`/api/play/placar?periodo=${periodo}${jogo}`);
    setLinhas(r.ok ? r.linhas : []);
  }, [periodo, aba]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- busca o placar ao trocar de aba ou período
    void carregar();
  }, [carregar]);

  return (
    <div>
      <Premio />

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Jogo">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            role="tab"
            aria-selected={aba === a.id}
            onClick={() => setAba(a.id)}
            className={`rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${
              aba === a.id
                ? "border-kambada-amarelo bg-kambada-amarelo text-kambada-grafite"
                : "border-borda text-texto hover:border-kambada-amarelo"
            }`}
          >
            {a.rotulo}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-2" role="tablist" aria-label="Período">
        {PERIODOS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={periodo === p.id}
            onClick={() => setPeriodo(p.id)}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              periodo === p.id ? "bg-kambada-grafite text-kambada-amarelo" : "text-texto-suave hover:text-texto"
            }`}
          >
            {p.rotulo}
          </button>
        ))}
      </div>

      <ol className="mt-5 space-y-2" aria-live="polite">
        {linhas === null ? (
          <li className="text-texto-tenue">Carregando…</li>
        ) : linhas.length === 0 ? (
          <li className="rounded-xl border-2 border-dashed border-borda p-6 text-center text-texto-suave">
            Ninguém jogou ainda neste período. Seja a primeira pessoa no ranking!
          </li>
        ) : (
          linhas.map((l) => (
            <li
              key={`${l.posicao}-${l.apelido}`}
              className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 ${
                l.posicao <= 3 && periodo === "semana" && aba === "geral"
                  ? "border-kambada-amarelo bg-kambada-amarelo/10"
                  : "border-borda bg-superficie"
              }`}
            >
              <span className="w-8 text-center font-display text-xl font-extrabold text-texto">
                {l.posicao <= 3 ? MEDALHAS[l.posicao - 1] : l.posicao}
              </span>
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-kambada-amarelo text-xl"
                aria-hidden
              >
                {glifoDoAvatar(l.avatar)}
              </span>
              <span className="min-w-0 flex-1 truncate font-semibold text-texto">{l.apelido}</span>
              <span className="font-display text-xl font-extrabold text-texto">{l.pontos}</span>
            </li>
          ))
        )}
      </ol>

      <section className="mt-10 rounded-xl border-2 border-borda bg-superficie p-5" aria-labelledby="regras">
        <h2 id="regras" className="font-display text-xl font-extrabold text-texto">
          Como funciona o prêmio da semana
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-texto-suave">
          <li>
            A semana vai de segunda a domingo. Valem os seus melhores pontos em cada jogo, somados.
          </li>
          <li>
            Os 3 primeiros ganham cupom de desconto nas peças da loja: <strong>{PREMIOS_SEMANAIS[0]}%</strong> para o 1º
            lugar e <strong>{PREMIOS_SEMANAIS[1]}%</strong> para o 2º e o 3º.
          </li>
          <li>É preciso somar pelo menos {PONTOS_MINIMOS_PREMIO} pontos na semana.</li>
          <li>
            Na segunda-feira, volte a esta página, no mesmo navegador e aparelho em que jogou, e resgate o cupom em até{" "}
            {REGRAS_PREMIO.prazoParaResgatarDias} dias. Ele vale por {REGRAS_PREMIO.validadeCupomDias} dias, para uma
            compra.
          </li>
          <li>Sem e-mail e sem cadastro: seu apelido é só um apelido.</li>
        </ul>
      </section>
    </div>
  );
}
