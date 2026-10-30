import type { Metadata, Viewport } from "next";
import { connection } from "next/server";
import { ApoioFapema } from "@/components/play/ApoioFapema";
import { InstalarApp } from "@/components/play/app/InstalarApp";
import { RegistrarApp } from "@/components/play/app/RegistrarApp";
import { SairDoPlay } from "@/components/play/jogos/SairDoPlay";
import "./play.css";

export const metadata: Metadata = {
  title: { default: "Kambada Play", template: "%s | Kambada Play" },
  robots: { index: false, follow: false },
  description:
    "O Kambada Play é a plataforma de cultura maranhense da Kambada: jogos, histórias e a festa do Bumba Meu Boi para viver em casa.",
  // App instalável só do Play (30/10/2026): este manifesto substitui o da loja nas páginas do Play.
  manifest: "/kambadaplay/manifest.json",
  appleWebApp: { capable: true, title: "Kambada Play", statusBarStyle: "black" },
  icons: { apple: "/kambadaplay/icones/apple-touch-icon.png" },
};

export const viewport: Viewport = { themeColor: "#201E1F" };

/**
 * Raiz das páginas do Kambada Play (jogo do arraial, conto do boi e vitrine da
 * matraca). Cabeçalho, rodapé e carrinho vêm do layout da loja; o `.play-root`
 * só leva o fundo e o tom das páginas do Play.
 */
export default async function PlayLayout({ children }: { children: React.ReactNode }) {
  // Páginas do Play são sempre geradas na hora e nunca ficam no cache do CDN: o acesso é por
  // login, e uma página guardada seria entregue a quem não entrou.
  await connection();
  return (
    <div className="play-root">
      <RegistrarApp />
      {children}
      <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 bg-kambada-preto px-4 py-3 text-center">
        <InstalarApp compacto />
        <SairDoPlay />
      </div>
      <ApoioFapema />
    </div>
  );
}
