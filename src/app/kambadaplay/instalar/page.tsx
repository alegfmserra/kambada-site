import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { InstalarApp, IconeCompartilhar, PassosIPhone } from "@/components/play/app/InstalarApp";

export const metadata: Metadata = {
  title: "Como instalar o app",
  description:
    "Instale o Kambada Play no celular, sem App Store e sem Google Play: no Android pelo Chrome, no iPhone pelo Safari (Compartilhar → Adicionar à Tela de Início).",
  alternates: { canonical: "/kambadaplay/instalar" },
  robots: { index: true, follow: true },
};

/**
 * Página "Como instalar" do app do Kambada Play (30/10/2026). Endereço fixo
 * (/kambadaplay/instalar): é o que as escolas mandam às famílias por WhatsApp
 * e o QR code da apresentação comercial aponta para cá. Fica fora do login.
 * Não mudar o endereço sem trocar o QR code.
 */
export default function InstalarPage() {
  return (
    <div className="play-tema-site">
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex items-center gap-4">
          <Image
            src="/kambadaplay/icones/icone-192.png"
            alt="Ícone do app Kambada Play"
            width={72}
            height={72}
            unoptimized
            className="rounded-2xl shadow-[4px_4px_0_0_#201E1F]"
          />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--destaque-texto)]">Kambada Play</p>
            <h1 className="mt-1 font-display text-3xl font-extrabold leading-tight text-texto sm:text-4xl">
              Instale o app no celular
            </h1>
          </div>
        </div>

        <p className="mt-5 text-lg leading-relaxed text-texto-suave">
          Jogos, HQs e animações sobre a cultura do Maranhão, com ícone na tela do celular, como qualquer aplicativo.{" "}
          <strong className="text-texto">Não precisa de App Store nem de Google Play</strong>: leva menos de um minuto.
        </p>

        <div className="mt-6">
          <InstalarApp />
        </div>

        <section aria-labelledby="android" className="mt-10 rounded-2xl border-2 border-borda p-5 sm:p-6">
          <h2 id="android" className="font-display text-2xl font-extrabold text-texto">
            Android
          </h2>
          <ol className="mt-4 list-decimal space-y-2 pl-6 leading-relaxed text-texto">
            <li>
              Abra <strong>somoskambada.com.br/kambadaplay/instalar</strong> no <strong>Chrome</strong>.
            </li>
            <li>
              Toque no botão amarelo <strong>Instalar o app</strong> e depois em <strong>Instalar</strong>.
            </li>
            <li>
              Não apareceu o botão? Toque nos <strong>três pontinhos ⋮</strong> no alto, à direita, e escolha{" "}
              <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.
            </li>
            <li>O ícone amarelo do Kambada Play aparece junto dos outros aplicativos.</li>
          </ol>
        </section>

        <section aria-labelledby="iphone" className="mt-6 rounded-2xl border-2 border-borda p-5 sm:p-6">
          <h2 id="iphone" className="font-display text-2xl font-extrabold text-texto">
            iPhone e iPad
          </h2>
          <p className="mt-2 text-sm text-texto-suave">
            No iPhone a instalação é pelo Safari, no botão Compartilhar <IconeCompartilhar />.
          </p>
          <PassosIPhone outroNavegador />
        </section>

        <section aria-labelledby="depois" className="mt-6 rounded-2xl border-2 border-borda p-5 sm:p-6">
          <h2 id="depois" className="font-display text-2xl font-extrabold text-texto">
            Depois de instalar
          </h2>
          <ul className="mt-4 list-disc space-y-2 pl-6 leading-relaxed text-texto">
            <li>Abra pelo ícone e entre com o seu login (ou com o que a escola passou).</li>
            <li>
              Abriu uma HQ com internet, ela fica guardada: dá para ler de novo <strong>sem internet</strong>. Na página da
              HQ, o botão <strong>Guardar as HQs</strong> baixa todas de uma vez.
            </li>
            <li>Os jogos e o ranking precisam de internet.</li>
            <li>O app não pede telefone, localização, câmera nem microfone. Para criança, só o apelido.</li>
          </ul>
        </section>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link
            href="/kambadaplay"
            className="rounded-full bg-kambada-amarelo px-8 py-3.5 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
          >
            Abrir o Kambada Play
          </Link>
          <Link
            href="/kambadaplay/planos"
            className="rounded-full border-2 border-borda px-8 py-3 font-bold text-texto transition-colors hover:border-kambada-amarelo"
          >
            Ver os planos
          </Link>
        </div>
      </div>
    </div>
  );
}
