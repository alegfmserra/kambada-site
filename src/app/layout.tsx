import type { Metadata } from "next";
import { DM_Sans, Poppins } from "next/font/google";
import Cabecalho from "@/components/Cabecalho";
import Rodape from "@/components/Rodape";
import { SITE } from "@/lib/site";
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
  // A imagem de compartilhamento vem de src/app/opengraph-image.png,
  // gerada por scripts/gerar-icones.mjs — o Next a associa sozinho.
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: SITE.nomeCompleto,
    url: SITE.url,
  },
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${poppins.variable} ${dmSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-kambada-grafite text-kambada-branco">
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
      </body>
    </html>
  );
}
