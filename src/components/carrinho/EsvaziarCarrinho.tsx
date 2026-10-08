"use client";

import { useEffect } from "react";
import { useCarrinho } from "./ProvedorCarrinho";

/** Esvazia o carrinho uma vez, quando o pagamento volta aprovado. */
export default function EsvaziarCarrinho() {
  const { esvaziar, pronto } = useCarrinho();
  useEffect(() => {
    if (pronto) esvaziar();
  }, [pronto, esvaziar]);
  return null;
}
