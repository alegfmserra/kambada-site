import type { ReactNode } from "react";
import FaixaBlack from "@/components/loja/FaixaBlack";

/**
 * Moldura das páginas da loja (vitrine, categorias, busca e peça).
 * Hoje só carrega a faixa da Black Kambada, que se mostra sozinha de 22 a 30/11.
 */
export default function LayoutDaLoja({ children }: { children: ReactNode }) {
  return (
    <>
      <FaixaBlack />
      {children}
    </>
  );
}
