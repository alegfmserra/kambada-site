import type { Metadata } from "next";
import { DM_Sans, Poppins } from "next/font/google";
import BotaoWhatsApp from "@/components/BotaoWhatsApp";
import Cabecalho from "@/components/Cabecalho";
import Rodape from "@/components/Rodape";
import { EH_PRODUCAO, SITE } from "@/lib/site";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: "Moda Maranhense: Tradição e Identidade Cultural | Somos Kambada",
    template: "%s | Somos Kambada",
  },
  description: SITE.descricao,
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE.nomeCompleto,
    url: SITE.url,
  },
  alternates: { canonical: "/" },
  robots: EH_PRODUCAO
    ? { index: true, follow: true }
    : { index: false, follow: false },
};

/**
 * Aplica o tema salvo antes de a página pintar, para não haver o flash de
 * fundo escuro em quem escolheu claro (e vice-versa). Precisa ser síncrono e
 * inline; por isso não passa pelo React.
 */
const SCRIPT_TEMA = `
(function () {
  try {
    var t = localStorage.getItem('kambada-tema');
    if (t === 'claro' || t === 'escuro') {
      document.documentElement.dataset.tema = t;
    }
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${poppins.variable} ${dmSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="flex min-h-full flex-col bg-fundo text-texto">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-4 focus:rounded-md focus:bg-kambada-amarelo focus:px-4 focus:py-2 focus:font-semibold focus:text-kambada-grafite"
        >
          Pular para o conteúdo
        </a>
        <Cabecalho />
        <main id="conteudo" className="flex-1">
          {children}
        </main>
        <Rodape />
        <BotaoWhatsApp />
      </body>
    </html>
  );
}
