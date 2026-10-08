import type { Metadata } from "next";
import Link from "next/link";
import { linkWhatsApp } from "@/lib/site";

export const metadata: Metadata = {
  title: "Pagamento não concluído",
  robots: { index: false, follow: false },
};

export default function PaginaFalha() {
  return (
    <section>
      <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <p className="text-6xl" aria-hidden="true">
          🦀
        </p>
        <h1 className="mt-6 font-display text-4xl font-extrabold">O pagamento não foi concluído</h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-texto-suave">
          Nada foi cobrado, e o seu carrinho continua salvo. Você pode tentar de novo com outra
          forma de pagamento — ou fechar o pedido com a gente pelo WhatsApp.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link
            href="/checkout"
            className="rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold text-kambada-grafite hover:bg-kambada-amarelo-escuro"
          >
            Tentar de novo
          </Link>
          <a
            href={linkWhatsApp("Oi! Tentei pagar um pedido no site e não consegui. Pode me ajudar?")}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-borda px-7 py-3.5 font-display font-semibold hover:border-kambada-amarelo-escuro"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
