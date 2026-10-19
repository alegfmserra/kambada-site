"use client";

import Link from "next/link";
import { useState } from "react";
import { chamar } from "./jogador";

type Aba = "entrar" | "criar" | "esqueci";

const CAMPO =
  "mt-1 w-full rounded-lg border-2 border-borda bg-fundo px-4 py-3 text-texto outline-none focus:border-kambada-amarelo";
const BOTAO =
  "w-full rounded-full bg-kambada-amarelo px-8 py-3.5 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro disabled:opacity-60";

/**
 * Entrada do Kambada Play: entrar com e-mail e senha, criar conta ou pedir
 * nova senha. O login de demonstração (sem "@") continua passando pelo mesmo
 * campo, para as apresentações.
 */
export function FormularioEntrada({ de, aviso }: { de: string; aviso?: string }) {
  const [aba, setAba] = useState<Aba>("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [novidades, setNovidades] = useState(false);
  const [aceite, setAceite] = useState(false);
  const [erro, setErro] = useState("");
  const [info, setInfo] = useState(avisoInicial(aviso));
  const [enviando, setEnviando] = useState(false);
  const [linkTeste, setLinkTeste] = useState("");

  function trocar(a: Aba) {
    setAba(a);
    setErro("");
    setInfo("");
    setLinkTeste("");
  }

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    const demonstracao = !email.includes("@");
    const r = demonstracao
      ? await chamar<{ destino: string }>("/api/play/entrar", { usuario: email, senha, de })
      : await chamar<{ destino: string }>("/api/play/conta", { acao: "entrar", email, senha, de });
    if (!r.ok) {
      setEnviando(false);
      setErro(r.mensagem ?? "Não deu para entrar. Tente de novo.");
      return;
    }
    window.location.assign(r.destino || "/kambadaplay");
  }

  async function criar(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    if (!aceite) {
      setErro("Para criar a conta, aceite os Termos e a Política de Privacidade.");
      return;
    }
    setEnviando(true);
    const r = await chamar<{ destino: string; emailEnviado: boolean }>("/api/play/conta", {
      acao: "cadastrar",
      nome,
      email,
      senha,
      novidades,
      aceiteTermos: aceite,
      de,
    });
    if (!r.ok) {
      setEnviando(false);
      setErro(r.mensagem ?? "Não deu para criar a conta.");
      return;
    }
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination -- navegação completa: o cookie novo precisa passar pelo porteiro
    window.location.assign(`/kambadaplay/conta?bemvindo=1${r.emailEnviado ? "" : "&semEmail=1"}`);
  }

  async function esqueci(e: React.FormEvent) {
    e.preventDefault();
    setErro("");
    setEnviando(true);
    const r = await chamar<{ mensagem: string; linkDeRedefinicao?: string }>("/api/play/conta", {
      acao: "esqueci",
      email,
    });
    setEnviando(false);
    if (!r.ok) {
      setErro(r.mensagem ?? "Não deu para pedir a nova senha.");
      return;
    }
    setInfo(r.mensagem);
    if (r.linkDeRedefinicao) setLinkTeste(r.linkDeRedefinicao);
  }

  return (
    <div className="mt-8 text-left">
      <div className="flex gap-2" role="tablist" aria-label="Entrar ou criar conta">
        {(
          [
            ["entrar", "Entrar"],
            ["criar", "Criar conta"],
          ] as const
        ).map(([id, rotulo]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={aba === id}
            onClick={() => trocar(id)}
            className={`flex-1 rounded-full border-2 px-4 py-2 text-sm font-bold transition-colors ${
              aba === id
                ? "border-kambada-amarelo bg-kambada-amarelo text-kambada-grafite"
                : "border-borda text-texto hover:border-kambada-amarelo"
            }`}
          >
            {rotulo}
          </button>
        ))}
      </div>

      {info ? (
        <p role="status" className="mt-4 rounded-md bg-kambada-amarelo/20 px-3 py-2 text-sm font-semibold text-texto">
          {info}
        </p>
      ) : null}

      {aba === "entrar" ? (
        <form onSubmit={entrar} className="mt-5 space-y-4">
          <div>
            <label htmlFor="email" className="text-sm font-semibold text-texto-suave">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              inputMode="email"
              required
              className={CAMPO}
            />
          </div>
          <div>
            <label htmlFor="senha" className="text-sm font-semibold text-texto-suave">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="current-password"
              required
              className={CAMPO}
            />
          </div>
          {erro ? <Erro texto={erro} /> : null}
          <button type="submit" disabled={enviando} className={BOTAO}>
            {enviando ? "Entrando…" : "Entrar"}
          </button>
          <button
            type="button"
            onClick={() => trocar("esqueci")}
            className="block w-full text-center text-sm font-semibold text-[var(--destaque-texto)] hover:underline"
          >
            Esqueci a senha
          </button>
        </form>
      ) : null}

      {aba === "criar" ? (
        <form onSubmit={criar} className="mt-5 space-y-4">
          <div>
            <label htmlFor="nome" className="text-sm font-semibold text-texto-suave">
              Nome
            </label>
            <input
              id="nome"
              name="nome"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              autoComplete="name"
              required
              minLength={2}
              maxLength={60}
              className={CAMPO}
            />
          </div>
          <div>
            <label htmlFor="email-novo" className="text-sm font-semibold text-texto-suave">
              E-mail
            </label>
            <input
              id="email-novo"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              autoCapitalize="none"
              inputMode="email"
              required
              className={CAMPO}
            />
          </div>
          <div>
            <label htmlFor="senha-nova" className="text-sm font-semibold text-texto-suave">
              Senha (mínimo de 8 caracteres)
            </label>
            <input
              id="senha-nova"
              name="senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={100}
              className={CAMPO}
            />
          </div>
          <label className="flex items-start gap-3 text-sm text-texto-suave">
            <input
              type="checkbox"
              checked={novidades}
              onChange={(e) => setNovidades(e.target.checked)}
              className="mt-1 h-4 w-4 accent-kambada-amarelo"
            />
            <span>
              Quero receber novidades do Kambada Play, promoções e os <strong>cupons do ranking</strong> por e-mail.
              Dá para cancelar em qualquer e-mail.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm text-texto-suave">
            <input
              type="checkbox"
              checked={aceite}
              onChange={(e) => setAceite(e.target.checked)}
              required
              className="mt-1 h-4 w-4 accent-kambada-amarelo"
            />
            <span>
              Li e aceito os{" "}
              <Link
                href="/termos"
                className="font-semibold text-[var(--destaque-texto)] underline-offset-2 hover:underline"
                target="_blank"
              >
                Termos
              </Link>{" "}
              e a{" "}
              <Link
                href="/privacidade"
                className="font-semibold text-[var(--destaque-texto)] underline-offset-2 hover:underline"
                target="_blank"
              >
                Política de Privacidade
              </Link>
              . Conta de criança ou adolescente: cadastre em nome do responsável ou do professor.
            </span>
          </label>
          <p className="text-xs text-texto-tenue">
            Guardamos só nome e e-mail. Nada de CPF, telefone ou foto. Sua senha fica criptografada.
          </p>
          {erro ? <Erro texto={erro} /> : null}
          <button type="submit" disabled={enviando} className={BOTAO}>
            {enviando ? "Criando…" : "Criar conta e jogar"}
          </button>
        </form>
      ) : null}

      {aba === "esqueci" ? (
        <form onSubmit={esqueci} className="mt-5 space-y-4">
          <p className="text-sm text-texto-suave">
            Digite o e-mail da conta. Mandamos um link para criar uma nova senha (vale 1 hora).
          </p>
          <div>
            <label htmlFor="email-esqueci" className="text-sm font-semibold text-texto-suave">
              E-mail
            </label>
            <input
              id="email-esqueci"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              className={CAMPO}
            />
          </div>
          {erro ? <Erro texto={erro} /> : null}
          {linkTeste ? (
            <p className="break-all text-xs text-texto-tenue">
              Ambiente de testes (sem e-mail configurado):{" "}
              <a className="underline" href={linkTeste}>
                abrir link de redefinição
              </a>
            </p>
          ) : null}
          <button type="submit" disabled={enviando} className={BOTAO}>
            {enviando ? "Enviando…" : "Mandar o link"}
          </button>
          <button
            type="button"
            onClick={() => trocar("entrar")}
            className="block w-full text-center text-sm font-semibold text-[var(--destaque-texto)] hover:underline"
          >
            Voltar para entrar
          </button>
        </form>
      ) : null}
    </div>
  );
}

function Erro({ texto }: { texto: string }) {
  return (
    <p role="alert" className="rounded-md bg-kambada-grafite/10 px-3 py-2 text-sm font-semibold text-texto">
      {texto}
    </p>
  );
}

function avisoInicial(aviso?: string): string {
  switch (aviso) {
    case "descadastrado":
      return "Pronto: você não receberá mais novidades por e-mail. Sua conta continua ativa.";
    case "link-invalido":
      return "Esse link não vale mais. Entre na sua conta para ajustar o recebimento de novidades.";
    case "saiu":
      return "Você saiu do Kambada Play.";
    default:
      return "";
  }
}
