"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ConfirmarEmail } from "./ConfirmarEmail";
import { chamar, esquecerJogador } from "./jogador";

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
  continuar,
}: {
  bemvindo: boolean;
  semEmail: boolean;
  senhaTrocada: boolean;
  /** Conta recém-criada: para onde a pessoa ia (endereço de dentro do Play, já validado na página). */
  continuar?: string;
}) {
  const [conta, setConta] = useState<Conta | null | undefined>(undefined);
  const [demonstracao, setDemonstracao] = useState(false);
  const [aviso, setAviso] = useState("");

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
            : "Mandamos um e-mail para confirmar seu endereço. Confirme para valer o prêmio do ranking."}
        </p>
      ) : null}
      {bemvindo && continuar ? (
        <a
          href={continuar}
          className="block rounded-full bg-kambada-amarelo px-8 py-4 text-center text-lg font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
        >
          {continuar === "/kambadaplay" ? "Ir para o Kambada Play" : "Continuar para o jogo"}
        </a>
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

      {!conta.confirmadoEm && !conta.usuario ? <ConfirmarEmail /> : null}

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

      {conta.demo ? null : <ExcluirConta comEmail={!conta.usuario} />}
    </div>
  );
}

/**
 * Excluir a conta: fica fechado até a pessoa pedir, explica o que some e o que
 * fica, e pede a senha de novo (quem está com o aparelho na mão pode ser a criança).
 */
function ExcluirConta({ comEmail }: { comEmail: boolean }) {
  const [aberto, setAberto] = useState(false);
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function excluir(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    const r = await chamar("/api/play/conta", { acao: "excluir", senha });
    if (!r.ok) {
      setEnviando(false);
      setErro(r.mensagem ?? "Não deu para excluir agora. Tente de novo.");
      return;
    }
    esquecerJogador();
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- a conta e o cookie acabaram de sair; o porteiro precisa rodar de novo
    window.location.assign("/kambadaplay/entrar?aviso=conta-excluida");
  }

  if (!aberto) {
    return (
      <p className="border-t border-borda pt-5 text-sm text-texto-suave">
        Não quer mais a conta?{" "}
        <button
          type="button"
          onClick={() => setAberto(true)}
          aria-expanded={false}
          className="inline-flex min-h-11 items-center font-semibold text-texto underline underline-offset-4"
        >
          Excluir minha conta
        </button>
      </p>
    );
  }

  return (
    <form onSubmit={excluir} className="rounded-xl border-2 border-erro p-5 text-sm text-texto" aria-labelledby="excluir-titulo">
      <h2 id="excluir-titulo" className="font-display text-xl font-extrabold text-texto">
        Excluir a conta
      </h2>
      <p className="mt-2 text-texto-suave">Isto não tem volta. Ao excluir:</p>
      <ul className="mt-2 list-disc space-y-1 pl-5 text-texto-suave">
        <li>Apagamos o nome, o e-mail e a senha da conta.</li>
        <li>O apelido sai do ranking. As pontuações antigas ficam como “Brincante”, sem ligação com você.</li>
        <li>Apagamos o brincante do Arraial: nível, coleção e recados.</li>
        <li>As partidas já jogadas deixam de estar ligadas à conta.</li>
        <li>Cupom que você já ganhou continua valendo até a data dele. Anote o código antes: ele não aparece mais aqui.</li>
        <li>
          Pedidos feitos na loja com este e-mail não são apagados (a loja guarda o registro por obrigação legal), mas
          deixam de aparecer em “Minha conta”.
        </li>
      </ul>
      {comEmail ? <p className="mt-3 text-texto-suave">Mandamos um e-mail confirmando a exclusão.</p> : null}
      <label htmlFor="senha-excluir" className="mt-4 block font-semibold text-texto">
        Digite a senha da conta para confirmar
      </label>
      <input
        id="senha-excluir"
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        autoComplete="current-password"
        required
        maxLength={100}
        className="mt-1 w-full rounded-lg border-2 border-borda-campo bg-fundo px-4 py-3 text-texto outline-none focus:border-kambada-amarelo"
      />
      {erro ? (
        <p role="alert" className="mt-3 font-semibold text-erro">
          {erro}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            setAberto(false);
            setSenha("");
            setErro("");
          }}
          className="min-h-11 rounded-full bg-kambada-amarelo px-6 py-2.5 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
        >
          Ficar com a conta
        </button>
        <button
          type="submit"
          disabled={enviando || !senha}
          className="min-h-11 rounded-full border-2 border-erro px-6 py-2.5 font-bold text-erro transition-colors disabled:opacity-60"
        >
          {enviando ? "Excluindo…" : "Excluir a conta para sempre"}
        </button>
      </div>
    </form>
  );
}
