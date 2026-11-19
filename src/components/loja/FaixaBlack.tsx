"use client";

import { useEffect, useState } from "react";
import { evento } from "@/lib/analytics/eventos";
import { BLACK, ativaEm, cupomDaBlackDisponivel, diaMes, guardarCupom, hojeSaoLuis } from "@/lib/campanhas/black";

const CHAVE_DISPENSADA = "kambada-black-faixa-dispensada";
const CHAVE_VISTA = "kambada-black-faixa-vista";

/**
 * Faixa fina da Black Kambada no topo da loja (vitrine, categorias, busca e
 * página de peça), só de 22 a 30/11. Quem fecha não vê de novo nesta visita.
 *
 * A data é conferida no navegador, depois de montar: as páginas da loja ficam
 * em cache por 10 minutos, e uma faixa decidida no servidor apareceria (ou
 * sumiria) com atraso na virada do dia.
 *
 * Fundo amarelo com letra grafite nos dois temas (contraste de 11:1); por isso
 * o contorno de foco aqui é grafite, e não o amarelo do tema escuro.
 */
export default function FaixaBlack() {
  const [visivel, setVisivel] = useState(false);
  const [copiado, setCopiado] = useState(false);

  useEffect(() => {
    if (!ativaEm(hojeSaoLuis())) return;
    let jaVista = false;
    try {
      if (sessionStorage.getItem(CHAVE_DISPENSADA)) return;
      jaVista = Boolean(sessionStorage.getItem(CHAVE_VISTA));
      sessionStorage.setItem(CHAVE_VISTA, "1");
    } catch {
      /* sem armazenamento: mostra, só não lembra */
    }
    // A data e o armazenamento só existem no navegador; por isso a faixa entra depois de montar.
    // Cupom esgotado (limite de usos): a faixa não aparece.
    let vivo = true;
    void cupomDaBlackDisponivel().then((disponivel) => {
      if (!vivo || !disponivel) return;
      setVisivel(true);
      if (!jaVista) evento("view_promotion", { promotion_name: BLACK.nome, creative_slot: "faixa-loja" });
    });
    return () => {
      vivo = false;
    };
  }, []);

  if (!visivel) return null;

  function dispensar() {
    setVisivel(false);
    try {
      sessionStorage.setItem(CHAVE_DISPENSADA, "1");
    } catch {
      /* ok */
    }
  }

  async function copiar() {
    guardarCupom(BLACK.codigo);
    evento("select_promotion", { promotion_name: BLACK.nome, creative_slot: "faixa-loja", creative_name: "copiar-codigo" });
    try {
      await navigator.clipboard.writeText(BLACK.codigo);
    } catch {
      /* o código está escrito na faixa */
    }
    setCopiado(true);
  }

  return (
    <aside aria-label="Promoção Black Kambada" data-area="faixa-black" className="bg-kambada-amarelo text-kambada-grafite">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 sm:px-6">
        <p className="flex-1 py-2 text-sm leading-snug">
          <strong className="font-display">Black Kambada:</strong> {BLACK.percentual}% nas peças com{" "}
          <strong className="font-mono tracking-wide">{BLACK.codigo}</strong> até {diaMes(BLACK.fim)}
        </p>
        <button
          type="button"
          onClick={copiar}
          data-evento="select_promotion"
          className="min-h-11 shrink-0 rounded-full px-3 font-display text-sm font-semibold underline underline-offset-4 focus-visible:outline-kambada-grafite"
        >
          <span aria-live="polite">{copiado ? "Copiado" : "Copiar código"}</span>
        </button>
        <button
          type="button"
          onClick={dispensar}
          aria-label="Fechar o aviso da Black Kambada"
          data-alvo="fechar"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-xl leading-none font-bold focus-visible:outline-kambada-grafite"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
    </aside>
  );
}
