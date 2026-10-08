"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { MOTIVOS, mensagemAtendimento, type Motivo } from "@/lib/pedido/atendimento";
import { linkWhatsApp } from "@/lib/site";

export default function FormularioAtendimento({ refInicial }: { refInicial: string }) {
  const [motivo, setMotivo] = useState<Motivo>("entrega");
  const [ref, setRef] = useState(refInicial);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [recebidoEm, setRecebidoEm] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  function enviar(e: FormEvent) {
    e.preventDefault();
    if (!nome.trim() || descricao.trim().length < 10) {
      setErro("Informe seu nome e conte, em poucas palavras, o que aconteceu.");
      return;
    }
    setErro(null);
    window.open(
      linkWhatsApp(
        mensagemAtendimento({
          motivo,
          ref: ref.trim().toUpperCase(),
          nome: nome.trim(),
          descricao: descricao.trim(),
          recebidoEm: motivo !== "entrega" && motivo !== "reclamacao" ? recebidoEm : undefined,
        }),
      ),
      "_blank",
      "noopener,noreferrer",
    );
  }

  const pedeData = motivo !== "entrega" && motivo !== "reclamacao";

  return (
    <form onSubmit={enviar} noValidate className="max-w-2xl space-y-8">
      <fieldset>
        <legend className="font-display text-xl font-bold">1. O que você precisa?</legend>
        <div className="mt-4 space-y-2">
          {MOTIVOS.map((m) => (
            <label
              key={m.id}
              className={`flex min-h-14 cursor-pointer items-start gap-3 rounded-xl border px-4 py-3 ${
                motivo === m.id ? "border-kambada-amarelo-escuro bg-superficie" : "border-borda"
              }`}
            >
              <input
                type="radio"
                name="motivo"
                value={m.id}
                checked={motivo === m.id}
                onChange={() => setMotivo(m.id)}
                className="mt-1 h-5 w-5 accent-kambada-amarelo-escuro"
              />
              <span>
                <span className="font-semibold">{m.rotulo}</span>
                <span className="block text-sm text-texto-suave">{m.dica}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-4 font-display text-xl font-bold">2. Seu pedido</legend>
        <div>
          <label htmlFor="at-ref" className="block text-sm font-semibold">
            Número do pedido
          </label>
          <input
            id="at-ref"
            value={ref}
            onChange={(e) => setRef(e.target.value)}
            placeholder="KMB-20261008-ABC123"
            spellCheck={false}
            className="mt-1 min-h-11 w-full rounded-xl border border-borda bg-fundo px-4 py-2.5 font-mono uppercase outline-none focus:border-kambada-amarelo-escuro"
          />
        </div>
        <div>
          <label htmlFor="at-nome" className="block text-sm font-semibold">
            Seu nome
          </label>
          <input
            id="at-nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            autoComplete="name"
            required
            className="mt-1 min-h-11 w-full rounded-xl border border-borda bg-fundo px-4 py-2.5 outline-none focus:border-kambada-amarelo-escuro"
          />
        </div>
        {pedeData && (
          <div>
            <label htmlFor="at-data" className="block text-sm font-semibold">
              Quando você recebeu?
            </label>
            <input
              id="at-data"
              type="date"
              value={recebidoEm}
              onChange={(e) => setRecebidoEm(e.target.value)}
              className="mt-1 min-h-11 w-full rounded-xl border border-borda bg-fundo px-4 py-2.5 outline-none focus:border-kambada-amarelo-escuro"
            />
          </div>
        )}
        <div className="sm:col-span-2">
          <label htmlFor="at-desc" className="block text-sm font-semibold">
            Conte o que aconteceu
          </label>
          <textarea
            id="at-desc"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={5}
            required
            className="mt-1 w-full rounded-xl border border-borda bg-fundo px-4 py-2.5 outline-none focus:border-kambada-amarelo-escuro"
          />
        </div>
      </fieldset>

      <div aria-live="assertive">{erro && <p className="rounded-xl bg-superficie px-4 py-3 text-sm">{erro}</p>}</div>

      <div>
        <button
          type="submit"
          className="rounded-full bg-kambada-amarelo px-8 py-4 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro"
        >
          Enviar pelo WhatsApp
        </button>
        <p className="mt-3 text-sm text-texto-suave">
          A mensagem abre pronta no WhatsApp da Kambada — é só enviar. Não pedimos CPF nem dados de
          cartão por lá. Antes, se quiser, veja a{" "}
          <Link href="/trocas-e-devolucoes" className="font-semibold text-texto underline underline-offset-4">
            política de trocas e devoluções
          </Link>
          .
        </p>
      </div>
    </form>
  );
}
