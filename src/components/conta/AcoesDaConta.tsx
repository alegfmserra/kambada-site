"use client";

import { useState } from "react";
import { chamar } from "@/components/play/jogos/jogador";

/** Botões da "Minha conta" da loja: reenviar confirmação, novidades por e-mail e sair. */
export function AcoesDaConta({ confirmado, novidades }: { confirmado: boolean; novidades: boolean }) {
  const [quer, setQuer] = useState(novidades);
  const [aviso, setAviso] = useState("");
  const [linkTeste, setLinkTeste] = useState("");

  async function reenviar() {
    setAviso("");
    const r = await chamar<{ emailEnviado?: boolean; jaConfirmado?: boolean; linkDeConfirmacao?: string }>(
      "/api/play/conta",
      { acao: "reenviar-confirmacao" },
    );
    if (!r.ok) return setAviso(r.mensagem ?? "Não deu para reenviar.");
    if (r.jaConfirmado) return setAviso("Seu e-mail já está confirmado.");
    setAviso(r.emailEnviado ? "Enviamos de novo. Confira também a caixa de spam." : "E-mail não configurado neste ambiente.");
    if (r.linkDeConfirmacao) setLinkTeste(r.linkDeConfirmacao);
  }

  async function mudarNovidades(valor: boolean) {
    setQuer(valor);
    const r = await chamar("/api/play/conta", { acao: "novidades", quer: valor });
    if (!r.ok) setAviso(r.mensagem ?? "Não deu para salvar.");
  }

  async function sair() {
    await chamar("/api/play/sair", {});
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- o cookie acabou de sair; recarrega tudo sem a sessão
    window.location.assign("/entrar?aviso=saiu");
  }

  return (
    <div className="mt-5 space-y-4 text-sm">
      {!confirmado ? (
        <button
          type="button"
          onClick={reenviar}
          className="font-semibold text-[var(--destaque-texto)] underline-offset-2 hover:underline"
        >
          Reenviar e-mail de confirmação
        </button>
      ) : null}
      {linkTeste ? (
        <p className="break-all text-xs">
          Ambiente de testes:{" "}
          <a className="underline" href={linkTeste}>
            abrir link de confirmação
          </a>
        </p>
      ) : null}
      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={quer}
          onChange={(e) => void mudarNovidades(e.target.checked)}
          className="mt-1 h-4 w-4 accent-kambada-amarelo"
        />
        <span>Receber novidades, promoções e cupons por e-mail.</span>
      </label>
      {aviso ? (
        <p role="status" className="font-semibold">
          {aviso}
        </p>
      ) : null}
      <button
        type="button"
        onClick={sair}
        className="rounded-full border-2 border-borda px-5 py-2 font-bold transition-colors hover:border-kambada-amarelo"
      >
        Sair da conta
      </button>
    </div>
  );
}
