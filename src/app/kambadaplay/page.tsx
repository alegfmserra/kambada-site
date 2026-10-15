import { Hero } from "@/components/play/sections/Hero";
import { Manifesto } from "@/components/play/sections/Manifesto";
import { Origem } from "@/components/play/sections/Origem";
import { TiposDeMatraca } from "@/components/play/sections/TiposDeMatraca";
import { Vitrine } from "@/components/play/sections/Vitrine";
import { Artesanato } from "@/components/play/sections/Artesanato";
import { PrecoEntrega } from "@/components/play/sections/PrecoEntrega";
import { ConviteArraial } from "@/components/play/sections/ConviteArraial";
import { Footer } from "@/components/play/sections/Footer";
import { SplashKambada } from "@/components/play/SplashKambada";
import "@/components/play/sections/matraca.css";

export default function Home() {
  return (
    <main>
      {/* A classe `js` libera o estado inicial escondido dos reveals
          (matraca.css); sem JS a página nasce visível. Roda antes do paint. */}
      <script
        dangerouslySetInnerHTML={{
          __html: 'document.documentElement.classList.add("js");',
        }}
      />
      <noscript>
        <style>{`[data-reveal]{opacity:1}`}</style>
      </noscript>

      {/* Splash de marca na primeira visita da sessão: espera fontes + load real do hero */}
      <SplashKambada tema="noite" rota="matraca" aguardarImg="#hero img">
        <Hero />
        <Manifesto />
        <Origem />
        <TiposDeMatraca />
        <Vitrine />
        <Artesanato />
        <PrecoEntrega />
        <ConviteArraial />
        <Footer />
      </SplashKambada>
    </main>
  );
}
