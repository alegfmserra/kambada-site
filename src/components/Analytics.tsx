import { ANALYTICS, EH_PRODUCAO } from "@/lib/site";
import AnalyticsForaDoPlay from "./AnalyticsForaDoPlay";

/**
 * Google Analytics 4 + Google Ads (os mesmos IDs do site atual).
 *
 * Só carrega em produção (domínio oficial): no endereço temporário, as visitas
 * de teste entrariam na mesma propriedade do site antigo e sujariam os dados.
 * Para ligar fora de produção (ex.: validar o evento), defina
 * NEXT_PUBLIC_ANALYTICS=1 no painel.
 *
 * Os scripts em si são desenhados pelo componente cliente AnalyticsForaDoPlay,
 * que sabe em que página a pessoa está: no Kambada Play (público infantil) o
 * gtag.js nem é baixado.
 */
export default function Analytics() {
  if (!EH_PRODUCAO && process.env.NEXT_PUBLIC_ANALYTICS !== "1") return null;
  return <AnalyticsForaDoPlay ga4={ANALYTICS.ga4} googleAds={ANALYTICS.googleAds} />;
}
