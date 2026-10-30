"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { HQS } from "@/content/play/hq";

const semMudanca = () => () => undefined;

/** Volta só para dentro do Play (o `de` vem do endereço, posto pelo service worker). */
function destinoDeVolta(): string {
  const de = new URLSearchParams(window.location.search).get("de") ?? "";
  return de.startsWith("/kambadaplay") && !de.startsWith("//") ? de : "/kambadaplay";
}

/**
 * Lista das HQs na tela "Sem internet". Funciona mesmo sem JavaScript (todas
 * aparecem, em links simples); com JavaScript, mostra só as guardadas neste
 * aparelho. Links <a>, não <Link>: sem internet a navegação suave do Next
 * falha, e a navegação completa é a que o service worker atende.
 */
export function HQsGuardadas() {
  const [guardadas, setGuardadas] = useState<string[] | null>(null);
  const volta = useSyncExternalStore(semMudanca, destinoDeVolta, () => "/kambadaplay");

  useEffect(() => {
    if (typeof caches === "undefined") return;
    Promise.all(HQS.map(async (h) => ((await caches.match(`/kambadaplay/hq/${h.slug}`)) ? h.slug : null))).then(
      (r) => setGuardadas(r.filter((s): s is string => s !== null)),
      () => undefined,
    );
  }, []);

  const lista = guardadas === null ? HQS : HQS.filter((h) => guardadas.includes(h.slug));

  return (
    <div className="mt-8">
      {lista.length === 0 ? (
        <p className="rounded-xl border-2 border-borda p-4 text-texto-suave">
          Nenhuma HQ guardada ainda. Com internet, abra uma HQ (ou toque em &quot;Guardar as HQs&quot; no fim de qualquer
          HQ) e ela fica disponível aqui.
        </p>
      ) : null}
      <ul className="space-y-3">
        {lista.map((h) => (
          <li key={h.slug}>
            <a
              href={`/kambadaplay/hq/${h.slug}`}
              className="block rounded-xl border-2 border-borda p-4 transition-colors hover:border-kambada-amarelo"
            >
              <span className="font-display text-lg font-extrabold text-texto">{h.titulo}</span>
              <span className="mt-1 block text-sm text-texto-suave">
                {h.paginas} páginas{guardadas ? " · guardada, dá para ler sem internet" : ""}
              </span>
            </a>
          </li>
        ))}
      </ul>
      <a
        href={volta}
        className="mt-8 inline-block rounded-full bg-kambada-amarelo px-8 py-3.5 font-bold text-kambada-grafite transition-colors hover:bg-kambada-amarelo-escuro"
      >
        Tentar de novo
      </a>
    </div>
  );
}
