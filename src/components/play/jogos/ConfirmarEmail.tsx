"use client";

import { useState } from "react";
import { chamar } from "./jogador";

/**
 * Aviso para a conta que ainda não confirmou o e-mail: sem confirmação até o
 * domingo, o cupom do ranking da semana passa para o próximo (regra de
 * 17/11/2026, em lib/play/jogos/placar.ts). Aparece no ranking e na "Minha conta".
 */
export function ConfirmarEmail({ className = "" }: { className?: string }) {
  const [aviso, setAviso] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [linkTeste, setLinkTeste] = useState("");

  async function reenviar() {
    setAviso("");
    setEnviando(true);
    const r = await chamar<{ emailEnviado?: boolean; jaConfirmado?: boolean; linkDeConfirmacao?: string }>(
      "/api/play/conta",
      { acao: "reenviar-confirmacao" },
    );
    setEnviando(false);
    if (!r.ok) {
      setAviso(r.mensagem ?? "Não deu para reenviar.");
      return;
    }
    if (r.jaConfirmado) {
      setAviso("Seu e-mail já está confirmado.");
      return;
    }
    setAviso(r.emailEnviado ? "Enviamos de novo. Confira também a caixa de spam." : "E-mail não configurado neste ambiente.");
    if (r.linkDeConfirmacao) setLinkTeste(r.linkDeConfirmacao);
  }

  return (
    <div className={`rounded-xl border-2 border-dashed border-borda-campo p-4 text-sm text-texto-suave ${className}`}>
      <p className="font-display text-lg font-extrabold text-texto">Confirme seu e-mail para valer o prêmio</p>
      <p className="mt-1">
        Seus pontos entram no ranking do mesmo jeito, mas o cupom do top 3 só sai para conta com e-mail confirmado
        até o domingo. Sem confirmar, o prêmio passa para o próximo.
      </p>
      <button
        type="button"
        onClick={reenviar}
        disabled={enviando}
        className="mt-3 inline-flex min-h-11 items-center rounded-full border-2 border-borda-campo px-5 py-2 font-bold text-texto transition-colors hover:border-kambada-amarelo disabled:opacity-60"
      >
        {enviando ? "Enviando…" : "Reenviar e-mail de confirmação"}
      </button>
      <p role="status" className="mt-2 min-h-5 font-semibold text-texto">
        {aviso}
      </p>
      {linkTeste ? (
        <p className="break-all text-xs">
          Ambiente de testes:{" "}
          <a className="underline" href={linkTeste}>
            abrir link de confirmação
          </a>
        </p>
      ) : null}
    </div>
  );
}
