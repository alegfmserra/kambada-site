import type { Metadata } from "next";
import { ContoScroll } from "@/components/play/conto/ContoScroll";
import { SplashKambada } from "@/components/play/SplashKambada";
import "@/components/play/conto/conto.css";

export const metadata: Metadata = {
  title: "O Auto do Boi",
  description:
    "Um folheto de cordel digital: a lenda do Bumba Meu Boi maranhense em xilogravura animada, da noite de São João à festa que renasce todo junho.",
};

export default function ContoPage() {
  return (
    <main>
      {/* Splash tema papel: fontes prontas bastam pro folheto abrir */}
      <SplashKambada tema="papel" rota="conto">
        <ContoScroll />
      </SplashKambada>
    </main>
  );
}
