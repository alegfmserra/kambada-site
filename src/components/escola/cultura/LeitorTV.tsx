"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Revistinha na TV: a página inteira na tela, fundo escuro, setas grandes.
 * Para a professora ler para a roda (Educação Infantil) com o projetor ou a
 * TV da sala. Teclado (← →, espaço) e controle de apresentação funcionam;
 * "Tela cheia" esconde o resto.
 */
export function LeitorTV({ titulo, paginas }: { titulo: string; paginas: string[] }) {
  const [i, setI] = useState(0);
  const total = paginas.length;
  const ir = useCallback((n: number) => setI(Math.min(total - 1, Math.max(0, n))), [total]);

  useEffect(() => {
    const teclar = (e: KeyboardEvent) => {
      if (["ArrowRight", " ", "PageDown"].includes(e.key)) { e.preventDefault(); ir(i + 1); }
      if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); ir(i - 1); }
    };
    window.addEventListener("keydown", teclar);
    return () => window.removeEventListener("keydown", teclar);
  }, [i, ir]);

  return (
    <div id="leitor-tv" className="relative flex h-[85vh] items-center justify-center gap-3 rounded-3xl bg-kambada-grafite p-3 [&:fullscreen]:h-screen [&:fullscreen]:rounded-none">
      <button type="button" onClick={() => ir(i - 1)} disabled={i === 0} aria-label="Página anterior" className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-white/10 text-4xl text-white disabled:opacity-20">
        ‹
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element -- página da HQ */}
      <img key={i} src={paginas[i]} alt={`${titulo}, página ${i + 1} de ${total}`} onClick={() => ir(i + 1)} className="h-full w-auto max-w-[80%] cursor-pointer rounded-lg bg-white object-contain" />
      {i < total - 1 && <link rel="preload" as="image" href={paginas[i + 1]} />}
      <button type="button" onClick={() => ir(i + 1)} disabled={i === total - 1} aria-label="Próxima página" className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-kambada-amarelo text-4xl text-kambada-grafite disabled:opacity-20">
        ›
      </button>
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-3 rounded-full bg-black/50 px-4 py-1.5 text-sm text-white">
        <span>
          {i + 1} de {total}
        </span>
        <button
          type="button"
          className="font-bold text-kambada-amarelo underline"
          onClick={() => {
            const el = document.getElementById("leitor-tv");
            if (document.fullscreenElement) void document.exitFullscreen();
            else void el?.requestFullscreen();
          }}
        >
          ⛶ Tela cheia
        </button>
      </div>
    </div>
  );
}
