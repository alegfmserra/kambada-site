"use client";

import { useState } from "react";
import FotoEmoldurada from "@/components/FotoEmoldurada";
import type { FotoProduto } from "@/lib/fotoDoProduto";
import { useOpcaoAtiva } from "./OpcaoAtiva";

/**
 * Foto principal da peça, trocando conforme a opção escolhida.
 * Opção sem foto própria mostra a foto padrão (a do produto-pai).
 * Com galeria, miniaturas abaixo trocam a foto grande; mudar de opção volta
 * para a foto daquela opção.
 */
export default function FotoAtiva({
  nome,
  padrao,
  porOpcao,
  galeria = [],
}: {
  nome: string;
  padrao: FotoProduto | null;
  porOpcao: Record<number, FotoProduto>;
  galeria?: FotoProduto[];
}) {
  const ativa = useOpcaoAtiva();
  const daOpcao = (ativa?.idOpcao !== null && ativa?.idOpcao !== undefined ? porOpcao[ativa.idOpcao] : undefined) ?? padrao;
  // A miniatura escolhida vale só para a opção em que foi clicada: trocar de
  // opção volta para a foto daquela opção, sem efeito nem estado derivado.
  const [escolhida, setEscolhida] = useState<{ foto: FotoProduto; opcao: number | null } | null>(null);
  const escolher = (f: FotoProduto) => setEscolhida({ foto: f, opcao: ativa?.idOpcao ?? null });
  const foto = (escolhida && escolhida.opcao === (ativa?.idOpcao ?? null) ? escolhida.foto : null) ?? daOpcao;
  const todas = daOpcao ? [daOpcao, ...galeria.filter((g) => g.src !== daOpcao.src)] : galeria;

  if (!foto) {
    // Peça ainda sem foto no acervo: um espaço honesto — melhor que uma
    // imagem genérica que não é a peça.
    return (
      <div
        aria-hidden="true"
        className="flex aspect-[3/4] items-center justify-center rounded-3xl border border-dashed border-borda bg-superficie text-7xl"
      >
        🦀
      </div>
    );
  }

  return (
    <div>
      <FotoEmoldurada
        key={foto.src}
        src={foto.src}
        alt={nome}
        priority
        sizes="(min-width: 1024px) 34rem, 92vw"
        className="aspect-[3/4] rounded-3xl"
      />
      {todas.length > 1 && (
        <ul aria-label="Mais fotos" className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {todas.map((f, i) => (
            <li key={f.src} className="shrink-0">
              <button
                type="button"
                onClick={() => escolher(f)}
                aria-label={`Foto ${i + 1} de ${todas.length}`}
                aria-current={f.src === foto.src ? "true" : undefined}
                className={`block h-20 w-16 overflow-hidden rounded-xl border-2 ${f.src === foto.src ? "border-kambada-amarelo" : "border-transparent hover:border-borda"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.src} alt="" loading="lazy" className="h-full w-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
