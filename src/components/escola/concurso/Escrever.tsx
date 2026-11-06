"use client";

import { useEffect, useRef, useState } from "react";
import { CRITERIOS, LIMITE_CARACTERES, NOTA_MAXIMA, contarPalavras, type Proposta } from "@/lib/escola/concurso";
import type { MinhaRedacao } from "@/lib/escola/concursoServico";
import { BOTAO, BOTAO_SECUNDARIO, chamar } from "../chamar";

/**
 * Folha da redação: contador de palavras com a faixa pedida, rascunho
 * guardado sozinho a cada pausa (e no botão), e o envio ao professor com
 * confirmação (depois de enviada, não muda mais). Avaliada, mostra a nota
 * de cada critério e o comentário do professor.
 */
export function Escrever({ proposta, inicial }: { proposta: Proposta; inicial: MinhaRedacao }) {
  const [r, setR] = useState(inicial);
  const [texto, setTexto] = useState(inicial.texto);
  const [estado, setEstado] = useState<"" | "salvando" | "salvo">("");
  const [erro, setErro] = useState("");
  const [confirmar, setConfirmar] = useState(false);
  const ultimo = useRef(inicial.texto);
  const palavras = contarPalavras(texto);
  const naFaixa = palavras >= proposta.minPalavras && palavras <= proposta.maxPalavras;

  async function salvar(enviar = false) {
    setErro("");
    setEstado("salvando");
    const resp = await chamar<{ redacao: MinhaRedacao }>("concurso", { acao: "salvar", texto, enviar });
    if (!resp.ok) {
      setEstado("");
      setErro(resp.mensagem ?? "Não deu para salvar.");
      return;
    }
    ultimo.current = texto;
    setR(resp.redacao);
    setEstado("salvo");
    setConfirmar(false);
  }

  // Rascunho automático: 3 segundos depois da última tecla.
  useEffect(() => {
    if (r.enviada || texto === ultimo.current) return;
    const id = window.setTimeout(() => void salvar(), 3000);
    return () => window.clearTimeout(id);
  });

  if (r.enviada) {
    return (
      <div className="space-y-5">
        <div className="rounded-3xl border-2 border-kambada-green bg-kambada-green/10 p-5">
          <p className="font-display text-xl font-extrabold">✓ Redação enviada!</p>
          <p className="mt-1 text-sm text-texto-suave">
            {r.avaliacao ? "O professor já avaliou. Olha como foi:" : "Agora é com o professor. Quando ele avaliar, a nota e o comentário aparecem aqui."}
          </p>
          {(r.finalista || r.representante || r.colocacao) && (
            <p className="mt-3 rounded-2xl bg-kambada-amarelo px-4 py-2 font-bold text-kambada-grafite">
              {r.colocacao ? `🏆 ${r.colocacao}º lugar na rede Kambada!` : r.representante ? "🌟 Tua redação vai representar a escola!" : "⭐ Tu é finalista da turma!"}
            </p>
          )}
        </div>
        {r.avaliacao && (
          <div className="rounded-3xl border-2 border-borda p-5">
            <p className="font-display text-lg font-extrabold">
              Nota: {r.avaliacao.total} de {CRITERIOS.length * NOTA_MAXIMA}
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {CRITERIOS.map((c) => (
                <li key={c.id} className="rounded-2xl bg-superficie p-3 text-sm">
                  <b>{c.nome}</b>
                  <span className="ml-2 text-kambada-amarelo-escuro" aria-label={`${r.avaliacao!.notas[c.id]} de ${NOTA_MAXIMA}`}>
                    {"★".repeat(r.avaliacao!.notas[c.id] ?? 0)}
                    <span className="text-texto-tenue">{"★".repeat(NOTA_MAXIMA - (r.avaliacao!.notas[c.id] ?? 0))}</span>
                  </span>
                </li>
              ))}
            </ul>
            {r.avaliacao.comentario && (
              <p className="mt-4 rounded-2xl bg-kambada-amarelo/15 p-4 text-sm">
                <b>Do professor:</b> {r.avaliacao.comentario}
              </p>
            )}
          </div>
        )}
        <article className="whitespace-pre-wrap rounded-3xl border-2 border-dashed border-borda p-5 leading-relaxed">{r.texto}</article>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <label htmlFor="redacao" className="block font-display text-lg font-extrabold">
        ✍️ Tua redação
      </label>
      <textarea
        id="redacao"
        value={texto}
        onChange={(e) => {
          setTexto(e.target.value);
          setEstado("");
        }}
        maxLength={LIMITE_CARACTERES}
        rows={14}
        placeholder="Escreve aqui. Pode parar e voltar depois: o rascunho fica guardado."
        className="w-full rounded-2xl border-2 border-borda bg-fundo p-4 text-lg leading-relaxed outline-none focus:border-kambada-amarelo"
      />
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
        <span className={naFaixa ? "font-semibold text-kambada-green" : "text-texto-suave"}>
          {palavras} palavras · pedido: de {proposta.minPalavras} a {proposta.maxPalavras}
        </span>
        <span className="text-texto-suave" role="status">
          {estado === "salvando" ? "Guardando…" : estado === "salvo" ? "Rascunho guardado ✓" : ""}
        </span>
      </div>
      {erro && <p className="font-semibold text-kambada-red" role="alert">{erro}</p>}
      {!confirmar ? (
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => salvar()} className={BOTAO_SECUNDARIO}>
            Guardar rascunho
          </button>
          <button type="button" onClick={() => setConfirmar(true)} disabled={!naFaixa} className={BOTAO}>
            Enviar ao professor →
          </button>
        </div>
      ) : (
        <div className="space-y-3 rounded-2xl bg-kambada-amarelo/15 p-4" role="alertdialog" aria-label="Confirmar envio">
          <p className="font-semibold">Depois de enviar, tu não muda mais o texto. Leu tudo de novo? Conferiu os acentos?</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={() => salvar(true)} className={BOTAO}>Sim, enviar</button>
            <button type="button" onClick={() => setConfirmar(false)} className={BOTAO_SECUNDARIO}>Voltar e revisar</button>
          </div>
        </div>
      )}
    </div>
  );
}
