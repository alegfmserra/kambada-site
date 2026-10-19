import type { Metadata } from "next";
import Link from "next/link";
import { confirmarEmail } from "@/lib/play/contas";

export const metadata: Metadata = { title: "Confirmar e-mail", robots: { index: false, follow: false } };

/** Destino do link do e-mail de confirmação. Confirma no servidor e mostra o resultado. */
export default async function ConfirmarPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  const conta = token ? await confirmarEmail(token) : null;
  return (
    <div className="play-tema-site">
      <div className="mx-auto max-w-md px-4 py-16 text-center sm:py-24">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Kambada Play</p>
        {conta ? (
          <>
            <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-texto sm:text-4xl">
              Éguas, {conta.nome}! <span className="destaque">E-mail confirmado.</span>
            </h1>
            <p className="mt-3 text-texto-suave">
              Sua conta está completa. Agora seus pontos valem cupom e, se você quis, as novidades chegam no seu e-mail.
            </p>
            <Link
              href="/kambadaplay/entrar?de=%2Fkambadaplay%2Fjogos"
              className="mt-8 inline-block rounded-full bg-kambada-amarelo px-8 py-3.5 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
            >
              Bora jogar
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-texto sm:text-4xl">
              Esse link não vale mais
            </h1>
            <p className="mt-3 text-texto-suave">
              Ele vence em 48 horas ou já foi usado. Entre na sua conta e peça um novo e-mail de confirmação.
            </p>
            <Link
              href="/kambadaplay/entrar?de=%2Fkambadaplay%2Fconta"
              className="mt-8 inline-block rounded-full bg-kambada-amarelo px-8 py-3.5 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
            >
              Entrar na minha conta
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
