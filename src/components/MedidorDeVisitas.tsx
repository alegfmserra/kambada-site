"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { origemDaVisita } from "@/lib/atribuicao/atribuicao";
import { rastrear } from "@/lib/visitas/rastrear";
import { canalDaOrigem, ficaForaDaMedicao } from "@/lib/visitas/canal";
import { evento } from "@/lib/analytics/eventos";
import { cliqueDoElemento, semMedicaoDeCliques, tipoDaPagina } from "@/lib/analytics/cliques";
import { EH_PRODUCAO } from "@/lib/site";

/**
 * Medição própria do site (01/11/2026): página vista, tempo de tela e canal de
 * origem (Instagram, Facebook, Google, Bing, direto...). Anônima: sem cookie, sem
 * identificador, sem terceiros. Só em produção (como GA4/GoatCounter; fora dela,
 * NEXT_PUBLIC_ANALYTICS=1 liga) e nunca no Play nem nas áreas privadas.
 * O canal vai só na 1ª página de cada sessão (sessionStorage), e é isso que
 * conta como "sessão" no painel.
 */
const CHAVE_SESSAO = "kambada-sessao-medida";

export default function MedidorDeVisitas() {
  const caminho = usePathname() ?? "/";
  const ligado = EH_PRODUCAO || process.env.NEXT_PUBLIC_ANALYTICS === "1";

  useEffect(() => {
    if (!ligado || ficaForaDaMedicao(caminho)) return;

    let canal: string | undefined;
    let campanha: string | undefined;
    try {
      if (!sessionStorage.getItem(CHAVE_SESSAO)) {
        sessionStorage.setItem(CHAVE_SESSAO, "1");
        const o = origemDaVisita(window.location.search, document.referrer, window.location.hostname, caminho);
        canal = o ? canalDaOrigem(o.fonte, o.meio) : "Direto";
        campanha = o?.campanha;
      }
    } catch {
      /* sem armazenamento: não marca sessão, só página */
    }
    rastrear({ tipo: "pagina", caminho, ...(canal ? { canal } : {}), ...(campanha ? { campanha } : {}) });

    let acumulado = 0;
    let desde = document.visibilityState === "visible" ? Date.now() : 0;
    const descarregar = () => {
      if (desde) acumulado += Date.now() - desde;
      desde = 0;
      const seg = Math.round(acumulado / 1000);
      acumulado = 0;
      if (seg >= 1) rastrear({ tipo: "tempo", caminho, seg });
    };
    const aoMudarVisibilidade = () => {
      if (document.visibilityState === "visible") {
        if (!desde) desde = Date.now();
      } else {
        descarregar();
      }
    };
    document.addEventListener("visibilitychange", aoMudarVisibilidade);
    window.addEventListener("pagehide", descarregar);
    return () => {
      document.removeEventListener("visibilitychange", aoMudarVisibilidade);
      window.removeEventListener("pagehide", descarregar);
      descarregar();
    };
  }, [ligado, caminho]);

  // Cliques em links e botões (contador de cliques). Só o texto curto do elemento e
  // para onde ele leva (caminho interno sem query, ou só o domínio de fora).
  useEffect(() => {
    if (!ligado || ficaForaDaMedicao(caminho)) return;
    const aoClicar = (ev: MouseEvent) => {
      const alvo = (ev.target as Element | null)?.closest?.("a,button,[role=button]");
      if (!alvo) return;
      const rotulo = (alvo.getAttribute("data-clique") || alvo.getAttribute("aria-label") || (alvo as HTMLElement).innerText || "")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 50);
      if (!rotulo) return;
      let destino: string | undefined;
      const href = alvo instanceof HTMLAnchorElement ? alvo.href : "";
      if (href) {
        try {
          const u = new URL(href);
          destino = u.origin === window.location.origin ? u.pathname.slice(0, 80) : u.hostname.replace(/^www\./, "");
        } catch {
          /* link estranho: conta só o texto */
        }
      }
      rastrear({ tipo: "clique", rotulo, ...(destino ? { destino } : {}) });
    };
    document.addEventListener("click", aoClicar, true);
    return () => document.removeEventListener("click", aoClicar, true);
  }, [ligado, caminho]);

  // Mapa de cliques no Google Analytics (17/11/2026): um ouvinte só para o site inteiro.
  // As regras (o que vira `select_item`, o que vira `clique`, o que nunca é enviado)
  // estão em lib/analytics/cliques.ts. `evento()` só fala com o GA4 se ele estiver
  // carregado, e fica mudo no Play; por isso este efeito não depende de `ligado`.
  useEffect(() => {
    if (semMedicaoDeCliques(caminho)) return;
    const aoClicar = (ev: MouseEvent) => {
      const el = (ev.target as Element | null)?.closest?.("a,button,[role=button],summary") as HTMLElement | null;
      if (!el || el.closest("[data-sem-medicao]")) return;
      const aqui = window.location.pathname;
      if (el.dataset.evento === "select_item") {
        evento("select_item", {
          item_list_name: el.closest("[data-lista]")?.getAttribute("data-lista") ?? tipoDaPagina(aqui),
          items: [{ item_id: el.dataset.itemId, item_name: el.dataset.itemNome, item_category: el.dataset.itemCategoria }],
        });
        return;
      }
      const clique = cliqueDoElemento(
        {
          evento: el.dataset.evento,
          alvo: el.dataset.alvo,
          area: el.closest("[data-area]")?.getAttribute("data-area"),
          marco: el.closest("body > header") ? "cabecalho" : el.closest("body > footer") ? "rodape" : null,
          texto: el.getAttribute("aria-label") || el.innerText,
        },
        aqui,
      );
      if (clique) evento("clique", clique);
    };
    document.addEventListener("click", aoClicar, true);
    return () => document.removeEventListener("click", aoClicar, true);
  }, [caminho]);

  return null;
}
