"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { chamar } from "./jogador";

type Conta = {
  id: string;
  nome: string;
  email: string;
  novidades: boolean;
  confirmadoEm?: string;
  criadoEm: string;
  /** Conta sem e-mail (entra por usuário); `demo` = conta de demonstração. */
  usuario?: string;
  demo?: boolean;
};

export function MinhaConta({
  bemvindo,
  semEmail,
  senhaTrocada,
}: {
  bemvindo: boolean;
  semEmail: boolean;
  senhaTrocada: boolean;
}) {
  const [conta, setConta] = useState<Conta | null | undefined>(undefined);
  const [demonstracao, setDemonstracao] = useState(false);
  const [aviso, setAviso] = useState("");
  const [linkTeste, setLinkTeste] = useState("");

  useEffect(() => {
    let vivo = true;
    void (async () => {
      const r = await chamar<{ conta: Conta | null; demonstracao: boolean }>("/api/play/conta?acao=eu");
      if (!vivo) return;
      setConta(r.ok ? r.conta : null);
      setDemonstracao(Boolean(r.ok && r.demonstracao));
    })();
    return () => {
      vivo = false;
    };
  }, []);

  async function reenviar() {
    setAviso("");
    const r = await chamar<{ emailEnviado?: boolean; jaConfirmado?: boolean; linkDeConfirmacao?: string }>(
      "/api/play/conta",
      { acao: "reenviar-confirmacao" },
    );
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

  async function mudarNovidades(quer: boolean) {
    if (!conta) return;
    setConta({ ...conta, novidades: quer });
    const r = await chamar("/api/play/conta", { acao: "novidades", quer });
    if (!r.ok) setAviso(r.mensagem ?? "Não deu para salvar.");
  }

  async function sair() {
    await chamar("/api/play/sair", {});
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- o cookie acabou de sair; o porteiro precisa rodar de novo
    window.location.assign("/kambadaplay/entrar?aviso=saiu");
  }

  if (conta === undefined) return <p className="mt-6 text-texto-tenue">Carregando…</p>;

  if (!conta) {
    return (
      <div className="mt-6 space-y-4">
        <p className="text-texto-suave">
          {demonstracao
            ? "Você entrou com o acesso de demonstração. Para guardar pontos e concorrer aos cupons, crie uma conta com e-mail."
            : "Você não está em uma conta."}
        </p>
        <Link
          href="/kambadaplay/entrar"
          className="inline-block rounded-full bg-kambada-amarelo px-8 py-3 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
        >
          Entrar ou criar conta
        </Link>
        {demonstracao ? (
          <button
            type="button"
            onClick={sair}
            className="block text-sm font-semibold text-texto-suave underline-offset-4 hover:underline"
          >
            Sair do acesso de demonstração
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-6">
      {bemvindo ? (
        <p role="status" className="rounded-xl border-2 border-kambada-amarelo bg-kambada-amarelo/15 p-4 text-texto">
          <strong>Éguas, {conta.nome}, bem-vindo ao Kambada Play!</strong>{" "}
          {semEmail
            ? "Não conseguimos mandar o e-mail de confirmação agora; você pode pedir de novo abaixo."
            : "Mandamos um e-mail para confirmar seu endereço. Confirme para seus pontos valerem cupom."}
        </p>
      ) : null}
      {senhaTrocada ? (
        <p role="status" className="rounded-xl border-2 border-kambada-amarelo bg-kambada-amarelo/15 p-4 text-texto">
          Senha trocada. Você já está dentro.
        </p>
      ) : null}

      <dl className="rounded-xl border-2 border-borda bg-superficie p-5 text-sm">
        <div className="flex justify-between gap-4 py-1">
          <dt className="text-texto-suave">Nome</dt>
          <dd className="font-semibold text-texto">{conta.nome}</dd>
        </div>
        {conta.usuario ? (
          <>
            <div className="flex justify-between gap-4 py-1">
              <dt className="text-texto-suave">Usuário</dt>
              <dd className="font-semibold text-texto">{conta.usuario}</dd>
            </div>
            <div className="flex justify-between gap-4 py-1">
              <dt className="text-texto-suave">Status</dt>
              <dd className="font-semibold text-texto">{conta.demo ? "Conta de demonstração" : "Conta sem e-mail"}</dd>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between gap-4 py-1">
              <dt className="text-texto-suave">E-mail</dt>
              <dd className="font-semibold text-texto">{conta.email}</dd>
            </div>
            <div className="flex justify-between gap-4 py-1">
              <dt className="text-texto-suave">Status</dt>
              <dd className="font-semibold text-texto">{conta.confirmadoEm ? "E-mail confirmado" : "E-mail ainda não confirmado"}</dd>
            </div>
          </>
        )}
      </dl>

      {!conta.confirmadoEm && !conta.usuario ? (
        <div className="rounded-xl border-2 border-dashed border-borda p-4 text-sm text-texto-suave">
          Sem confirmação, seus pontos entram no ranking, mas o cupom e as novidades não chegam.{" "}
          <button
            type="button"
            onClick={reenviar}
            className="font-semibold text-[var(--destaque-texto)] underline-offset-2 hover:underline"
          >
            Reenviar e-mail de confirmação
          </button>
          {linkTeste ? (
            <p className="mt-2 break-all text-xs">
              Ambiente de testes:{" "}
              <a className="underline" href={linkTeste}>
                abrir link de confirmação
              </a>
            </p>
          ) : null}
        </div>
      ) : null}

      <label className="flex items-start gap-3 rounded-xl border-2 border-borda bg-superficie p-4 text-sm text-texto">
        <input
          type="checkbox"
          checked={conta.novidades}
          onChange={(e) => void mudarNovidades(e.target.checked)}
          className="mt-1 h-4 w-4 accent-kambada-amarelo"
        />
        <span>
          <strong>Receber novidades, promoções e os cupons do ranking por e-mail.</strong>
          <br />
          <span className="text-texto-suave">Desligue aqui ou pelo link em qualquer e-mail.</span>
        </span>
      </label>

      {aviso ? (
        <p role="status" className="text-sm font-semibold text-texto">
          {aviso}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Link
          href="/kambadaplay/jogos"
          className="rounded-full bg-kambada-amarelo px-8 py-3 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
        >
          Ir para os jogos
        </Link>
        <Link
          href="/kambadaplay/placar"
          className="rounded-full border-2 border-borda px-8 py-3 font-bold text-texto transition-colors hover:border-kambada-amarelo"
        >
          Ver o ranking
        </Link>
        <button
          type="button"
          onClick={sair}
          className="rounded-full border-2 border-borda px-8 py-3 font-bold text-texto transition-colors hover:border-kambada-amarelo"
        >
          Sair
        </button>
      </div>
    </div>
  );
}
