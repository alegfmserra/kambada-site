import type { Metadata } from "next";
import "./play.css";

export const metadata: Metadata = {
  title: { default: "Kambada Play", template: "%s | Kambada Play" },
  description:
    "O Kambada Play é a plataforma de cultura maranhense da Kambada: jogos, histórias e a festa do Bumba Meu Boi para viver em casa.",
};

/**
 * Raiz das páginas do Kambada Play (jogo do arraial, conto do boi e vitrine da
 * matraca). Cabeçalho, rodapé e carrinho vêm do layout da loja; o `.play-root`
 * só leva o fundo e o tom das páginas do Play.
 */
export default function PlayLayout({ children }: { children: React.ReactNode }) {
  return <div className="play-root">{children}</div>;
}
