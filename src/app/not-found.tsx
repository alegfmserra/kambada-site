import type { Metadata } from "next";
import Link from "next/link";
import { linkWhatsApp } from "@/lib/site";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: true },
};

/**
 * 404 da Kambada. Antes era a tela padrão do Next, em inglês e sem saída
 * (auditoria de 10/10/2026). Agora tem a cara da marca e três caminhos.
 */
export default function NaoEncontrada() {
  return (
    <section>
      <div className="mx-auto max-w-3xl px-4 py-20 text-center sm:px-6 sm:py-28">
        <p className="text-6xl" aria-hidden="true">
          🦀
        </p>
        <h1 className="mt-6 font-display text-4xl font-extrabold text-balance sm:text-5xl">
          Essa página se perdeu no arraial
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg leading-relaxed text-texto-suave">
          O endereço que você abriu não existe mais ou foi digitado errado. A loja continua aqui
          pertinho.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <Link
            href="/loja"
            className="rounded-full bg-kambada-amarelo px-7 py-3.5 font-display font-semibold whitespace-nowrap text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
          >
            Ver a loja
          </Link>
          <Link
            href="/"
            className="rounded-full border border-borda px-7 py-3.5 font-display font-semibold whitespace-nowrap text-texto transition-colors hover:border-kambada-amarelo-escuro"
          >
            Página inicial
          </Link>
          <a
            href={linkWhatsApp("Oi! Cheguei numa página que não existe no site da Kambada.")}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-borda px-7 py-3.5 font-display font-semibold whitespace-nowrap text-texto transition-colors hover:border-kambada-amarelo-escuro"
          >
            Falar no WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
