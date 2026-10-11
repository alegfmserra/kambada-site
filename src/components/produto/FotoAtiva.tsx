"use client";

import FotoEmoldurada from "@/components/FotoEmoldurada";
import type { FotoProduto } from "@/lib/fotoDoProduto";
import { useOpcaoAtiva } from "./OpcaoAtiva";

/**
 * Foto principal da peça, trocando conforme a opção escolhida.
 * Opção sem foto própria mostra a foto padrão (a do produto-pai).
 */
export default function FotoAtiva({
  nome,
  padrao,
  porOpcao,
}: {
  nome: string;
  padrao: FotoProduto | null;
  porOpcao: Record<number, FotoProduto>;
}) {
  const ativa = useOpcaoAtiva();
  const foto = (ativa?.idOpcao !== null && ativa?.idOpcao !== undefined ? porOpcao[ativa.idOpcao] : undefined) ?? padrao;

  if (!foto) {
    // Peça ainda sem foto no acervo: um espaço honesto — melhor que uma
    // imagem genérica que não é a peça.
    return (
      <div
        aria-hidden="true"
        className="flex aspect-square items-center justify-center rounded-3xl border border-dashed border-borda bg-superficie text-7xl"
      >
        🦀
      </div>
    );
  }

  return (
    <FotoEmoldurada
      key={foto.src}
      src={foto.src}
      alt={nome}
      priority
      sizes="(min-width: 1024px) 34rem, 92vw"
      className="aspect-square rounded-3xl"
    />
  );
}
