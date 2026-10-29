"use client";

import Link from "next/link";
import { useState } from "react";
import type { PecaParaAvaliar } from "@/lib/avaliacoes/pedido";

type Props = { token: string; pecas: PecaParaAvaliar[]; nomeExibido: string };

const ROTULOS = ["", "Não gostei", "Poderia ser melhor", "Boa", "Muito boa", "Amei"];

/** Estrelas de 1 a 5 por peça, comentário opcional e autorização para publicar. */
export default function FormularioAvaliacao({ token, pecas, nomeExibido }: Props) {
  const [notas, setNotas] = useState<Record<string, number>>({});
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [autoriza, setAutoriza] = useState(true);
  const [estado, setEstado] = useState<"livre" | "enviando" | "enviado">("livre");
  const [erro, setErro] = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    const avaliacoes = pecas
      .filter((p) => notas[p.produto])
      .map((p) => ({ produto: p.produto, nota: notas[p.produto], texto: textos[p.produto] ?? "" }));
    if (!avaliacoes.length) return setErro("Escolha as estrelas de pelo menos uma peça.");
    setEstado("enviando");
    try {
      const r = await fetch("/api/avaliacoes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ t: token, autoriza, avaliacoes }),
      });
      const j = (await r.json().catch(() => ({}))) as { erro?: string };
      if (!r.ok) throw new Error(j.erro ?? "Não deu para enviar agora.");
      setEstado("enviado");
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não deu para enviar agora.");
      setEstado("livre");
    }
  }

  if (estado === "enviado") {
    return (
      <div className="mt-8 rounded-2xl border border-borda bg-superficie p-6">
        <p className="font-display text-xl font-bold">Éguas, obrigado! 💛</p>
        <p className="mt-2 text-texto-suave">
          Recebemos sua avaliação.{" "}
          {autoriza ? "Ela aparece na página da peça assim que a gente conferir." : "Ela fica só com a gente, como você pediu."}
        </p>
        <Link href="/loja" className="mt-4 inline-block font-semibold underline underline-offset-4">
          Voltar para a loja
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="mt-8 space-y-6">
      {pecas.map((p) => (
        <fieldset key={p.produto} className="rounded-2xl border border-borda p-5">
          <legend className="px-1 font-display font-bold">
            <Link href={p.href} className="hover:underline">
              {p.produtoNome}
            </Link>
            {p.opcao && <span className="ml-2 text-sm font-normal text-texto-suave">({p.opcao})</span>}
          </legend>
          <div className="mt-2 flex items-center gap-1" role="radiogroup" aria-label={`Nota para ${p.produtoNome}`}>
            {[1, 2, 3, 4, 5].map((n) => {
              const marcada = (notas[p.produto] ?? 0) >= n;
              return (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={notas[p.produto] === n}
                  aria-label={`${n} de 5 — ${ROTULOS[n]}`}
                  onClick={() => setNotas({ ...notas, [p.produto]: n })}
                  className={`min-h-11 min-w-11 text-3xl leading-none transition-colors ${
                    marcada ? "text-kambada-amarelo-escuro" : "text-borda hover:text-kambada-amarelo"
                  }`}
                >
                  ★
                </button>
              );
            })}
            {notas[p.produto] ? <span className="ml-2 text-sm text-texto-suave">{ROTULOS[notas[p.produto]]}</span> : null}
          </div>
          <label className="mt-3 block text-sm">
            <span className="text-texto-suave">Conta mais (opcional): tecido, tamanho, estampa, entrega…</span>
            <textarea
              maxLength={600}
              rows={3}
              value={textos[p.produto] ?? ""}
              onChange={(e) => setTextos({ ...textos, [p.produto]: e.target.value })}
              className="mt-1 w-full rounded-xl border border-borda bg-fundo p-3 text-base"
            />
          </label>
        </fieldset>
      ))}

      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={autoriza}
          onChange={(e) => setAutoriza(e.target.checked)}
          className="mt-1 h-4 w-4 accent-kambada-amarelo"
        />
        <span>
          Autorizo publicar minha avaliação no site com o nome <strong>{nomeExibido}</strong>. Seu e-mail nunca aparece.
        </span>
      </label>

      {erro && (
        <p role="alert" className="text-sm font-semibold text-red-700 dark:text-red-400">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={estado === "enviando"}
        className="rounded-full bg-kambada-amarelo px-8 py-4 font-display font-semibold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro disabled:opacity-60"
      >
        {estado === "enviando" ? "Enviando…" : "Enviar avaliação"}
      </button>
    </form>
  );
}
