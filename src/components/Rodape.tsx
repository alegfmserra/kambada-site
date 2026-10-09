import Image from "next/image";
import Link from "next/link";
import { NAV, POS_VENDA, REDES, SITE, linkWhatsApp } from "@/lib/site";

export default function Rodape() {
  return (
    <footer className="border-t border-borda bg-superficie-forte text-kambada-branco">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 pb-28 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div>
          <Image
            src="/marca/kambada-logo-horizontal-amarelo.png"
            alt="Kambada"
            width={180}
            height={54}
            className="h-10 w-auto"
          />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-kambada-branco/70">
            Moda e arte que celebram o Maranhão.
          </p>
        </div>

        <nav aria-label="Rodapé">
          <h2 className="font-display text-sm font-semibold tracking-wide text-kambada-amarelo uppercase">
            Navegar
          </h2>
          <ul className="mt-4 space-y-2.5">
            {NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-kambada-branco/70 transition-colors hover:text-kambada-amarelo"
                >
                  {item.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label="Seu pedido">
          <h2 className="font-display text-sm font-semibold tracking-wide text-kambada-amarelo uppercase">
            Seu pedido
          </h2>
          <ul className="mt-4 space-y-2.5">
            {POS_VENDA.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-kambada-branco/70 transition-colors hover:text-kambada-amarelo"
                >
                  {item.rotulo}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <h2 className="font-display text-sm font-semibold tracking-wide text-kambada-amarelo uppercase">
            Se achega
          </h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              {/* Sem número escrito: o link já leva para a conversa. */}
              <a
                href={linkWhatsApp()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-kambada-branco/70 transition-colors hover:text-kambada-amarelo"
              >
                Falar no WhatsApp
              </a>
            </li>
            {REDES.map((rede) => (
              <li key={rede.nome}>
                <a
                  href={rede.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-kambada-branco/70 transition-colors hover:text-kambada-amarelo"
                >
                  {rede.nome}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs leading-relaxed text-kambada-branco/60 sm:px-6">
          © {new Date().getFullYear()} {SITE.nomeCompleto}. Todos os direitos
          reservados. Kambada® é marca registrada no INPI. Todas as artes, estampas, ilustrações e personagens são
          criações próprias da Kambada, protegidas pela Lei nº 9.610/1998 —
          proibida a reprodução sem autorização.{" "}
          <Link href="/direitos-autorais" className="underline underline-offset-2 hover:text-kambada-amarelo">
            Direitos autorais
          </Link>
        </p>
      </div>
    </footer>
  );
}
