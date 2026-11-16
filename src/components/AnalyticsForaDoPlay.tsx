"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

/**
 * O Kambada Play é público infantil: nada de Google Analytics nem Google Ads ali
 * (decisão do Alexandre, 27/10/2026). O Google respeita a chave "ga-disable-<id>":
 * ligada nas páginas do Play (inclusive na navegação sem recarregar) e desligada
 * fora delas. A contagem de contas e partidas do Play é do próprio servidor.
 *
 * A área de controle (/admin) também fica fora (05/11/2026): as visitas do próprio
 * Alexandre ao painel eram 5 % das visualizações e sujavam tráfego direto e tempo.
 *
 * Desde 15/11/2026 o gtag.js nem é baixado no Play: quem chega direto numa página
 * do Play não recebe script nenhum do Google. Os scripts só entram na primeira
 * página de fora do Play; daí em diante ficam na aba (não há como descarregar um
 * script), e quem cala o Google dentro do Play é a chave "ga-disable".
 */
export default function AnalyticsForaDoPlay({ ga4, googleAds }: { ga4: string; googleAds: string }) {
  const caminho = usePathname() ?? "/";
  const noPlay = caminho.startsWith("/kambadaplay");
  const semMedicao = noPlay || caminho.startsWith("/admin");

  // Vira verdadeiro na primeira página fora do Play e não volta: se voltasse, o
  // React tiraria as tags e o next/script as carregaria de novo na saída do Play.
  const [carregar, setCarregar] = useState(!noPlay);
  if (!noPlay && !carregar) setCarregar(true);

  useEffect(() => {
    const janela = window as unknown as Record<string, unknown>;
    janela["ga-disable-" + ga4] = semMedicao;
    janela["ga-disable-" + googleAds] = semMedicao;
  }, [semMedicao, ga4, googleAds]);

  if (!carregar) return null;
  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${ga4}`} strategy="afterInteractive" />
      <Script id="gtag" strategy="afterInteractive">
        {`window.dataLayer = window.dataLayer || [];
if (location.pathname.indexOf('/kambadaplay') === 0 || location.pathname.indexOf('/admin') === 0) { window['ga-disable-${ga4}'] = true; window['ga-disable-${googleAds}'] = true; }
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${ga4}', { anonymize_ip: true });
gtag('config', '${googleAds}');`}
      </Script>
    </>
  );
}
