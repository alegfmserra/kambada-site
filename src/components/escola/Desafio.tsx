"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { rotaEscola } from "@/lib/escola/host";
import type { EstadoPartida, Resposta } from "@/lib/escola/servico";
import type { TrilhaPublica } from "@/lib/escola/tipos";
import { BOTAO, BOTAO_SECUNDARIO, chamar } from "./chamar";
import { COR_DISCIPLINA, FalaKambadinha, Kambadinha } from "./Marca";

/**
 * Um desafio (trilha): pergunta por pergunta, duas tentativas.
 * 1º erro: a opção sai e vem a dica. 2º erro: mostra a certa e explica.
 * O servidor guarda a ordem das opções e o gabarito; aqui só chega a tela.
 */
export function Desafio({ trilha }: { trilha: TrilhaPublica }) {
  const [estado, setEstado] = useState<EstadoPartida | null>(null);
  const [descartadas, setDescartadas] = useState<number[]>([]);
  const [dica, setDica] = useState("");
  const [fechada, setFechada] = useState<(Resposta & { escolha: number }) | null>(null);
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [verFim, setVerFim] = useState(false);

  const iniciar = useCallback(async () => {
    setErro("");
    setFechada(null);
    setVerFim(false);
    setDescartadas([]);
    setDica("");
    const r = await chamar<{ estado: EstadoPartida }>("desafio", { acao: "iniciar", trilha: trilha.id });
    if (r.ok) setEstado(r.estado);
    else setErro(r.mensagem ?? "Não deu para abrir o desafio.");
  }, [trilha.id]);

  useEffect(() => {
    // Abre (ou retoma) a partida ao entrar na página.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void iniciar();
  }, [iniciar]);

  async function responder(escolha: number) {
    if (!estado || enviando || fechada) return;
    setEnviando(true);
    setErro("");
    const r = await chamar<{ resposta: Resposta }>("desafio", { acao: "responder", partida: estado.partida, escolha });
    setEnviando(false);
    if (!r.ok) {
      setErro(r.mensagem ?? "Não deu para responder.");
      return;
    }
    const resp = r.resposta;
    if (resp.descartada !== undefined && !resp.resultado) {
      setDescartadas((d) => [...d, resp.descartada!]);
      setDica(resp.dica ?? "");
      return;
    }
    setFechada({ ...resp, escolha });
  }

  function proxima() {
    if (!fechada?.proxima) return;
    setEstado(fechada.proxima);
    setFechada(null);
    setDescartadas([]);
    setDica("");
  }

  if (erro && !estado) {
    return (
      <div className="space-y-4 text-center">
        <p className="font-semibold text-kambada-red">{erro}</p>
        <Link href={rotaEscola("/aluno")} className={BOTAO_SECUNDARIO}>Voltar aos desafios</Link>
      </div>
    );
  }
  if (!estado) return <p className="text-center text-texto-suave">Abrindo o desafio…</p>;

  if (fechada?.fim && verFim) {
    const f = fechada.fim;
    return (
      <div className="mx-auto max-w-lg space-y-6 text-center">
        <Kambadinha tamanho={120} className="mx-auto" />
        <h1 className="font-display text-3xl font-extrabold">Desafio completo! 🏆</h1>
        <p className="font-display text-5xl font-extrabold text-kambada-amarelo-escuro">{f.pontos} pontos</p>
        <div className="grid grid-cols-3 gap-3">
          <Contador simbolo="✓" rotulo="de primeira" n={f.primeira} cor="bg-kambada-green/15" />
          <Contador simbolo="↻" rotulo="na segunda" n={f.segunda} cor="bg-kambada-amarelo/20" />
          <Contador simbolo="✗" rotulo="para treinar" n={f.reforco} cor="bg-kambada-red/15" />
        </div>
        <p className="text-sm text-texto-suave">No ranking vale a sua melhor resposta em cada pergunta. Jogar de novo pode subir os pontos.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <button type="button" className={BOTAO} onClick={iniciar}>Jogar de novo</button>
          <Link href={rotaEscola("/aluno")} className={BOTAO_SECUNDARIO}>Outros desafios</Link>
        </div>
      </div>
    );
  }

  const q = estado.questao;
  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex items-center justify-between text-sm">
        <Link href={rotaEscola("/aluno")} className="font-semibold underline">← Desafios</Link>
        <span className="font-semibold">
          {trilha.emoji} {trilha.titulo} · {estado.indice + 1} de {estado.total}
        </span>
        <span className="font-bold">{fechada ? estado.pontos + (fechada.pontosGanhos ?? 0) : estado.pontos} pts</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-superficie">
        <div className="h-full rounded-full bg-kambada-amarelo transition-all" style={{ width: `${((estado.indice + (fechada ? 1 : 0)) / estado.total) * 100}%` }} />
      </div>

      <article className="relative overflow-hidden rounded-3xl border-2 border-borda p-6">
        <span className="absolute inset-x-0 top-0 h-1.5" style={{ background: COR_DISCIPLINA[q.disciplina] }} aria-hidden />
        <p className="text-xs font-bold uppercase tracking-wider text-texto-suave">
          {q.cena} · {q.habilidade}
        </p>
        <h1 className="mt-3 font-display text-2xl font-bold leading-snug">{q.enunciado}</h1>

        <div className="mt-6 grid gap-3">
          {q.opcoes.map((o, i) => {
            const saiu = descartadas.includes(i);
            const certa = fechada && fechada.correta === i;
            const errada = fechada && !fechada.certo && fechada.escolha === i;
            return (
              <button
                key={i}
                type="button"
                onClick={() => responder(i)}
                disabled={saiu || !!fechada || enviando}
                className={`rounded-2xl border-2 px-5 py-4 text-left text-lg font-semibold transition-colors ${
                  certa
                    ? "border-kambada-green bg-kambada-green/15"
                    : errada
                      ? "border-kambada-red bg-kambada-red/10"
                      : saiu
                        ? "border-borda text-texto-tenue line-through opacity-50"
                        : "border-borda hover:border-kambada-amarelo"
                }`}
              >
                {o}
              </button>
            );
          })}
        </div>

        {dica && !fechada && (
          <div className="mt-5" role="status">
            <FalaKambadinha tamanho={56}>Quase! Dica: {dica}</FalaKambadinha>
          </div>
        )}
        {erro && <p className="mt-4 font-semibold text-kambada-red">{erro}</p>}

        {fechada && (
          <div className="mt-5 space-y-4" role="status">
            <p className={`rounded-2xl p-4 font-semibold ${fechada.resultado === "reforco" ? "bg-kambada-red/10" : "bg-kambada-green/15"}`}>
              {fechada.resultado === "primeira" && "✓ Acertou de primeira! +100. "}
              {fechada.resultado === "segunda" && "↻ Acertou na segunda! +50. "}
              {fechada.resultado === "reforco" && "✗ Dessa vez não foi. Olha só: "}
              {fechada.explica}
            </p>
            <button type="button" className={`${BOTAO} w-full`} onClick={fechada.fim ? () => setVerFim(true) : proxima}>
              {fechada.fim ? "Ver o resultado 🏆" : "Próxima pergunta →"}
            </button>
          </div>
        )}
      </article>
    </div>
  );
}

function Contador({ simbolo, rotulo, n, cor }: { simbolo: string; rotulo: string; n: number; cor: string }) {
  return (
    <div className={`rounded-2xl p-4 ${cor}`}>
      <p className="text-2xl font-extrabold">{simbolo} {n}</p>
      <p className="text-xs">{rotulo}</p>
    </div>
  );
}
