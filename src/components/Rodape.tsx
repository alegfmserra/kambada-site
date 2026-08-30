import Image from "next/image";
import Link from "next/link";
import { NAV, REDES, SITE, WHATSAPP, linkWhatsApp } from "@/lib/site";

export default function Rodape() {
  return (
    <footer className="border-t border-white/10 bg-kambada-preto">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3">
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

        <div>
          <h2 className="font-display text-sm font-semibold tracking-wide text-kambada-amarelo uppercase">
            Se achega
          </h2>
          <ul className="mt-4 space-y-2.5">
            <li>
              <a
                href={linkWhatsApp()}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-kambada-branco/70 transition-colors hover:text-kambada-amarelo"
              >
                WhatsApp {WHATSAPP.exibicao}
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
        <p className="mx-auto max-w-6xl px-4 py-6 text-xs text-kambada-branco/50 sm:px-6">
          © {new Date().getFullYear()} {SITE.nomeCompleto}. Todos os direitos
          reservados.
        </p>
      </div>
    </footer>
  );
}
