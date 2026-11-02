"use client";

import { useState } from "react";
import { chamar } from "@/components/play/jogos/jogador";

/** Botões da "Minha conta" da loja: reenviar confirmação, novidades por e-mail e sair. */
const MESES = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

export function AcoesDaConta({
  confirmado,
  novidades,
  aniversario,
  podeAniversario = true,
}: {
  confirmado: boolean;
  novidades: boolean;
  /** "MM-DD" já guardado, se houver. */
  aniversario?: string;
  /** Conta por usuário (sem e-mail) não tem parabéns por e-mail. */
  podeAniversario?: boolean;
}) {
  const [quer, setQuer] = useState(novidades);
  const [dia, setDia] = useState(aniversario ? String(Number(aniversario.slice(3))) : "");
  const [mes, setMes] = useState(aniversario ? String(Number(aniversario.slice(0, 2))) : "");
  const [avisoAniv, setAvisoAniv] = useState("");
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

  async function salvarAniversario(apagar = false) {
    setAvisoAniv("");
    if (apagar) {
      setDia("");
      setMes("");
    }
    const r = await chamar("/api/play/conta", { acao: "aniversario", dia: apagar ? "" : dia, mes: apagar ? "" : mes });
    if (!r.ok) return setAvisoAniv(r.mensagem ?? "Não deu para salvar.");
    setAvisoAniv(apagar ? "Data apagada." : "Pronto! Anotamos o seu aniversário.");
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
      {podeAniversario ? (
        <fieldset className="rounded-xl border border-borda p-4">
          <legend className="px-1 font-semibold">Aniversário (opcional)</legend>
          <p className="text-xs text-texto-suave">
            Informe só o dia e o mês do titular da conta (sem ano e sem idade). No dia, a Kambada manda um parabéns e um cupom de 15 %.
            Se a conta é de uma criança, coloque o aniversário do responsável. O e-mail só chega a quem aceitou receber novidades (opção acima).
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <label className="sr-only" htmlFor="aniv-dia">Dia</label>
            <select id="aniv-dia" value={dia} onChange={(e) => setDia(e.target.value)} className="rounded-lg border border-borda bg-fundo px-2 py-1.5">
              <option value="">Dia</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
            <label className="sr-only" htmlFor="aniv-mes">Mês</label>
            <select id="aniv-mes" value={mes} onChange={(e) => setMes(e.target.value)} className="rounded-lg border border-borda bg-fundo px-2 py-1.5">
              <option value="">Mês</option>
              {MESES.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>
            <button type="button" onClick={() => void salvarAniversario()} disabled={!dia || !mes} className="rounded-full bg-kambada-amarelo px-4 py-1.5 font-bold text-kambada-grafite disabled:opacity-50">
              Salvar
            </button>
            {aniversario || (dia && mes) ? (
              <button type="button" onClick={() => void salvarAniversario(true)} className="text-xs font-semibold underline-offset-2 hover:underline">
                Apagar
              </button>
            ) : null}
          </div>
          {avisoAniv ? <p role="status" className="mt-2 font-semibold">{avisoAniv}</p> : null}
        </fieldset>
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
