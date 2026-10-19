import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { FormularioEntrada } from "@/components/play/jogos/FormularioEntrada";
import { destinoSeguro } from "@/lib/play/acesso";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Entre ou crie sua conta no Kambada Play.",
  robots: { index: false, follow: false },
};

export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; aviso?: string; modo?: string }>;
}) {
  const { de, aviso, modo } = await searchParams;
  return (
    <div className="play-tema-site">
      <div className="mx-auto max-w-md px-4 py-14 text-center sm:py-20">
        <Image
          src="/marca/kambada-logo-horizontal-amarelo.png"
          alt="Kambada"
          width={360}
          height={120}
          priority
          className="mx-auto h-auto w-44"
        />
        <p className="mt-8 text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Kambada Play</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold leading-tight text-texto sm:text-4xl">
          Entre para <span className="destaque">jogar</span>
        </h1>
        <p className="mt-3 text-texto-suave">
          Jogos, histórias e a festa do Maranhão. Crie sua conta com e-mail para guardar seus pontos, concorrer aos
          cupons da semana e receber as novidades.
        </p>
        <FormularioEntrada de={destinoSeguro(de)} aviso={aviso} modo={modo} />
        <Link
          href="/kambadaplay/experimente"
          className="mt-6 inline-block rounded-full border-2 border-borda px-6 py-3 text-sm font-bold text-texto transition-colors hover:border-kambada-amarelo"
        >
          Só quero experimentar: jogar o quiz sem cadastro
        </Link>
        <p className="mt-8 text-sm text-texto-tenue">
          {"Tudo liberado de graça até 31/12/2026. "}
          <Link href="/kambadaplay/planos" className="font-semibold text-[var(--destaque-texto)] hover:underline">
            Conheça os planos
          </Link>{" "}
          que vêm por aí, inclusive para escolas.
        </p>
      </div>
    </div>
  );
}
