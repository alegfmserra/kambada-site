"use client";

import { useState } from "react";
import { HQS, paginaDaHQ } from "@/content/play/hq";
import { falarComSW } from "./pwa";

/**
 * "Guardar as HQs para ler sem internet": pede ao service worker do app que
 * baixe todas as HQs (páginas + imagens). Só aparece efeito com o SW ativo,
 * ou seja, no site publicado; aberta uma HQ com internet, ela já fica guardada.
 */
export function GuardarHQs() {
  const [estado, setEstado] = useState<"parado" | "guardando" | "ok" | "erro">("parado");
  const [texto, setTexto] = useState("");

  async function guardar() {
    setEstado("guardando");
    setTexto("");
    const hqs = HQS.map((h) => ({
      url: `/kambadaplay/hq/${h.slug}`,
      imagens: Array.from({ length: h.paginas }, (_, i) => paginaDaHQ(h, i + 1)),
    }));
    const r = await falarComSW<{ ok: number; total: number }>({ tipo: "guardar-hqs", hqs });
    if (!r) {
      setEstado("erro");
      setTexto("Não deu para guardar agora. Abra o app com internet e tente de novo.");
      return;
    }
    setEstado(r.ok > 0 ? "ok" : "erro");
    setTexto(
      r.ok === r.total
        ? `Pronto: ${r.ok === 1 ? "a HQ ficou guardada" : `as ${r.ok} HQs ficaram guardadas`} neste aparelho. Dá para ler sem internet.`
        : r.ok > 0
          ? `${r.ok} de ${r.total} HQs guardadas. Tente de novo com internet para guardar o resto.`
          : "Não deu para guardar. Confira se você entrou na sua conta e se há internet.",
    );
  }

  return (
    <div className="rounded-xl border-2 border-borda p-4">
      <p className="text-sm font-semibold text-texto">Vai ficar sem internet?</p>
      <p className="mt-1 text-sm text-texto-suave">Guarde as HQs neste aparelho e leia no carro, na escola ou no interior.</p>
      <button
        type="button"
        onClick={guardar}
        disabled={estado === "guardando"}
        className="mt-3 rounded-full border-2 border-kambada-amarelo px-5 py-2 text-sm font-bold text-texto transition-colors hover:bg-kambada-amarelo hover:text-kambada-grafite disabled:opacity-60"
      >
        {estado === "guardando" ? "Guardando…" : "Guardar as HQs para ler sem internet"}
      </button>
      {texto ? (
        <p role="status" className={`mt-2 text-sm font-semibold ${estado === "erro" ? "text-red-600" : "text-texto"}`}>
          {texto}
        </p>
      ) : null}
    </div>
  );
}
