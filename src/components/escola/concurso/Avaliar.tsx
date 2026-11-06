"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CRITERIOS, NOTA_MAXIMA } from "@/lib/escola/concurso";
import type { RedacaoNaEscola } from "@/lib/escola/concursoServico";
import { BOTAO, BOTAO_SECUNDARIO } from "../chamar";
import { useAcao } from "../Coordenacao";
import { LinkArquivo, MandarArquivo } from "./Arquivos";

/** Quem escreveu: apelido sempre; nome de verdade quando quem vê é a escola. */
export function Autor({ r }: { r: Pick<RedacaoNaEscola, "apelido" | "avatar" | "nome" | "turma"> }) {
  return (
    <span>
      <span aria-hidden>{r.avatar}</span> <b>{r.apelido}</b>
      {r.nome ? <span className="text-texto-suave"> · {r.nome}</span> : null}
      <span className="text-xs text-texto-suave"> · {r.turma}</span>
    </span>
  );
}

function Selos({ r }: { r: RedacaoNaEscola }) {
  return (
    <span className="flex flex-wrap gap-1.5 text-xs font-bold">
      {!r.enviada && <span className="rounded-full bg-superficie px-2.5 py-1">rascunho</span>}
      {r.enviada && !r.avaliacao && <span className="rounded-full bg-kambada-amarelo/30 px-2.5 py-1">para avaliar</span>}
      {r.avaliacao && <span className="rounded-full bg-kambada-green/20 px-2.5 py-1">{r.avaliacao.total}/{CRITERIOS.length * NOTA_MAXIMA}</span>}
      {r.finalista && <span className="rounded-full bg-kambada-amarelo px-2.5 py-1 text-kambada-grafite">⭐ finalista</span>}
      {r.representante && <span className="rounded-full bg-kambada-grafite px-2.5 py-1 text-white">🌟 representa a escola</span>}
      {r.colocacao && <span className="rounded-full bg-kambada-red px-2.5 py-1 text-white">🏆 {r.colocacao}º lugar</span>}
    </span>
  );
}

/** Uma redação no painel do professor: texto, grade de 1 a 5 por critério, comentário e "finalista". */
export function CartaoRedacao({ r, podeAvaliar = true }: { r: RedacaoNaEscola; podeAvaliar?: boolean }) {
  const { rodar, ocupado, avisos } = useAcao();
  const router = useRouter();
  const [aberta, setAberta] = useState(r.enviada && !r.avaliacao);
  const [notas, setNotas] = useState<Record<string, number>>(r.avaliacao?.notas ?? {});
  const [comentario, setComentario] = useState(r.avaliacao?.comentario ?? "");
  const completa = CRITERIOS.every((c) => notas[c.id]);

  return (
    <li className="rounded-3xl border-2 border-borda p-4 sm:p-5">
      <button type="button" onClick={() => setAberta(!aberta)} className="flex w-full flex-wrap items-center justify-between gap-2 text-left" aria-expanded={aberta}>
        <Autor r={r} />
        <span className="flex items-center gap-2">
          <Selos r={r} />
          <span className="text-xs text-texto-suave">{r.palavras} palavras {aberta ? "▲" : "▼"}</span>
        </span>
      </button>
      {aberta && (
        <div className="mt-4 space-y-4">
          {r.anexo && <LinkArquivo a={r.anexo} rotulo="📎 Folha da redação (abrir)" />}
          {/* Texto digitado só existe nas redações fictícias da demonstração. */}
          {r.texto.trim() && <article className="whitespace-pre-wrap rounded-2xl bg-superficie p-4 leading-relaxed">{r.texto}</article>}
          {podeAvaliar && (
            <div className="flex flex-wrap items-center gap-3 text-sm">
              <MandarArquivo rotulo={r.anexo ? "Trocar a folha" : "Anexar a folha"} campos={{ acao: "redacao", aluno: r.alunoId }} onPronto={() => router.refresh()} />
              <button
                type="button"
                disabled={ocupado}
                onClick={() => {
                  if (window.confirm(r.avaliacao ? "Tirar só o arquivo? A nota fica." : "Tirar esta redação? Ela volta para “sem redação”.")) void rodar({ acao: "tirar-redacao", redacao: r.id }, () => "Redação tirada.");
                }}
                className="font-semibold underline"
              >
                Tirar
              </button>
            </div>
          )}
          {podeAvaliar && r.enviada && (
            <div className="space-y-3">
              {CRITERIOS.map((c) => (
                <fieldset key={c.id} className="flex flex-wrap items-center justify-between gap-2">
                  <legend className="sr-only">{c.nome}</legend>
                  <span className="text-sm">
                    <b>{c.nome}</b> <span className="text-texto-suave">· {c.explica}</span>
                  </span>
                  <span className="flex gap-1">
                    {Array.from({ length: NOTA_MAXIMA }, (_, i) => i + 1).map((n) => (
                      <button
                        key={n}
                        type="button"
                        aria-label={`${c.nome}: ${n} de ${NOTA_MAXIMA}`}
                        aria-pressed={notas[c.id] === n}
                        onClick={() => setNotas({ ...notas, [c.id]: n })}
                        className={`h-9 w-9 rounded-full border-2 text-sm font-bold ${notas[c.id] === n ? "border-kambada-amarelo bg-kambada-amarelo text-kambada-grafite" : "border-borda hover:border-kambada-amarelo"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </span>
                </fieldset>
              ))}
              <div className="space-y-2 rounded-2xl border-2 border-dashed border-borda p-3">
                <p className="text-sm font-semibold">Correção em arquivo (opcional): a redação marcada à mão ou no computador. O aluno recebe junto com a nota.</p>
                {r.correcao ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="min-w-[14rem] flex-1">
                      <LinkArquivo a={r.correcao} rotulo="📝 Correção anexada" />
                    </div>
                    <button type="button" disabled={ocupado} onClick={() => rodar({ acao: "tirar-correcao", redacao: r.id }, () => "Correção tirada.")} className="text-sm font-semibold underline">
                      Tirar
                    </button>
                  </div>
                ) : (
                  <MandarArquivo rotulo="Anexar a correção" campos={{ acao: "correcao", redacao: r.id }} onPronto={() => router.refresh()} />
                )}
              </div>
              <textarea
                value={comentario}
                onChange={(e) => setComentario(e.target.value)}
                maxLength={600}
                rows={3}
                placeholder="Comentário para o aluno (ele vê junto com a nota)"
                className="w-full rounded-2xl border-2 border-borda bg-fundo p-3 text-sm outline-none focus:border-kambada-amarelo"
              />
              <div className="flex flex-wrap gap-3">
                <button type="button" disabled={!completa || ocupado} onClick={() => rodar({ acao: "avaliar-redacao", redacao: r.id, notas, comentario }, () => "Avaliação guardada. O aluno já vê a nota.")} className={BOTAO}>
                  Salvar avaliação
                </button>
                {r.avaliacao && (
                  <button type="button" disabled={ocupado} onClick={() => rodar({ acao: "finalista", redacao: r.id, ligado: !r.finalista }, () => (r.finalista ? "Saiu das finalistas." : "Finalista da turma! A coordenação já vê."))} className={BOTAO_SECUNDARIO}>
                    {r.finalista ? "Tirar das finalistas" : "⭐ Escolher como finalista"}
                  </button>
                )}
              </div>
              {avisos}
            </div>
          )}
        </div>
      )}
    </li>
  );
}

/** Coordenação: escolher a representante da escola; gestão Kambada: dar 1º, 2º ou 3º lugar. */
export function EscolhaDaEscola({ r, modo }: { r: RedacaoNaEscola; modo: "representante" | "colocacao" }) {
  const { rodar, ocupado, avisos } = useAcao();
  const [aberta, setAberta] = useState(false);
  return (
    <li className="space-y-3 rounded-3xl border-2 border-borda p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Autor r={r} />
        <Selos r={r} />
      </div>
      <button type="button" onClick={() => setAberta(!aberta)} className="text-sm font-semibold underline" aria-expanded={aberta}>
        {aberta ? "Esconder o texto" : "Ler a redação"}
      </button>
      {aberta && (
        <>
          {r.anexo && <LinkArquivo a={r.anexo} rotulo="📎 Redação anexada (abrir)" />}
          {r.texto.trim() && <article className="whitespace-pre-wrap rounded-2xl bg-superficie p-4 text-sm leading-relaxed">{r.texto}</article>}
        </>
      )}
      {r.avaliacao?.comentario && <p className="text-xs text-texto-suave">Professor: “{r.avaliacao.comentario}”</p>}
      <div className="flex flex-wrap gap-2">
        {modo === "representante" ? (
          <button type="button" disabled={ocupado || r.representante} onClick={() => rodar({ acao: "representante", redacao: r.id }, () => "Escolhida para representar a escola.")} className={r.representante ? BOTAO_SECUNDARIO : BOTAO}>
            {r.representante ? "🌟 Representa a escola" : "Escolher para representar a escola"}
          </button>
        ) : (
          <>
            {[1, 2, 3].map((n) => (
              <button key={n} type="button" disabled={ocupado} onClick={() => rodar({ acao: "colocacao", redacao: r.id, colocacao: r.colocacao === n ? null : n }, () => "Resultado atualizado.")} className={r.colocacao === n ? BOTAO : BOTAO_SECUNDARIO}>
                🏆 {n}º
              </button>
            ))}
          </>
        )}
      </div>
      {avisos}
    </li>
  );
}

/** Aluno ainda sem redação nesta temporada: o professor anexa a folha que ele entregou. */
export function AnexarFolha({ alunoId, apelido, avatar, nome }: { alunoId: string; apelido: string; avatar: string; nome: string | null }) {
  const router = useRouter();
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-dashed border-borda p-3">
      <span>
        <span aria-hidden>{avatar}</span> <b>{apelido}</b>
        {nome ? <span className="text-texto-suave"> · {nome}</span> : null}
      </span>
      <MandarArquivo rotulo="Anexar a folha" campos={{ acao: "redacao", aluno: alunoId }} onPronto={() => router.refresh()} />
    </li>
  );
}
