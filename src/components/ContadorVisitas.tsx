"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Script from "next/script";
import { EH_PRODUCAO } from "@/lib/site";

/**
 * GoatCounter (contagem de visitas sem cookies, conta somoskambada@gmail.com).
 *
 * Regras: só em produção (como o GA4; fora dela, NEXT_PUBLIC_ANALYTICS=1 liga);
 * nunca no Kambada Play (público infantil) nem nas áreas privadas (pedido,
 * checkout, conta, admin), onde o endereço pode carregar identificadores.
 * A CSP também só libera o GoatCounter fora do Play (next.config.ts).
 * Contamos à mão (no_onload) só o caminho, sem query string, e a cada troca de
 * página — o Next navega sem recarregar, e o script sozinho contaria só a 1ª.
 */
const ENDERECO = "https://somoskambada.goatcounter.com/count";

type GoatCounter = { count?: (v: { path: string }) => void };

/** Páginas que NÃO entram na contagem. "/contato" não pode cair no "/conta". */
export function ficaForaDaContagem(caminho: string): boolean {
  return /^\/(kambadaplay|admin|checkout|pedido|carrinho|entrar|api)(\/|$)|^\/conta(\/|$)/.test(caminho);
}

function contar(caminho: string) {
  const gc = (window as unknown as { goatcounter?: GoatCounter }).goatcounter;
  gc?.count?.({ path: caminho });
}

export default function ContadorVisitas() {
  const caminho = usePathname() ?? "/";
  const ligado = EH_PRODUCAO || process.env.NEXT_PUBLIC_ANALYTICS === "1";
  const fora = ficaForaDaContagem(caminho);

  useEffect(() => {
    if (!ligado || fora) return;
    // Na 1ª página o script ainda não carregou: quem conta é o onLoad abaixo.
    contar(caminho);
  }, [ligado, fora, caminho]);

  if (!ligado || fora) return null;
  return (
    <Script
      src="https://gc.zgo.at/count.js"
      strategy="afterInteractive"
      data-goatcounter={ENDERECO}
      data-goatcounter-settings='{"no_onload":true}'
      onLoad={() => contar(caminho)}
    />
  );
}
