"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { rastrear } from "@/lib/visitas/rastrear";

/** Anota a página que não existiu (só o caminho, sem query): mostra links quebrados no painel de Performance. */
export default function Registrar404() {
  const caminho = usePathname() ?? "";
  useEffect(() => {
    rastrear({ tipo: "erro404", caminho });
  }, [caminho]);
  return null;
}
