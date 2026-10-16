import type { Metadata } from "next";
import { connection } from "next/server";
import { SairDoPlay } from "@/components/play/jogos/SairDoPlay";
import "./play.css";

export const metadata: Metadata = {
  title: { default: "Kambada Play", template: "%s | Kambada Play" },
  robots: { index: false, follow: false },
  description:
    "O Kambada Play é a plataforma de cultura maranhense da Kambada: jogos, histórias e a festa do Bumba Meu Boi para viver em casa.",
};

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
      {children}
      <div className="bg-kambada-preto px-4 py-3 text-center">
        <SairDoPlay />
      </div>
    </div>
  );
}
