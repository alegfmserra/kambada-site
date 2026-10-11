import Script from "next/script";
import { ANALYTICS, EH_PRODUCAO } from "@/lib/site";

/**
 * Google Analytics 4 + Google Ads (os mesmos IDs do site atual).
 *
 * Só carrega em produção (domínio oficial): no endereço temporário, as visitas
 * de teste entrariam na mesma propriedade do site antigo e sujariam os dados.
 * Para ligar fora de produção (ex.: validar o evento), defina
 * NEXT_PUBLIC_ANALYTICS=1 no painel.
 */
export default function Analytics() {
  if (!EH_PRODUCAO && process.env.NEXT_PUBLIC_ANALYTICS !== "1") return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${ANALYTICS.ga4}`} strategy="afterInteractive" />
      <Script id="gtag" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ANALYTICS.ga4}', { anonymize_ip: true });
gtag('config', '${ANALYTICS.googleAds}');`}
      </Script>
    </>
  );
}
