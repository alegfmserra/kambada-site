import type { Metadata } from "next";
import Link from "next/link";
import { FormularioEntrada } from "@/components/play/jogos/FormularioEntrada";
import { destinoSeguro } from "@/lib/play/acesso";

export const metadata: Metadata = {
  title: "Entrar na minha conta",
  description: "Entre ou crie sua conta na Kambada para acompanhar seus pedidos.",
  robots: { index: false, follow: false },
};

/**
 * Entrada da conta pela loja (ícone de perfil no cabeçalho). A conta é a
 * mesma do Kambada Play: um cadastro só para pedidos, jogos e planos.
 */
export default async function EntrarPage({
  searchParams,
}: {
  searchParams: Promise<{ de?: string; aviso?: string; modo?: string }>;
}) {
  const { de, aviso, modo } = await searchParams;
  const destino = de ? destinoSeguro(de) : "/conta";
  return (
    <section>
      <div className="mx-auto max-w-md px-4 py-14 text-center sm:py-20">
        <h1 className="font-display text-3xl font-extrabold leading-tight text-texto sm:text-4xl">
          Minha <span className="destaque">conta</span>
        </h1>
        <p className="mt-3 text-texto-suave">
          Entre para ver seus pedidos, seu plano e as novidades. A mesma conta vale na loja e no Kambada Play.
        </p>
        <FormularioEntrada de={destino} aviso={aviso} modo={modo} />
        <p className="mt-8 text-sm text-texto-tenue">
          Comprou sem conta? Crie a conta com o mesmo e-mail do pedido e confirme o e-mail: seus pedidos aparecem
          lá. Ou{" "}
          <Link href="/pedido" className="font-semibold text-[var(--destaque-texto)] hover:underline">
            acompanhe pelo número do pedido
          </Link>
          .
        </p>
      </div>
    </section>
  );
}
